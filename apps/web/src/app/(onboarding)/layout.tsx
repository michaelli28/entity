import { AuroraBackground } from "@zstar/ui";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        {children}
      </div>
    </AuroraBackground>
  );
}
