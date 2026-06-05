"use client";
import Link from "next/link";
import { useState } from "react";

type Gf1NavLink = { label: string; href: string; beta?: boolean };

const GF1_LINKS: Gf1NavLink[] = [
  { label: "Dashboard", href: "/gf1" },
  { label: "Pipeline", href: "/gf1/pipeline" },
  { label: "Proposals", href: "/gf1/proposals" },
  { label: "Organizations", href: "/gf1/organizations" },
  { label: "Activity", href: "/gf1/activity" },
  { label: "Reports", href: "/gf1/reports/win-loss" },
];

export default function MainNavGF1Dropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="gf1-nav-dropdown relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="gf1-nav-trigger px-4 py-2 font-semibold text-neutral-900 bg-white rounded hover:bg-neutral-100 focus:outline-none flex items-center gap-1"
        aria-haspopup="true"
        aria-expanded={open}
        type="button"
      >
        GF1
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="gf1-nav-menu absolute left-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 min-w-[180px] z-50">
          {GF1_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block px-4 py-2 text-sm text-neutral-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <span className="inline-flex items-center gap-1">
                  <span>{link.label}</span>
                  {link.beta && (
                    <span className="text-[10px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Beta
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
