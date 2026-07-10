import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { BlogLikeButton } from "@/components/marketing/blog-like-button";

const posts = [
  {
    slug: "weekly-time-review",
    title: "The weekly time review that saves Friday afternoon",
    category: "Timekeeping",
    description: "A lighter review rhythm catches missing context before payroll, billing, and the end-of-week scramble.",
    image: "/media/generated/blog/weekly-time-review.png",
    imageAlt: "An operations manager reviewing a weekly timesheet in warm afternoon light",
    date: "Jun 24, 2026",
    readTime: "5 min read",
    likes: 42,
    sections: [
      { heading: "Friday is too late to discover Tuesday", paragraphs: ["Most time problems are not dramatic. A task is missing a client, a timer kept running through lunch, or a useful note exists only in someone’s memory. Left alone, those small gaps become Friday’s cleanup project.", "A ten-minute review in the middle of the week changes the shape of the work. People still remember what happened, managers can resolve exceptions quickly, and payroll or billing never inherits a mystery."] },
      { heading: "Review the exceptions, not every minute", paragraphs: ["A good review does not ask a manager to reread the entire week. Surface entries without descriptions, unusually long sessions, unassigned work, missed breaks, and days that look incomplete.", "The system should make the questionable items obvious and leave normal work alone. That keeps review light enough to become a habit instead of another meeting."] },
      { heading: "Close the loop before the week closes", paragraphs: ["Give each exception an owner and a clear next action. Once corrections are made, approved time can move cleanly into payroll, invoicing, reporting, or matter records.", "The payoff is not only a calmer Friday. It is better operational data produced by a routine the team can actually sustain."] }
    ]
  },
  {
    slug: "approved-time-invoices",
    title: "Why invoice drafts should start with approved time",
    category: "Billing",
    description: "Connect approval and invoicing so the billing desk starts with work the team has already reviewed.",
    image: "/media/generated/blog/approved-time-invoices.png",
    imageAlt: "A billing professional aligning approved time with an invoice draft",
    date: "Jun 17, 2026",
    readTime: "6 min read",
    likes: 31,
    sections: [
      { heading: "A draft should not restart the review", paragraphs: ["When invoice preparation begins with raw time, the billing desk becomes the final detective. Descriptions get rewritten, rates are questioned, and missing approvals interrupt work that should already be moving toward the customer.", "Starting with approved time separates operational review from invoice presentation. The draft becomes a packaging step, not another round of reconstruction."] },
      { heading: "Approval creates a useful boundary", paragraphs: ["Before approval, the team can correct ownership, duration, matter codes, billable status, and supporting detail. After approval, those facts should remain stable unless someone intentionally reopens the record.", "That boundary gives finance a dependable source and creates a visible trail when changes are genuinely required."] },
      { heading: "Build the handoff into the system", paragraphs: ["Approved entries should flow directly into a draft grouped the way the customer expects to see the work. Rates, taxes, retainers, and billing rules can then be applied consistently.", "The result is faster drafting, fewer internal questions, and invoices that are easier for customers to understand and trust."] }
    ]
  },
  {
    slug: "shift-swap-record",
    title: "Shift swaps need a record, not a group text",
    category: "Operations",
    description: "Give schedule changes a clear owner, approval trail, and place in the same system as the work.",
    image: "/media/generated/blog/shift-swap-record.png",
    imageAlt: "A restaurant team reviewing a shift change together on a tablet",
    date: "Jun 10, 2026",
    readTime: "4 min read",
    likes: 57,
    sections: [
      { heading: "A conversation is not a schedule", paragraphs: ["Group texts are excellent at starting a shift swap and terrible at becoming the official record. Someone volunteers, another person reacts, and the manager is left deciding whether the schedule actually changed.", "The cost appears later as missed coverage, incorrect reminders, and a time clock that still expects the original employee."] },
      { heading: "Make the request explicit", paragraphs: ["A useful swap flow identifies the shift, the person requesting coverage, the proposed replacement, and the deadline for a decision. It also checks whether the replacement creates overtime, a role mismatch, or a coverage gap elsewhere.", "The manager should approve one clear request—not interpret a thread."] },
      { heading: "Update every downstream view", paragraphs: ["Once approved, the working schedule, employee reminders, manager dashboard, and clock-in permissions should all reflect the same answer.", "That small piece of workflow design turns a casual conversation into dependable operations without making the team feel buried in process."] }
    ]
  },
  {
    slug: "legal-time-tracking",
    title: "When a law firm outgrows generic time tracking",
    category: "Legal",
    description: "The warning signs appear when time, matters, billing rules, and client expectations stop fitting one tool.",
    image: "/media/generated/blog/legal-time-tracking.png",
    imageAlt: "A lawyer reviewing matter notes and time records in a quiet office",
    date: "Jun 03, 2026",
    readTime: "7 min read",
    likes: 38,
    sections: [
      { heading: "Hours are only the beginning", paragraphs: ["Generic trackers are built to answer who worked and for how long. A law firm also needs to know the matter, task, activity, billing arrangement, narrative quality, and whether the entry follows a client’s outside-counsel rules.", "When those details live in spreadsheets and memory, time capture may be simple while billing remains difficult."] },
      { heading: "Watch for work around the tool", paragraphs: ["Frequent narrative rewrites, manual UTBMS coding, separate matter lists, rate spreadsheets, and repeated pre-bill corrections are signs that the system no longer represents the work.", "Another warning is delayed entry. If recording time requires too much later cleanup, attorneys naturally postpone it and accuracy declines."] },
      { heading: "Choose around the whole billing lifecycle", paragraphs: ["The better question is not whether a product has a timer. Ask how captured work becomes reviewed time, a compliant invoice, a client-facing record, and useful firm reporting.", "A system that connects those stages reduces write-downs and administrative drag while giving the firm a clearer picture of where its effort becomes revenue."] }
    ]
  }
] as const;

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = posts.find((item) => item.slug === params.slug);
  return post ? { title: post.title, description: post.description } : {};
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((item) => item.slug === params.slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-[#172219]">
      <article>
        <header className="pb-10 pl-5 pt-32 md:pl-14 md:pt-40 lg:pl-20">
          <div className="w-full">
            <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,32vw)] lg:items-stretch lg:gap-10">
              <div className="max-w-6xl pb-8 pr-5 lg:pb-14 lg:pt-3 lg:pr-0">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#65734c]">{post.category}</p>
                  <h1 className="mt-5 max-w-5xl font-title text-[clamp(2.75rem,4.2vw,5rem)] leading-[0.9]">{post.title}</h1>
                  <p className="mt-7 max-w-4xl text-lg font-semibold leading-8 text-[#314839]/72">{post.description}</p>
                  <div className="mt-8 flex flex-wrap items-center gap-5 text-sm font-bold text-[#314839]/70">
                    <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#879665]" />{post.date}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#879665]" />{post.readTime}</span>
                    <BlogLikeButton postId={post.slug} title={post.title} likes={post.likes} />
                  </div>
                </div>

                <div className="mt-14 max-w-5xl border-t border-[#314839]/15 pt-12">
                  {post.sections.map((section) => (
                    <section key={section.heading} className="mb-14 last:mb-0">
                      <h2 className="font-title text-4xl leading-none md:text-5xl">{section.heading}</h2>
                      <span className="mt-5 block h-[3px] w-14 rounded-full bg-[#b4c292]" />
                      <div className="mt-7 grid gap-6 text-lg font-medium leading-8 text-[#314839]/82 md:grid-cols-2">
                        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                      </div>
                    </section>
                  ))}
                  <div className="border-t border-[#314839]/15 pt-8">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[#314839]"><ArrowLeft className="h-4 w-4" />View all blog posts</Link>
                  </div>
                </div>
              </div>
              <div className="relative min-h-[34rem] overflow-hidden rounded-l-[2rem] shadow-2xl shadow-[#172219]/15 md:min-h-[44rem] lg:h-full">
                <Image src={post.image} alt={post.imageAlt} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#172219]/22 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </header>
      </article>
    </main>
  );
}
