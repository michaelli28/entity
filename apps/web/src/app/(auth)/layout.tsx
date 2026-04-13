import { TheatricsProvider } from "@/lib/theatrics/tier-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TheatricsProvider value="medium">{children}</TheatricsProvider>;
}
