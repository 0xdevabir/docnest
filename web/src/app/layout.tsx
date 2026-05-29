import type { Metadata, Viewport } from "next";
import { geistSans, geistMono } from "@/lib/fonts";
import { Background } from "@/components/layout/Background";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DocSmith — AI-powered documentation that writes itself",
    template: "%s · DocSmith",
  },
  description:
    "DocSmith analyzes your codebase with AI to generate beautiful, accurate documentation — READMEs, API docs, architecture guides — in seconds.",
  keywords: [
    "documentation generator",
    "AI docs",
    "readme generator",
    "developer tools",
    "docsmith",
    "codebase analysis",
    "TypeScript",
    "CLI",
  ],
  authors: [{ name: "DocSmith" }],
  creator: "DocSmith",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "DocSmith — AI-powered documentation that writes itself",
    description:
      "Drop DocSmith into any codebase and get beautiful, accurate documentation in seconds.",
    siteName: "DocSmith",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocSmith — AI-powered documentation that writes itself",
    description:
      "Drop DocSmith into any codebase and get beautiful, accurate documentation in seconds.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#080812",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <Background />
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
