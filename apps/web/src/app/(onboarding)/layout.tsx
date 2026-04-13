import { AuroraBackground } from "@zstar/ui";
import { TheatricsProvider } from "@/lib/theatrics/tier-context";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TheatricsProvider value="medium">
      <AuroraBackground>
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          {children}
        </div>
      </AuroraBackground>
    </TheatricsProvider>
  );
}
