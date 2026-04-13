import "@testing-library/jest-dom/vitest";
import { expect, vi } from "vitest";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";
expect.extend(matchers);

// jsdom does not implement window.matchMedia — stub it globally so hooks that
// call matchMedia (e.g. useReducedMotion) work in the test environment.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
