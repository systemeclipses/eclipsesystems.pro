"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navLinks = [
  ["Features", "/features"],
  ["Demos", "/demos"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["Help Center", "/help-center"],
  ["Blog", "/blog"]
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  const [solidPath, setSolidPath] = useState(pathname);
  const [transitionsEnabled, setTransitionsEnabled] = useState(true);
  const showSolid = solid && solidPath === pathname;

  useEffect(() => {
    setTransitionsEnabled(false);
    setSolid(false);
    setSolidPath(pathname);

    function updateHeader(allowMissingHero = false) {
      const hero = document.querySelector<HTMLElement>("[data-public-hero]");
      const header = headerRef.current;

      if (!header) return;
      if (!hero) {
        if (allowMissingHero) setSolid(true);
        return;
      }

      setSolid(hero.getBoundingClientRect().bottom <= header.getBoundingClientRect().bottom);
    }

    const frame = window.requestAnimationFrame(() => updateHeader());
    const checks = [80, 220, 500].map((delay, index) =>
      window.setTimeout(() => updateHeader(index === 2), delay)
    );
    const transitionTimer = window.setTimeout(() => setTransitionsEnabled(true), 80);
    const heroObserver = new MutationObserver(() => updateHeader());
    const handleViewportChange = () => updateHeader();

    heroObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(frame);
      checks.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(transitionTimer);
      heroObserver.disconnect();
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className={`fixed left-1/2 top-6 z-50 isolate flex w-[calc(100%-2.5rem)] max-w-[100rem] -translate-x-1/2 items-center justify-between gap-3 rounded-full border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-3xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] before:pointer-events-none before:absolute before:-inset-3 before:-z-10 before:rounded-full before:bg-[#314839]/18 before:blur-2xl before:content-[''] md:w-[calc(100%-5rem)] md:px-7 lg:gap-5 ${
        transitionsEnabled ? "duration-500" : "duration-0"
      } ${
        showSolid
          ? "border-[#314839]/20 bg-[#314839] text-[#f9e8d2] shadow-black/25"
          : "border-white/70 bg-[rgba(24,35,28,0.38)] text-white shadow-black/20"
      }`}
    >
      <Link href="/" className="flex items-center gap-3">
        <Image src="/brand/wordmark-white.png" alt="Eclipse Systems" width={168} height={70} priority className="h-8 w-auto object-contain sm:h-9" />
      </Link>
      <nav className="hidden items-center gap-10 lg:flex">
        {navLinks.map(([label, href]) => (
          <Link key={label} href={href} className="transition hover:text-white">
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href="mailto:john@eclipsesystems.pro,garrett@eclipsesystems.pro"
          aria-label="Email John and Garrett at Eclipse Systems"
          title="Email Eclipse Systems"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <Mail className="h-4 w-4" />
        </a>
        <Link href="/contact" className="whitespace-nowrap rounded-full bg-[#f9e8d2] px-4 py-2 font-bold text-[#314839] transition hover:bg-white sm:px-5">
          Contact
        </Link>
      </div>
    </header>
  );
}
