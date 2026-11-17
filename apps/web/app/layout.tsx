import type { Metadata } from "next";
import localFont from "next/font/local";
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
  metadataBase: new URL("https://www.eclipsesystems.pro"),
  title: {
    default: "Custom Business Software & Solutions | Eclipse Systems",
    template: "%s | Eclipse Systems"
  },
  description:
    "Custom business software for Birmingham and beyond: client portals, operations systems, CRM, dashboards, workflow automation and integrations.",
  applicationName: "Eclipse Systems",
  authors: [{ name: "Eclipse Systems", url: "https://www.eclipsesystems.pro" }],
  generator: "Next.js",
  keywords: [],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.eclipsesystems.pro",
    siteName: "Eclipse Systems",
    title: "Eclipse Systems - Custom Software Consulting",
    description:
      "Eclipse Systems builds custom business software and demonstrates real environments for operations, client portals, CRM, and storefront workflows.",
    images: [{ url: "/api/og/default", width: 1200, height: 630, alt: "Eclipse Systems custom software consulting" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Eclipse Systems - Custom Software Consulting",
    description: "Custom portals, operations hubs, CRM pipelines, storefronts, billing workflows, dashboards, automations, and integrations.",
    images: ["/api/og/default"]
  },
  alternates: { canonical: "https://www.eclipsesystems.pro" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  verification: {
    google: /^[a-zA-Z0-9_-]{12,200}$/.test(process.env.GOOGLE_SITE_VERIFICATION ?? "") ? process.env.GOOGLE_SITE_VERIFICATION : undefined,
    other: /^[a-zA-Z0-9_-]{12,200}$/.test(process.env.BING_SITE_VERIFICATION ?? "") ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION! } : undefined
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.eclipsesystems.pro/#organization",
    name: "Eclipse Systems",
    url: "https://www.eclipsesystems.pro",
    logo: "https://www.eclipsesystems.pro/brand/wordmark.png",
    sameAs: [
      "https://www.linkedin.com/in/eclipse-systems-2842a3410/",
      "https://www.instagram.com/get.eclipse/"
    ]
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Eclipse Systems",
    alternateName: ["Eclipse Custom Software", "Eclipse Systems Consulting"],
    url: "https://www.eclipsesystems.pro",
    publisher: { "@id": "https://www.eclipsesystems.pro/#organization" }
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Eclipse Systems Custom Software Consulting",
    description:
      "Custom software design and development for operations hubs, client portals, CRM pipelines, storefronts, billing workflows, dashboards, automations, and integrations.",
    url: "https://www.eclipsesystems.pro",
    areaServed: [{ "@type": "City", name: "Birmingham, Alabama" }, { "@type": "Country", name: "United States" }],
    provider: { "@type": "Organization", name: "Eclipse Systems", url: "https://www.eclipsesystems.pro" },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Eclipse Systems demo environments",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Operations Hub custom software" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Client Portal custom software" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "CRM and sales pipeline custom software" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Storefront and commerce custom software" } }
      ]
    }
  };

  return (
    <html lang="en" className={`${seatren.variable} ${helvena.variable}`} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const stored = localStorage.getItem("eclipse-theme"); const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; const mode = stored === "system" ? system : stored === "dark" || stored === "light" ? stored : "light"; document.documentElement.classList.toggle("dark", mode === "dark"); document.documentElement.style.colorScheme = mode; } catch (_) {} })();`
          }}
        />
        <StructuredData schema={organization} />
        <StructuredData schema={website} />
        <StructuredData schema={service} />
        {children}
      </body>
    </html>
  );
}
