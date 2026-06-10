"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  Settings,
  UserRound,
  UsersRound
} from "lucide-react";
import { getPackageDefinition } from "@/lib/packages";

export type CrmDemoView =
  | "dashboard"
  | "opportunities"
  | "activity"
  | "organizations"
  | "pipeline"
  | "proposals"
  | "pricing"
  | "renewals"
  | "reports"
  | "support"
  | "admin";

const templateAssetBase = "/templates/crm";

const navIcons = {
  dashboard: LayoutDashboard,
  pipeline: FolderKanban,
  tasks: ClipboardList,
  people: UsersRound,
  invoice: ReceiptText,
  signature: FileSignature,
  calendar: CalendarClock,
  reports: BarChart3,
  messages: MessageSquareText,
  settings: Settings
} as const;

type Stage = "Lead" | "Prospect" | "Client";

const stageOrder: Stage[] = ["Lead", "Prospect", "Client"];

const initialOrganizations = [
  {
    id: "northstar",
    name: "Northstar Manufacturing",
    contact: "Elena Pierce",
    email: "elena@northstar.example",
    phone: "(205) 555-0144",
    stage: "Lead" as Stage,
    next: "Discovery call",
    employees: 84,
    annualRevenue: 128000,
    owner: "Avery Stone",
    services: ["Payroll", "Benefits", "HR tools"]
  },
  {
    id: "crescent",
    name: "Crescent Medical Group",
    contact: "Marcus Lee",
    email: "marcus@crescent.example",
    phone: "(256) 555-0182",
    stage: "Lead" as Stage,
    next: "Send intake link",
    employees: 42,
    annualRevenue: 76000,
    owner: "Unassigned",
    services: ["Timekeeping", "Onboarding"]
  },
  {
    id: "meridian",
    name: "Meridian Staffing",
    contact: "Asha Brooks",
    email: "asha@meridian.example",
    phone: "(615) 555-0129",
    stage: "Prospect" as Stage,
    next: "Proposal review",
    employees: 126,
    annualRevenue: 311000,
    owner: "Jordan Miles",
    services: ["Payroll", "Workers comp", "LMS"]
  },
  {
    id: "harbor",
    name: "Harbor Benefits Co.",
    contact: "Nolan White",
    email: "nolan@harbor.example",
    phone: "(334) 555-0117",
    stage: "Prospect" as Stage,
    next: "Pricing approval",
    employees: 63,
    annualRevenue: 142000,
    owner: "Avery Stone",
    services: ["Benefits", "Retirement", "Compliance"]
  },
  {
    id: "blue-ridge",
    name: "Blue Ridge Logistics",
    contact: "Ivy Santos",
    email: "ivy@blueridge.example",
    phone: "(423) 555-0166",
    stage: "Client" as Stage,
    next: "Implementation kickoff",
    employees: 210,
    annualRevenue: 224000,
    owner: "Jordan Miles",
    services: ["Payroll", "Benefits", "Timekeeping", "LMS"]
  },
  {
    id: "apex",
    name: "Apex Field Services",
    contact: "Theo Grant",
    email: "theo@apex.example",
    phone: "(251) 555-0188",
    stage: "Client" as Stage,
    next: "Renewal reminder",
    employees: 97,
    annualRevenue: 168000,
    owner: "Mara Chen",
    services: ["Payroll", "Workers comp"]
  }
];

const opportunitySeed = [
  { id: "opp-01", company: "ForgeWorks", contact: "Dana Reid", channel: "Phone", followUp: "Today 2:00 PM", status: "New" },
  { id: "opp-02", company: "Pinecrest Dental", contact: "Cole Morgan", channel: "Email", followUp: "Tomorrow", status: "Responded" },
  { id: "opp-03", company: "MetroCare Clinics", contact: "Vivian Hart", channel: "LinkedIn", followUp: "Friday", status: "Cold" },
  { id: "opp-04", company: "Summit Retail Group", contact: "Owen Price", channel: "Referral", followUp: "Next week", status: "New" }
];

const initialActivity = [
  "Claim new opportunity",
  "Log outreach",
  "Schedule follow-up",
  "Send retirement questionnaire",
  "Generate proposal",
  "Request e-signature"
];

const proposalAssets = [
  { title: "City cover", src: `${templateAssetBase}/proposal-template-city.png` },
  { title: "Eclipse brand", src: "/favicon.svg" },
  { title: "Territory marker", src: `${templateAssetBase}/proposal-template-pin.png` }
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function EclipseWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm bg-cream">
        <span className="absolute h-6 w-6 rounded-full bg-primary" />
        <span className="absolute left-4 top-1 h-6 w-6 rounded-full bg-cream" />
        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-secondary" />
      </span>
      {!compact ? <span className="font-title text-3xl leading-none text-cream">Eclipse Systems</span> : null}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-md border border-border bg-white/65 p-5 dark:border-white/10 dark:bg-[#15231a] ${className}`}>{children}</section>;
}

function ViewHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-5 overflow-hidden rounded-md bg-primary p-6 text-white md:p-8">
      <p className="text-sm font-semibold text-secondary">{eyebrow}</p>
      <h1 className="mt-4 max-w-4xl font-title text-5xl leading-[0.9] text-cream md:text-7xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-sm leading-6 text-white/75 md:text-base">{text}</p>
    </div>
  );
}

export function CrmDemo({ view }: { view: CrmDemoView }) {
  const pkg = getPackageDefinition("crm-sales-pipeline");
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({ "Claim new opportunity": true, "Log outreach": true });
  const [selectedOrgId, setSelectedOrgId] = useState(initialOrganizations[2].id);
  const [proposalOrgId, setProposalOrgId] = useState(initialOrganizations[2].id);
  const [pricingSeats, setPricingSeats] = useState(126);
  const [supportMessage, setSupportMessage] = useState("");
  const selectedOrg = organizations.find((org) => org.id === selectedOrgId) ?? organizations[0];
  const proposalOrg = organizations.find((org) => org.id === proposalOrgId) ?? organizations[0];
  const openDeals = organizations.filter((org) => org.stage !== "Client");
  const forecast = openDeals.reduce((sum, org) => sum + org.annualRevenue, 0);
  const winRate = Math.round((organizations.filter((org) => org.stage === "Client").length / organizations.length) * 100);
  const monthlyAdmin = pricingSeats * 38;
  const implementation = Math.max(8500, Math.round(pricingSeats * 95));

  if (!pkg) return null;

  function moveOrg(id: string, direction: 1 | -1) {
    setOrganizations((current) =>
      current.map((org) => {
        if (org.id !== id) return org;
        const index = stageOrder.indexOf(org.stage);
        const nextStage = stageOrder[Math.min(stageOrder.length - 1, Math.max(0, index + direction))];
        return { ...org, stage: nextStage, next: nextStage === "Client" ? "Implementation kickoff" : nextStage === "Prospect" ? "Proposal review" : "Discovery call" };
      })
    );
  }

  const content = {
    dashboard: (
      <>
        <ViewHeader
          eyebrow="Eclipse CRM template"
          title={pkg.tagline}
          text="This demo mirrors the dropped-in CRM template's sales operating flow: dashboard, opportunities, activity, organizations, pipeline, proposals, pricing, e-sign, renewals, reports, support, and admin."
        />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["New leads", opportunitySeed.length],
                ["Active deals", openDeals.length],
                ["Forecast", formatMoney(forecast)],
                ["Win rate", `${winRate}%`]
              ].map(([label, value]) => (
                <Card key={label}>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
                </Card>
              ))}
            </div>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Recent activity</p>
                  <h2 className="mt-2 text-3xl font-semibold leading-none">Sales motion</h2>
                </div>
                <Link href="/crm/activity" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white">Open activity <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="mt-5 grid gap-3">
                {["Proposal generated for Meridian Staffing", "Harbor Benefits pricing marked ready", "Blue Ridge moved to client", "Follow-up scheduled for ForgeWorks"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-sm bg-cream/70 p-3 dark:bg-[#0f1a14]">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-primary">Follow-up queue</p>
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 grid gap-3">
              {opportunitySeed.slice(0, 3).map((opp) => (
                <div key={opp.id} className="rounded-sm border border-border bg-cream/60 p-3 dark:border-white/10 dark:bg-[#0f1a14]">
                  <p className="font-semibold">{opp.company}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{opp.contact} · {opp.followUp}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </>
    ),
    opportunities: (
      <>
        <ViewHeader eyebrow="Opportunities" title="Claim, qualify, and schedule outreach." text="The template has a pre-organization opportunity stream for claims, responses, contact logging, and follow-up dates." />
        <Card>
          <div className="grid gap-3">
            {opportunitySeed.map((opp) => (
              <div key={opp.id} className="grid gap-3 rounded-md border border-border bg-cream/65 p-4 dark:border-white/10 dark:bg-[#0f1a14] lg:grid-cols-[1fr_160px_160px_120px] lg:items-center">
                <div>
                  <p className="font-semibold">{opp.company}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{opp.contact} · {opp.channel}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{opp.followUp}</p>
                <p className="text-sm text-muted-foreground">{claimed[opp.id] ? "Claimed by you" : opp.status}</p>
                <button onClick={() => setClaimed((current) => ({ ...current, [opp.id]: !current[opp.id] }))} className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white">
                  {claimed[opp.id] ? "Release" : "Claim"}
                </button>
              </div>
            ))}
          </div>
        </Card>
      </>
    ),
    activity: (
      <>
        <ViewHeader eyebrow="Activity" title="Checklist-driven sales work." text="This mirrors the template's activity checklist surface: claim, log contact, schedule follow-up, generate proposal, and request e-signature." />
        <Card>
          <div className="grid gap-3 md:grid-cols-2">
            {initialActivity.map((item, index) => (
              <label key={item} className="flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-border bg-cream/65 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
                <input type="checkbox" checked={Boolean(completed[item])} onChange={() => setCompleted((current) => ({ ...current, [item]: !current[item] }))} className="h-5 w-5 accent-primary" />
                <span>
                  <span className="block text-sm font-semibold">0{index + 1}. {item}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{completed[item] ? "Completed" : "Ready for sales owner"}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      </>
    ),
    organizations: (
      <>
        <ViewHeader eyebrow="Organizations" title="Lead, prospect, and client records." text="Organization profiles carry contacts, worksites, owners, intake links, proposals, activity, and stage history." />
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card>
            <div className="grid gap-2">
              {organizations.map((org) => (
                <button key={org.id} onClick={() => setSelectedOrgId(org.id)} className={`rounded-md border p-3 text-left ${selectedOrg.id === org.id ? "border-primary bg-secondary/25 dark:border-secondary/60 dark:bg-secondary/15" : "border-border bg-cream/60 dark:border-white/10 dark:bg-[#0f1a14]"}`}>
                  <p className="font-semibold">{org.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{org.stage} · {org.owner}</p>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">{selectedOrg.stage}</p>
                <h2 className="mt-2 text-3xl font-semibold">{selectedOrg.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{selectedOrg.contact} · {selectedOrg.email} · {selectedOrg.phone}</p>
              </div>
              <span className="rounded-sm bg-secondary/35 px-2 py-1 text-xs font-semibold text-primary">{selectedOrg.employees} employees</span>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Info label="Owner" value={selectedOrg.owner} />
              <Info label="Annual revenue" value={formatMoney(selectedOrg.annualRevenue)} />
              <Info label="Next action" value={selectedOrg.next} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedOrg.services.map((service) => <span key={service} className="rounded-sm bg-cream px-2 py-1 text-xs font-semibold text-primary dark:bg-[#0f1a14] dark:text-secondary">{service}</span>)}
            </div>
          </Card>
        </div>
      </>
    ),
    pipeline: (
      <>
        <ViewHeader eyebrow="Pipeline" title="Move accounts through the board." text="The template's kanban moves organizations from lead to prospect to client and keeps value, owner, and next action visible." />
        <div className="grid gap-4 xl:grid-cols-3">
          {stageOrder.map((stage) => (
            <Card key={stage} className="bg-cream/55 dark:bg-[#15231a]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{stage}</h2>
                <span className="rounded-sm bg-secondary/35 px-2 py-1 text-xs font-semibold text-primary">{formatMoney(organizations.filter((org) => org.stage === stage).reduce((sum, org) => sum + org.annualRevenue, 0))}</span>
              </div>
              <div className="mt-4 grid gap-3">
                {organizations.filter((org) => org.stage === stage).map((org) => (
                  <article key={org.id} className="rounded-md border border-border bg-white/85 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
                    <p className="font-semibold">{org.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{org.contact} · {org.employees} employees</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{org.next}</p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => moveOrg(org.id, -1)} disabled={stage === "Lead"} className="h-8 rounded-sm border border-border px-2 text-xs font-semibold disabled:opacity-40">Back</button>
                      <button onClick={() => moveOrg(org.id, 1)} disabled={stage === "Client"} className="h-8 rounded-sm bg-primary px-2 text-xs font-semibold text-white disabled:opacity-40">Advance</button>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </>
    ),
    proposals: (
      <>
        <ViewHeader eyebrow="Proposals" title="Build proposals with branded assets." text="The template includes proposal drafting, approval, slide builder, PDF export, and PPTX generation. This demo shows the workflow without wiring the original database." />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <div className="grid gap-3 md:grid-cols-3">
              {proposalAssets.map((asset) => (
                <div key={asset.title} className="overflow-hidden rounded-md border border-border bg-cream/65 dark:border-white/10 dark:bg-[#0f1a14]">
                  <div className="relative h-40 bg-white dark:bg-[#101a14]">
                    <Image src={asset.src} alt={asset.title} fill className="object-contain p-3" />
                  </div>
                  <p className="border-t border-border p-3 text-sm font-semibold">{asset.title}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-primary">Draft proposal</p>
            <label className="mt-4 block text-sm font-semibold">Prospect</label>
            <select value={proposalOrgId} onChange={(event) => setProposalOrgId(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-border bg-white px-3 text-sm">
              {organizations.filter((org) => org.stage !== "Client").map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
            <div className="mt-5 rounded-md bg-cream/70 p-4 dark:bg-[#0f1a14]">
              <p className="font-semibold">{proposalOrg.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{proposalOrg.services.join(", ")}</p>
              <p className="mt-3 text-2xl font-semibold text-primary">{formatMoney(proposalOrg.annualRevenue)}</p>
            </div>
            <button className="mt-5 h-10 w-full rounded-md bg-primary px-3 text-sm font-semibold text-white">Generate demo proposal</button>
          </Card>
        </div>
      </>
    ),
    pricing: (
      <>
        <ViewHeader eyebrow="Pricing & e-sign" title="Agreement builder and signing flow." text="Pricing calculations, generated PDFs, approval status, and e-signature requests are core Eclipse CRM workflows." />
        <Card>
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <label className="text-sm font-semibold">Employees / seats</label>
              <input type="range" min={20} max={250} value={pricingSeats} onChange={(event) => setPricingSeats(Number(event.target.value))} className="mt-4 w-full accent-primary" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Info label="Seats" value={String(pricingSeats)} />
                <Info label="Monthly admin" value={formatMoney(monthlyAdmin)} />
                <Info label="Implementation" value={formatMoney(implementation)} />
              </div>
            </div>
            <div className="rounded-md bg-primary p-5 text-white">
              <p className="text-sm font-semibold text-secondary">Agreement status</p>
              <p className="mt-4 text-3xl font-semibold">Ready to send</p>
              <p className="mt-3 text-sm leading-6 text-white/70">PDF generated, signer assigned, reminder queue enabled.</p>
            </div>
          </div>
        </Card>
      </>
    ),
    renewals: (
      <>
        <ViewHeader eyebrow="Renewals" title="Track renewal deadlines and reminders." text="The template includes renewal rows, salesperson ownership, due dates, and reminder logs." />
        <Card>
          <div className="grid gap-3">
            {organizations.filter((org) => org.stage === "Client").map((org, index) => (
              <div key={org.id} className="grid gap-3 rounded-md border border-border bg-cream/65 p-4 dark:border-white/10 dark:bg-[#0f1a14] md:grid-cols-[1fr_150px_150px] md:items-center">
                <div>
                  <p className="font-semibold">{org.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{org.owner}</p>
                </div>
                <p className="text-sm font-semibold text-primary">{index === 0 ? "Aug 14, 2026" : "Sep 2, 2026"}</p>
                <button className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white">Create reminder</button>
              </div>
            ))}
          </div>
        </Card>
      </>
    ),
    reports: (
      <>
        <ViewHeader eyebrow="Reports" title="Lead, proposal, commission, and win/loss reporting." text="The source template has dedicated report cards for lead counts, proposed clients, commissions, worksite employees, and win/loss analysis." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Leads created", "42"],
            ["Proposed clients", "11"],
            ["Commission forecast", formatMoney(74000)],
            ["Worksite employees", "622"]
          ].map(([label, value]) => <Card key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p></Card>)}
        </div>
      </>
    ),
    support: (
      <>
        <ViewHeader eyebrow="Support" title="Feedback, diagnostics, and attachments." text="The Eclipse CRM package includes a scoped support portal with the same operating surface as the imported workflow." />
        <Card>
          <label className="text-sm font-semibold">Support note</label>
          <textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} className="mt-2 min-h-32 w-full rounded-md border border-border bg-white p-3 text-sm" placeholder="Describe the request, bug, or client question..." />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{supportMessage.length} characters</p>
            <button className="h-10 rounded-md bg-primary px-3 text-sm font-semibold text-white">Create demo ticket</button>
          </div>
        </Card>
      </>
    ),
    admin: (
      <>
        <ViewHeader eyebrow="Settings" title="Admin controls for the CRM package." text="The original template includes SUTA defaults, company inventory, admin users, and package settings." />
        <div className="grid gap-5 lg:grid-cols-3">
          {["SUTA defaults", "Company inventory", "Admin users"].map((label) => (
            <Card key={label}>
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="mt-5 text-2xl font-semibold">{label}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Demo-ready controls copied from the structure of the CRM template package.</p>
            </Card>
          ))}
        </div>
      </>
    )
  } satisfies Record<CrmDemoView, React.ReactNode>;

  return (
    <section className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-[#2f4135] p-4 text-white md:flex md:flex-col">
        <Link href="/templates" className="block"><EclipseWordmark /></Link>
        <div className="mt-7 grid gap-5 pr-1">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">CRM Demo</p>
            <nav className="grid gap-1">
              {pkg.navItems.map((item) => {
                const Icon = navIcons[item.icon as keyof typeof navIcons] ?? FileText;
                const active = item.href === (view === "dashboard" ? "/crm" : `/crm/${view}`);
                return (
                  <Link key={item.label} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition ${active ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                    <Icon className="h-[18px] w-[18px] text-secondary" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-white/10 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">Package</p>
            <nav className="grid gap-1">
              <Link href="/templates" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/75 transition hover:bg-white/10 hover:text-white"><LayoutDashboard className="h-[18px] w-[18px] text-secondary" />All Packages</Link>
              <Link href="/settings/account" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/75 transition hover:bg-white/10 hover:text-white"><UserRound className="h-[18px] w-[18px] text-secondary" />Account</Link>
            </nav>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-40 border-b border-border bg-[#2f4135] p-3 text-white md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/templates" className="min-w-0 truncate font-title text-2xl leading-none text-cream">CRM Demo</Link>
          <details className="relative">
            <summary aria-label="CRM navigation" className="grid h-12 w-12 cursor-pointer list-none place-items-center rounded-md border border-white/15 bg-white/10 text-white"><LayoutDashboard className="h-5 w-5" /></summary>
            <div className="absolute right-0 top-14 z-50 grid w-64 gap-1 rounded-md border border-border bg-white p-2 text-sm text-ink shadow-xl">
              {pkg.navItems.map((item) => {
                const Icon = navIcons[item.icon as keyof typeof navIcons] ?? FileText;
                return <Link key={`${item.label}-mobile`} href={item.href} className="flex items-center gap-2 rounded-sm px-2 py-2 hover:bg-cream"><Icon className="h-4 w-4 text-primary" />{item.label}</Link>;
              })}
            </div>
          </details>
        </div>
      </header>
      <main className="md:pl-60">
        <div className="w-full px-4 py-5 md:px-8 md:py-8 xl:px-10">{content[view]}</div>
      </main>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-[#0f1a14]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
