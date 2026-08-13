import type { Metadata, Viewport } from "next";
import { Noto_Sans_Kannada, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { StructuredData } from "@/components/StructuredData";
import { AUTHOR, AUTHOR_PROFILES, DEFAULT_TITLE, SITE } from "@/lib/site";
import { getSiteUrl } from "@/lib/site-url";

const notoSansKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Noto Sans", "sans-serif"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE.nameTulu}`,
  },
  description: SITE.description,
  applicationName: SITE.nameLatin,
  category: "music",
  keywords: [...SITE.keywords],
  authors: [{ name: AUTHOR.name, url: AUTHOR.url }],
  creator: AUTHOR.name,
  publisher: AUTHOR.name,
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  alternates: {
    canonical: "/",
    languages: { "tcy-Knda": "/", "en-IN": "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: `${SITE.nameTulu} — ${SITE.nameLatin}`,
    title: DEFAULT_TITLE,
    description: SITE.description,
    locale: SITE.locale,
    alternateLocale: [SITE.altLocale],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE.description,
    site: AUTHOR.twitterHandle,
    creator: AUTHOR.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  appleWebApp: {
    capable: true,
    title: SITE.shortName,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: SITE.themeColor,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={SITE.htmlLang} className={`${notoSansKannada.variable} ${inter.variable} h-full`}>
      <head>
        {/* rel="me" is the machine-readable half of the author credit in the
            footer: it claims these profiles as the same identity, without
            needing four more links printed over the artwork. */}
        {AUTHOR_PROFILES.map((profile) => (
          <link key={profile.label} rel="me" href={profile.href} />
        ))}
        <link rel="author" href={AUTHOR.url} />
        <link rel="preconnect" href="https://www.youtube.com" />
        <StructuredData />
      </head>
      <body className="h-full overflow-hidden antialiased">
        {children}
        {/* Both no-op off Vercel and inject nothing in development, so local
            runs stay clean and there is no key to configure. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
