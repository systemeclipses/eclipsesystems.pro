"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { useRef, useState } from "react";

const posts = [
  {
    title: "The weekly time review that saves Friday afternoon",
    category: "Timekeeping",
    excerpt: "A lighter review rhythm catches missing context before payroll, billing, and the end-of-week scramble.",
    href: "/blog/weekly-time-review",
    image: "/media/generated/blog/weekly-time-review.png",
    imageAlt: "An operations manager reviewing a weekly timesheet in warm afternoon light",
    date: "Jun 24, 2026",
    readTime: "5 min"
  },
  {
    title: "Why invoice drafts should start with approved time",
    category: "Billing",
    excerpt: "Connect approval and invoicing so the billing desk starts with work the team has already reviewed.",
    href: "/blog/approved-time-invoices",
    image: "/media/generated/blog/approved-time-invoices.png",
    imageAlt: "A billing professional aligning approved time with an invoice draft",
    date: "Jun 17, 2026",
    readTime: "6 min"
  },
  {
    title: "Shift swaps need a record, not a group text",
    category: "Operations",
    excerpt: "Give schedule changes a clear owner, approval trail, and place in the same system as the work.",
    href: "/blog/shift-swap-record",
    image: "/media/generated/blog/shift-swap-record.png",
    imageAlt: "A restaurant team reviewing a shift change together on a tablet",
    date: "Jun 10, 2026",
    readTime: "4 min"
  },
  {
    title: "When a law firm outgrows generic time tracking",
    category: "Legal",
    excerpt: "The warning signs appear when time, matters, billing rules, and client expectations stop fitting one tool.",
    href: "/blog/legal-time-tracking",
    image: "/media/generated/blog/legal-time-tracking.png",
    imageAlt: "A lawyer reviewing matter notes and time records in a quiet office",
    date: "Jun 03, 2026",
    readTime: "7 min"
  }
] as const;

export function HomeBlogCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function move(direction: -1 | 1) {
    const next = (activeIndex + direction + posts.length) % posts.length;
    const card = trackRef.current?.querySelector<HTMLElement>(`[data-post-index="${next}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    setActiveIndex(next);
  }

  function syncActivePost() {
    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-post-index]"));
    const nearest = cards.reduce((best, card, index) => {
      const distance = Math.abs(card.offsetLeft - track.offsetLeft - track.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });

    setActiveIndex(nearest.index);
  }

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[2rem] bg-[#172219] px-6 py-8 text-[#f9e8d2] shadow-2xl shadow-[#172219]/10 md:px-10 md:py-11">
      <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="max-w-4xl font-title text-5xl leading-[0.9] sm:text-6xl md:text-[5.4rem]">
            Useful ideas for work in motion.
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/blog" className="mr-2 text-sm font-bold text-[#f9e8d2]/72 transition hover:text-white">
            View all posts
          </Link>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous posts"
            title="Previous posts"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next posts"
            title="Next posts"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#f9e8d2] text-[#314839] transition hover:bg-white"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={syncActivePost}
        className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post, index) => {
          return (
            <Link
              key={post.title}
              href={post.href}
              data-post-index={index}
              onFocus={() => setActiveIndex(index)}
              className="group relative flex h-[31rem] min-w-[86%] snap-start overflow-hidden rounded-[1.25rem] border border-white/15 bg-[#172219] text-center text-[#f9e8d2] shadow-xl transition duration-500 hover:-translate-y-1 hover:border-[#b4c292]/70 hover:shadow-2xl focus-visible:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b4c292] sm:min-w-[62%] lg:min-w-[38%] xl:min-w-[31.5%]"
            >
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(min-width: 1280px) 31vw, (min-width: 1024px) 38vw, (min-width: 640px) 62vw, 86vw"
                className="object-cover transition duration-700 group-hover:scale-[1.035] group-focus-visible:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,13,.34)_0%,rgba(10,18,13,.16)_35%,rgba(10,18,13,.82)_100%)]" />
              <div className="absolute inset-0 bg-[#24382b]/20 transition duration-500 group-hover:bg-[#172219]/72 group-focus-visible:bg-[#172219]/72" />

              <div className="relative z-10 flex h-full w-full flex-col items-center px-7 pb-7 pt-14">
                <div className="transition duration-500 group-hover:-translate-y-3 group-focus-visible:-translate-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b4c292]">{post.category}</p>
                  <h3 className="mx-auto mt-3 max-w-sm font-title text-[2.4rem] leading-[0.94] text-[#f9e8d2]">{post.title}</h3>
                  <span className="mx-auto mt-5 block h-[3px] w-12 rounded-full bg-[#b4c292]" />
                </div>

                <p className="mt-auto translate-y-5 text-sm font-semibold leading-6 text-[#f9e8d2]/88 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                  {post.excerpt}
                </p>

                <div className="mt-6 flex w-full items-center justify-center gap-5 border-t border-white/18 pt-5 text-xs font-bold text-[#f9e8d2]/75">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-[#b4c292]" />{post.date}</span>
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-[#b4c292]" />{post.readTime}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2" aria-hidden="true">
        {posts.map((post, index) => (
          <span key={post.title} className={`h-1 rounded-full transition-all duration-500 ${index === activeIndex ? "w-10 bg-[#f9e8d2]" : "w-4 bg-white/20"}`} />
        ))}
      </div>
    </section>
  );
}
