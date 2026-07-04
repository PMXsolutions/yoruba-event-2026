import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Yoruba Day Canberra 2026 | Premium Cultural Celebration",
  description:
    "November 2026 in Canberra, ACT—Yoruba Day celebrates Aso Oke, talking drum, Eyo showcase, cuisine, music, and community unity. Presented by Yoruba Association Canberra.",
  openGraph: {
    title: "Yoruba Day Canberra 2026",
    description:
      "An elevated, welcoming celebration of Yoruba culture in the ACT—elders, youth, families, and friends together.",
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
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
