import Image from "next/image";
import type { Metadata } from "next";
import { ExternalLink, Linkedin, Mail, Phone } from "lucide-react";
import { ScheduleDemoForm } from "@/components/marketing/schedule-demo-form";

export const metadata: Metadata = {
  title: "Contact | Eclipse Systems",
  description: "Contact Eclipse Systems for custom software, packaged systems, workflow consulting, support, and project questions.",
  alternates: { canonical: "/contact" }
};

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/eclipse-systems", icon: Linkedin },
  { label: "X / Twitter", href: "https://twitter.com/eclipsesystems", icon: ExternalLink }
];

export default function ContactPage({ searchParams }: { searchParams?: { demo?: string } }) {
  const selectedDemo = searchParams?.demo ?? "";

  return (
    <main className="min-h-screen bg-cream text-ink">
      <section data-public-hero-shell className="px-3 pt-3">
        <div data-public-hero className="relative mx-auto overflow-hidden rounded-[2rem] bg-[#172219] px-6 pb-12 pt-36 text-[#f9e8d2] shadow-2xl shadow-[#172219]/20 md:px-10 md:pb-16 md:pt-44 lg:px-14">
          <Image
            src="/media/generated/heroes/discovery.jpg"
            alt="A team mapping its workflow during a discovery workshop"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#172219]/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#172219]/92 via-[#172219]/62 to-[#172219]/28" />
          <div className="relative z-10 mx-auto max-w-[100rem]">
            <h1 className="max-w-6xl font-title text-[clamp(4rem,8vw,8.8rem)] leading-[0.84]">Contact Eclipse Systems.</h1>
            <p className="mt-7 max-w-3xl text-base font-semibold leading-7 text-[#f9e8d2]/76 md:text-lg">
              Reach out about custom software, packaged systems, workflow cleanup, support, or the rough idea you are still trying to shape.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[100rem] gap-10 px-5 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-xl shadow-[#172219]/5">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#314839] text-[#f9e8d2]">
                  <Mail className="h-5 w-5" />
                </span>
                <p className="text-right text-sm font-bold uppercase tracking-[0.16em] text-[#314839]/62">Direct email</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a href="mailto:john@eclipsesystems.pro" className="rounded-[1rem] border border-[#d8d0c1] bg-white p-4 transition hover:border-[#314839]/35 hover:bg-[#eef1e5]">
                  <span className="block text-sm font-bold text-[#314839]/62">John Wittig</span>
                  <span className="mt-1 block break-all text-lg font-black text-[#172219]">john@eclipsesystems.pro</span>
                </a>
                <a href="mailto:garrett@eclipsesystems.pro" className="rounded-[1rem] border border-[#d8d0c1] bg-white p-4 transition hover:border-[#314839]/35 hover:bg-[#eef1e5]">
                  <span className="block text-sm font-bold text-[#314839]/62">Garrett Helmers</span>
                  <span className="mt-1 block break-all text-lg font-black text-[#172219]">garrett@eclipsesystems.pro</span>
                </a>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#314839]/70">Email either of us directly for project ideas, workflow questions, partnerships, or a quick intro.</p>
            </div>

            <div className="rounded-[1.5rem] border border-[#d8d0c1] bg-[#fbfaf6] p-6 shadow-xl shadow-[#172219]/5">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#314839] text-[#f9e8d2]">
                  <Phone className="h-5 w-5" />
                </span>
                <p className="text-right text-sm font-bold uppercase tracking-[0.16em] text-[#314839]/62">Phone</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a href="tel:+12054702455" className="rounded-[1rem] border border-[#d8d0c1] bg-white p-4 transition hover:border-[#314839]/35 hover:bg-[#eef1e5]">
                  <span className="block text-sm font-bold text-[#314839]/62">John Wittig</span>
                  <span className="mt-1 block text-xl font-black text-[#172219]">(205) 470-2455</span>
                </a>
                <a href="tel:+12059554028" className="rounded-[1rem] border border-[#d8d0c1] bg-white p-4 transition hover:border-[#314839]/35 hover:bg-[#eef1e5]">
                  <span className="block text-sm font-bold text-[#314839]/62">Garrett Helmers</span>
                  <span className="mt-1 block text-xl font-black text-[#172219]">(205) 955-4028</span>
                </a>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#314839]/70">Call or text either of us when a quick conversation is easier than email.</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-[#cbd3b0] bg-[#eef1e5] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#314839]/62">Socials</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#314839] px-4 py-2.5 text-sm font-bold text-[#f9e8d2] transition hover:bg-[#172219]">
                    <Icon className="h-4 w-4" />
                    {social.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d8d0c1] bg-[#fbfaf6] p-5 shadow-2xl shadow-[#172219]/8 md:p-7">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#314839]/62">Send a message</p>
            <h2 className="mt-3 font-title text-5xl leading-none text-[#172219] md:text-6xl">Tell us what you need.</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#314839]/70">
              If it should become a demo conversation, we can take it there. If it is just a question, that works too.
            </p>
          </div>

          <ScheduleDemoForm
            selectedDemo={selectedDemo}
            submitLabel="Send message"
            helperText="This goes to the Eclipse team so we can reply with the right next step."
            className="border-0 bg-transparent p-0 shadow-none md:p-0"
          />
        </div>
      </section>
    </main>
  );
}
