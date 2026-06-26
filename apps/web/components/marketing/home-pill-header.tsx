"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  ["Features", "/features"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["Guides", "/guides"],
  ["Help Center", "/help-center"],
  ["Blog", "/blog"]
] as const;

export function HomePillHeader() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    function updateHeader() {
      setSolid(window.scrollY > window.innerHeight * 0.72);
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);

    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, []);

  return (
    <header
      className={`fixed left-1/2 top-4 z-50 flex w-[calc(100%-4rem)] max-w-[100rem] -translate-x-1/2 items-center justify-between gap-5 rounded-full border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-2xl transition-colors duration-500 md:w-[calc(100%-5rem)] md:px-7 ${
        solid
          ? "border-[#314839]/20 bg-[#314839] text-[#f9e8d2] shadow-black/24"
          : "border-white/12 bg-[#27352d]/74 text-white/72 shadow-black/20"
      }`}
    >
      <Link href="/" className="flex items-center gap-3">
        <Image src="/brand/wordmark-white.png" alt="Eclipse Systems" width={168} height={70} priority className="h-9 w-auto object-contain" />
      </Link>
      <nav className="hidden items-center gap-10 lg:flex">
        {navLinks.map(([label, href]) => (
          <Link key={label} href={href} className="transition hover:text-[#f9e8d2]">
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
    </header>
  );
}
