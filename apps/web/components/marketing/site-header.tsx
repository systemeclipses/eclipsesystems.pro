import Link from "next/link";
import { ChevronUp, Mail, Sparkles } from "lucide-react";

const resourceLinks = [
  ["Blog", "/blog"],
  ["Webinars", "/webinars"],
  ["Guides & Templates", "/guides"],
  ["Help Center", "/help-center"],
  ["Developer Documentation", "/developer-documentation"],
  ["Invoice Template", "/invoice-template"]
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-[#314839] text-sm text-white">
        <div className="mx-auto flex max-w-[104rem] items-center justify-between gap-4 px-5 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-secondary" />
            <span className="truncate">Everything your team tracks, bills, schedules, and resolves - in one orbit.</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <a href="mailto:help@eclipsesystems.pro" className="hidden items-center gap-2 hover:text-cream sm:inline-flex">
              <Mail className="h-4 w-4" />
              help@eclipsesystems.pro
            </a>
            <a href="#" aria-label="Eclipse Systems on LinkedIn" className="hover:text-cream">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.68H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
              </svg>
            </a>
            <a href="#" aria-label="Eclipse Systems on Instagram" className="hover:text-cream">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-2.2a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1Z" />
              </svg>
            </a>
            <a href="#" aria-label="Eclipse Systems on X" className="hover:text-cream">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M18.9 1.15h3.68l-8.04 9.18L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.23H4.29l13.32 17.42Z" />
              </svg>
            </a>
            <Link href="/login" className="font-semibold text-cream hover:text-white">Login</Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center justify-center rounded-md bg-white px-3 text-sm font-semibold text-primary transition hover:bg-cream"
            >
              Start Trial
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-secondary text-white shadow-sm">
        <nav className="mx-auto flex max-w-[104rem] items-center justify-between px-5 py-4 text-sm">
          <Link href="/" className="font-title text-2xl leading-none text-white">Eclipse Systems</Link>
          <div className="ml-auto hidden items-center gap-7 font-semibold text-white md:flex">
            <Link href="/features" className="hover:text-white">Features</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/industries" className="hover:text-white">Industries</Link>
            <div className="group relative py-3">
              <button className="inline-flex items-center gap-1 hover:text-white">
                Resources
                <ChevronUp className="h-4 w-4 transition group-hover:rotate-180" />
              </button>
              <div className="absolute right-0 top-full h-5 w-[680px]" />
              <div className="invisible absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[680px] border border-border bg-white p-6 text-ink opacity-0 shadow-2xl shadow-primary/20 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="grid grid-cols-[0.82fr_1.18fr] gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Resources</p>
                    <nav className="mt-5 grid gap-4 text-xl font-medium">
                      {resourceLinks.map(([label, href]) => (
                        <Link key={label} href={href} className="hover:text-primary">{label}</Link>
                      ))}
                    </nav>
                  </div>

                  <div className="border-l border-border pl-6">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Report</p>
                    <Link href="/guides" className="mt-5 block rounded-md bg-[#e9dfd0] p-5 transition hover:shadow-xl hover:shadow-primary/10">
                      <div className="flex gap-4">
                        <div className="grid h-16 w-24 shrink-0 place-items-center rounded-sm bg-primary text-center text-[10px] font-semibold leading-tight text-cream">
                          Eclipse<br />Field Notes
                        </div>
                        <div>
                          <p className="text-xl font-semibold leading-tight">The State of Modern Team Operations</p>
                          <p className="mt-3 text-sm leading-5 text-muted-foreground">
                            How service firms and shift teams are bringing time, billing, and operations into one workspace.
                          </p>
                        </div>
                      </div>
                      <span className="mt-5 flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink">
                        Get the report
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
