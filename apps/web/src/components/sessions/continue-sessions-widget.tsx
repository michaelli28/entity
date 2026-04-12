"use client";
import Link from "next/link";

import { useBlueprints, useSessions } from "@/lib/hooks/use-sessions";

export function ContinueSessionsWidget() {
  const { data: blueprints = [] } = useBlueprints();
  const { data: sessions = [] } = useSessions();
  const core = [...blueprints]
    .filter((b) => b.order < 99)
    .sort((a, b) => a.order - b.order);
  const doneCount = core.filter((b) =>
    sessions.find((s) => s.session_type === b.key && s.completed_at),
  ).length;
  const nextBlueprint = core.find(
    (b) =>
      !sessions.find((s) => s.session_type === b.key && s.completed_at),
  );

  return (
    <Link
      href="/dashboard/sessions"
      className="block rounded-xl p-5 border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-400">
            Continue your mentor sessions
          </div>
          <div className="text-lg font-medium mt-1">
            {nextBlueprint
              ? `Next: ${nextBlueprint.title}`
              : "All core sessions done — try a Deep Dive"}
          </div>
        </div>
        <div className="text-sm text-neutral-400">
          {doneCount} / {core.length}
        </div>
      </div>
    </Link>
  );
}
