import Link from "next/link";
import { Mail } from "lucide-react";

const productLinks = [
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["Industries", "/industries"],
  ["Resources", "/guides"]
] as const;

const resourceLinks = [
  ["Blog", "/blog"],
  ["Webinars", "/webinars"],
  ["Help Center", "/help-center"],
  ["Developer Documentation", "/developer-documentation"],
  ["Invoice Template", "/invoice-template"]
] as const;

const companyLinks = [
  ["Login", "/login"],
  ["Start Trial", "/signup"],
  ["Locations", "/locations"],
  ["Alternatives", "/alternatives"]
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto grid max-w-[104rem] gap-10 px-5 py-12 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="font-title text-4xl leading-none text-cream">Eclipse Systems</Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/72">
            Timekeeping, project billing, shift operations, chat, and legal billing tools for teams that need one clear operating workspace.
          </p>
          <a href="mailto:help@eclipsesystems.pro" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cream hover:text-white">
            <Mail className="h-4 w-4" />
            help@eclipsesystems.pro
          </a>
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
