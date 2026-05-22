import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@/lib/analytics";
import { StructuredData } from "@/components/seo/structured-data";
import "./globals.css";

const seatren = localFont({
  src: "../../../Seatren.otf",
  variable: "--font-seatren",
  display: "swap"
});

const helvena = localFont({
  src: [
    { path: "../../../Helvena-Regular.otf", weight: "400", style: "normal" },
    { path: "../../../Helvena-Medium.otf", weight: "500", style: "normal" },
    { path: "../../../Helvena-Semibold.otf", weight: "600", style: "normal" },
    { path: "../../../Helvena-Bold.otf", weight: "700", style: "normal" }
  ],
  variable: "--font-helvena",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eclipsesystems.pro"),
  title: {
    default: "Eclipse Timekeeping by Eclipse Systems - Time Tracking, Invoicing & Shift Management for Modern Teams",
    template: "%s | Eclipse Timekeeping by Eclipse Systems"
  },
  description: "Timekeeping, invoicing, shift management, team chat, and legal billing add-ons. From $10/seat/month. Built for U.S. small businesses, law firms, and shift teams.",
  applicationName: "Eclipse Timekeeping",
  authors: [{ name: "Eclipse Systems", url: "https://eclipsesystems.pro" }],
  generator: "Next.js",
  keywords: [],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eclipsesystems.pro",
    siteName: "Eclipse Systems",
    title: "Eclipse Timekeeping by Eclipse Systems",
    description: "Eclipse Suite bundles timekeeping, project billing, shift management, and chat. Eclipse Legal is available as a law-firm add-on.",
    images: [{ url: "/api/og/default", width: 1200, height: 630, alt: "Eclipse Timekeeping by Eclipse Systems" }]
  },
  twitter: {
    card: "summary_large_image",
    site: "@eclipsesystems",
    creator: "@eclipsesystems",
    title: "Eclipse Timekeeping by Eclipse Systems",
    description: "Time tracking, invoicing, shift management, chat, and legal billing add-ons from $10/seat/month.",
    images: ["/api/og/default"]
  },
  alternates: { canonical: "https://eclipsesystems.pro" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  verification: {
    google: "TODO_GSC_VERIFICATION_CODE",
    other: { "msvalidate.01": "TODO_BING_WEBMASTER_CODE" }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Eclipse Systems",
    url: "https://eclipsesystems.pro",
    logo: "https://eclipsesystems.pro/api/og/default",
    sameAs: [
      "https://www.linkedin.com/company/eclipse-systems",
      "https://twitter.com/eclipsesystems"
    ]
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Eclipse Systems",
    alternateName: ["Eclipse Timekeeping", "Eclipse Systems Timekeeping"],
    url: "https://eclipsesystems.pro",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://eclipsesystems.pro/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    } as never
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Eclipse Timekeeping by Eclipse Systems",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    url: "https://eclipsesystems.pro",
    offers: [
      { "@type": "Offer", name: "Eclipse Timekeeping", price: "10", priceCurrency: "USD", unitText: "seat per month" },
      { "@type": "Offer", name: "Mission Command by Eclipse", price: "18", priceCurrency: "USD", unitText: "seat per month" },
      { "@type": "Offer", name: "Eclipse", price: "22", priceCurrency: "USD", unitText: "seat per month" },
      { "@type": "Offer", name: "Eclipse Suite", price: "38", priceCurrency: "USD", unitText: "seat per month" },
      { "@type": "Offer", name: "Eclipse Legal Add-on", price: "20", priceCurrency: "USD", unitText: "seat per month" }
    ],
    publisher: { "@type": "Organization", name: "Eclipse Systems", url: "https://eclipsesystems.pro" }
  };

  return (
    <html lang="en" className={`${seatren.variable} ${helvena.variable}`}>
      <body>
        <StructuredData schema={organization} />
        <StructuredData schema={website} />
        <StructuredData schema={software} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
