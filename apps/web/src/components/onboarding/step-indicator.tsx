interface StepIndicatorProps {
  step: number;
  total?: number;
  labels?: readonly string[];
}

const DEFAULT_LABELS = ["Welcome", "Profile", "Consent"] as const;

export function StepIndicator({
  step,
  total = 3,
  labels = DEFAULT_LABELS,
}: StepIndicatorProps) {
  const progress = Math.min(1, Math.max(0, (step - 1) / Math.max(1, total - 1)));
  const current = labels[step - 1] ?? "";

  return (
    <div
      className="en-step"
      role="group"
      aria-label={`Step ${step} of ${total}: ${current}`}
      style={{ "--step-progress": String(progress) } as React.CSSProperties}
    >
      <span className="en-step__count">
        {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <span className="en-step__track" aria-hidden="true" />
      <span>{current}</span>
    </div>
  );
}
