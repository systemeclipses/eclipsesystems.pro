"use client";

import Image from "next/image";
import Link from "next/link";
import { HelpCircle, Mail, MessageSquareText, X } from "lucide-react";
import { useState } from "react";

const quickActions = [
  {
    label: "Schedule a demo",
    description: "Pick a time to walk through fit and options.",
    href: "/schedule-demo",
    icon: MessageSquareText
  },
  {
    label: "FAQs",
    description: "Answers about timelines, scope, and support.",
    href: "/help-center",
    icon: HelpCircle
  },
  {
    label: "Contact info",
    description: "Email Eclipse Systems directly.",
    href: "mailto:help@eclipsesystems.pro",
    icon: Mail
  }
] as const;

export function QuickActionMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(calc(100vw-2.5rem),22rem)] rounded-[1.25rem] border border-[#d8d0c1] bg-[#fbfaf6] p-3 text-[#172219] shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-3 border-b border-[#d8d0c1] px-2 pb-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#314839]">
                <Image src="/brand/logomark-white.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              </span>
              <div>
                <p className="text-sm font-bold">How can we help?</p>
                <p className="text-xs font-semibold text-[#314839]/62">Choose a next step.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close quick actions"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d0c1] text-[#314839] transition hover:bg-[#eef1e5]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group grid grid-cols-[2.5rem_1fr] gap-3 rounded-[1rem] p-3 transition hover:bg-[#eef1e5]"
                  onClick={() => setOpen(false)}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b4c292] text-[#172219] transition group-hover:bg-[#314839] group-hover:text-[#f9e8d2]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{action.label}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#314839]/64">{action.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid h-16 w-16 place-items-center rounded-full border border-[#f9e8d2]/30 bg-[#314839] shadow-2xl shadow-black/25 transition hover:-translate-y-1 hover:bg-[#172219]"
      >
        <Image src="/brand/logomark-white.png" alt="" width={42} height={42} className="h-10 w-10 object-contain" />
      </button>
    </div>
  );
}
