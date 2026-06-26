import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, ClipboardList, Hammer, Presentation, Wrench } from "lucide-react";
import { HomePillHeader } from "@/components/marketing/home-pill-header";
import { MuteOnlyVideo } from "@/components/marketing/mute-only-video";

export const metadata: Metadata = {
  title: "Eclipse Systems | Custom Software Consulting",
  description:
    "Eclipse Systems designs custom business software for operations, client portals, CRM, storefronts, billing workflows, dashboards, automations, and integrations.",
  alternates: { canonical: "/" }
};

const featureCards = [
  {
    eyebrow: "Live demo",
    title: "See working software before you commit.",
    text: "The first conversation gets concrete fast. We can walk through operations, client portals, CRM, storefronts, billing, and reporting as working environments.",
    cta: "Schedule a demo",
    href: "/schedule-demo",
    video: "/media/eclipse-systems-demo-showcase.webm",
    poster: "/media/eclipse-systems-demo-showcase-poster.png"
  },
  {
    eyebrow: "Workflow",
    title: "Map the business before writing the system.",
    text: "We start with the real handoffs: who owns the work, what customers need to see, where approvals stall, and what should become automatic.",
    cta: "Explore the approach",
    href: "#about",
    image: "/media/generated/eclipse-operations-glass.png",
    imageAlt: "Floating glass operations software modules"
  },
  {
    eyebrow: "Custom build",
    title: "Launch the layer your team actually needs.",
    text: "Your system can connect portals, operations, sales, commerce, invoices, dashboards, permissions, and automations into one coherent product.",
    cta: "Talk through the build",
    href: "/schedule-demo",
    image: "/media/generated/eclipse-commerce-glass.png",
    imageAlt: "Floating glass CRM and commerce software modules"
  }
] as const;

const industries = [
  "Manufacturing.",
  "Construction.",
  "Healthcare.",
  "Field Service.",
  "Real Estate.",
  "Retail.",
  "Hospitality.",
  "Education.",
  "Logistics.",
  "Nonprofits.",
  "Fitness.",
  "Legal.",
  "Finance.",
  "Insurance.",
  "Your Business.",
  "Automotive.",
  "Home Services.",
  "Agriculture.",
  "Your Team.",
  "Events.",
  "Franchises.",
  "Your Business.",
  "Pro Services.",
  "Property Teams.",
  "Food Service.",
  "Your Team.",
  "Medical Offices.",
  "Trade Teams.",
  "Your Business."
] as const;

const processSteps = [
  {
    number: "01",
    title: "Discovery",
    summary: "Meet with you and your key people to uncover the workflow, goals, blockers, and right build path.",
    detail: "Bring us the messy process. We will map what matters, define success, and shape a clear timeline your team can trust.",
    icon: ClipboardList
  },
  {
    number: "02",
    title: "Creation",
    summary: "Turn the plan into working software while you review, refine, and keep the build aligned with real operations.",
    detail: "Your screens, permissions, automations, reports, data, and integrations come together in a system built around your team.",
    icon: Hammer
  },
  {
    number: "03",
    title: "Implementation",
    summary: "Launch with training, admin handoff, and the rollout plan created during discovery.",
    detail: "Your staff gets the walkthroughs, controls, and confidence they need before the new system becomes daily workflow.",
    icon: Presentation
  },
  {
    number: "04",
    title: "Maintenance",
    summary: "Keep improving the system as your team grows, shifts, and finds better ways to work.",
    detail: "Stay supported after launch with workflow help, updates, adjustments, and the steady backup to keep momentum.",
    icon: Wrench
  }
] as const;

export default function LandingPage() {
  return (
    <main className="home-redesign min-h-screen overflow-hidden bg-[#111913] text-[#f9e8d2]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body > header {
              display: none !important;
            }

            .home-redesign {
              --ease-out-soft: cubic-bezier(.16, 1, .3, 1);
            }

            .home-redesign .motion-rise {
              animation: home-rise 900ms var(--ease-out-soft) both;
            }

            .home-redesign .motion-rise-delay {
              animation: home-rise 1100ms var(--ease-out-soft) 120ms both;
            }

            .home-redesign .hero-art {
              animation: dashboard-float var(--float-duration, 9200ms) ease-in-out infinite;
              will-change: transform;
              transform: translate3d(0, 0, 0);
            }

            .home-redesign .glass-card {
              transition: transform 520ms var(--ease-out-soft), border-color 520ms var(--ease-out-soft), background-color 520ms var(--ease-out-soft), box-shadow 520ms var(--ease-out-soft);
            }

            .home-redesign .glass-card:hover {
              transform: translateY(-8px);
              border-color: rgba(249, 232, 210, .34);
              background-color: rgba(255, 255, 255, .085);
              box-shadow: 0 26px 70px rgba(0, 0, 0, .24);
            }

            .home-redesign .feature-card {
              animation: home-rise 900ms var(--ease-out-soft) both;
              transition: transform 620ms var(--ease-out-soft), box-shadow 620ms var(--ease-out-soft), border-color 620ms var(--ease-out-soft);
            }

            .home-redesign .feature-card:hover {
              transform: translateY(-6px);
              border-color: rgba(180, 194, 146, .42);
            }

            .home-redesign .feature-media {
              transition: transform 900ms var(--ease-out-soft), filter 900ms var(--ease-out-soft);
            }

            .home-redesign .feature-card:hover .feature-media {
              transform: scale(1.035);
              filter: saturate(1.08) contrast(1.05);
            }

            .home-redesign .soft-band {
              position: relative;
              overflow: hidden;
            }

            .home-redesign .soft-band::before {
              content: "";
              position: absolute;
              inset: -40% -10% auto;
              height: 70%;
              background: radial-gradient(circle at 50% 0%, rgba(249,232,210,.16), transparent 58%);
              pointer-events: none;
            }

            .home-redesign .industry-flip {
              position: relative;
              height: clamp(2.85rem, 4.85vw, 5.4rem);
              width: min(100%, 48rem);
              overflow: hidden;
              perspective: 900px;
            }

            .home-redesign .industry-flip-word {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transform: translateY(42%) rotateX(62deg);
              transform-origin: 50% 100%;
              animation: industry-flip var(--industry-cycle-duration, 87s) cubic-bezier(.16, 1, .3, 1) infinite;
              will-change: opacity, transform;
            }

            .home-redesign .industry-flip-label {
              position: relative;
              display: inline-block;
              padding-bottom: .08em;
            }

            .home-redesign .industry-flip-label::after {
              content: "";
              position: absolute;
              left: 3%;
              right: 2%;
              bottom: .045em;
              height: .12em;
              border-radius: 999px;
              background: rgba(249, 232, 210, .88);
              clip-path: polygon(0 48%, 7% 35%, 15% 52%, 24% 42%, 34% 58%, 45% 39%, 56% 51%, 68% 45%, 79% 60%, 90% 41%, 100% 55%, 100% 82%, 88% 73%, 75% 84%, 62% 70%, 49% 82%, 37% 72%, 25% 86%, 13% 70%, 0 78%);
              transform: rotate(-1.4deg) translateY(.02em);
              transform-origin: left center;
              filter: drop-shadow(0 .035em 0 rgba(23, 34, 25, .16));
            }

            @media (min-width: 1024px) {
              .home-redesign .industry-flip-word {
                justify-content: flex-start;
              }
            }

            @keyframes home-rise {
              from {
                opacity: 0;
                transform: translateY(28px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes industry-flip {
              0% {
                opacity: 0;
                transform: translateY(42%) rotateX(62deg);
              }
              .45%, 2.65% {
                opacity: 1;
                transform: translateY(0) rotateX(0deg);
              }
              3.2%, 100% {
                opacity: 0;
                transform: translateY(-42%) rotateX(-62deg);
              }
            }

            .home-redesign .hero-scene {
              width: max(100%, calc((100vh - 1.5rem) * 1.777));
              height: max(100%, calc(100vw / 1.777));
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
            }

            @keyframes dashboard-float {
              0%, 100% {
                transform: translate3d(0, calc(var(--float-distance, 10px) * -0.5), 0);
              }
              50% {
                transform: translate3d(0, calc(var(--float-distance, 10px) * 0.5), 0);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .home-redesign .motion-rise,
              .home-redesign .motion-rise-delay,
              .home-redesign .hero-art,
              .home-redesign .industry-flip-word {
                animation: none;
              }

              .home-redesign .industry-flip-word:first-child {
                opacity: 1;
                transform: none;
              }

              .home-redesign .glass-card,
              .home-redesign .glass-card:hover,
              .home-redesign .feature-card,
              .home-redesign .feature-card:hover,
              .home-redesign .feature-media,
              .home-redesign .feature-card:hover .feature-media {
                transition: none;
                transform: none;
              }
            }
          `
        }}
      />

      <section className="relative px-3 py-3">
        <div className="relative min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#18231c] shadow-2xl shadow-black/40">
          <div className="hero-scene absolute" aria-label="A hand holding floating glass software dashboards in Eclipse brand colors">
            <Image
              src="/media/generated/hero-layers/hero-base.png"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <Image
              src="/media/generated/hero-layers/left-dashboard.png"
              alt=""
              width={275}
              height={285}
              priority
              className="hero-art absolute h-auto w-[16.45%]"
              style={{ left: "35.89%", top: "30.29%", "--float-distance": "12px", "--float-duration": "10200ms" } as React.CSSProperties}
            />
            <Image
              src="/media/generated/hero-layers/middle-dashboard.png"
              alt=""
              width={250}
              height={210}
              priority
              className="hero-art absolute h-auto w-[14.95%]"
              style={{ left: "49.94%", top: "45.91%", "--float-distance": "8px", "--float-duration": "9200ms", animationDelay: "-2400ms" } as React.CSSProperties}
            />
            <Image
              src="/media/generated/hero-layers/right-dashboard.png"
              alt=""
              width={435}
              height={360}
              priority
              className="hero-art absolute h-auto w-[26.02%]"
              style={{ left: "54.43%", top: "15.41%", "--float-distance": "14px", "--float-duration": "11200ms", animationDelay: "-5200ms" } as React.CSSProperties}
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(249,232,210,.18),transparent_34%),linear-gradient(180deg,rgba(17,25,19,.08),rgba(17,25,19,.56)_72%,rgba(17,25,19,.82))]" />
          <div className="absolute inset-x-0 top-[58%] h-px bg-white/12" />
          <div className="absolute inset-y-0 left-[3.2%] w-px bg-white/12" />
          <div className="absolute inset-y-0 right-[3.2%] w-px bg-white/12" />

          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[112rem] flex-col px-5 py-7 md:px-10">
            <HomePillHeader />

            <div className="motion-rise-delay grid flex-1 place-items-center pb-20 pt-16 text-center md:pb-28">
              <div className="w-full max-w-[104rem]">
                <h1 className="text-[clamp(2.65rem,5vw,6.65rem)] leading-[0.96] text-[#f9e8d2] drop-shadow-[0_16px_34px_rgba(0,0,0,.36)]">
                  <span className="block md:whitespace-nowrap font-title">Transform your workflow.</span>
                  <span className="block md:whitespace-nowrap font-sans font-normal">Elevate your operations.</span>
                </h1>
              </div>
            </div>

            <div className="motion-rise-delay mx-auto mb-14 grid w-full max-w-[35rem] justify-items-center text-center">
              <p className="text-base font-semibold leading-7 text-white/78 md:text-lg">
                Eclipse builds custom software that adapts to the rhythm of your business: portals, operations hubs, sales pipelines, storefronts, billing, reporting, and automation.
              </p>
              <Link href="/schedule-demo" className="mt-6 rounded-full bg-[#b4c292] px-7 py-3 text-sm font-bold text-[#18231c] shadow-xl shadow-black/20 transition hover:bg-[#f9e8d2]">
                Schedule a demo
              </Link>
            </div>

          </div>
        </div>
      </section>

      <section id="product" className="px-3 pb-3">
        <div className="rounded-[2rem] border border-white/10 bg-[#f5f2eb] px-5 pb-14 pt-6 text-[#172219] md:px-10 md:pb-24 md:pt-10">
          <div className="mx-auto grid max-w-[92rem] gap-7 md:gap-10">
            <section className="feature-card relative rounded-[2rem] border border-[#d8d0c1] bg-[#fbfaf6] p-7 shadow-2xl shadow-[#172219]/10 md:p-10 lg:p-14">
              <span className="absolute right-7 top-7 inline-flex rounded-full border border-[#b4c292]/60 bg-[#eef1e5] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#314839] md:right-10 md:top-10 lg:right-14 lg:top-14">
                Process
              </span>
              <div className="flex flex-wrap items-start justify-between gap-8 pr-0 pt-10 md:pr-32 md:pt-0">
                <div>
                  <h2 className="max-w-4xl font-title text-[clamp(3.1rem,5.4vw,6.4rem)] leading-[0.88] text-[#172219]">
                    From first fit to ongoing support.
                  </h2>
                </div>
                <div className="grid justify-items-start gap-6">
                  <p className="max-w-xl text-base font-semibold leading-7 text-[#314839]/78 md:text-lg">
                    A clean build starts with clarity, then moves through creation, rollout, and maintenance without losing the people who actually use the system.
                  </p>
                </div>
              </div>

              <div className="mt-12 grid gap-5 lg:grid-cols-4 lg:gap-14">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                  <article key={step.number} className="group relative rounded-[1.7rem] bg-[#314839] p-5 text-[#f9e8d2] transition duration-500 hover:-translate-y-1 hover:bg-[#172219] md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid h-16 w-16 place-items-center rounded-[1.15rem] bg-[#b4c292] text-[#172219] shadow-[0_14px_34px_rgba(23,34,25,.2)]">
                        <Icon className="h-8 w-8 stroke-[1.85]" />
                      </div>
                      <span className="rounded-full bg-[#f9e8d2] px-3 py-1 text-xs font-bold text-[#314839]">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mt-12 text-3xl font-bold leading-none">{step.title}</h3>
                    <p className="mt-3 text-base font-semibold leading-6 text-[#f9e8d2]">{step.summary}</p>
                    <p className="mt-4 text-sm font-semibold leading-6 text-[#f9e8d2]/72">{step.detail}</p>
                    {index < processSteps.length - 1 ? (
                      <ArrowRight className="absolute -right-11 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full border border-[#314839]/20 bg-[#f9e8d2] p-1.5 text-[#314839] shadow-[0_14px_30px_rgba(23,34,25,.18)] lg:block" />
                    ) : null}
                  </article>
                  );
                })}
              </div>
            </section>

            {featureCards.map((card, index) => {
              const isDark = index === 0;
              const isSage = index === 2;

              if (isDark) {
                return (
                  <article
                    key={card.title}
                    className="feature-card overflow-hidden rounded-[2rem] border border-[#314839] bg-[#314839] text-[#f9e8d2] shadow-2xl shadow-[#172219]/10 xl:-mx-32 2xl:-mx-44"
                  >
                    <div className="grid gap-8 px-7 py-12 md:px-12 md:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-14 lg:px-16">
                      <div className="relative grid justify-items-center text-center lg:justify-items-start lg:text-left">
                        <h2 className="relative z-10 max-w-xl font-title text-[clamp(2.35rem,3.9vw,4.85rem)] leading-[0.94] text-[#f9e8d2]">
                          Software built for
                        </h2>
                        <div className="relative z-10 mt-3 flex w-full justify-center lg:justify-start">
                          <div className="industry-flip font-title text-[clamp(2.05rem,4.15vw,4.95rem)] leading-none text-[#b4c292]">
                            {industries.map((industry, industryIndex) => (
                              <span
                                key={industry}
                                className="industry-flip-word whitespace-nowrap"
                                style={
                                  {
                                    "--industry-cycle-duration": `${industries.length * 3}s`,
                                    animationDelay: `${industryIndex * 3}s`
                                  } as React.CSSProperties
                                }
                              >
                                <span className="industry-flip-label">{industry}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="relative z-10 mt-7 max-w-md text-base font-semibold leading-7 text-[#f9e8d2]/78 md:text-lg">
                          Walk through operations, portals, CRM, storefronts, billing, reporting, and automation as real working environments.
                        </p>
                        <Link
                          href={card.href}
                          className="relative z-10 mt-9 inline-flex rounded-full bg-[#f9e8d2] px-7 py-3 text-sm font-bold text-[#314839] transition hover:bg-white"
                        >
                          Schedule a demo
                        </Link>
                        <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-[#f9e8d2]/72 lg:justify-start">
                          {["No pressure walkthrough", "Real product screens", "Built around your workflow"].map((item) => (
                            <span key={item} className="inline-flex items-center gap-2">
                              <Check className="h-4 w-4 text-[#b4c292]" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="relative overflow-hidden rounded-[1.6rem] border border-[#f9e8d2]/20 bg-[#172219] shadow-[0_28px_70px_rgba(0,0,0,.24)]">
                        {"video" in card ? (
                          <MuteOnlyVideo
                            className="aspect-video w-full origin-top scale-[1.13] object-cover"
                            src={card.video}
                            poster={card.poster}
                          />
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              }

              return (
              <article
                key={card.title}
                id={index === 1 ? "about" : index === 2 ? "systems" : undefined}
                className={`feature-card grid overflow-hidden rounded-[2rem] shadow-2xl shadow-[#172219]/10 lg:grid-cols-2 lg:items-center ${
                  isSage
                      ? "border border-[#cbd3b0] bg-[#eef1e5] text-[#172219]"
                      : "border border-[#d8d0c1] bg-[#fbfaf6] text-[#172219]"
                }`}
              >
                <div className={`relative min-h-[340px] overflow-hidden bg-[#172219] md:min-h-[460px] ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  {"video" in card ? (
                    <MuteOnlyVideo
                      className="feature-media h-full min-h-[340px] w-full object-cover md:min-h-[460px]"
                      src={card.video}
                      poster={card.poster}
                    />
                  ) : (
                    <Image
                      src={card.image}
                      alt={card.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 43vw, 94vw"
                      className="feature-media object-cover"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#172219]/36 via-transparent to-transparent" />
                </div>

                <div className="p-7 md:p-12 lg:p-16">
                  <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${
                    "border border-[#b4c292]/60 bg-[#fbfaf6] text-[#314839]"
                  }`}>
                    {card.eyebrow}
                  </span>
                  <h2 className="mt-7 max-w-xl font-title text-[clamp(3.1rem,5.4vw,6.4rem)] leading-[0.88]">
                    {card.title}
                  </h2>
                  <p className="mt-7 max-w-lg text-base font-semibold leading-7 text-[#314839]/82 md:text-lg">
                    {card.text}
                  </p>
                  <Link
                    href={card.href}
                    className="mt-8 inline-flex rounded-full bg-[#172219] px-6 py-3 text-sm font-bold text-[#f9e8d2] transition hover:bg-[#314839]"
                  >
                    {card.cta}
                  </Link>
                </div>
              </article>
              );
            })}

            <div className="feature-card rounded-[2rem] border border-[#d8d0c1] bg-[#172219] p-7 text-[#f9e8d2] shadow-2xl shadow-[#172219]/10 md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#b4c292]">Ready</p>
                  <h2 className="mt-4 max-w-4xl font-title text-[clamp(3rem,5vw,6rem)] leading-[0.88]">
                    Bring the workflow. We will bring the working model.
                  </h2>
                </div>
                <Link href="/schedule-demo" className="inline-flex rounded-full bg-[#f9e8d2] px-7 py-3 text-sm font-bold text-[#314839] transition hover:bg-white">
                  Schedule a demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
