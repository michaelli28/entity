import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (!API_URL) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL not configured" },
      { status: 500 },
    );
  }

  const { path } = await params;
  const pathStr = path.join("/");

  // Never proxy chat/stream — goes direct client→FastAPI
  if (pathStr.startsWith("chat/stream")) {
    return NextResponse.json(
      { error: "Use direct streaming endpoint" },
      { status: 400 },
    );
  }

  const { getToken } = await auth();
  const token = await getToken({ template: "backend" });
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const target = `${API_URL}/api/${pathStr}${req.nextUrl.search}`;
  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.delete("host");

  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(15000),
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    const body = await req.arrayBuffer();
    if (body.byteLength > 0) init.body = body;
  }

  try {
    const res = await fetch(target, init);
    const resHeaders = new Headers(res.headers);
    return new NextResponse(res.body, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "upstream_unavailable", detail: message },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
