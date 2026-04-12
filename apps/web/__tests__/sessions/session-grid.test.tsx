import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionGrid } from "@/components/sessions/session-grid";

vi.mock("@/lib/hooks/use-sessions", () => ({
  useBlueprints: () => ({
    data: [
      { key: "big_picture", title: "The Big Picture", subtitle: "s1", order: 1, starter_questions: [] },
      { key: "problem_market", title: "Problem & Market", subtitle: "s2", order: 2, starter_questions: [] },
      { key: "business", title: "Business", subtitle: "s3", order: 3, starter_questions: [] },
      { key: "ask", title: "Ask", subtitle: "s4", order: 4, starter_questions: [] },
    ],
    isLoading: false,
  }),
  useSessions: () => ({ data: [], isLoading: false }),
  useDeepDiveRecommendation: () => ({ data: null, isLoading: false }),
  useCreateSession: () => ({ mutate: vi.fn() }),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("SessionGrid", () => {
  it("renders 4 core cards in order", () => {
    wrap(<SessionGrid />);
    const titles = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(["The Big Picture", "Problem & Market", "Business", "Ask"]);
  });

  it("marks Big Picture as Recommended when no sessions exist", () => {
    wrap(<SessionGrid />);
    expect(screen.getAllByText("Recommended")).toHaveLength(1);
  });
});
