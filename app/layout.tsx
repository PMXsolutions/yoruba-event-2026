import type { Metadata } from "next";
import localFont from "next/font/local";
import { EventJsonLd } from "@/components/seo/EventJsonLd";
import { SITE } from "@/lib/site";
import "./globals.css";

// Files in app/fonts. next/font/google crashes the production build when
// Google Fonts returns a URL with no file extension.
const heading = localFont({
  src: "./fonts/cormorant-garamond-latin.woff2",
  variable: "--font-heading",
  weight: "300 700",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const body = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-body",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.seo.canonicalUrl),
  title: SITE.seo.title,
  description: SITE.seo.description,
  alternates: {
    canonical: SITE.seo.canonicalUrl,
  },
  openGraph: {
    title: SITE.name,
    description: SITE.seo.description,
    url: SITE.seo.canonicalUrl,
    siteName: SITE.platformBrand,
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.seo.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${heading.variable} ${body.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-espresso text-cream">
        <EventJsonLd />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
