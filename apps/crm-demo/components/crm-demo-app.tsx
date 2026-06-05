"use client";

import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity as ActivityIcon,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Filter,
  Handshake,
  LayoutDashboard,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { demoConfig, pipelineStages, type Activity, type Company, type Contact, type Deal, type DealStage, type LineItem, type Product } from "@/lib/demo-data";
import { dealValue, getCompany, getContact, getOwner, isLastMonth, isThisMonth, stageProbability, useCrmStore, type ViewKey } from "@/lib/crm-store";

const stageColors: Record<DealStage, string> = {
  "New Lead": "#60a5fa",
  Qualified: "#22c55e",
  "Proposal Sent": "#f59e0b",
  Negotiation: "#a855f7",
  "Closed Won": "#0f766e",
  "Closed Lost": "#ef4444"
};

const navItems: Array<{ id: ViewKey; label: string; icon: React.ElementType }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", icon: Handshake },
  { id: "deals", label: "Deal Detail", icon: CircleDollarSign },
  { id: "contacts", label: "Contacts", icon: UsersRound },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "reports", label: "Reports", icon: BarChart3 }
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CrmDemoApp() {
  const store = useCrmStore();
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", demoConfig.theme.primary);
    document.documentElement.style.setProperty("--accent", demoConfig.theme.accent);
    document.documentElement.style.setProperty("--success", demoConfig.theme.success);
    document.documentElement.style.setProperty("--danger", demoConfig.theme.danger);
    document.documentElement.style.setProperty("--warning", demoConfig.theme.warning);
  }, []);

  const filteredDeals = useFilteredDeals();
  const selectedDeal = store.deals.find((deal) => deal.id === store.selectedDealId) ?? store.deals[0];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border bg-slate-950 p-4 text-white lg:block">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-sm bg-primary text-lg font-bold text-primary-foreground">V</span>
            <div>
              <p className="text-sm text-white/60">{demoConfig.demoCompanyName}</p>
              <h1 className="text-xl font-semibold">{demoConfig.productName}</h1>
            </div>
          </div>

          <nav className="mt-8 grid gap-1" aria-label="CRM sections">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = store.view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => store.setView(item.id)}
                  className={cx(
                    "flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition",
                    active ? "bg-white text-slate-950" : "text-white/72 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-md border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Package</p>
            <p className="mt-3 text-sm leading-6 text-white/72">{demoConfig.packageName} template with fully seeded in-memory data.</p>
            <button onClick={store.resetDemo} className="mt-4 inline-flex h-9 items-center gap-2 rounded-sm bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/15">
              <RefreshCw className="h-4 w-4" />
              Reset demo
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-panel/95 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{demoConfig.packageName}</p>
                <h2 className="text-2xl font-semibold">Industry-agnostic sales workspace</h2>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={store.filters.query}
                    onChange={(event) => store.setFilters({ query: event.target.value })}
                    className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm"
                    placeholder="Search companies, contacts, deals..."
                  />
                </label>
                <button onClick={() => setDealModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                  <Plus className="h-4 w-4" />
                  Deal
                </button>
                <button onClick={() => setContactModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold">
                  <Plus className="h-4 w-4" />
                  Contact
                </button>
              </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => store.setView(item.id)} className={cx("h-9 shrink-0 rounded-sm px-3 text-sm font-semibold", store.view === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          <Filters />

          <div className="px-4 pb-8 lg:px-6">
            {store.view === "dashboard" ? <Dashboard deals={filteredDeals} /> : null}
            {store.view === "pipeline" ? <Pipeline deals={filteredDeals} /> : null}
            {store.view === "deals" ? <DealDetail deal={selectedDeal} onGenerateQuote={() => setQuoteOpen(true)} onLogActivity={() => setActivityModalOpen(true)} /> : null}
            {store.view === "contacts" ? <ContactsView /> : null}
            {store.view === "companies" ? <CompaniesView /> : null}
            {store.view === "reports" ? <Reports deals={filteredDeals} /> : null}
          </div>
        </section>
      </div>

      {dealModalOpen ? <DealModal onClose={() => setDealModalOpen(false)} /> : null}
      {contactModalOpen ? <ContactModal onClose={() => setContactModalOpen(false)} /> : null}
      {activityModalOpen ? <ActivityModal deal={selectedDeal} onClose={() => setActivityModalOpen(false)} /> : null}
      {quoteOpen ? <QuoteModal deal={selectedDeal} onClose={() => setQuoteOpen(false)} /> : null}
    </main>
  );
}

function useFilteredDeals() {
  const { deals, companies, contacts, users, filters } = useCrmStore();
  return useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return deals.filter((deal) => {
      const company = companies.find((item) => item.id === deal.companyId);
      const contact = contacts.find((item) => item.id === deal.contactId);
      const owner = users.find((item) => item.id === deal.ownerId);
      const haystack = [deal.name, company?.name, company?.industry, contact?.name, owner?.name, deal.notes].join(" ").toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesStage = filters.stage === "all" || deal.stage === filters.stage;
      const matchesOwner = filters.ownerId === "all" || deal.ownerId === filters.ownerId;
      const matchesValue = dealValue(deal) >= filters.minValue;
      return matchesQuery && matchesStage && matchesOwner && matchesValue;
    });
  }, [companies, contacts, deals, filters, users]);
}

function Filters() {
  const { filters, users, setFilters } = useCrmStore();
  return (
    <section className="px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-panel p-3 shadow-soft">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
        </span>
        <select value={filters.stage} onChange={(event) => setFilters({ stage: event.target.value as "all" | DealStage })} className="h-10 rounded-sm border border-border bg-white px-3 text-sm">
          <option value="all">All stages</option>
          {pipelineStages.map((stage) => <option key={stage}>{stage}</option>)}
        </select>
        <select value={filters.ownerId} onChange={(event) => setFilters({ ownerId: event.target.value })} className="h-10 rounded-sm border border-border bg-white px-3 text-sm">
          <option value="all">All reps</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Min value
          <input type="range" min={0} max={80000} step={5000} value={filters.minValue} onChange={(event) => setFilters({ minValue: Number(event.target.value) })} className="accent-primary" />
          <span className="min-w-16 font-semibold text-foreground">{formatMoney(filters.minValue)}</span>
        </label>
      </div>
    </section>
  );
}

function Dashboard({ deals }: { deals: Deal[] }) {
  const state = useCrmStore();
  const openDeals = deals.filter((deal) => !deal.stage.startsWith("Closed"));
  const wonThisMonth = deals.filter((deal) => deal.stage === "Closed Won" && isThisMonth(deal.expectedCloseDate)).reduce((sum, deal) => sum + dealValue(deal), 0);
  const wonLastMonth = deals.filter((deal) => deal.stage === "Closed Won" && isLastMonth(deal.expectedCloseDate)).reduce((sum, deal) => sum + dealValue(deal), 0);
  const closed = deals.filter((deal) => deal.stage === "Closed Won" || deal.stage === "Closed Lost");
  const winRate = closed.length ? Math.round((closed.filter((deal) => deal.stage === "Closed Won").length / closed.length) * 100) : 0;
  const forecast = openDeals.reduce((sum, deal) => sum + dealValue(deal) * stageProbability(deal.stage), 0);
  const stageData = pipelineStages.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);
    return { name: stage, count: stageDeals.length, value: stageDeals.reduce((sum, deal) => sum + dealValue(deal), 0), fill: stageColors[stage] };
  });
  const repData = state.users.map((user) => {
    const repDeals = deals.filter((deal) => deal.ownerId === user.id);
    return { name: user.name, value: repDeals.reduce((sum, deal) => sum + dealValue(deal), 0), won: repDeals.filter((deal) => deal.stage === "Closed Won").reduce((sum, deal) => sum + dealValue(deal), 0) };
  });
  const activities = state.activities.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);
  const followUps = state.activities.filter((activity) => activity.dueDate && !activity.done).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate))).slice(0, 6);

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Open pipeline" value={formatMoney(openDeals.reduce((sum, deal) => sum + dealValue(deal), 0))} detail={`${openDeals.length} active deals`} />
        <Metric title="Won this month" value={formatMoney(wonThisMonth)} detail={`Last month ${formatMoney(wonLastMonth)}`} />
        <Metric title="Win rate" value={`${winRate}%`} detail={`${closed.length} closed deals`} />
        <Metric title="Weighted forecast" value={formatMoney(forecast)} detail="Stage-weighted" />
        <Metric title="Follow-ups" value={String(followUps.length)} detail="Upcoming tasks" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
        <Panel title="Funnel by stage" icon={BarChart3}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip formatter={(value) => String(value)} />
                <Funnel dataKey="count" data={stageData} isAnimationActive>
                  <LabelList position="right" fill="#334155" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Deals by rep" icon={UserRound}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repData} layout="vertical" margin={{ left: 12, right: 18 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <YAxis dataKey="name" type="category" width={70} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent activity" icon={ActivityIcon}>
          <ActivityList activities={activities} />
        </Panel>
        <Panel title="Upcoming follow-ups" icon={CalendarClock}>
          <ActivityList activities={followUps} compact />
        </Panel>
      </section>
    </div>
  );
}

function Pipeline({ deals }: { deals: Deal[] }) {
  const { moveDeal } = useCrmStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(event: DragEndEvent) {
    const dealId = String(event.active.id);
    const stage = event.over?.id as DealStage | undefined;
    if (stage && pipelineStages.includes(stage)) moveDeal(dealId, stage);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <section className="grid gap-4 xl:grid-cols-6">
        {pipelineStages.map((stage) => (
          <PipelineColumn key={stage} stage={stage} deals={deals.filter((deal) => deal.stage === stage)} />
        ))}
      </section>
    </DndContext>
  );
}

function PipelineColumn({ stage, deals }: { stage: DealStage; deals: Deal[] }) {
  const { setSelectedDeal } = useCrmStore();
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const value = deals.reduce((sum, deal) => sum + dealValue(deal), 0);
  return (
    <section ref={setNodeRef} className={cx("min-h-[520px] rounded-md border border-border bg-muted/45 p-3 transition", isOver && "ring-2 ring-primary")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{stage}</h3>
          <p className="text-xs text-muted-foreground">{deals.length} deals · {formatMoney(value)}</p>
        </div>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stageColors[stage] }} />
      </div>
      <div className="grid gap-3">
        {deals.map((deal) => <PipelineCard key={deal.id} deal={deal} onOpen={() => setSelectedDeal(deal.id)} />)}
      </div>
    </section>
  );
}

function PipelineCard({ deal, onOpen }: { deal: Deal; onOpen: () => void }) {
  const state = useCrmStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const company = getCompany(state, deal.companyId);
  const owner = getOwner(state, deal.ownerId);
  const style = { transform: CSS.Translate.toString(transform) };
  return (
    <article ref={setNodeRef} style={style} className={cx("rounded-md border border-border bg-panel p-3 shadow-soft", isDragging && "z-20 opacity-70")}>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <p className="font-semibold leading-snug">{deal.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{company.name}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-semibold text-primary">{formatMoney(dealValue(deal))}</span>
          <span className="rounded-sm bg-muted px-2 py-1 text-xs font-semibold">{owner.name}</span>
        </div>
      </button>
      <button {...listeners} {...attributes} className="mt-3 h-8 w-full rounded-sm border border-border text-xs font-semibold text-muted-foreground hover:bg-muted">
        Drag to move
      </button>
    </article>
  );
}

function DealDetail({ deal, onGenerateQuote, onLogActivity }: { deal: Deal; onGenerateQuote: () => void; onLogActivity: () => void }) {
  const state = useCrmStore();
  const { updateDeal, addLineItem, updateLineItem, removeLineItem, toggleActivityDone } = state;
  const company = getCompany(state, deal.companyId);
  const contact = getContact(state, deal.contactId);
  const owner = getOwner(state, deal.ownerId);
  const dealActivities = state.activities.filter((activity) => activity.dealId === deal.id || activity.contactId === contact.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const nextTask = dealActivities.find((activity) => activity.type === "task" && !activity.done);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel title={deal.name} icon={CircleDollarSign}>
        <div className="grid gap-4 md:grid-cols-4">
          <Info label="Value" value={formatMoney(dealValue(deal))} />
          <Info label="Stage" value={deal.stage} />
          <Info label="Owner" value={owner.name} />
          <Info label="Close date" value={formatDate(deal.expectedCloseDate)} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold">
            Stage
            <select value={deal.stage} onChange={(event) => updateDeal(deal.id, { stage: event.target.value as DealStage })} className="h-11 rounded-md border border-border bg-white px-3">
              {pipelineStages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Owner
            <select value={deal.ownerId} onChange={(event) => updateDeal(deal.id, { ownerId: event.target.value })} className="h-11 rounded-md border border-border bg-white px-3">
              {state.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Expected close
            <input type="date" value={deal.expectedCloseDate} onChange={(event) => updateDeal(deal.id, { expectedCloseDate: event.target.value })} className="h-11 rounded-md border border-border bg-white px-3" />
          </label>
        </div>

        <section className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Editable quote line items</h3>
            <button
              onClick={() => {
                const product = state.products[0];
                addLineItem(deal.id, { productId: product.id, quantity: 1, unitPrice: product.price });
              }}
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-border px-3 text-sm font-semibold hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Line item
            </button>
          </div>
          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Product / Service</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Unit price</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3"> </th>
                </tr>
              </thead>
              <tbody>
                {deal.lineItems.map((item, index) => (
                  <tr key={`${item.productId}-${index}`} className="border-t border-border">
                    <td className="px-3 py-2">
                      <select value={item.productId} onChange={(event) => {
                        const product = state.products.find((entry) => entry.id === event.target.value);
                        updateLineItem(deal.id, index, { productId: event.target.value, unitPrice: product?.price ?? item.unitPrice });
                      }} className="h-10 w-full rounded-sm border border-border bg-white px-2">
                        {state.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input type="number" min={1} value={item.quantity} onChange={(event) => updateLineItem(deal.id, index, { quantity: Number(event.target.value) })} className="h-10 w-24 rounded-sm border border-border bg-white px-2" /></td>
                    <td className="px-3 py-2"><input type="number" min={0} value={item.unitPrice} onChange={(event) => updateLineItem(deal.id, index, { unitPrice: Number(event.target.value) })} className="h-10 w-32 rounded-sm border border-border bg-white px-2" /></td>
                    <td className="px-3 py-2 text-right font-semibold">{formatMoney(item.quantity * item.unitPrice)}</td>
                    <td className="px-3 py-2"><button onClick={() => removeLineItem(deal.id, index)} aria-label="Remove line item" className="grid h-9 w-9 place-items-center rounded-sm hover:bg-muted"><Trash2 className="h-4 w-4 text-danger" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-primary p-4 text-primary-foreground">
            <span className="text-sm font-semibold">Quote total</span>
            <span className="text-3xl font-semibold">{formatMoney(dealValue(deal))}</span>
          </div>
        </section>
      </Panel>

      <div className="grid gap-5">
        <Panel title="Company & contact" icon={Building2}>
          <p className="font-semibold">{company.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{company.industry} · {company.website}</p>
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="font-semibold">{contact.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{contact.role}</p>
            <p className="mt-2 text-sm">{contact.email}</p>
            <p className="text-sm">{contact.phone}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={onGenerateQuote} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
              <FileText className="h-4 w-4" />
              Generate quote
            </button>
            <button onClick={onLogActivity} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Activity
            </button>
          </div>
        </Panel>

        <Panel title="Next task" icon={CalendarClock}>
          {nextTask ? (
            <label className="flex items-start gap-3 rounded-md border border-border p-3">
              <input type="checkbox" checked={Boolean(nextTask.done)} onChange={() => toggleActivityDone(nextTask.id)} className="mt-1 h-4 w-4 accent-primary" />
              <span>
                <span className="block font-semibold">{nextTask.body}</span>
                <span className="mt-1 block text-sm text-muted-foreground">Due {formatDate(nextTask.dueDate)}</span>
              </span>
            </label>
          ) : <p className="text-sm text-muted-foreground">No open task on this deal.</p>}
        </Panel>

        <Panel title="Activity timeline" icon={ActivityIcon}>
          <ActivityList activities={dealActivities} compact />
        </Panel>

        <Panel title="Notes" icon={FileText}>
          <textarea value={deal.notes} onChange={(event) => updateDeal(deal.id, { notes: event.target.value })} className="min-h-36 w-full rounded-md border border-border bg-white p-3 text-sm" />
        </Panel>
      </div>
    </section>
  );
}

function ContactsView() {
  const state = useCrmStore();
  const contact = state.contacts.find((item) => item.id === state.selectedContactId) ?? state.contacts[0];
  const company = getCompany(state, contact.companyId);
  const deals = state.deals.filter((deal) => deal.contactId === contact.id);
  const activities = state.activities.filter((activity) => activity.contactId === contact.id);

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Contacts" icon={UsersRound}>
        <div className="grid gap-2">
          {state.contacts.map((item) => (
            <button key={item.id} onClick={() => state.setSelectedContact(item.id)} className={cx("rounded-md border p-3 text-left", item.id === contact.id ? "border-primary bg-blue-50" : "border-border hover:bg-muted")}>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.role}</p>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={contact.name} icon={UserRound}>
        <div className="grid gap-4 md:grid-cols-3">
          <Info label="Company" value={company.name} />
          <Info label="Role" value={contact.role} />
          <Info label="Open deals" value={String(deals.filter((deal) => !deal.stage.startsWith("Closed")).length)} />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section>
            <h3 className="font-semibold">Related deals</h3>
            <DealList deals={deals} />
          </section>
          <section>
            <h3 className="font-semibold">Activity history</h3>
            <ActivityList activities={activities} compact />
          </section>
        </div>
      </Panel>
    </section>
  );
}

function CompaniesView() {
  const state = useCrmStore();
  const company = state.companies.find((item) => item.id === state.selectedCompanyId) ?? state.companies[0];
  const contacts = state.contacts.filter((contact) => contact.companyId === company.id);
  const deals = state.deals.filter((deal) => deal.companyId === company.id);

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title="Companies" icon={Building2}>
        <div className="grid gap-2">
          {state.companies.map((item) => (
            <button key={item.id} onClick={() => state.setSelectedCompany(item.id)} className={cx("rounded-md border p-3 text-left", item.id === company.id ? "border-primary bg-blue-50" : "border-border hover:bg-muted")}>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.industry}</p>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={company.name} icon={Building2}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="rounded-sm bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{company.industry}</span>
            <p className="mt-3 text-muted-foreground">{company.website}</p>
          </div>
          <Info label="Pipeline value" value={formatMoney(deals.reduce((sum, deal) => sum + dealValue(deal), 0))} />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section>
            <h3 className="font-semibold">Contacts</h3>
            <div className="mt-3 grid gap-2">
              {contacts.map((contact) => (
                <button key={contact.id} onClick={() => state.setSelectedContact(contact.id)} className="rounded-md border border-border p-3 text-left hover:bg-muted">
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="font-semibold">Related deals</h3>
            <DealList deals={deals} />
          </section>
        </div>
      </Panel>
    </section>
  );
}

function Reports({ deals }: { deals: Deal[] }) {
  const state = useCrmStore();
  const byStage = pipelineStages.map((stage) => ({ name: stage, value: deals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + dealValue(deal), 0), fill: stageColors[stage] }));
  const revenueByRep = state.users.map((user) => ({ name: user.name, revenue: deals.filter((deal) => deal.ownerId === user.id && deal.stage === "Closed Won").reduce((sum, deal) => sum + dealValue(deal), 0) }));
  const closed = deals.filter((deal) => deal.stage === "Closed Won" || deal.stage === "Closed Lost");
  const won = closed.filter((deal) => deal.stage === "Closed Won").length;
  const winRateData = [
    { name: "Won", value: won, fill: "hsl(var(--success))" },
    { name: "Lost", value: Math.max(0, closed.length - won), fill: "hsl(var(--danger))" }
  ];

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Report pipeline" value={formatMoney(byStage.reduce((sum, item) => sum + item.value, 0))} detail="Filtered value" />
        <Metric title="Win rate" value={`${closed.length ? Math.round((won / closed.length) * 100) : 0}%`} detail={`${closed.length} closed deals`} />
        <Metric title="Won revenue" value={formatMoney(revenueByRep.reduce((sum, item) => sum + item.revenue, 0))} detail="Closed won by rep" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Pipeline by stage" icon={BarChart3}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={70} />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  {byStage.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Win rate" icon={Handshake}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={winRateData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} label>
                  {winRateData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Revenue by rep" icon={UserRound}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByRep}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Area dataKey="revenue" fill="hsl(var(--primary))" fillOpacity={0.22} stroke="hsl(var(--primary))" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function DealModal({ onClose }: { onClose: () => void }) {
  const state = useCrmStore();
  const [companyId, setCompanyId] = useState(state.companies[0].id);
  const availableContacts = state.contacts.filter((contact) => contact.companyId === companyId);
  const [contactId, setContactId] = useState(availableContacts[0]?.id ?? state.contacts[0].id);
  const [productId, setProductId] = useState(state.products[1].id);

  useEffect(() => {
    const nextContact = state.contacts.find((contact) => contact.companyId === companyId);
    if (nextContact) setContactId(nextContact.id);
  }, [companyId, state.contacts]);

  function submit(formData: FormData) {
    const product = state.products.find((item) => item.id === productId) ?? state.products[0];
    state.addDeal({
      name: String(formData.get("name") || "New opportunity"),
      companyId,
      contactId,
      ownerId: String(formData.get("ownerId")),
      stage: String(formData.get("stage")) as DealStage,
      expectedCloseDate: String(formData.get("expectedCloseDate")),
      notes: String(formData.get("notes") || ""),
      lineItems: [{ productId: product.id, quantity: Number(formData.get("quantity") || 1), unitPrice: product.price }]
    });
    onClose();
  }

  return (
    <Modal title="Add deal" onClose={onClose}>
      <form action={submit} className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold">Deal name<input name="name" required className="h-11 rounded-md border border-border px-3" /></label>
        <label className="grid gap-1 text-sm font-semibold">Company<select value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="h-11 rounded-md border border-border px-3">{state.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Contact<select value={contactId} onChange={(event) => setContactId(event.target.value)} className="h-11 rounded-md border border-border px-3">{availableContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">Owner<select name="ownerId" className="h-11 rounded-md border border-border px-3">{state.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Stage<select name="stage" className="h-11 rounded-md border border-border px-3">{pipelineStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">Product<select value={productId} onChange={(event) => setProductId(event.target.value)} className="h-11 rounded-md border border-border px-3">{state.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold">Quantity<input name="quantity" type="number" min={1} defaultValue={5} className="h-11 rounded-md border border-border px-3" /></label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">Expected close<input name="expectedCloseDate" type="date" required defaultValue="2026-06-28" className="h-11 rounded-md border border-border px-3" /></label>
        <label className="grid gap-1 text-sm font-semibold">Notes<textarea name="notes" className="min-h-24 rounded-md border border-border p-3" /></label>
        <button className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground">Create deal</button>
      </form>
    </Modal>
  );
}

function ContactModal({ onClose }: { onClose: () => void }) {
  const state = useCrmStore();
  function submit(formData: FormData) {
    state.addContact({
      companyId: String(formData.get("companyId")),
      name: String(formData.get("name")),
      role: String(formData.get("role")),
      email: String(formData.get("email")),
      phone: String(formData.get("phone"))
    });
    onClose();
  }
  return (
    <Modal title="Add contact" onClose={onClose}>
      <form action={submit} className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold">Company<select name="companyId" className="h-11 rounded-md border border-border px-3">{state.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-semibold">Name<input name="name" required className="h-11 rounded-md border border-border px-3" /></label>
        <label className="grid gap-1 text-sm font-semibold">Role<input name="role" required className="h-11 rounded-md border border-border px-3" /></label>
        <label className="grid gap-1 text-sm font-semibold">Email<input name="email" type="email" required className="h-11 rounded-md border border-border px-3" /></label>
        <label className="grid gap-1 text-sm font-semibold">Phone<input name="phone" required className="h-11 rounded-md border border-border px-3" /></label>
        <button className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground">Create contact</button>
      </form>
    </Modal>
  );
}

function ActivityModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const state = useCrmStore();
  function submit(formData: FormData) {
    state.addActivity({
      dealId: deal.id,
      contactId: deal.contactId,
      type: String(formData.get("type")) as Activity["type"],
      body: String(formData.get("body")),
      dueDate: String(formData.get("dueDate") || "") || undefined,
      done: false
    });
    onClose();
  }
  return (
    <Modal title="Log activity" onClose={onClose}>
      <form action={submit} className="grid gap-3">
        <label className="grid gap-1 text-sm font-semibold">Type<select name="type" className="h-11 rounded-md border border-border px-3"><option>call</option><option>email</option><option>meeting</option><option>note</option><option>task</option></select></label>
        <label className="grid gap-1 text-sm font-semibold">Body<textarea name="body" required className="min-h-28 rounded-md border border-border p-3" /></label>
        <label className="grid gap-1 text-sm font-semibold">Due date<input name="dueDate" type="date" className="h-11 rounded-md border border-border px-3" /></label>
        <button className="h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground">Save activity</button>
      </form>
    </Modal>
  );
}

function QuoteModal({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const state = useCrmStore();
  const company = getCompany(state, deal.companyId);
  const contact = getContact(state, deal.contactId);
  const owner = getOwner(state, deal.ownerId);

  function downloadQuote() {
    const html = document.getElementById("quote-document")?.outerHTML ?? "";
    const blob = new Blob([`<!doctype html><html><head><title>${demoConfig.quoteTitle}</title></head><body>${html}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${company.name.replace(/\s+/g, "-").toLowerCase()}-quote.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal title="Generated quote" onClose={onClose} wide>
      <section id="quote-document" className="rounded-md border border-border bg-white p-6 text-slate-950">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-primary">{demoConfig.demoCompanyName}</p>
            <h2 className="mt-2 text-4xl font-semibold">{demoConfig.quoteTitle}</h2>
            <p className="mt-2 text-slate-500">{demoConfig.productName} · Prepared for {company.name}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Sales rep: {owner.name}</p>
            <p>Expected close: {formatDate(deal.expectedCloseDate)}</p>
            <p>Quote date: Jun 5, 2026</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bill to</p>
            <p className="mt-2 font-semibold">{company.name}</p>
            <p className="text-sm text-slate-600">{company.industry}</p>
            <p className="text-sm text-slate-600">{company.website}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Contact</p>
            <p className="mt-2 font-semibold">{contact.name}</p>
            <p className="text-sm text-slate-600">{contact.role}</p>
            <p className="text-sm text-slate-600">{contact.email}</p>
          </div>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead className="border-y border-slate-200 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr><th className="py-3">Product / Service</th><th>Type</th><th>Qty</th><th>Unit</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody>
            {deal.lineItems.map((item, index) => {
              const product = state.products.find((entry) => entry.id === item.productId) as Product | undefined;
              return (
                <tr key={`${item.productId}-${index}`} className="border-b border-slate-100">
                  <td className="py-3 font-semibold">{product?.name ?? item.productId}</td>
                  <td>{product?.type.replace("_", " ")}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td className="text-right font-semibold">{formatMoney(item.quantity * item.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs rounded-md bg-slate-950 p-4 text-white">
            <p className="text-sm text-white/60">Quote total</p>
            <p className="mt-2 text-3xl font-semibold">{formatMoney(dealValue(deal))}</p>
          </div>
        </div>
      </section>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold"><Printer className="h-4 w-4" />Print / save PDF</button>
        <button onClick={downloadQuote} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"><FileText className="h-4 w-4" />Download quote</button>
      </div>
    </Modal>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      {children}
    </section>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <section className="rounded-md border border-border bg-panel p-4 shadow-soft">
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
    </div>
  );
}

function ActivityList({ activities, compact = false }: { activities: Activity[]; compact?: boolean }) {
  const state = useCrmStore();
  if (!activities.length) return <p className="text-sm text-muted-foreground">No activity matches the current filters.</p>;
  return (
    <div className="grid gap-2">
      {activities.map((activity) => {
        const deal = state.deals.find((item) => item.id === activity.dealId);
        const contact = activity.contactId ? getContact(state, activity.contactId) : undefined;
        return (
          <article key={activity.id} className="flex items-start gap-3 rounded-md border border-border p-3">
            <span className={cx("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-sm text-xs font-semibold", activity.done ? "bg-success text-white" : "bg-muted text-muted-foreground")}>
              {activity.done ? <Check className="h-4 w-4" /> : activity.type.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{activity.body}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activity.type} {deal ? `· ${deal.name}` : ""} {contact ? `· ${contact.name}` : ""}
              </p>
              {!compact && activity.dueDate ? <p className="mt-1 text-sm font-semibold text-primary">Due {formatDate(activity.dueDate)}</p> : null}
            </div>
            {activity.type === "task" ? <button onClick={() => state.toggleActivityDone(activity.id)} className="h-8 rounded-sm border border-border px-2 text-xs font-semibold">{activity.done ? "Done" : "Mark done"}</button> : null}
          </article>
        );
      })}
    </div>
  );
}

function DealList({ deals }: { deals: Deal[] }) {
  const state = useCrmStore();
  return (
    <div className="mt-3 grid gap-2">
      {deals.map((deal) => (
        <button key={deal.id} onClick={() => state.setSelectedDeal(deal.id)} className="rounded-md border border-border p-3 text-left hover:bg-muted">
          <p className="font-semibold">{deal.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{deal.stage} · {formatMoney(dealValue(deal))}</p>
        </button>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <section className={cx("max-h-[90vh] w-full overflow-y-auto rounded-md bg-panel p-5 shadow-2xl", wide ? "max-w-5xl" : "max-w-xl")}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-sm hover:bg-muted" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
