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
  title: "Yoruba Day Canberra 2026 | Cultural Celebration",
  description:
    "November 2026 in Canberra, ACT—Yoruba Day celebrates Aso Oke, talking drum, Eyo showcase, cuisine, music, and community unity. Presented by Yoruba Association Canberra. Exact date and venue to be confirmed. Register your interest today.",
  openGraph: {
    title: "Yoruba Day Canberra 2026",
    description:
      "A warm, welcoming celebration of Yoruba culture in Canberra, ACT—elders, youth, families, and friends together. Presented by Yoruba Association Canberra.",
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
