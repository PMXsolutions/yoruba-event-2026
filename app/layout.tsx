import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { ACTIVE_EVENT } from "@/lib/site";
import EventJsonLd from "@/components/seo/EventJsonLd";
import "./globals.css";

const heading = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = ACTIVE_EVENT.canonicalUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${ACTIVE_EVENT.name} | Premium Cultural Celebration`,
    template: `%s | ${ACTIVE_EVENT.name}`,
  },
  description: ACTIVE_EVENT.tagline,
  keywords: [
    "Yoruba Day",
    "Canberra",
    "Yoruba culture",
    "African heritage",
    "cultural event",
    "2026",
  ],
  authors: [{ name: ACTIVE_EVENT.organisation }],
  creator: ACTIVE_EVENT.organisation,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: siteUrl,
    siteName: ACTIVE_EVENT.name,
    title: ACTIVE_EVENT.name,
    description: ACTIVE_EVENT.tagline,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: ACTIVE_EVENT.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: ACTIVE_EVENT.name,
    description: ACTIVE_EVENT.tagline,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-espresso text-cream">
        <EventJsonLd />
        {children}
      </body>
    </html>
  );
}
