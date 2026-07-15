import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { FacebookMark, LinkedInMark } from "@/components/marketing/social-icons";

const productLinks = [
  ["Capabilities", "/features"],
  ["Engagements", "/pricing"],
  ["Industries", "/industries"],
  ["Demo environments", "/demos"]
] as const;

const resourceLinks = [
  ["Blog", "/blog"],
  ["Webinars", "/webinars"],
  ["Help Center", "/help-center"],
  ["Developer Documentation", "/developer-documentation"],
  ["Invoice Template", "/invoice-template"]
] as const;

const companyLinks = [
  ["Contact", "/contact"],
  ["Locations", "/locations"],
  ["Alternatives", "/alternatives"]
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[#18231c] text-white">
      <div className="mx-auto grid max-w-[104rem] gap-10 px-5 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="inline-flex">
            <Image src="/brand/wordmark-white.png" alt="Eclipse Systems" width={176} height={74} className="h-14 w-auto object-contain" />
          </Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/72">
            Custom software consulting for businesses that need portals, operations systems, CRM workflows, storefronts, dashboards, automations, and integrations built around how they actually work.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="mailto:info@eclipsesystems.pro" className="inline-flex items-center gap-2 text-sm font-semibold text-cream hover:text-white">
              <Mail className="h-4 w-4" />
              info@eclipsesystems.pro
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61591896988440"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Eclipse Systems on Facebook"
              title="Facebook"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#f9e8d2] bg-[#b4c292] text-[#314839] transition hover:border-white hover:bg-[#c5d2a4]"
            >
              <FacebookMark className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/eclipse-systems-2842a3410/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Eclipse Systems on LinkedIn"
              title="LinkedIn"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#f9e8d2] bg-[#b4c292] text-[#314839] transition hover:border-white hover:bg-[#c5d2a4]"
            >
              <LinkedInMark className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Resources" links={resourceLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[104rem] flex-col gap-3 px-5 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Eclipse Systems. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-cream">Privacy</Link>
            <Link href="/terms" className="hover:text-cream">Terms</Link>
            <Link href="/security" className="hover:text-cream">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-secondary">{title}</p>
      <nav className="mt-4 grid gap-3 text-sm text-white/72">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="hover:text-cream">{label}</Link>
        ))}
      </nav>
    </div>
  );
}
