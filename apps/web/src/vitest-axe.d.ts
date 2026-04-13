import type { AxeResults } from "axe-core";

// vitest-axe v0.1.0 augments `Vi.Assertion` (Vitest v1/v2 namespace).
// Vitest v3 dropped the `Vi` namespace; `Assertion` now lives in `@vitest/expect`
// which is a transitive dep not directly accessible from this workspace package.
// This shim provides the `toHaveNoViolations` matcher type via the `vitest` module
// that IS directly accessible.
declare module "vitest" {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

export type { AxeResults };
