import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const { getToken } = await auth();
  const url = new URL(req.url);
  const targetCategory = url.searchParams.get("category");
  const targetSignal = url.searchParams.get("signal");
  if (!targetCategory || !targetSignal) {
    return new Response("bad request", { status: 400 });
  }

  const token = await getToken({ template: "backend" });
  if (!token) return new Response("unauthorized", { status: 401 });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return new Response("NEXT_PUBLIC_API_URL not configured", { status: 500 });
  }

  const r = await fetch(`${apiUrl}/api/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_type: "deep_dive",
      target_category: targetCategory,
      target_signal: targetSignal,
    }),
  });
  if (!r.ok) return new Response(await r.text(), { status: r.status });

  const s = (await r.json()) as { id: string };
  redirect(`/dashboard/chat/deep-dive/${s.id}`);
}
