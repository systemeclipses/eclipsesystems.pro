"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export type DemoScreenshot = {
  src: string;
  alt: string;
  label: string;
  href: string;
};

export function DemoScreenshotCarousel({ images }: { images: readonly DemoScreenshot[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || motion.matches || images.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  function move(direction: -1 | 1) {
    setActive((current) => (current + direction + images.length) % images.length);
  }

  return (
    <div
      className="group relative aspect-video w-full overflow-hidden rounded-[1.15rem] bg-[#172219]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Eclipse demo environment screenshots"
    >
      {images.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-700 ${index === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== active}
        >
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 58vw, 94vw" className="object-cover object-top" />
        </div>
      ))}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-[#172219]/92 via-[#172219]/40 to-transparent px-4 pb-4 pt-16 text-[#f9e8d2] md:px-5 md:pb-5">
        <Link
          href={images[active]?.href ?? "/demos"}
          aria-label={`Open ${images[active]?.label ?? "demo"} environment`}
          className="group/link flex items-center gap-4 rounded-lg border border-white/15 bg-[#172219]/90 px-3 py-2 shadow-lg shadow-black/25 backdrop-blur-sm transition hover:bg-[#314839]"
        >
          <span>
            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#c7d6a5]">Demo environment</span>
            <span className="mt-1 block text-sm font-bold text-[#f9e8d2] md:text-base">{images[active]?.label}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-[#f9e8d2] transition group-hover/link:translate-x-1" />
        </Link>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => move(-1)} aria-label="Previous screenshot" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[#172219]/65 transition hover:bg-[#314839]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Next screenshot" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[#172219]/65 transition hover:bg-[#314839]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="absolute right-4 top-4 flex gap-1.5 rounded-full bg-[#172219]/68 p-2 backdrop-blur-sm md:right-5 md:top-5">
        {images.map((image, index) => (
          <button
            key={image.label}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show ${image.label}`}
            aria-current={index === active ? "true" : undefined}
            className={`h-2 rounded-full transition-all ${index === active ? "w-6 bg-[#f9e8d2]" : "w-2 bg-white/45 hover:bg-white/75"}`}
          />
        ))}
      </div>
    </div>
  );
}
