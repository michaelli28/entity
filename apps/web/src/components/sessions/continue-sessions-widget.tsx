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
    (b) => !sessions.find((s) => s.session_type === b.key && s.completed_at),
  );

  return (
    <Link href="/dashboard/sessions" className="en-continue">
      <span className="en-continue__left">
        <span className="en-continue__label">Continue mentor sessions</span>
        <span className="en-continue__title">
          {nextBlueprint
            ? `Next · ${nextBlueprint.title}`
            : "All core sessions done — try a deep dive"}
        </span>
      </span>
      <span className="en-continue__count">
        {String(doneCount).padStart(2, "0")} /{" "}
        {String(core.length).padStart(2, "0")}
      </span>
    </Link>
  );
}
