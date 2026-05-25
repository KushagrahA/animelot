import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://animelot.com"),
  title: {
    default: "Animelot — Discover, Rate & Discuss Anime",
    template: "%s | Animelot",
  },
  description:
    "Discover anime, publish ratings, write reviews, build a watch list, and discuss series with an anime community built around real taste signals.",
  keywords: [
    "anime ratings",
    "anime reviews",
    "anime database",
    "best anime",
    "anime recommendations",
    "anime watch list",
    "anime community",
    "rate anime",
  ],
  authors: [{ name: "Animelot" }],
  creator: "Animelot",
  applicationName: "Animelot",
  alternates: {
    canonical: "https://animelot.com",
  },
  manifest: "/site.webmanifest",
  category: "entertainment",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/animelot-logo-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://animelot.com",
    siteName: "Animelot",
    title: "Animelot — Discover, Rate & Discuss Anime",
    description: "Discover anime, publish ratings, write reviews, and build your watch list on Animelot.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Animelot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Animelot — Discover, Rate & Discuss Anime",
    description: "Discover anime, publish ratings, write reviews, and build your watch list on Animelot.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://animelot.com/#organization",
      name: "Animelot",
      url: "https://animelot.com",
      logo: "https://animelot.com/animelot-logo-512.png",
    },
    {
      "@type": "WebSite",
      "@id": "https://animelot.com/#website",
      name: "Animelot",
      url: "https://animelot.com",
      publisher: { "@id": "https://animelot.com/#organization" },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://animelot.com/browse?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${workSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
        <Providers>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          {/* SVG filter for HankoStamp ink roughness — rendered once, referenced globally */}
          <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
            <defs>
              <filter id="ink-roughness" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.65"
                  numOctaves="3"
                  stitchTiles="stitch"
                  result="noise"
                />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
          </svg>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
