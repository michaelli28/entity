import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { DM_Serif_Display, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

const fontDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display-loaded",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Times New Roman", "Georgia", "serif"],
  preload: true,
});

const fontSans = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-sans-loaded",
  display: "swap",
  preload: true,
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono-loaded",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "ZStar",
  description: "AI-powered founder profiling and deal flow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html
        lang="en"
        className={`dark ${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
      >
        <body className="antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
