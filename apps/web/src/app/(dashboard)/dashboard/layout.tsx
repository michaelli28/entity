import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";

async function checkOnboarded(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return false;
  try {
    const res = await fetch(`${apiUrl}/api/founders/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const body = (await res.json()) as {
      onboarding_completed_at?: string | null;
    };
    return Boolean(body.onboarding_completed_at);
  } catch {
    return false;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, getToken } = await auth();
  if (!userId) redirect("/sign-in");
  const token = await getToken({ template: "backend" });
  const onboarded = await checkOnboarded(token);
  if (!onboarded) redirect("/onboarding");
  return (
    <div className="bg-[var(--color-bg)] flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
