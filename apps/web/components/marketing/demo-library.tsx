"use client";

import Image from "next/image";
import {
  BriefcaseBusiness,
  Check,
  LayoutDashboard,
  ShoppingBag,
  UsersRound
} from "lucide-react";
import { useState } from "react";
import { packageDefinitions } from "@/lib/packages";

const presentation = {
  "operations-hub": {
    shortName: "Operations",
    image: "/media/generated/features-carousel/operations-hub.jpg",
    imageAlt: "A generated Operations Hub workspace with scheduling, documents, approvals, and reports",
    icon: LayoutDashboard,
    flow: [
      "Your team starts the day from one company home.",
      "Work, schedules, tickets, and training stay connected.",
      "Managers approve and act without chasing updates.",
      "Reporting reflects what is actually happening."
    ]
  },
  "client-portal": {
    shortName: "Client Portal",
    image: "/media/generated/features-carousel/client-portal.jpg",
    imageAlt: "A generated Client Portal workspace across laptop and tablet screens",
    icon: UsersRound,
    flow: [
      "Clients sign into a space that feels like your brand.",
      "Projects, files, invoices, and requests stay together.",
      "Your team responds from the same shared record.",
      "Customers always know what happens next."
    ]
  },
  "crm-sales-pipeline": {
    shortName: "CRM",
    image: "/media/generated/features-carousel/crm-sales-pipeline.jpg",
    imageAlt: "A generated CRM workspace with a sales pipeline and conversion reporting",
    icon: BriefcaseBusiness,
    flow: [
      "A lead enters with the context your team needs.",
      "Deals move through a clear, shared pipeline.",
      "Proposals, follow-ups, and signatures stay attached.",
      "Closed work hands cleanly into billing and operations."
    ]
  },
  storefront: {
    shortName: "Storefront",
    image: "/media/generated/features-carousel/storefront.jpg",
    imageAlt: "A generated Storefront workspace with catalog, checkout, orders, and inventory",
    icon: ShoppingBag,
    flow: [
      "Customers find the right product or service quickly.",
      "Checkout follows your pricing and payment rules.",
      "Orders move into a practical fulfillment view.",
      "Inventory, receipts, and customer history stay current."
    ]
  }
} as const;

export function DemoLibrary() {
  const [selectedSlug, setSelectedSlug] = useState<(typeof packageDefinitions)[number]["slug"]>("operations-hub");
  const selected = packageDefinitions.find((item) => item.slug === selectedSlug) ?? packageDefinitions[0];
  const detail = presentation[selected.slug];

  return (
    <section data-public-hero-shell className="px-3 pt-3">
      <div data-public-hero className="overflow-hidden rounded-[2rem] bg-[#172219] px-5 pb-5 pt-28 text-[#f9e8d2] md:px-8 md:pb-8 md:pt-32">
        <div className="mx-auto max-w-[100rem]">
        <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold text-[#b4c292]">Eclipse demo environments</p>
            <h1 className="mt-3 max-w-4xl font-title text-5xl leading-[0.88] sm:text-6xl md:text-[5.4rem] lg:text-[6.25rem]">
              See the system before the sales call.
            </h1>
          </div>
          <div>
            <p className="max-w-2xl text-base font-semibold leading-7 text-white/72 md:text-lg">
              Choose an environment to see who uses it, what moves through it, and how the pieces work together before we ever ask you to book a call.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#f9e8d2]/78">
              {["No login required", "Real workflow detail", "Built around your team"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#b4c292]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Demo environments"
          className="mt-10 flex gap-2 overflow-x-auto border-b border-white/15 pb-4"
        >
          {packageDefinitions.map((item) => {
            const itemDetail = presentation[item.slug];
            const Icon = itemDetail.icon;
            const selectedTab = item.slug === selected.slug;

            return (
              <button
                key={item.slug}
                type="button"
                role="tab"
                aria-selected={selectedTab}
                aria-controls="selected-demo"
                onClick={() => setSelectedSlug(item.slug)}
                className={
                  selectedTab
                    ? "flex h-12 shrink-0 items-center gap-2 rounded-full bg-[#f9e8d2] px-5 text-sm font-bold text-[#314839]"
                    : "flex h-12 shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-sm font-bold text-white/72 transition hover:bg-white/10 hover:text-white"
                }
              >
                <Icon className="h-4 w-4" />
                {itemDetail.shortName}
              </button>
            );
          })}
        </div>

        <article
          id="selected-demo"
          role="tabpanel"
          className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#fbfaf6] text-[#172219] shadow-2xl shadow-black/20"
        >
          <div className="grid lg:grid-cols-[1.06fr_0.94fr]">
            <div className="relative min-h-[360px] overflow-hidden bg-[#172219] md:min-h-[560px]">
              <Image
                key={detail.image}
                src={detail.image}
                alt={detail.imageAlt}
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="animate-in object-cover fade-in duration-700"
              />
              <div className="absolute inset-x-0 bottom-0 bg-[#172219]/88 px-6 py-5 text-[#f9e8d2] backdrop-blur-md md:px-8">
                <p className="text-xs font-bold uppercase text-[#b4c292]">Designed for</p>
                <p className="mt-1 text-lg font-bold">{selected.audience}</p>
              </div>
            </div>

            <div className="p-7 md:p-10 lg:p-12">
              <p className="text-sm font-bold text-[#314839]">{detail.shortName} environment</p>
              <h3 className="mt-3 font-title text-[clamp(3rem,4.6vw,5.5rem)] leading-[0.88]">{selected.name}</h3>
              <p className="mt-5 text-xl font-bold leading-7 text-[#314839]">{selected.tagline}</p>
              <p className="mt-5 text-base font-semibold leading-7 text-[#314839]/72">{selected.description}</p>

              <div className="mt-8 grid grid-cols-3 border-y border-[#314839]/14 py-5">
                {selected.metrics.map((metric) => (
                  <div key={metric.label} className="border-l border-[#314839]/14 px-3 first:border-l-0 first:pl-0">
                    <p className="font-title text-3xl leading-none text-[#314839] md:text-4xl">{metric.value}</p>
                    <p className="mt-2 text-xs font-bold leading-4 text-[#314839]/58">{metric.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-sm font-bold">Included views</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {selected.features.slice(0, 8).map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm font-semibold leading-5 text-[#314839]/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#78905d]" />
                      <span className="first-letter:uppercase">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-[#d8d0c1] bg-[#eef1e5] px-7 py-8 md:px-10">
            <p className="text-sm font-bold text-[#314839]">How the work moves</p>
            <ol className="mt-5 grid gap-5 md:grid-cols-4">
              {detail.flow.map((step, index) => (
                <li key={step} className="border-l-2 border-[#b4c292] pl-4">
                  <span className="text-xs font-bold text-[#314839]/48">0{index + 1}</span>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#314839]">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </article>
        </div>
      </div>
    </section>
  );
}
