interface WizardCardProps {
  children: React.ReactNode;
}

export function WizardCard({ children }: WizardCardProps) {
  return (
    <div className="bg-black/80 w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl backdrop-blur">
      {children}
    </div>
  );
}
