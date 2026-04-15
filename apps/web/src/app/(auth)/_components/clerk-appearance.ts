import { dark } from "@clerk/themes";

/**
 * Clerk appearance config for Entity auth surfaces.
 *
 * The baseTheme `dark` gives us dark-aware defaults; we then override
 * variables and element classes with our OKLCH tokens. Colors must be
 * concrete values here (Clerk cannot resolve CSS custom properties),
 * so these duplicate values from packages/ui/src/styles/tokens.css.
 */
export const clerkAuthAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "oklch(0.68 0.22 258)",
    colorBackground: "transparent",
    colorText: "oklch(0.965 0.005 258)",
    colorTextSecondary: "oklch(0.72 0.012 258)",
    colorInputBackground: "transparent",
    colorInputText: "oklch(0.965 0.005 258)",
    colorNeutral: "oklch(0.72 0.012 258)",
    colorDanger: "oklch(0.66 0.18 25)",
    colorSuccess: "oklch(0.74 0.14 160)",
    borderRadius: "10px",
    fontFamily: "var(--font-sans)",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "en-clerk",
  },
} as const;
