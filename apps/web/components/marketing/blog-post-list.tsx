"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { BlogLikeButton } from "@/components/marketing/blog-like-button";

const posts = [
  {
    id: "weekly-time-review",
    title: "The weekly time review that saves Friday afternoon",
    category: "Timekeeping",
    excerpt: "A lighter review rhythm catches missing context before payroll, billing, and the end-of-week scramble.",
    href: "/blog/weekly-time-review",
    image: "/media/generated/blog/weekly-time-review.png",
    imageAlt: "An operations manager reviewing a weekly timesheet in warm afternoon light",
    date: "Jun 24, 2026",
    likes: 42
  },
  {
    id: "approved-time-invoices",
    title: "Why invoice drafts should start with approved time",
    category: "Billing",
    excerpt: "Connect approval and invoicing so the billing desk starts with work the team has already reviewed.",
    href: "/blog/approved-time-invoices",
    image: "/media/generated/blog/approved-time-invoices.png",
    imageAlt: "A billing professional aligning approved time with an invoice draft",
    date: "Jun 17, 2026",
    likes: 31
  },
  {
    id: "shift-swap-record",
    title: "Shift swaps need a record, not a group text",
    category: "Operations",
    excerpt: "Give schedule changes a clear owner, approval trail, and place in the same system as the work.",
    href: "/blog/shift-swap-record",
    image: "/media/generated/blog/shift-swap-record.png",
    imageAlt: "A restaurant team reviewing a shift change together on a tablet",
    date: "Jun 10, 2026",
    likes: 57
  },
  {
    id: "legal-time-tracking",
    title: "When a law firm outgrows generic time tracking",
    category: "Legal",
    excerpt: "The warning signs appear when time, matters, billing rules, and client expectations stop fitting one tool.",
    href: "/blog/legal-time-tracking",
    image: "/media/generated/blog/legal-time-tracking.png",
    imageAlt: "A lawyer reviewing matter notes and time records in a quiet office",
    date: "Jun 03, 2026",
    likes: 38
  }
] as const;

export function BlogPostList() {
  return (
    <div className="grid gap-7">
      {posts.map((post, index) => {
        return (
          <article
            key={post.id}
            className="group grid overflow-hidden rounded-[1.75rem] border border-[#d8d0c1] bg-[#fbfaf6] shadow-xl shadow-[#172219]/6 transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#172219]/12 lg:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="flex min-h-[28rem] flex-col p-7 md:p-10 lg:p-12">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#314839]/65">
                <span className="text-[#314839]">{post.category}</span>
                <span className="h-1 w-1 rounded-full bg-[#b4c292]" />
                <span>0{index + 1}</span>
              </div>

              <h2 className="mt-8 max-w-2xl font-title text-[clamp(2.8rem,4.5vw,5.2rem)] leading-[0.9] text-[#172219]">
                {post.title}
              </h2>
              <span className="mt-7 block h-[3px] w-14 rounded-full bg-[#b4c292]" />
              <p className="mt-7 max-w-xl text-base font-semibold leading-7 text-[#314839]/75">{post.excerpt}</p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-5 pt-10">
                <div className="flex items-center gap-5 text-sm font-bold text-[#314839]/68">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#879665]" />
                    {post.date}
                  </span>
                  <BlogLikeButton postId={post.id} title={post.title} likes={post.likes} />
                </div>

                <Link href={post.href} className="inline-flex items-center gap-2 text-sm font-bold text-[#314839]">
                  Read the story
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <Link href={post.href} className="relative min-h-[22rem] overflow-hidden lg:min-h-full" aria-label={`Read ${post.title}`}>
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172219]/22 via-transparent to-transparent" />
              <span className="absolute bottom-6 right-6 rounded-full border border-white/35 bg-[#172219]/45 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
                {post.category} field note
              </span>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
