import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  MessageSquareText,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  UsersRound
} from "lucide-react";

export function ConnectedSystems() {
  return (
    <section className="feature-card overflow-hidden rounded-[2rem] border border-[#b4c292] bg-[#e6eadb] px-6 py-10 text-[#172219] shadow-2xl shadow-[#172219]/12 md:px-10 md:py-14 lg:px-14">
      <div className="grid justify-items-center gap-6 text-center">
        <div className="grid justify-items-center">
          <h2 className="max-w-5xl font-title text-[clamp(3.2rem,5.8vw,7rem)] leading-[0.88]">
            Your systems should work together.
          </h2>
        </div>
        <p className="max-w-xl text-base font-semibold leading-7 text-[#314839]/72 md:text-lg">
          Start with the environment your team needs now. Connect the others when the work should move without duplicate entry, missed handoffs, or disconnected customer records.
        </p>
      </div>

      <div className="mt-12 grid items-center gap-5 lg:grid-cols-[1fr_2.5rem_1fr_2.5rem_1fr] lg:gap-3">
        <SystemCard
          tone="dark"
          label="Internal team"
          title="Operations Hub"
          text="Run schedules, approvals, billing, support, training, and reporting from the internal source of truth."
          visual={<OperationsVisual />}
        />
        <ConnectionArrow />
        <SystemCard
          tone="sage"
          label="Your clients"
          title="Client Portal"
          text="Turn the same projects, files, invoices, and messages into a clear branded experience for every customer."
          visual={<PortalVisual />}
        />
        <ConnectionArrow />
        <SystemCard
          tone="cream"
          label="Your customers"
          title="Storefront"
          text="Bring products, orders, payments, inventory, and customer history into the workflow your team already runs."
          visual={<StorefrontVisual />}
        />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-3 border-t border-[#314839]/14 pt-7 text-sm font-bold text-[#314839]/70">
        {["Shared customer records", "Cleaner handoffs", "One reporting layer", "Modules that grow with you"].map((item) => (
          <span key={item} className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-[#78905d]" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function SystemCard({
  tone,
  label,
  title,
  text,
  visual
}: {
  tone: "dark" | "sage" | "cream";
  label: string;
  title: string;
  text: string;
  visual: React.ReactNode;
}) {
  const colors = {
    dark: "border-[#314839] bg-[#314839] text-[#f9e8d2]",
    sage: "border-[#a9b884] bg-[#b4c292] text-[#172219]",
    cream: "border-[#d8d0c1] bg-[#f9e8d2] text-[#172219]"
  };

  return (
    <article className={"flex min-h-[34rem] flex-col overflow-hidden rounded-[1.6rem] border " + colors[tone]}>
      <div className="relative h-[19rem] overflow-hidden">{visual}</div>
      <div className="mt-auto p-6 md:p-7">
        <p className={tone === "dark" ? "text-xs font-bold uppercase text-[#b4c292]" : "text-xs font-bold uppercase text-[#314839]/60"}>
          {label}
        </p>
        <h3 className="mt-3 font-title text-4xl leading-none md:text-5xl">{title}</h3>
        <p className={tone === "dark" ? "mt-4 text-sm font-semibold leading-6 text-[#f9e8d2]/72" : "mt-4 text-sm font-semibold leading-6 text-[#314839]/76"}>
          {text}
        </p>
      </div>
    </article>
  );
}

function ConnectionArrow() {
  return (
    <div className="grid place-items-center text-[#314839]" aria-hidden="true">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-[#314839]/18 bg-[#eef1e5] shadow-lg shadow-[#172219]/10">
        <ArrowDown className="h-4 w-4 lg:hidden" />
        <ArrowRight className="hidden h-4 w-4 lg:block" />
      </span>
    </div>
  );
}

function OperationsVisual() {
  const tiles = [
    { icon: Clock3, value: "12", label: "On clock" },
    { icon: UsersRound, value: "28", label: "People" },
    { icon: BarChart3, value: "94%", label: "Complete" },
    { icon: FileCheck2, value: "7", label: "Approvals" }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1d2b22]">
      <div className="connected-marquee absolute left-0 top-[19%] flex w-max gap-3">
        {[...tiles, ...tiles].map((tile, index) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label + index} className="h-28 w-32 shrink-0 rounded-xl border border-white/12 bg-[#f9e8d2] p-3 text-[#172219] shadow-xl shadow-black/25">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-[#314839]" />
                <span className="h-1.5 w-8 rounded-full bg-[#b4c292]" />
              </div>
              <p className="mt-5 font-title text-2xl leading-none">{tile.value}</p>
              <p className="mt-1 text-[9px] font-bold text-[#314839]/55">{tile.label}</p>
            </div>
          );
        })}
      </div>
      <div className="connected-anchor absolute left-1/2 top-1/2 z-10 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#b4c292]/40 bg-[#314839] p-4 text-center text-[#f9e8d2] shadow-2xl shadow-black/45">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#b4c292] text-[#172219]">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <p className="mt-4 text-xs font-bold">One shared record</p>
        <div className="mt-3 grid gap-1.5">
          <span className="h-1.5 rounded-full bg-white/16" />
          <span className="mx-auto h-1.5 w-3/4 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function PortalVisual() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#9aaa73]">
      <div className="connected-portal-track absolute left-[-28%] top-[19%] flex w-[156%] gap-3 opacity-55">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 w-48 shrink-0 rounded-xl border border-[#314839]/14 bg-[#fbfaf6] p-3 shadow-lg shadow-[#314839]/15">
            <div className="flex gap-2">
              <div className="w-12 rounded-lg bg-[#314839] p-2">
                <span className="block h-2 rounded-full bg-[#b4c292]" />
                <span className="mt-3 block h-1.5 rounded-full bg-white/18" />
                <span className="mt-2 block h-1.5 w-3/4 rounded-full bg-white/12" />
              </div>
              <div className="flex-1 space-y-2 py-1">
                {[76, 92, 61].map((width) => (
                  <div key={width} className="rounded-md bg-[#eef1e5] p-2">
                    <span className="block h-1.5 rounded-full bg-[#314839]/15" style={{ width: width + "%" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 z-10 h-32 w-52 -translate-x-1/2 -translate-y-1/2">
        {[
          { icon: UsersRound, title: "Project updated", width: "82%" },
          { icon: MessageSquareText, title: "New client reply", width: "64%" },
          { icon: FileCheck2, title: "Document approved", width: "92%" }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="connected-portal-cycle absolute inset-0 rounded-2xl border border-[#314839]/14 bg-[#f9e8d2] p-4 text-[#172219] shadow-2xl shadow-[#314839]/30"
              style={{ animationDelay: index * -4 + "s" }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#314839] text-[#f9e8d2]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-xs font-bold">{item.title}</p>
              </div>
              <div className="mt-4 grid gap-2">
                <span className="h-2 rounded-full bg-[#314839]/14" style={{ width: item.width }} />
                <span className="h-2 w-1/2 rounded-full bg-[#b4c292]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StorefrontVisual() {
  const fan = [
    { icon: ShoppingBag, className: "connected-fan-left", tone: "bg-[#314839] text-[#f9e8d2]" },
    { icon: PackageCheck, className: "connected-fan-mid-left", tone: "bg-[#b4c292] text-[#172219]" },
    { icon: ReceiptText, className: "connected-fan-center", tone: "bg-[#172219] text-[#f9e8d2]" },
    { icon: PackageCheck, className: "connected-fan-mid-right", tone: "bg-[#f9e8d2] text-[#172219]" },
    { icon: ShoppingBag, className: "connected-fan-right", tone: "bg-[#78905d] text-[#f9e8d2]" }
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e7ddca]">
      <div className="absolute inset-x-0 top-[25%] h-36">
        {fan.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={"connected-fan-item absolute left-1/2 top-1/2 grid h-20 w-20 place-items-center rounded-2xl border border-[#314839]/12 shadow-2xl shadow-[#172219]/25 " + item.className + " " + item.tone}
              style={{ animationDelay: index * -0.7 + "s" }}
            >
              <Icon className="h-8 w-8" />
            </div>
          );
        })}
      </div>
      <div className="connected-order-card absolute bottom-[7%] left-1/2 flex w-[62%] -translate-x-1/2 items-center gap-2 rounded-xl border border-[#314839]/12 bg-[#fbfaf6] p-3 text-[#172219] shadow-xl shadow-[#172219]/20">
        <PackageCheck className="h-5 w-5 text-[#314839]" />
        <div className="flex-1">
          <p className="text-[10px] font-bold">Order confirmed</p>
          <span className="mt-1 block h-1.5 rounded-full bg-[#b4c292]" />
        </div>
      </div>
    </div>
  );
}
