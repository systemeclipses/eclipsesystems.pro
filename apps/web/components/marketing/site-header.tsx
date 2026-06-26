import Link from "next/link";
import Image from "next/image";

const navLinks = [
  ["Features", "/features"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["Guides", "/guides"],
  ["Help Center", "/help-center"],
  ["Blog", "/blog"]
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 px-5 pt-4">
      <div className="mx-auto flex w-full max-w-[100rem] items-center justify-between gap-5 rounded-full border border-[#314839]/20 bg-[#314839] px-5 py-3 text-sm font-semibold text-[#f9e8d2] shadow-2xl shadow-black/20 backdrop-blur-2xl md:px-7">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/wordmark-white.png" alt="Eclipse Systems" width={168} height={70} priority className="h-9 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map(([label, href]) => (
            <Link key={label} href={href} className="transition hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/schedule-demo" className="rounded-full bg-[#f9e8d2] px-5 py-2 font-bold text-[#314839] transition hover:bg-white">
            Schedule a demo
          </Link>
          <Link href="/login" aria-label="Login" className="hidden rounded-full border border-white/12 px-3 py-2 text-white/72 transition hover:text-white sm:inline-flex">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
