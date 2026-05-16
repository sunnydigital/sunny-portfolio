import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { ShadowboxProvider } from "@/lib/shadowbox";
import { ScrollProvider } from "@/lib/scroll";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "Sunny Son",
  description: "Interactive portfolio showcasing concepts, projects, and skills through immersive 3D visualization.",
  openGraph: {
    title: "Sunny — AI/ML Engineer",
    description: "Interactive portfolio showcasing concepts, projects, and skills through immersive 3D visualization.",
    siteName: "Sunny Son",
    url: "https://www.sunnyson.dev",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sunny — AI/ML Engineer",
    description: "Interactive portfolio showcasing concepts, projects, and skills through immersive 3D visualization.",
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="antialiased" style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)" }}>
        <SessionWrapper>
          <ThemeProvider>
            <ShadowboxProvider>
              <ScrollProvider>
                {children}
              </ScrollProvider>
            </ShadowboxProvider>
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
