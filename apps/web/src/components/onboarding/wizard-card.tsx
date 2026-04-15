interface WizardCardProps {
  children: React.ReactNode;
}

export function WizardCard({ children }: WizardCardProps) {
  return <div className="en-onboard-panel">{children}</div>;
}
