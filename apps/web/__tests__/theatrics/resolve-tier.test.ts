import { resolveTier } from "@/lib/theatrics/resolve-tier";

describe("resolveTier", () => {
  describe("default full tier", () => {
    it("returns 'full' for root path", () => {
      expect(resolveTier("/")).toBe("full");
    });

    it("returns 'full' for unknown path", () => {
      expect(resolveTier("/foo")).toBe("full");
    });

    it("returns 'full' for /showcase", () => {
      expect(resolveTier("/showcase")).toBe("full");
    });

    it("returns 'full' for /terms", () => {
      expect(resolveTier("/terms")).toBe("full");
    });

    it("returns 'full' for /privacy", () => {
      expect(resolveTier("/privacy")).toBe("full");
    });

    it("returns 'full' for /subprocessors", () => {
      expect(resolveTier("/subprocessors")).toBe("full");
    });
  });

  describe("medium tier", () => {
    it("returns 'medium' for /sign-in", () => {
      expect(resolveTier("/sign-in")).toBe("medium");
    });

    it("returns 'medium' for /sign-up/factor-two (startsWith match)", () => {
      expect(resolveTier("/sign-up/factor-two")).toBe("medium");
    });

    it("returns 'medium' for /onboarding", () => {
      expect(resolveTier("/onboarding")).toBe("medium");
    });
  });

  describe("calm tier", () => {
    it("returns 'calm' for /dashboard", () => {
      expect(resolveTier("/dashboard")).toBe("calm");
    });

    it("returns 'calm' for /dashboard/chat (startsWith match)", () => {
      expect(resolveTier("/dashboard/chat")).toBe("calm");
    });

    it("returns 'calm' for /profile", () => {
      expect(resolveTier("/profile")).toBe("calm");
    });

    it("returns 'calm' for /scores", () => {
      expect(resolveTier("/scores")).toBe("calm");
    });

    it("returns 'calm' for /sessions", () => {
      expect(resolveTier("/sessions")).toBe("calm");
    });
  });

  describe("first-session override", () => {
    it("returns 'medium' for /dashboard when user.isFirstSession is true", () => {
      expect(resolveTier("/dashboard", { isFirstSession: true })).toBe("medium");
    });

    it("returns 'calm' for /dashboard when user.isFirstSession is false", () => {
      expect(resolveTier("/dashboard", { isFirstSession: false })).toBe("calm");
    });

    it("returns 'calm' for /dashboard when user provided without isFirstSession", () => {
      expect(resolveTier("/dashboard", {})).toBe("calm");
    });
  });
});
