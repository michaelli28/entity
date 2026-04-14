import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";

type OnboardCheck = "onboarded" | "needs-onboarding" | "unknown";

async function checkOnboarded(
  token: string | null | undefined,
): Promise<OnboardCheck> {
  if (!token) return "unknown";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return "unknown";
  try {
    const res = await fetch(`${apiUrl}/api/founders/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 404) return "needs-onboarding";
    if (!res.ok) return "unknown";
    const body = (await res.json()) as {
      onboarding_completed_at?: string | null;
    };
    return body.onboarding_completed_at ? "onboarded" : "needs-onboarding";
  } catch {
    return "unknown";
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/sign-in");
  let token: string | null = null;
  try {
    token = await getToken({ template: "backend" });
  } catch {
    token = null;
  }
  const status = await checkOnboarded(token);
  if (status === "needs-onboarding") redirect("/onboarding");
  return (
    <div className="bg-[var(--color-bg)] flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
