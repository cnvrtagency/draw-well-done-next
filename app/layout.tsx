import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/supabase";
import { AppProviders } from "@/components/AppProviders";

const themeInitScript = `
(function() {
  var storageKey = "topdraw_theme";
  var cookieKey = "topdraw_theme";
  var defaultTheme = "dark";
  var pref = defaultTheme;
  var cookieMatch = document.cookie.match(new RegExp("(?:^|; )" + cookieKey + "=([^;]+)"));
  if (cookieMatch && (cookieMatch[1] === "dark" || cookieMatch[1] === "light" || cookieMatch[1] === "system")) pref = cookieMatch[1];
  try {
    var stored = window.localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light" || stored === "system") pref = stored;
  } catch (error) {}
  var resolved = pref;
  if (pref === "system") {
    resolved = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  if (resolved !== "light") resolved = "dark";
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = pref;
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TopDraw | UK Prize Competitions",
    template: "%s | TopDraw",
  },
  description: "Enter UK prize competitions with clear ticket caps, free postal entry routes and published winners.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "TopDraw",
    description: "UK prize competitions with clear ticket caps.",
    url: SITE_URL,
    siteName: "TopDraw",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-theme-preference="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="theme-dark min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
          <AppProviders>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
