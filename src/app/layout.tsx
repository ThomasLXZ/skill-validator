import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import HtmlLang from "@/components/HtmlLang";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
const TITLE = "Claude Skill Validator – Check SKILL.md Online (Free)";
const DESCRIPTION =
  "Free Claude Skill validator. Paste a SKILL.md or upload a skill .zip/folder to check frontmatter, name and description rules, broken file references, scripts and best practices. Runs 100% in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "claude skill validator", "SKILL.md validator", "agent skills validator", "claude skills checker",
    "validate claude skill", "skill.md linter", "anthropic agent skills", "claude code skills",
  ],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title: TITLE, description: DESCRIPTION, siteName: "Claude Skill Validator" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

// Runs before paint so the saved / system theme never flashes.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

// URL is the source of truth. This only sets <html lang> before paint.
const LANG_SCRIPT = `(function(){try{var p=location.pathname;var zh=p==="/zh"||p.indexOf("/zh/")===0;document.documentElement.lang=zh?"zh-Hans":"en"}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased"><HtmlLang />{children}</body>
    </html>
  );
}
