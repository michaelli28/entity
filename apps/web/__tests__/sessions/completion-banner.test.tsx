import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompletionBanner } from "@/components/sessions/completion-banner";

vi.mock("@/lib/hooks/use-sessions", () => ({
  useSession: (id: string | null) => ({
    data: id
      ? { id, session_type: "big_picture", started_at: "2026-04-12", completed_at: null,
          coverage_score: 82, suggest_complete: true, target_category: null, target_signal: null }
      : null,
    isLoading: false,
  }),
  useCompleteSession: () => ({ mutate: vi.fn(), isPending: false }),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CompletionBanner", () => {
  beforeEach(() => localStorage.clear());

  it("renders when suggest_complete is true", () => {
    wrap(<CompletionBanner sessionId="abc-123" onCompleted={() => {}} />);
    expect(screen.getByText(/mark this session complete/i)).toBeInTheDocument();
  });

  it("hidden when dismissed in localStorage", () => {
    localStorage.setItem("banner-dismissed:abc-123", "1");
    wrap(<CompletionBanner sessionId="abc-123" onCompleted={() => {}} />);
    expect(screen.queryByText(/mark this session complete/i)).toBeNull();
  });
});
