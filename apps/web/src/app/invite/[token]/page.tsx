"use client";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "ok" | "error">("working");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/cofounder/accept/${token}`, {
          method: "POST",
        });
        if (res.ok) {
          setStatus("ok");
          router.push("/dashboard/chat");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [token, router]);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      {status === "working" && <p>Joining your co-founder&apos;s workspace…</p>}
      {status === "ok" && <p>Joined! Redirecting…</p>}
      {status === "error" && (
        <p className="text-red-400">
          This invite is invalid or expired. Please ask your co-founder for a
          new link.
        </p>
      )}
    </div>
  );
}
