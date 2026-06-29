"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, FileText, Scale, UsersRound } from "lucide-react";
import { useRef, useState } from "react";

const posts = [
  {
    title: "The weekly time review that saves Friday afternoon",
    category: "Timekeeping",
    excerpt: "A lighter review rhythm catches missing context before payroll, billing, and the end-of-week scramble.",
    href: "/guides",
    icon: Clock3
  },
  {
    title: "Why invoice drafts should start with approved time",
    category: "Billing",
    excerpt: "Connect approval and invoicing so the billing desk starts with work the team has already reviewed.",
    href: "/invoice-template",
    icon: FileText
  },
  {
    title: "Shift swaps need a record, not a group text",
    category: "Operations",
    excerpt: "Give schedule changes a clear owner, approval trail, and place in the same system as the work.",
    href: "/webinars",
    icon: UsersRound
  },
  {
    title: "When a law firm outgrows generic time tracking",
    category: "Legal",
    excerpt: "The warning signs appear when time, matters, billing rules, and client expectations stop fitting one tool.",
    href: "/pricing",
    icon: Scale
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
          const Icon = post.icon;

          return (
            <Link
              key={post.title}
              href={post.href}
              data-post-index={index}
              onFocus={() => setActiveIndex(index)}
              className="group flex min-h-[21rem] min-w-[86%] snap-start flex-col rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 text-[#172219] transition duration-500 hover:-translate-y-1 hover:border-[#b4c292] sm:min-w-[62%] lg:min-w-[38%] xl:min-w-[31.5%]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#b4c292] text-[#172219]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-[#314839]/60">0{index + 1}</span>
              </div>
              <p className="mt-7 text-xs font-bold uppercase text-[#314839]">{post.category}</p>
              <h3 className="mt-3 font-title text-4xl leading-none">{post.title}</h3>
              <p className="mt-5 text-sm font-semibold leading-6 text-[#314839]/72">{post.excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-bold text-[#314839]">
                Read the preview <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
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
