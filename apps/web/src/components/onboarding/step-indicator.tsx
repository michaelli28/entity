interface StepIndicatorProps {
  step: number;
  total?: number;
}

export function StepIndicator({ step, total = 3 }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 w-16 rounded-full transition ${
            i < step ? "bg-primary" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}
