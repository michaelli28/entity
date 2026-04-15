"use client";
import { useSessionCoverage } from "@/lib/hooks/use-sessions";

interface Props {
  sessionId: string;
}

export function SessionProgress({ sessionId }: Props) {
  const { data } = useSessionCoverage(sessionId);
  if (!data) return null;

  const coveredCount = data.target_signals.filter((s) => s.covered).length;
  const total = data.target_signals.length;
  const pct = total === 0 ? 0 : Math.round((coveredCount / total) * 100);

  return (
    <div
      className="en-chat-progress"
      role="group"
      aria-label={`Coverage: ${coveredCount} of ${total} signals`}
    >
      <div className="en-chat-progress__row">
        <span className="en-chat-progress__label">Coverage</span>
        <span className="en-chat-progress__count">
          {String(coveredCount).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
          <span className="en-chat-progress__count-pct">{pct}%</span>
        </span>
      </div>
      <div
        className="en-chat-progress__track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="en-chat-progress__fill"
          style={{ "--en-progress": pct / 100 } as React.CSSProperties}
        />
      </div>
      <ul className="en-chat-progress__signals">
        {data.target_signals.map((sig) => (
          <li
            key={sig.key}
            className="en-chat-progress__signal"
            data-covered={sig.covered || undefined}
            title={sig.key}
          >
            <span
              className="en-chat-progress__signal-dot"
              aria-hidden="true"
            />
            <span>{sig.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
