interface WizardCardProps {
  children: React.ReactNode;
}

export function WizardCard({ children }: WizardCardProps) {
  return <div className="zs-onboard-panel">{children}</div>;
}
