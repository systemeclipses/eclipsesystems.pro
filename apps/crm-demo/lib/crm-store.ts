"use client";

import { create } from "zustand";
import { activities, companies, contacts, deals, products, seedData, users, type Activity, type Company, type Contact, type Deal, type DealStage, type LineItem } from "@/lib/demo-data";

export type ViewKey = "dashboard" | "pipeline" | "deals" | "contacts" | "companies" | "reports";

export type CrmFilters = {
  query: string;
  stage: "all" | DealStage;
  ownerId: "all" | string;
  minValue: number;
};

type CrmState = {
  users: typeof users;
  companies: Company[];
  contacts: Contact[];
  products: typeof products;
  deals: Deal[];
  activities: Activity[];
  view: ViewKey;
  selectedDealId: string;
  selectedContactId: string;
  selectedCompanyId: string;
  filters: CrmFilters;
  setView: (view: ViewKey) => void;
  setSelectedDeal: (dealId: string) => void;
  setSelectedContact: (contactId: string) => void;
  setSelectedCompany: (companyId: string) => void;
  setFilters: (filters: Partial<CrmFilters>) => void;
  moveDeal: (dealId: string, stage: DealStage) => void;
  addDeal: (deal: Omit<Deal, "id" | "createdAt">) => void;
  updateDeal: (dealId: string, changes: Partial<Deal>) => void;
  addLineItem: (dealId: string, item: LineItem) => void;
  updateLineItem: (dealId: string, index: number, item: Partial<LineItem>) => void;
  removeLineItem: (dealId: string, index: number) => void;
  addContact: (contact: Omit<Contact, "id">) => void;
  addActivity: (activity: Omit<Activity, "id" | "createdAt">) => void;
  toggleActivityDone: (activityId: string) => void;
  resetDemo: () => void;
};

const today = "2026-06-05";

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function dealValue(deal: Pick<Deal, "lineItems">) {
  return deal.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function stageProbability(stage: DealStage) {
  const weights: Record<DealStage, number> = {
    "New Lead": 0.1,
    Qualified: 0.25,
    "Proposal Sent": 0.5,
    Negotiation: 0.75,
    "Closed Won": 1,
    "Closed Lost": 0
  };
  return weights[stage];
}

export function isThisMonth(date: string) {
  return date.slice(0, 7) === today.slice(0, 7);
}

export function isLastMonth(date: string) {
  return date.slice(0, 7) === "2026-05";
}

export function getCompany(state: Pick<CrmState, "companies">, companyId: string) {
  return state.companies.find((company) => company.id === companyId) ?? state.companies[0];
}

export function getContact(state: Pick<CrmState, "contacts">, contactId: string) {
  return state.contacts.find((contact) => contact.id === contactId) ?? state.contacts[0];
}

export function getOwner(state: Pick<CrmState, "users">, ownerId: string) {
  return state.users.find((user) => user.id === ownerId) ?? state.users[0];
}

const initialFilters: CrmFilters = {
  query: "",
  stage: "all",
  ownerId: "all",
  minValue: 0
};

export const useCrmStore = create<CrmState>((set) => ({
  users: seedData.users,
  companies: seedData.companies,
  contacts: seedData.contacts,
  products: seedData.products,
  deals: seedData.deals,
  activities: seedData.activities,
  view: "dashboard",
  selectedDealId: seedData.deals[8].id,
  selectedContactId: seedData.contacts[8].id,
  selectedCompanyId: seedData.companies[5].id,
  filters: initialFilters,
  setView: (view) => set({ view }),
  setSelectedDeal: (dealId) => set({ selectedDealId: dealId, view: "deals" }),
  setSelectedContact: (contactId) => set({ selectedContactId: contactId, view: "contacts" }),
  setSelectedCompany: (companyId) => set({ selectedCompanyId: companyId, view: "companies" }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  moveDeal: (dealId, stage) =>
    set((state) => ({
      deals: state.deals.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal)),
      selectedDealId: dealId
    })),
  addDeal: (deal) =>
    set((state) => {
      const newDeal = { ...deal, id: makeId("deal"), createdAt: today };
      return { deals: [newDeal, ...state.deals], selectedDealId: newDeal.id, view: "deals" };
    }),
  updateDeal: (dealId, changes) =>
    set((state) => ({
      deals: state.deals.map((deal) => (deal.id === dealId ? { ...deal, ...changes } : deal))
    })),
  addLineItem: (dealId, item) =>
    set((state) => ({
      deals: state.deals.map((deal) => (deal.id === dealId ? { ...deal, lineItems: [...deal.lineItems, item] } : deal))
    })),
  updateLineItem: (dealId, index, item) =>
    set((state) => ({
      deals: state.deals.map((deal) => {
        if (deal.id !== dealId) return deal;
        return { ...deal, lineItems: deal.lineItems.map((line, lineIndex) => (lineIndex === index ? { ...line, ...item } : line)) };
      })
    })),
  removeLineItem: (dealId, index) =>
    set((state) => ({
      deals: state.deals.map((deal) => (deal.id === dealId ? { ...deal, lineItems: deal.lineItems.filter((_, lineIndex) => lineIndex !== index) } : deal))
    })),
  addContact: (contact) =>
    set((state) => {
      const newContact = { ...contact, id: makeId("contact") };
      return { contacts: [newContact, ...state.contacts], selectedContactId: newContact.id, view: "contacts" };
    }),
  addActivity: (activity) =>
    set((state) => {
      const newActivity = { ...activity, id: makeId("activity"), createdAt: new Date().toISOString() };
      return { activities: [newActivity, ...state.activities] };
    }),
  toggleActivityDone: (activityId) =>
    set((state) => ({
      activities: state.activities.map((activity) => (activity.id === activityId ? { ...activity, done: !activity.done } : activity))
    })),
  resetDemo: () =>
    set({
      users,
      companies,
      contacts,
      products,
      deals,
      activities,
      selectedDealId: deals[8].id,
      selectedContactId: contacts[8].id,
      selectedCompanyId: companies[5].id,
      filters: initialFilters,
      view: "dashboard"
    })
}));
