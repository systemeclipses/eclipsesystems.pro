export type CommissionRecord = {
  id: string;
  clientName: string;
  closeDate: string;
  annualAdminFees: number;
  annualRevenue: number;
  annualCommission: number;
  totalEmployees: number | null;
  wcProfit?: number | null;
  wcMarginPct?: number | null;
  annualAddons?: number | null;
  salesRepId?: string | null;
  salesRepName?: string | null;
};

export type ProspectRecord = {
  id: string;
  name: string;
  status: string;
  estimatedRevenue: number;
  createdAt: string;
  salesRepId?: string | null;
  salesRepName?: string | null;
};

export type LeadRecord = {
  id: string;
  name: string;
  source: string;
  createdAt: string;
  salesRepId?: string | null;
  salesRepName?: string | null;
};
