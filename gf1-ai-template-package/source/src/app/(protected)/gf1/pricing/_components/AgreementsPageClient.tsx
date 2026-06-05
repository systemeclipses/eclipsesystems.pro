"use client";

import { useEffect, useMemo, useState } from "react";
import { supaClient } from "@/lib/supabase/client";
import styles from "./AgreementsPage.module.css";
import {
  AGREEMENT_DEFAULT_RATES,
  calculateAgreement,
  derivePayPeriods,
} from "@/lib/gf1/agreements-calculations";
import type {
  AgreementContact,
  AgreementFormValues,
  WorkersCompClass,
} from "@/lib/gf1/agreements-types";
import { formatCurrency } from "@/lib/gf1/reports-utils";
import { US_STATES, getSUTARate } from "@/lib/gf1/rates";

export type PricingOrganizationOption = {
  id: string;
  legal_name?: string | null;
  dba_name?: string | null;
  trade_name?: string | null;
  name?: string | null;
  fein?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  primary_contact_phone?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  current_payroll_provider?: string | null;
  pay_frequency?: string | null;
  first_check_date?: string | null;
  first_period_start?: string | null;
  first_period_end?: string | null;
  total_employees?: number | null;
};

type PricingInfoSheetRow = {
  id: string;
  organization_id: string;
  form_json: AgreementFormValues;
  completed: boolean;
};

const PROVIDER_ADDRESS = {
  name: "Galactic Inc.",
  businessLine: "Galactic Employer Services",
  street: "400 Vestavia Pkwy Ste 402",
  city: "Vestavia",
  state: "AL",
  zip: "35216",
  phone: "205.322.2220",
};

const PAYROLL_METHODS = [
  "Email In",
  "Call In",
  "Enter in Prism",
  "Upload File",
  "Other",
];

const PAYROLL_PROCESS_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const CHECKS_DELIVERY = [
  "All direct deposit",
  "Client pick-up",
  "Regular Mail",
  "UPS",
  "FedEx",
  "Other",
];

const REPORTS_DELIVERY = [
  "No reports",
  "With checks",
  "Email",
  "Portal",
  "Other",
];

const PAYMENT_METHODS = [
  "Electronic debit",
  "Money wire",
  "Paper check",
  "Certified check",
];

const SERVICE_TYPES: AgreementFormValues["serviceType"][] = ["PEO", "ASO", "Payroll"];

const PAYROLL_FREQUENCIES: AgreementFormValues["payrollFrequency"][] = [
  "weekly",
  "biweekly",
  "semimonthly",
  "monthly",
];

const TAB_OPTIONS = [
  { id: "info", label: "Info Sheet" },
  { id: "billing", label: "Billing Agreement" },
  { id: "analysis", label: "Cost Analysis" },
] as const;

const INFO_STEPS = [
  { id: "basics", label: "Company Basics" },
  { id: "contacts", label: "Contacts" },
  { id: "addresses", label: "Addresses" },
  { id: "payroll", label: "Payroll Setup" },
  { id: "pricing", label: "Work Comp + Rates" },
] as const;

type ExportKind = "billing-agreement" | "cost-analysis";

const makeId = () => Math.random().toString(36).slice(2);

const emptyContact = (): AgreementContact => ({
  name: "",
  title: "",
  phone: "",
  email: "",
});

const emptyWcRow = (): WorkersCompClass => ({
  id: makeId(),
  code: "",
  description: "",
  annualPayroll: 0,
  currentRate: 0,
  galacticRate: 0,
});

const formatDateInput = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const formatGeneratedDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

const buildInitialForm = (): AgreementFormValues => ({
  legalName: "",
  dbaName: "",
  fein: "",
  primaryContact: emptyContact(),
  additionalContacts: [emptyContact(), emptyContact(), emptyContact()],
  physicalAddress: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  shippingAddress: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  shippingSameAsPhysical: true,
  serviceType: "PEO",
  serviceName: "Galactic Employer Services",
  activationDate: "",
  payrollFrequency: "biweekly",
  payPeriodsPerYear: derivePayPeriods("biweekly"),
  payPeriodsOverride: false,
  payrollMethod: PAYROLL_METHODS[0],
  payrollProcessDay: PAYROLL_PROCESS_DAYS[2],
  payPeriodStart: "",
  payPeriodEnd: "",
  firstCheckDate: "",
  checksDeliveryMethod: CHECKS_DELIVERY[0],
  reportsDeliveryMethod: REPORTS_DELIVERY[1],
  paymentMethod: PAYMENT_METHODS[0],
  estimatedEmployees: 0,
  workersCompClasses: [emptyWcRow()],
  grossPayrollOverrideEnabled: false,
  grossPayrollOverride: 0,
  adminFeeBasis: "per_payroll",
  currentAdminRate: 0,
  galacticAdminRate: 0,
  minimumAdminFeePerEmployeePerMonth: 0,
  healthPerPayroll: 0,
  dentalPerPayroll: 0,
  lifeDisabilityPerPayroll: 0,
  creditForAdvancePerPayroll: 0,
  deductionsCreditPerPayroll: 0,
  conversionFee: 0,
  workersCompDeposit: 0,
  timeAndAttendancePerEmployee: 0,
  timeAndAttendanceSetupFee: 0,
  initialTermMonths: 12,
  agreementDate: formatDateInput(new Date()),
  clientSignatoryName: "",
  clientSignatoryTitle: "",
  socialSecurityRate: AGREEMENT_DEFAULT_RATES.socialSecurityRate,
  medicareRate: AGREEMENT_DEFAULT_RATES.medicareRate,
  futaRate: AGREEMENT_DEFAULT_RATES.futaRate,
  sutaRate: AGREEMENT_DEFAULT_RATES.sutaRate,
  socialSecurityWageBase: AGREEMENT_DEFAULT_RATES.socialSecurityWageBase,
  futaWageBase: AGREEMENT_DEFAULT_RATES.futaWageBase,
  sutaWageBase: AGREEMENT_DEFAULT_RATES.sutaWageBase,
  currentProviderName: "",
  sutaState: "",
});

const mergeForm = (partial: Partial<AgreementFormValues>): AgreementFormValues => {
  const base = buildInitialForm();
  return {
    ...base,
    ...partial,
    primaryContact: {
      ...base.primaryContact,
      ...(partial.primaryContact ?? {}),
    },
    additionalContacts: Array.isArray(partial.additionalContacts) && partial.additionalContacts.length
      ? partial.additionalContacts.map((contact) => ({ ...emptyContact(), ...contact }))
      : base.additionalContacts,
    physicalAddress: {
      ...base.physicalAddress,
      ...(partial.physicalAddress ?? {}),
    },
    shippingAddress: {
      ...base.shippingAddress,
      ...(partial.shippingAddress ?? {}),
    },
    workersCompClasses: Array.isArray(partial.workersCompClasses) && partial.workersCompClasses.length
      ? partial.workersCompClasses.map((row) => ({
          ...emptyWcRow(),
          ...row,
          id: row.id || makeId(),
        }))
      : base.workersCompClasses,
  };
};

export default function AgreementsPageClient({
  organizations = [],
}: {
  organizations?: PricingOrganizationOption[];
}) {
  const [form, setForm] = useState<AgreementFormValues>(() => buildInitialForm());
  const [activeTab, setActiveTab] = useState<(typeof TAB_OPTIONS)[number]["id"]>("info");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [infoStep, setInfoStep] = useState(0);
  const [infoSheetCompleted, setInfoSheetCompleted] = useState(false);
  const [infoSheetLoading, setInfoSheetLoading] = useState(false);
  const [infoSheetSaving, setInfoSheetSaving] = useState(false);
  const [infoSheetError, setInfoSheetError] = useState<string | null>(null);
  const [signatureRecipientName, setSignatureRecipientName] = useState("");
  const [signatureRecipientEmail, setSignatureRecipientEmail] = useState("");
  const [signatureSending, setSignatureSending] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [signatureLink, setSignatureLink] = useState<string | null>(null);
  const [pdfExportPending, setPdfExportPending] = useState<ExportKind | null>(null);
  const [pdfExportStatus, setPdfExportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [billingOverrides, setBillingOverrides] = useState<Record<string, string>>({});
  const [focusedBillingKey, setFocusedBillingKey] = useState<string | null>(null);
  const [analysisOverrides, setAnalysisOverrides] = useState<Record<string, string>>({});
  const [focusedAnalysisKey, setFocusedAnalysisKey] = useState<string | null>(null);

  const totalInfoSteps = INFO_STEPS.length;
  const generatedPreviewDate = useMemo(() => formatGeneratedDate(new Date()), []);
  const isFirstInfoStep = infoStep === 0;
  const isLastInfoStep = infoStep === totalInfoSteps - 1;
  const tabsLocked = !infoSheetCompleted;
  const infoSheetReady = Boolean(selectedOrgId);
  const showOrgGate = !selectedOrgId;
  const isBlank = (value: unknown) => typeof value !== "number" && (!value || String(value).trim() === "");

  const workCompComplete = useMemo(() => {
    if (infoStep !== 4) return false;
    if (isBlank(form.estimatedEmployees)) return false;
    if (form.grossPayrollOverrideEnabled && isBlank(form.grossPayrollOverride)) return false;
    if (form.workersCompClasses.some((row) => (
      isBlank(row.code) ||
      isBlank(row.description) ||
      isBlank(row.annualPayroll) ||
      isBlank(row.currentRate) ||
      isBlank(row.galacticRate)
    ))) return false;
    if (isBlank(form.minimumAdminFeePerEmployeePerMonth)) return false;
    if (isBlank(form.currentAdminRate)) return false;
    if (isBlank(form.galacticAdminRate)) return false;
    if (isBlank(form.sutaState)) return false;
    if (isBlank(form.sutaRate)) return false;
    if (isBlank(form.sutaWageBase)) return false;
    if (isBlank(form.futaRate)) return false;
    if (isBlank(form.futaWageBase)) return false;
    if (isBlank(form.socialSecurityRate)) return false;
    if (isBlank(form.socialSecurityWageBase)) return false;
    if (isBlank(form.medicareRate)) return false;
    if (isBlank(form.healthPerPayroll)) return false;
    if (isBlank(form.dentalPerPayroll)) return false;
    if (isBlank(form.lifeDisabilityPerPayroll)) return false;
    if (isBlank(form.creditForAdvancePerPayroll)) return false;
    if (isBlank(form.deductionsCreditPerPayroll)) return false;
    if (isBlank(form.agreementDate)) return false;
    if (isBlank(form.initialTermMonths)) return false;
    if (isBlank(form.conversionFee)) return false;
    if (isBlank(form.workersCompDeposit)) return false;
    if (isBlank(form.clientSignatoryName)) return false;
    if (isBlank(form.clientSignatoryTitle)) return false;
    return true;
  }, [form, infoStep]);

  const organizationOptions = useMemo(() => {
    const list = (organizations ?? []).filter((org) => Boolean(org?.id));
    return [...list].sort((a, b) => {
      const nameA = (a.legal_name || a.trade_name || a.name || "").toLowerCase();
      const nameB = (b.legal_name || b.trade_name || b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [organizations]);

  useEffect(() => {
    if (!signatureRecipientName && form.primaryContact?.name) {
      setSignatureRecipientName(form.primaryContact.name);
    }
    if (!signatureRecipientEmail && form.primaryContact?.email) {
      setSignatureRecipientEmail(form.primaryContact.email);
    }
  }, [form.primaryContact, signatureRecipientName, signatureRecipientEmail]);

  const applyOrganizationToForm = (org: PricingOrganizationOption) => {
    const legalName = org.legal_name || org.trade_name || org.name || "";
    const dbaName = org.dba_name || "";
    const street = org.address_line1 ?? "";
    const city = org.city ?? "";
    const state = org.state ?? "";
    const zip = org.postal_code ?? "";
    const payrollFrequency = PAYROLL_FREQUENCIES.includes(org.pay_frequency as any)
      ? (org.pay_frequency as AgreementFormValues["payrollFrequency"])
      : undefined;

    setForm((prev) => ({
      ...prev,
      legalName,
      dbaName,
      fein: org.fein ?? "",
      currentProviderName: org.current_payroll_provider ?? "",
      primaryContact: {
        ...prev.primaryContact,
        name: org.primary_contact_name ?? prev.primaryContact.name,
        email: org.primary_contact_email ?? prev.primaryContact.email,
        phone: org.primary_contact_phone ?? prev.primaryContact.phone,
      },
      physicalAddress: {
        ...prev.physicalAddress,
        street: street || prev.physicalAddress.street,
        city: city || prev.physicalAddress.city,
        state: state || prev.physicalAddress.state,
        zip: zip || prev.physicalAddress.zip,
      },
      shippingSameAsPhysical: true,
      shippingAddress: {
        street: street || prev.physicalAddress.street,
        city: city || prev.physicalAddress.city,
        state: state || prev.physicalAddress.state,
        zip: zip || prev.physicalAddress.zip,
      },
      payrollFrequency: payrollFrequency ?? prev.payrollFrequency,
      payPeriodsPerYear: payrollFrequency ? derivePayPeriods(payrollFrequency) : prev.payPeriodsPerYear,
      payPeriodsOverride: payrollFrequency ? false : prev.payPeriodsOverride,
      firstCheckDate: org.first_check_date ?? prev.firstCheckDate,
      payPeriodStart: org.first_period_start ?? prev.payPeriodStart,
      payPeriodEnd: org.first_period_end ?? prev.payPeriodEnd,
      estimatedEmployees:
        typeof org.total_employees === "number" ? org.total_employees : prev.estimatedEmployees,
    }));
  };

  const wcPayrollTotal = useMemo(
    () => form.workersCompClasses.reduce((total, row) => total + (Number(row.annualPayroll) || 0), 0),
    [form.workersCompClasses]
  );

  useEffect(() => {
    if (!form.payPeriodsOverride) {
      setForm((prev) => ({
        ...prev,
        payPeriodsPerYear: derivePayPeriods(prev.payrollFrequency),
      }));
    }
  }, [form.payrollFrequency, form.payPeriodsOverride]);

  useEffect(() => {
    if (form.shippingSameAsPhysical) {
      setForm((prev) => ({
        ...prev,
        shippingAddress: { ...prev.physicalAddress },
      }));
    }
  }, [form.physicalAddress, form.shippingSameAsPhysical]);

  useEffect(() => {
    if (!form.sutaState) return;
    setForm((prev) => ({
      ...prev,
      sutaRate: getSUTARate(prev.sutaState as any),
    }));
  }, [form.sutaState]);

  useEffect(() => {
    if (infoSheetCompleted) return;
    if (activeTab !== "info") {
      setActiveTab("info");
    }
  }, [infoSheetCompleted, activeTab]);

  const calculations = useMemo(() => calculateAgreement(form), [form]);

  const updateField = <K extends keyof AgreementFormValues>(key: K, value: AgreementFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadInfoSheet = async (orgId: string) => {
    const supabase = supaClient();
    setInfoSheetLoading(true);
    setInfoSheetError(null);
    try {
      const { data, error } = await supabase
        .from("pricing_info_sheets")
        .select("id, organization_id, form_json, completed")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (error && (error as any).code !== "PGRST116") {
        throw error;
      }

      if (data?.form_json) {
        setForm(mergeForm(data.form_json as AgreementFormValues));
        setInfoSheetCompleted(Boolean((data as PricingInfoSheetRow).completed));
      } else {
        setInfoSheetCompleted(false);
      }
    } catch (err) {
      console.error("Failed to load pricing info sheet", err);
      setInfoSheetError("Unable to load info sheet. Try again.");
      // keep any auto-filled data when load fails
      setInfoSheetCompleted(false);
    } finally {
      setInfoSheetLoading(false);
    }
  };

  const handleOrganizationChange = (value: string) => {
    setSelectedOrgId(value);
    setInfoSheetCompleted(false);
    if (!value) {
      setForm(buildInitialForm());
      return;
    }
    const selected = organizationOptions.find((org) => org.id === value);
    if (selected) applyOrganizationToForm(selected);
    void loadInfoSheet(value);
  };

  const saveInfoSheet = async (completedOverride?: boolean, formOverride?: AgreementFormValues) => {
    if (!selectedOrgId) {
      setInfoSheetError("Select an organization before saving.");
      return;
    }
    const supabase = supaClient();
    setInfoSheetSaving(true);
    setInfoSheetError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const nextForm = formOverride ?? form;
      const payload = {
        organization_id: selectedOrgId,
        form_json: nextForm,
        completed: completedOverride ?? infoSheetCompleted,
        created_by: authData?.user?.id ?? null,
      };
      const { error } = await supabase
        .from("pricing_info_sheets")
        .upsert(payload, { onConflict: "organization_id" });
      if (error) throw error;
      if (completedOverride !== undefined) {
        setInfoSheetCompleted(completedOverride);
      }
    } catch (err) {
      console.error("Failed to save pricing info sheet", err);
      setInfoSheetError("Unable to save info sheet. Try again.");
    } finally {
      setInfoSheetSaving(false);
    }
  };

  const handleCurrentProviderNameChange = (value: string) => {
    const nextForm = { ...form, currentProviderName: value };
    setForm(nextForm);
    void saveInfoSheet(undefined, nextForm);
  };

  const sendSignatureRequest = async () => {
    if (!selectedOrgId) {
      setSignatureStatus({ type: "error", message: "Select an organization before sending." });
      return;
    }
    if (!signatureRecipientName.trim() || !signatureRecipientEmail.trim()) {
      setSignatureStatus({ type: "error", message: "Recipient name and email are required." });
      return;
    }
    setSignatureSending(true);
    setSignatureStatus(null);
    setSignatureLink(null);
    try {
      const res = await fetch("/api/gf1/agreements/send-signing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrgId,
          recipientName: signatureRecipientName.trim(),
          recipientEmail: signatureRecipientEmail.trim(),
          formJson: form,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Unable to send signing request.");
      setSignatureLink(payload?.signingUrl ?? null);
      setSignatureStatus({ type: "success", message: "Signature request sent." });
    } catch (err: any) {
      setSignatureStatus({ type: "error", message: err?.message || "Unable to send signing request." });
    } finally {
      setSignatureSending(false);
    }
  };

  const goToNextInfoStep = () => setInfoStep((prev) => Math.min(prev + 1, totalInfoSteps - 1));
  const goToPrevInfoStep = () => setInfoStep((prev) => Math.max(prev - 1, 0));

  const updateContact = (idx: number, updates: Partial<AgreementContact>) => {
    setForm((prev) => {
      const next = [...prev.additionalContacts];
      next[idx] = { ...next[idx], ...updates };
      return { ...prev, additionalContacts: next };
    });
  };

  const updateWorkersCompRow = (id: string, updates: Partial<WorkersCompClass>) => {
    setForm((prev) => ({
      ...prev,
      workersCompClasses: prev.workersCompClasses.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      ),
    }));
  };

  const addWorkersCompRow = () => {
    setForm((prev) => ({
      ...prev,
      workersCompClasses: [...prev.workersCompClasses, emptyWcRow()],
    }));
  };

  const removeWorkersCompRow = (id: string) => {
    setForm((prev) => ({
      ...prev,
      workersCompClasses: prev.workersCompClasses.filter((row) => row.id !== id),
    }));
  };

  const costAnalysis = calculations.costAnalysis;
  const previewTaxes = costAnalysis.proposed.taxes;

  const bVal = (key: string, calc: number) =>
    key in billingOverrides && billingOverrides[key] !== ''
      ? parseFloat(billingOverrides[key].replace(/,/g, '')) || 0
      : calc;
  const bSet = (key: string, val: string) =>
    setBillingOverrides((prev) => ({ ...prev, [key]: val.replace(/,/g, '') }));
  const bInputVal = (key: string, calc: number): string => {
    const raw = key in billingOverrides ? billingOverrides[key] : calc.toFixed(2);
    if (focusedBillingKey === key) return raw;
    const num = parseFloat(raw);
    if (isNaN(num)) return raw;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const rateInputValue = (value: number) => value.toFixed(2);

  const bGross = bVal('gross', costAnalysis.proposed.grossPerPayroll);
  const bFica = bVal('fica', previewTaxes.socialSecurityPerPayroll + previewTaxes.medicarePerPayroll);
  const bFuta = bVal('futa', previewTaxes.futaPerPayroll);
  const bSuta = bVal('suta', previewTaxes.sutaPerPayroll);
  const bAdminFee = bVal('adminFee', costAnalysis.proposed.adminFeePerPayroll);
  const bWcTotal = costAnalysis.proposed.workersCompLines.reduce(
    (sum, line) => sum + bVal(`wc_${line.code}_${line.description}`, line.perPayroll),
    0
  );
  const bHealth = bVal('health', form.healthPerPayroll);
  const bDental = bVal('dental', form.dentalPerPayroll);
  const bLife = bVal('life', form.lifeDisabilityPerPayroll);
  const bCredits = bVal('credits', -(form.creditForAdvancePerPayroll + form.deductionsCreditPerPayroll));
  const bConversion = bVal('conversion', form.conversionFee);
  const bWcDeposit = bVal('wcDeposit', form.workersCompDeposit);
  const bTotalPerPayrollCalc = bGross + bFica + bFuta + bSuta + bAdminFee + bWcTotal + bHealth + bDental + bLife + bCredits;
  const bTotalPerPayroll = bVal('totalPerPayroll', bTotalPerPayrollCalc);
  const bFirstInvoiceCalc = bTotalPerPayroll + bConversion + bWcDeposit;
  const bFirstInvoice = bVal('firstInvoiceTotal', bFirstInvoiceCalc);

  // Cost analysis overrides — proposed defaults from billing values
  const aVal = (key: string, calc: number) =>
    key in analysisOverrides && analysisOverrides[key] !== ''
      ? parseFloat(analysisOverrides[key].replace(/,/g, '')) || 0
      : calc;
  const aSet = (key: string, val: string) =>
    setAnalysisOverrides((prev) => ({ ...prev, [key]: val.replace(/,/g, '') }));
  const aInputVal = (key: string, calc: number): string => {
    const raw = key in analysisOverrides ? analysisOverrides[key] : calc.toFixed(2);
    if (focusedAnalysisKey === key) return raw;
    const num = parseFloat(raw);
    if (isNaN(num)) return raw;
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const proTaxes = bFica + bFuta + bSuta;
  const aCurAdmin    = aVal('cur_admin',    costAnalysis.current.adminFeePerPayroll);
  const aCurTaxes    = aVal('cur_taxes',    costAnalysis.current.taxes.totalPerPayroll);
  const aCurWc       = aVal('cur_wc',       costAnalysis.current.workersCompPerPayroll);
  const aCurBenefits = aVal('cur_benefits', costAnalysis.current.benefitsPerPayroll);
  const aCurTotal    = aCurAdmin + aCurTaxes + aCurWc + aCurBenefits;
  const aCurAnnual   = aVal('cur_annual',   costAnalysis.current.totalAnnual);
  const aProAdmin    = aVal('pro_admin',    bAdminFee);
  const aProTaxes    = aVal('pro_taxes',    proTaxes);
  const aProWc       = aVal('pro_wc',       bWcTotal);
  const aProBenefits = aVal('pro_benefits', bHealth + bDental + bLife);
  const aProTotal    = aProAdmin + aProTaxes + aProWc + aProBenefits;
  const aProAnnual   = aVal('pro_annual',   bTotalPerPayroll * (calculations.payPeriodsPerYear || 26));
  const aSavingsPerPayroll = aCurTotal - aProTotal;
  const aSavingsAnnual     = aCurAnnual - aProAnnual;

  const exportPdf = async (kind: ExportKind) => {
    if (!selectedOrgId) {
      setPdfExportStatus({ type: "error", message: "Select an organization before generating a PDF." });
      return;
    }

    setPdfExportPending(kind);
    setPdfExportStatus(null);

    try {
      const supabase = supaClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? null;
      const payload = {
        kind,
        organizationId: selectedOrgId,
        form,
        billingOverrides,
        analysis: {
          current: {
            title: form.currentProviderName || "Current payroll company",
            perPayroll: aCurTotal,
            annual: aCurAnnual,
            lines: [
              { label: "Admin fee", value: aCurAdmin },
              { label: "Employer taxes", value: aCurTaxes },
              { label: "Workers comp", value: aCurWc },
              { label: "Benefits", value: aCurBenefits },
            ],
          },
          proposed: {
            title: "Galactic Inc proposal",
            perPayroll: aProTotal,
            annual: aProAnnual,
            lines: [
              { label: "Admin fee", value: aProAdmin },
              { label: "Employer taxes", value: aProTaxes },
              { label: "Workers comp", value: aProWc },
              { label: "Benefits", value: aProBenefits },
            ],
          },
          savingsPerPayroll: aSavingsPerPayroll,
          savingsAnnual: aSavingsAnnual,
        },
      };

      const response = await fetch("/api/gf1/pricing/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate PDF.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const logStatus = response.headers.get("X-Pdf-Log-Status");
      const match = disposition?.match(/filename="(.+)"/i);
      const filename = match?.[1] || `${kind}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setPdfExportStatus({
        type: "success",
        message:
          logStatus === "failed"
            ? "PDF generated. Admin PDF Review logging is not available yet."
            : "PDF generated and added to Admin PDF Review.",
      });
    } catch (error) {
      console.error("Failed to export pricing PDF", error);
      setPdfExportStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to generate PDF.",
      });
    } finally {
      setPdfExportPending(null);
    }
  };

  return (
    <div className={styles.page}>
      <div>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div className="page-heading">
              <div className={styles.headerTitle}>
                <i className="fas fa-file-signature" aria-hidden="true"></i>
                <h1>Pricing</h1>
              </div>
            </div>
            <div className={styles.tabs}>
              <div className={styles.tabList}>
                {TAB_OPTIONS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ""} ${
                      tabsLocked && tab.id !== "info" ? styles.tabButtonDisabled : ""
                    }`}
                    onClick={() => {
                      if (tabsLocked && tab.id !== "info") return;
                      setActiveTab(tab.id);
                    }}
                    disabled={tabsLocked && tab.id !== "info"}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className={styles.orgSwitcher}>
                <label className={styles.label}>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => handleOrganizationChange(e.target.value)}
                  >
                    <option value="">Select organization</option>
                    {organizationOptions.map((org) => {
                      const label = org.legal_name || org.trade_name || org.name || "Unnamed organization";
                      return (
                        <option key={org.id} value={org.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            </div>
          </div>
          <p className={styles.subtitle}>
            Create billing agreements and cost analysis from prospect onboarding data.
          </p>
        </div>

        <div className={styles.layout}>
        {activeTab === "info" && (
        <>
        <div className={`${styles.fullWidth} ${styles.stepper}`}>
          {INFO_STEPS.map((step, idx) => {
            const isActive = idx === infoStep;
            const isDisabled = !infoSheetReady && idx > 0;
            return (
              <button
                key={step.id}
                type="button"
                className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ""} ${
                  isDisabled ? styles.stepItemDisabled : ""
                }`}
                onClick={() => {
                  if (isDisabled) return;
                  setInfoStep(idx);
                }}
                disabled={isDisabled}
              >
                <span className={styles.stepIndex}>{idx + 1}</span>
                <span className={styles.stepLabel}>{step.label}</span>
              </button>
            );
          })}
        </div>
        {infoStep !== 4 && (
        <div className={styles.column}>
          {infoStep === 0 && (
          <section className={`${styles.section} ${styles.sectionSpaced}`}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Client basics</h3>
              <span className={styles.sectionNote}>Company identity + primary contact.</span>
            </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Legal name
                <input
                  value={form.legalName}
                  onChange={(e) => updateField("legalName", e.target.value)}
                  placeholder="Company, Inc."
                />
              </label>
              <label className={styles.label}>
                DBA
                <input
                  value={form.dbaName}
                  onChange={(e) => updateField("dbaName", e.target.value)}
                  placeholder="Doing business as"
                />
              </label>
              <label className={styles.label}>
                FEIN
                <input
                  value={form.fein}
                  onChange={(e) => updateField("fein", e.target.value)}
                  placeholder="00-0000000"
                />
              </label>
              <label className={styles.label}>
                Current provider name
                <input
                  value={form.currentProviderName}
                  onChange={(e) => updateField("currentProviderName", e.target.value)}
                  placeholder="Current payroll provider"
                />
              </label>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Primary contact name
                <input
                  value={form.primaryContact.name}
                  onChange={(e) =>
                    updateField("primaryContact", { ...form.primaryContact, name: e.target.value })
                  }
                />
              </label>
              <label className={styles.label}>
                Title
                <input
                  value={form.primaryContact.title}
                  onChange={(e) =>
                    updateField("primaryContact", { ...form.primaryContact, title: e.target.value })
                  }
                />
              </label>
              <label className={styles.label}>
                Phone
                <input
                  value={form.primaryContact.phone}
                  onChange={(e) =>
                    updateField("primaryContact", { ...form.primaryContact, phone: e.target.value })
                  }
                />
              </label>
              <label className={styles.label}>
                Email
                <input
                  type="email"
                  value={form.primaryContact.email}
                  onChange={(e) =>
                    updateField("primaryContact", { ...form.primaryContact, email: e.target.value })
                  }
                />
              </label>
            </div>
          </section>
          )}

          {infoStep === 1 && (
          <section className={`${styles.section} ${styles.sectionSpaced}`}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Additional contacts</h3>
              <span className={styles.sectionNote}>Up to three additional contacts.</span>
            </div>
            <div className={styles.formGrid}>
              {form.additionalContacts.map((contact, index) => (
                <div key={index} className={styles.formGridTwo}>
                  <label className={styles.label}>
                    Contact {index + 2} name
                    <input
                      value={contact.name}
                      onChange={(e) => updateContact(index, { name: e.target.value })}
                    />
                  </label>
                  <label className={styles.label}>
                    Title
                    <input
                      value={contact.title}
                      onChange={(e) => updateContact(index, { title: e.target.value })}
                    />
                  </label>
                  <label className={styles.label}>
                    Phone
                    <input
                      value={contact.phone}
                      onChange={(e) => updateContact(index, { phone: e.target.value })}
                    />
                  </label>
                  <label className={styles.label}>
                    Email
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, { email: e.target.value })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
          )}

          {infoStep === 2 && (
          <section className={`${styles.section} ${styles.sectionSpaced}`}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Addresses</h3>
              <span className={styles.sectionNote}>Physical + shipping details.</span>
            </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Physical street
                <input
                  value={form.physicalAddress.street}
                  onChange={(e) =>
                    updateField("physicalAddress", { ...form.physicalAddress, street: e.target.value })
                  }
                />
              </label>
              <label className={styles.label}>
                City
                <input
                  value={form.physicalAddress.city}
                  onChange={(e) =>
                    updateField("physicalAddress", { ...form.physicalAddress, city: e.target.value })
                  }
                />
              </label>
              <label className={styles.label}>
                State
                <select
                  value={form.physicalAddress.state}
                  onChange={(e) =>
                    updateField("physicalAddress", { ...form.physicalAddress, state: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                ZIP
                <input
                  value={form.physicalAddress.zip}
                  onChange={(e) =>
                    updateField("physicalAddress", { ...form.physicalAddress, zip: e.target.value })
                  }
                />
              </label>
            </div>
            <div className={styles.divider}></div>
            <label className={`${styles.checkboxRow} ${styles.checkboxRowSpaced}`}>
              <input
                type="checkbox"
                checked={form.shippingSameAsPhysical}
                onChange={(e) => updateField("shippingSameAsPhysical", e.target.checked)}
              />
              Shipping address is the same as physical.
            </label>
            {!form.shippingSameAsPhysical && (
              <div className={styles.formGridTwo}>
                <label className={styles.label}>
                  Shipping street
                  <input
                    value={form.shippingAddress.street}
                    onChange={(e) =>
                      updateField("shippingAddress", { ...form.shippingAddress, street: e.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  City
                  <input
                    value={form.shippingAddress.city}
                    onChange={(e) =>
                      updateField("shippingAddress", { ...form.shippingAddress, city: e.target.value })
                    }
                  />
                </label>
                <label className={styles.label}>
                  State
                  <select
                    value={form.shippingAddress.state}
                    onChange={(e) =>
                      updateField("shippingAddress", { ...form.shippingAddress, state: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.label}>
                  ZIP
                  <input
                    value={form.shippingAddress.zip}
                    onChange={(e) =>
                      updateField("shippingAddress", { ...form.shippingAddress, zip: e.target.value })
                    }
                  />
                </label>
              </div>
            )}
          </section>
          )}

          {infoStep === 3 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Service configuration</h3>
            </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Service type
                <select
                  value={form.serviceType}
                  onChange={(e) => updateField("serviceType", e.target.value as AgreementFormValues["serviceType"])}
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Provider service name
                <input
                  value={form.serviceName}
                  onChange={(e) => updateField("serviceName", e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Activation date
                <input
                  type="date"
                  value={form.activationDate}
                  onChange={(e) => updateField("activationDate", e.target.value)}
                />
              </label>
            </div>
          </section>
          )}

          {infoStep === 3 && (
          <section className={`${styles.section} ${styles.sectionSpaced}`}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Payroll setup</h3>
            </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Payroll frequency
                <select
                  value={form.payrollFrequency}
                  onChange={(e) => updateField("payrollFrequency", e.target.value as AgreementFormValues["payrollFrequency"])}
                >
                  {PAYROLL_FREQUENCIES.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Pay periods per year
                <input
                  type="number"
                  value={form.payPeriodsPerYear}
                  onChange={(e) => updateField("payPeriodsPerYear", Number(e.target.value))}
                />
              </label>
            </div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.payPeriodsOverride}
                onChange={(e) => updateField("payPeriodsOverride", e.target.checked)}
              />
              Override derived pay periods
            </label>
            <div className={styles.formGridThree}>
              <label className={styles.label}>
                Payroll method
                <select
                  value={form.payrollMethod}
                  onChange={(e) => updateField("payrollMethod", e.target.value)}
                >
                  {PAYROLL_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Payroll process day
                <select
                  value={form.payrollProcessDay}
                  onChange={(e) => updateField("payrollProcessDay", e.target.value)}
                >
                  {PAYROLL_PROCESS_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Payment method
                <select
                  value={form.paymentMethod}
                  onChange={(e) => updateField("paymentMethod", e.target.value)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Pay period start
                <input
                  type="date"
                  value={form.payPeriodStart}
                  onChange={(e) => updateField("payPeriodStart", e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Pay period end
                <input
                  type="date"
                  value={form.payPeriodEnd}
                  onChange={(e) => updateField("payPeriodEnd", e.target.value)}
                />
              </label>
              <label className={styles.label}>
                First check date
                <input
                  type="date"
                  value={form.firstCheckDate}
                  onChange={(e) => updateField("firstCheckDate", e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Checks delivery
                <select
                  value={form.checksDeliveryMethod}
                  onChange={(e) => updateField("checksDeliveryMethod", e.target.value)}
                >
                  {CHECKS_DELIVERY.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Reports delivery
                <select
                  value={form.reportsDeliveryMethod}
                  onChange={(e) => updateField("reportsDeliveryMethod", e.target.value)}
                >
                  {REPORTS_DELIVERY.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          )}

        </div>
        )}
        {infoStep === 4 && (
        <div className={styles.column}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Work comp and payroll</h3>
            </div>
            <div className={styles.formGridTwo}>
                <label className={`${styles.label} ${styles.labelSpaced}`}>
                  Estimated number of employees
                  <input
                    type="number"
                    value={form.estimatedEmployees}
                    onChange={(e) => updateField("estimatedEmployees", Number(e.target.value))}
                  />
                </label>
              <label className={`${styles.label} ${styles.labelSpaced}`}>
                Total gross annual payroll
                <input
                  type="number"
                  value={form.grossPayrollOverrideEnabled ? form.grossPayrollOverride : wcPayrollTotal}
                  onChange={(e) => updateField("grossPayrollOverride", Number(e.target.value))}
                  disabled={!form.grossPayrollOverrideEnabled}
                />
              </label>
            </div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.grossPayrollOverrideEnabled}
                onChange={(e) => updateField("grossPayrollOverrideEnabled", e.target.checked)}
              />
              Override total gross payroll (otherwise summed from WC rows).
            </label>
            <div className={styles.divider}></div>
            <table className={styles.wcTable}>
              <thead>
                <tr>
                  <th>Class code</th>
                  <th>Description</th>
                  <th>Annual payroll</th>
                  <th>Current WC %</th>
                  <th>Galactic WC %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.workersCompClasses.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        value={row.code}
                        onChange={(e) => updateWorkersCompRow(row.id, { code: e.target.value })}
                        placeholder="8810"
                      />
                    </td>
                    <td>
                      <input
                        value={row.description}
                        onChange={(e) => updateWorkersCompRow(row.id, { description: e.target.value })}
                        placeholder="Clerical"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.annualPayroll}
                        onChange={(e) =>
                          updateWorkersCompRow(row.id, { annualPayroll: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.currentRate}
                        onChange={(e) =>
                          updateWorkersCompRow(row.id, { currentRate: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.galacticRate}
                        onChange={(e) =>
                          updateWorkersCompRow(row.id, { galacticRate: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <div className={styles.wcActions}>
                        {form.workersCompClasses.length > 1 && (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => removeWorkersCompRow(row.id)}
                          >
                            Remove
                          </button>
                        )}
                        {idx === form.workersCompClasses.length - 1 && (
                          <button type="button" className="ghost-button" onClick={addWorkersCompRow}>
                            Add row
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Rates and fees</h3>
            </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Admin fee basis
                <select
                  value={form.adminFeeBasis}
                  onChange={(e) => updateField("adminFeeBasis", e.target.value as AgreementFormValues["adminFeeBasis"])}
                >
                  <option value="per_payroll">Per payroll</option>
                  <option value="percent_of_gross">Percent of gross</option>
                </select>
              </label>
              <label className={styles.label}>
                Minimum admin fee per employee per month
                <input
                  type="number"
                  value={form.minimumAdminFeePerEmployeePerMonth}
                  onChange={(e) => updateField("minimumAdminFeePerEmployeePerMonth", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Current admin rate {form.adminFeeBasis === "percent_of_gross" ? "(%)" : "(per payroll)"}
                <input
                  type="number"
                  value={form.currentAdminRate}
                  onChange={(e) => updateField("currentAdminRate", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Galactic admin rate {form.adminFeeBasis === "percent_of_gross" ? "(%)" : "(per payroll)"}
                <input
                  type="number"
                  value={form.galacticAdminRate}
                  onChange={(e) => updateField("galacticAdminRate", Number(e.target.value))}
                />
              </label>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.formGridThree}>
              <label className={styles.label}>
                SUTA state
                <select
                  value={form.sutaState}
                  onChange={(e) => updateField("sutaState", e.target.value)}
                >
                  <option value="">Select</option>
                  {US_STATES.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                SUTA rate (%)
                <input
                  type="number"
                  value={form.sutaRate}
                  onChange={(e) => updateField("sutaRate", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                SUTA wage base
                <input
                  type="number"
                  value={form.sutaWageBase}
                  onChange={(e) => updateField("sutaWageBase", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                FUTA rate (%)
                <input
                  type="number"
                  value={form.futaRate}
                  onChange={(e) => updateField("futaRate", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                FUTA wage base
                <input
                  type="number"
                  value={form.futaWageBase}
                  onChange={(e) => updateField("futaWageBase", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Social Security rate (%)
                <input
                  type="number"
                  value={form.socialSecurityRate}
                  onChange={(e) => updateField("socialSecurityRate", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Social Security wage base
                <input
                  type="number"
                  value={form.socialSecurityWageBase}
                  onChange={(e) => updateField("socialSecurityWageBase", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Medicare rate (%)
                <input
                  type="number"
                  value={form.medicareRate}
                  onChange={(e) => updateField("medicareRate", Number(e.target.value))}
                />
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Benefits and credits</h3>
            </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Health insurance (per payroll)
                <input
                  type="number"
                  value={form.healthPerPayroll}
                  onChange={(e) => updateField("healthPerPayroll", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Dental insurance (per payroll)
                <input
                  type="number"
                  value={form.dentalPerPayroll}
                  onChange={(e) => updateField("dentalPerPayroll", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Life/Disability (per payroll)
                <input
                  type="number"
                  value={form.lifeDisabilityPerPayroll}
                  onChange={(e) => updateField("lifeDisabilityPerPayroll", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Credit for advance (per payroll)
                <input
                  type="number"
                  value={form.creditForAdvancePerPayroll}
                  onChange={(e) => updateField("creditForAdvancePerPayroll", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Deductions credit (per payroll)
                <input
                  type="number"
                  value={form.deductionsCreditPerPayroll}
                  onChange={(e) => updateField("deductionsCreditPerPayroll", Number(e.target.value))}
                />
              </label>
            </div>
          </section>

              <section className={`${styles.section} ${styles.sectionSpaced}`}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Agreement meta</h3>
                </div>
            <div className={styles.formGridTwo}>
              <label className={styles.label}>
                Agreement date
                <input
                  type="date"
                  value={form.agreementDate}
                  onChange={(e) => updateField("agreementDate", e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Initial term (months)
                <input
                  type="number"
                  value={form.initialTermMonths}
                  onChange={(e) => updateField("initialTermMonths", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Conversion fee
                <input
                  type="number"
                  value={form.conversionFee}
                  onChange={(e) => updateField("conversionFee", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Workers comp deposit
                <input
                  type="number"
                  value={form.workersCompDeposit}
                  onChange={(e) => updateField("workersCompDeposit", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Time &amp; attendance (per EE / pay period)
                <input
                  type="number"
                  value={form.timeAndAttendancePerEmployee}
                  onChange={(e) => updateField("timeAndAttendancePerEmployee", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Time &amp; attendance setup fee
                <input
                  type="number"
                  value={form.timeAndAttendanceSetupFee}
                  onChange={(e) => updateField("timeAndAttendanceSetupFee", Number(e.target.value))}
                />
              </label>
              <label className={styles.label}>
                Client signatory name
                <input
                  value={form.clientSignatoryName}
                  onChange={(e) => updateField("clientSignatoryName", e.target.value)}
                />
              </label>
              <label className={styles.label}>
                Client signatory title
                <input
                  value={form.clientSignatoryTitle}
                  onChange={(e) => updateField("clientSignatoryTitle", e.target.value)}
                />
              </label>
            </div>
          </section>
        </div>
        )}

        <div className={`${styles.fullWidth} ${styles.stepNav}`}>
          <button
            type="button"
            className={styles.tabButton}
            onClick={goToPrevInfoStep}
            disabled={isFirstInfoStep}
          >
            Back
          </button>
          <div className={styles.stepMeta}>
            Step {infoStep + 1} of {totalInfoSteps}
            {infoSheetError && <span className={styles.stepError}> · {infoSheetError}</span>}
            {infoSheetLoading && <span className={styles.stepHint}> · Loading...</span>}
            {infoSheetCompleted && <span className={styles.stepHint}> · Info Sheet complete</span>}
          </div>
            <div className={styles.stepActions}>
              <button
                type="button"
                className={styles.tabButton}
                onClick={() => saveInfoSheet()}
                disabled={!infoSheetReady || infoSheetSaving}
              >
                {infoSheetSaving ? "Saving..." : "Save Info Sheet"}
              </button>
            <button
              type="button"
              className={styles.tabButton}
              onClick={() => {
                if (infoStep === 4) {
                  void saveInfoSheet(true);
                  return;
                }
                goToNextInfoStep();
              }}
              disabled={!infoSheetReady || (infoStep === 4 ? !workCompComplete : isLastInfoStep)}
            >
              {infoStep === 4 ? "Complete" : "Next"}
            </button>
          </div>
        </div>
        </>
        )}

        {activeTab === "billing" && (
        <div className={styles.column}>
          <section className={styles.previewCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.previewTitle}>Agreement for Professional Employment Services</h3>
              <span className={styles.previewMeta}>{generatedPreviewDate}</span>
            </div>
            <div className={styles.previewBody}>
              <div>
                <strong>Client:</strong> {form.legalName || "Client name"}{" "}
                {form.dbaName ? `dba ${form.dbaName}` : ""}
              </div>
              <div className={styles.previewMeta}>
                {form.physicalAddress.street || "Client street"} | {form.physicalAddress.city || "City"},{" "}
                {form.physicalAddress.state || "ST"} {form.physicalAddress.zip || "ZIP"}
              </div>
              <p>
                Client does hereby agree to follow the instructions set forth in the CLIENT SERVICE
                AGREEMENT and pay fees as prescribed below.
              </p>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Per payroll</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['gross', 'Gross Payroll', costAnalysis.proposed.grossPerPayroll],
                    ['adminFee', 'Administrative Fee', costAnalysis.proposed.adminFeePerPayroll],
                  ] as [string, string, number][]).map(([key, label, calc]) => (
                    <tr key={key}>
                      <td>{label}</td>
                      <td><div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal(key, calc)} onChange={(e) => bSet(key, e.target.value)} onFocus={() => setFocusedBillingKey(key)} onBlur={() => setFocusedBillingKey(null)} /></div></td>
                    </tr>
                  ))}
                  <tr>
                    <td>Employer Taxes (FICA)</td>
                    <td>
                      <div className={styles.billingCell}>
                        <input
                          type="text"
                          value={rateInputValue((form.socialSecurityRate || 0) + (form.medicareRate || 0))}
                          onChange={(e) => {
                            const nextTotal = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                            updateField("socialSecurityRate", Math.max(0, Number((nextTotal - (form.medicareRate || 0)).toFixed(2))));
                          }}
                        />
                        <span>%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>FUTA</td>
                    <td>
                      <div className={styles.billingCell}>
                        <input
                          type="text"
                          value={rateInputValue(form.futaRate || 0)}
                          onChange={(e) => updateField("futaRate", parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                        />
                        <span>%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>SUTA</td>
                    <td>
                      <div className={styles.billingCell}>
                        <input
                          type="text"
                          value={rateInputValue(form.sutaRate || 0)}
                          onChange={(e) => updateField("sutaRate", parseFloat(e.target.value.replace(/,/g, '')) || 0)}
                        />
                        <span>%</span>
                      </div>
                    </td>
                  </tr>
                  {costAnalysis.proposed.workersCompLines.map((line) => {
                    const wcKey = `wc_${line.code}_${line.description}`;
                    return (
                      <tr key={wcKey}>
                        <td>Workers' Comp {line.code} {line.description}</td>
                        <td><div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal(wcKey, line.perPayroll)} onChange={(e) => bSet(wcKey, e.target.value)} onFocus={() => setFocusedBillingKey(wcKey)} onBlur={() => setFocusedBillingKey(null)} /></div></td>
                      </tr>
                    );
                  })}
                  {([
                    ['health', 'Health Insurance', form.healthPerPayroll],
                    ['dental', 'Dental Insurance', form.dentalPerPayroll],
                    ['life', 'Life/Disability Insurance', form.lifeDisabilityPerPayroll],
                  ] as [string, string, number][]).map(([key, label, calc]) => (
                    <tr key={key}>
                      <td>{label}</td>
                      <td><div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal(key, calc)} onChange={(e) => bSet(key, e.target.value)} onFocus={() => setFocusedBillingKey(key)} onBlur={() => setFocusedBillingKey(null)} /></div></td>
                    </tr>
                  ))}
                  <tr>
                    <td>Credits / Deductions</td>
                    <td><div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal('credits', -(form.creditForAdvancePerPayroll + form.deductionsCreditPerPayroll))} onChange={(e) => bSet('credits', String(-(Math.abs(parseFloat(e.target.value.replace(/,/g, '')) || 0))))} onFocus={() => setFocusedBillingKey('credits')} onBlur={() => setFocusedBillingKey(null)} /></div></td>
                  </tr>
                </tbody>
              </table>
              <div className={styles.previewTotals}>
                <span>
                  <span>Total funds per payroll</span>
                  <div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal('totalPerPayroll', bTotalPerPayrollCalc)} onChange={(e) => bSet('totalPerPayroll', e.target.value)} onFocus={() => setFocusedBillingKey('totalPerPayroll')} onBlur={() => setFocusedBillingKey(null)} /></div>
                </span>
                <span>
                  <span>Conversion fee</span>
                  <div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal('conversion', form.conversionFee)} onChange={(e) => bSet('conversion', e.target.value)} onFocus={() => setFocusedBillingKey('conversion')} onBlur={() => setFocusedBillingKey(null)} /></div>
                </span>
                <span>
                  <span>Workers comp deposit</span>
                  <div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal('wcDeposit', form.workersCompDeposit)} onChange={(e) => bSet('wcDeposit', e.target.value)} onFocus={() => setFocusedBillingKey('wcDeposit')} onBlur={() => setFocusedBillingKey(null)} /></div>
                </span>
                <span>
                  <span>Total fees on first invoice</span>
                  <div className={styles.billingCell}><span>$</span><input type="text" value={bInputVal('firstInvoiceTotal', bFirstInvoiceCalc)} onChange={(e) => bSet('firstInvoiceTotal', e.target.value)} onFocus={() => setFocusedBillingKey('firstInvoiceTotal')} onBlur={() => setFocusedBillingKey(null)} /></div>
                </span>
              </div>
              <div>
                <strong>Initial term:</strong> {form.initialTermMonths} months -{" "}
                <strong>Pay frequency:</strong> {form.payrollFrequency} -{" "}
                <strong>First check date:</strong> {form.firstCheckDate || "-"}
              </div>
              <div className={styles.signatureGrid}>
                <div className={styles.signatureBlock}>
                  <div><strong>Client</strong></div>
                  <div>Name</div>
                  <div>Title</div>
                  <div>Date</div>
                </div>
                <div className={styles.signatureBlock}>
                  <div><strong>Provider</strong></div>
                  <div>{PROVIDER_ADDRESS.name}</div>
                  <div>{PROVIDER_ADDRESS.businessLine}</div>
                  <div>
                    {PROVIDER_ADDRESS.street}, {PROVIDER_ADDRESS.city}, {PROVIDER_ADDRESS.state}{" "}
                    {PROVIDER_ADDRESS.zip}
                  </div>
                  <div>{PROVIDER_ADDRESS.phone}</div>
                  <div>Date: {generatedPreviewDate}</div>
                </div>
              </div>
              <div className={styles.tabActions}>
                <button
                  type="button"
                  className={styles.tabButton}
                  onClick={() => void exportPdf("billing-agreement")}
                  disabled={pdfExportPending !== null}
                >
                  {pdfExportPending === "billing-agreement" ? "Generating PDF..." : "Generate PDF"}
                </button>
              </div>
              {pdfExportStatus ? (
                <div className={pdfExportStatus.type === "error" ? styles.stepError : styles.stepHint}>
                  {pdfExportStatus.message}
                </div>
              ) : null}
              <section className={`${styles.section} ${styles.sectionSpaced}`}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Send for e-signature</h3>
                </div>
                <div className={styles.formGridTwo}>
                  <label className={styles.label}>
                    Recipient name
                    <input
                      value={signatureRecipientName}
                      onChange={(e) => setSignatureRecipientName(e.target.value)}
                      placeholder="Full name"
                    />
                  </label>
                  <label className={styles.label}>
                    Recipient email
                    <input
                      type="email"
                      value={signatureRecipientEmail}
                      onChange={(e) => setSignatureRecipientEmail(e.target.value)}
                      placeholder="name@company.com"
                    />
                  </label>
                </div>
                <div className={styles.tabActions}>
                  <button
                    type="button"
                    className={styles.tabButton}
                    onClick={sendSignatureRequest}
                    disabled={signatureSending}
                  >
                    {signatureSending ? "Sending..." : "Send for signature"}
                  </button>
                  {signatureLink ? (
                    <button
                      type="button"
                      className={styles.tabButton}
                      onClick={() => {
                        navigator.clipboard.writeText(signatureLink);
                      }}
                    >
                      Copy link
                    </button>
                  ) : null}
                </div>
                {signatureStatus ? (
                  <div className={styles.stepMeta} style={{ marginTop: 8 }}>
                    <span className={signatureStatus.type === "error" ? styles.stepError : styles.stepHint}>
                      {signatureStatus.message}
                    </span>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        </div>
        )}

        {activeTab === "analysis" && (
        <div className={styles.column}>
          <section className={styles.previewCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.previewTitle}>Cost analysis / proposed costs</h3>
                <span className={styles.previewMeta}>
                  {calculations.payPeriodsPerYear} pay periods - {calculations.employeeCount} employees
                </span>
              </div>
              <div className={styles.tabActions}>
                <button
                  type="button"
                  className={styles.tabButton}
                  onClick={() => void exportPdf("cost-analysis")}
                  disabled={pdfExportPending !== null}
                >
                  {pdfExportPending === "cost-analysis" ? "Generating PDF..." : "Print PDF"}
                </button>
              </div>
            </div>
            {pdfExportStatus ? (
              <div className={pdfExportStatus.type === "error" ? styles.stepError : styles.stepHint}>
                {pdfExportStatus.message}
              </div>
            ) : null}
            <div className={styles.costGrid}>
              <div className={styles.costCard}>
                <input
                  type="text"
                  className={styles.costCardTitleInput}
                  value={form.currentProviderName}
                  onChange={(e) => handleCurrentProviderNameChange(e.target.value)}
                  placeholder="Current payroll company"
                />
                <div className={styles.costValue}>{formatCurrency(aCurTotal)}</div>
                <div className={styles.costList}>
                  {([
                    ['cur_annual',   'Annual total',   costAnalysis.current.totalAnnual],
                    ['cur_admin',    'Admin fee',      costAnalysis.current.adminFeePerPayroll],
                    ['cur_taxes',    'Employer taxes', costAnalysis.current.taxes.totalPerPayroll],
                    ['cur_wc',       'Workers comp',   costAnalysis.current.workersCompPerPayroll],
                    ['cur_benefits', 'Benefits',       costAnalysis.current.benefitsPerPayroll],
                  ] as [string, string, number][]).map(([key, label, calc]) => (
                    <span key={key}>
                      <span>{label}</span>
                      <div className={styles.analysisCell}><span>$</span><input type="text" value={aInputVal(key, calc)} onChange={(e) => aSet(key, e.target.value)} onFocus={() => setFocusedAnalysisKey(key)} onBlur={() => setFocusedAnalysisKey(null)} /></div>
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.costCard}>
                <h4>Galactic Inc proposal</h4>
                <div className={styles.costValue}>{formatCurrency(aProTotal)}</div>
                <div className={styles.costList}>
                  {([
                    ['pro_annual',   'Annual total',   bTotalPerPayroll * (calculations.payPeriodsPerYear || 26)],
                    ['pro_admin',    'Admin fee',      bAdminFee],
                    ['pro_taxes',    'Employer taxes', proTaxes],
                    ['pro_wc',       'Workers comp',   bWcTotal],
                    ['pro_benefits', 'Benefits',       bHealth + bDental + bLife],
                  ] as [string, string, number][]).map(([key, label, calc]) => (
                    <span key={key}>
                      <span>{label}</span>
                      <div className={styles.analysisCell}><span>$</span><input type="text" value={aInputVal(key, calc)} onChange={(e) => aSet(key, e.target.value)} onFocus={() => setFocusedAnalysisKey(key)} onBlur={() => setFocusedAnalysisKey(null)} /></div>
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.costCard}>
                <h4>Savings vs current</h4>
                <div className={styles.costValue}>{formatCurrency(aSavingsPerPayroll)}</div>
                <div className={styles.costList}>
                  <span>
                    <span>Annual savings</span>
                    <span>{formatCurrency(aSavingsAnnual)}</span>
                  </span>
                  <span>
                    <span>Gross payroll</span>
                    <span>{formatCurrency(bGross)}</span>
                  </span>
                  <span>
                    <span>Pay periods</span>
                    <span>{calculations.payPeriodsPerYear}</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
        )}
        </div>
      </div>
      {showOrgGate && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h2>Select organization</h2>
            <p className={styles.muted}>Choose a prospect to load or start an info sheet.</p>
            <label className={styles.label}>
              Organization name
              <select
                value={selectedOrgId}
                onChange={(e) => handleOrganizationChange(e.target.value)}
              >
                <option value="">Select organization</option>
                {organizationOptions.map((org) => {
                  const label = org.legal_name || org.trade_name || org.name || "Unnamed organization";
                  return (
                    <option key={org.id} value={org.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
