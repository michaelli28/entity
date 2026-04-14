import type { Metadata } from "next";
import { headers } from "next/headers";
import { resolveTier } from "@/lib/theatrics/resolve-tier";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { TheatricsProvider } from "@/lib/theatrics/tier-context";

const fontSans = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans-loaded",
  display: "swap",
  preload: true,
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-loaded",
  display: "swap",
  preload: false,
});

const fontDisplay = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Didot", "Times New Roman", "Georgia", "serif"],
  preload: true,
});

export const metadata: Metadata = {
  title: "ZStar",
  description: "AI-powered founder profiling and deal flow",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";
  const tier = resolveTier(pathname);

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html
        lang="en"
        data-theatrics={tier}
        className={`dark ${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      >
        <body className="antialiased">
          <TheatricsProvider value={tier}>
            <Providers>{children}</Providers>
          </TheatricsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
