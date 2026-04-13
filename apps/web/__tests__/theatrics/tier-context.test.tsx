import { render, screen } from "@testing-library/react";
import { TheatricsProvider, useMotionTier } from "@/lib/theatrics/tier-context";

function TierDisplay() {
  const tier = useMotionTier();
  return <div data-testid="tier">{tier}</div>;
}

describe("TheatricsProvider / useMotionTier", () => {
  it("returns 'full' as the default when no provider is present", () => {
    render(<TierDisplay />);
    expect(screen.getByTestId("tier")).toHaveTextContent("full");
  });

  it("returns the value supplied by TheatricsProvider", () => {
    render(
      <TheatricsProvider value="calm">
        <TierDisplay />
      </TheatricsProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("calm");
  });

  it("returns 'medium' when provider supplies medium", () => {
    render(
      <TheatricsProvider value="medium">
        <TierDisplay />
      </TheatricsProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("medium");
  });
});
