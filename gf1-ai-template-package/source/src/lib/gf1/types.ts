export type ProfileRole = 'admin' | 'staff' | 'sales' | 'sales_manager' | 'letter_generator' | 'implementations';
export type Gf1SalesRole = Extract<ProfileRole, 'sales' | 'sales_manager' | 'admin'>;

export type Gf1OrgStatus = 'lead' | 'prospect' | 'client';
export type Gf1PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'other';
export type Gf1BillingModel = 'percent_of_gross' | 'flat_per_employee';
export type Gf1ProposalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'sent_to_prospect';
export type Gf1ProposalDecision = 'pending' | 'approved' | 'rejected';
export type Gf1FeeBasis = 'PEPC' | 'PEPM';
export type Gf1AddonPricingModel = 'flat_monthly' | 'per_employee_per_month' | 'per_employee_per_check';

export type Gf1ProposalAddon = {
  id: string;
  label: string;
  enabled: boolean;
  pricing_model: Gf1AddonPricingModel;
  amount_cents: number | null;
};

export type Gf1OrganizationProfile = {
  id: string;
  created_at: string;
  updated_at: string;
  status: Gf1OrgStatus;
  legal_name: string;
  dba_name: string | null;
  website: string | null;
  logo_url: string | null;
  primary_contact_id: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_county: string | null;
  description_of_operations: string | null;
  naics_code: string | null;
  years_in_business: number | null;
  company_type: string | null;
  owners_json: Record<string, unknown> | null;
  bankruptcy_flag: boolean | null;
  lawsuits_flag: boolean | null;
  controlled_group_flag: boolean | null;
  fein: string | null;
  additional_feins: string[] | null;
  multi_state_flag: boolean | null;
  local_taxes_flag: boolean | null;
  total_employees: number | null;
  full_time_employees: number | null;
  part_time_employees: number | null;
  commission_only_employees: number | null;
  pay_frequency: Gf1PayFrequency | null;
  pay_frequency_other: string | null;
  pay_schedule_json: Record<string, unknown> | null;
  first_check_date: string | null;
  first_period_start: string | null;
  first_period_end: string | null;
  regular_commissions_or_bonuses_flag: boolean | null;
  payroll_submission_method: 'portal' | 'email' | null;
  current_payroll_provider: string | null;
  has_remote_employees_flag: boolean | null;
  remote_states: string[] | null;
  has_1099s_flag: boolean | null;
  employees_live_vs_work_state_flag: boolean | null;
  offers_health_flag: boolean | null;
  offers_dental_flag: boolean | null;
  offers_vision_flag: boolean | null;
  other_benefit_plans: string | null;
  wc_codes_json: Record<string, unknown> | null;
  wc_codes_annual_payroll_json: Record<string, unknown> | null;
  wc_states_json: Record<string, unknown> | null;
  pto_tracking_needed_flag: boolean | null;
  has_retirement_plan_flag: boolean | null;
  wants_galactic_retirement_flag: boolean | null;
  gl_import_needed_flag: boolean | null;
  large_employer_aca_flag: boolean | null;
  labor_posters_needed_flag: boolean | null;
  timekeeping_needed_flag: boolean | null;
  background_checks_needed_flag: boolean | null;
  drug_screenings_needed_flag: boolean | null;
  wants_wotc_flag: boolean | null;
  ats_needed_flag: boolean | null;
  additional_reporting_needed_flag: boolean | null;
  additional_details: string | null;
  created_by: string | null;
  commission_percent?: number | null;
  assigned_sales_rep_id?: string | null;
  implementation_owner_id?: string | null;
  implementation_owner_name?: string | null;
};

export type Gf1ContactRecord = {
  id: string;
  organization_id: string;
  full_name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type Gf1Worksite = {
  id: string;
  organization_id: string;
  name?: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  county: string | null;
  created_at: string;
  updated_at: string;
};

export type Gf1IntakeToken = {
  id: string;
  organization_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by: string | null;
};

export type Gf1ProposalRecord = {
  id: string;
  organization_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  status: Gf1ProposalStatus;
  base_price_per_employee_per_year: number | null;
  minimum_price_per_employee_per_year: number | null;
  annual_admin_target: number | null;
  billing_model: Gf1BillingModel | null;
  percent_of_gross: number | null;
  flat_admin_fee_per_employee_per_period: number | null;
  modeled_employee_count: number | null;
  notes_for_internal: string | null;
  notes_for_prospect: string | null;
  services_json: Record<string, unknown> | null;
  pdf_url: string | null;
  wc_cost_cents: number | null;
  wc_selling_price_cents: number | null;
  admin_fee_enabled: boolean | null;
  admin_fee_rate_cents: number | null;
  admin_fee_basis: Gf1FeeBasis | null;
  learning_management_system_fee_enabled?: boolean | null;
  learning_management_system_fee_rate_cents?: number | null;
  learning_management_system_fee_basis?: Gf1FeeBasis | null;
  timekeeping_fee_enabled: boolean | null;
  timekeeping_fee_rate_cents: number | null;
  timekeeping_fee_basis: Gf1FeeBasis | null;
  checks_per_month: number | null;
  addons_json: Gf1ProposalAddon[] | null;
  admin_fee_percent?: number | null;
  payroll_volume?: number | null;
  setup_fee_total?: number | null;
  deposit_total?: number | null;
};

export type Gf1ProposalApprovalRecord = {
  id: string;
  proposal_id: string;
  reviewer_id: string;
  created_at: string;
  decision: Gf1ProposalDecision;
  decision_at: string | null;
  comments: string | null;
};

export type PipelineStage = 'lead' | 'prospect' | 'client';

export type BaseRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type Gf1Organization = BaseRecord & {
  name: string;
  slug: string | null;
  domain: string | null;
  logo_url: string | null;
  legal_name?: string | null;
  dba_name?: string | null;
  trade_name?: string | null;
  sales_rep_name?: string | null;
  annual_commission?: number | null;
  annual_admin_fees?: number | null;
  annual_other_fees?: number | null;
  annual_revenue?: number | null;
  commission_percent?: number | null;
  assigned_sales_rep_id?: string | null;
  implementation_owner_id?: string | null;
  implementation_owner_name?: string | null;
  total_employees?: number | null;
  industry?: string | null;
  phone: string | null;
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  secondary_contact_name?: string | null;
  secondary_contact_email?: string | null;
  billing_contact_name?: string | null;
  billing_contact_email?: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  status: string | null;
  client_won_at?: string | null;
  go_live_date?: string | null;
  notes?: string | null;
};

export type Gf1Logo = BaseRecord & {
  organization_id: string;
  storage_path: string;
  public_url: string;
  uploaded_by: string;
};

export type Gf1Contact = BaseRecord & {
  organization_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
};

export type Gf1Lead = BaseRecord & {
  organization_id: string;
  owner_id: string | null;
  assigned_rep_id: string | null;
  stage: PipelineStage;
  status: 'open' | 'working' | 'closed_won' | 'closed_lost';
  source: string | null;
  est_value: number | null;
  next_action_at: string | null;
  notes: string | null;
  prospect_id: string | null;
};

export type Gf1Prospect = BaseRecord & {
  organization_id: string;
  lead_id: string;
  client_id: string | null;
  owner_id: string | null;
  assigned_rep_id: string | null;
  stage: PipelineStage;
  probability: number | null;
  target_close_date: string | null;
  notes: string | null;
};

export type Gf1Client = BaseRecord & {
  organization_id: string;
  prospect_id: string | null;
  lead_id: string | null;
  owner_id: string | null;
  assigned_rep_id: string | null;
  go_live_date: string | null;
  arr: number | null;
  status: 'active' | 'at_risk' | 'churned';
};

export type Gf1PeoService = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_optional: boolean;
  default_config: Record<string, unknown> | null;
  sort_order: number | null;
};

export type Gf1ProspectService = BaseRecord & {
  prospect_id: string;
  service_id: string;
  selected: boolean;
  config_json: Record<string, unknown> | null;
  locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
};

export type Gf1Agreement = BaseRecord & {
  prospect_id: string;
  organization_id: string;
  workers_comp_included: boolean;
  csa_json: Record<string, unknown> | null;
  billing_json: Record<string, unknown> | null;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  submitted_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
};

export type Gf1Proposal = BaseRecord & {
  prospect_id: string | null;
  organization_id: string;
  services_snapshot: Record<string, unknown>;
  pricing_json: Record<string, unknown> | null;
  status: 'draft' | 'awaiting_approval' | 'approved' | 'submitted' | 'sent_to_client' | 'accepted' | 'rejected';
  approval_status: ProposalApprovalStatus;
  approval_required: boolean;
  approval_requested_by: string | null;
  approval_requested_at: string | null;
  approval_decided_by: string | null;
  approval_decided_at: string | null;
  approval_notes: string | null;
  proposal_request_id: string | null;
  prospect_intake_id: string | null;
  admin_fee_percent: number | null;
  commission_percent: number | null;
  payroll_volume: number | null;
  estimated_commission: number | null;
  setup_fee_total: number | null;
  deposit_total: number | null;
  pricing_summary: Record<string, unknown> | null;
  competitor_pricing: Record<string, unknown> | null;
  submitted_by: string | null;
  sent_to_client_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  wc_cost_cents?: number | null;
  wc_selling_price_cents?: number | null;
  admin_fee_enabled?: boolean | null;
  admin_fee_rate_cents?: number | null;
  admin_fee_basis?: Gf1FeeBasis | null;
  learning_management_system_fee_enabled?: boolean | null;
  learning_management_system_fee_rate_cents?: number | null;
  learning_management_system_fee_basis?: Gf1FeeBasis | null;
  timekeeping_fee_enabled?: boolean | null;
  timekeeping_fee_rate_cents?: number | null;
  timekeeping_fee_basis?: Gf1FeeBasis | null;
  checks_per_month?: number | null;
  addons_json?: Gf1ProposalAddon[] | null;
};

export type Gf1WinLossRecord = BaseRecord & {
  organization_id: string;
  prospect_id: string | null;
  result: 'won' | 'lost';
  primary_reason: string;
  detail_reason: string | null;
  competitor: string | null;
  deal_size: number | null;
  created_by: string;
};

export type Gf1UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
};

export type AssignableUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: ProfileRole;
};

export type Gf1ImplementationChecklistStep = {
  step_key: string;
  completed_at: string | null;
  completed_by: string | null;
};

export type PipelineCard = {
  id: string;
  organization: Pick<Gf1Organization, 'id' | 'name' | 'logo_url' | 'primary_contact_name' | 'primary_contact_email' | 'primary_contact_phone'>;
  primary_contact: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  assigned_rep: string | null;
  stage: PipelineStage;
  href: string;
};

export type ProposalApprovalStatus = 'draft' | 'awaiting_approval' | 'approved' | 'rejected';

export type ProposalAdjustmentType = 'setup' | 'conversion' | 'deposit' | 'other';

export type ProposalAdjustmentCalc = 'flat' | 'percent_of_payroll' | 'percent_of_admin_fee';

export type Gf1ProposalAdjustment = BaseRecord & {
  proposal_id: string;
  label: string;
  amount: number;
  adjustment_type: ProposalAdjustmentType;
  calculation_method: ProposalAdjustmentCalc;
  percentage: number | null;
  sort_order: number | null;
};

export type Gf1ProposalWcCode = BaseRecord & {
  proposal_id: string;
  code: string;
  description: string | null;
  est_annual_payroll: number | null;
  carrier_rate: number | null;
  notes: string | null;
  sort_order: number | null;
};

export type PartialGf1Organization = Partial<Gf1Organization> & {
  dba_name?: string;
  trade_name?: string;
  legal_name?: string;
};

export type InventoryCategory =
  | 'computers'
  | 'monitors'
  | 'docking_stations'
  | 'attachable_monitors'
  | 'keyboards_mice'
  | 'phones'
  | 'chairs'
  | 'webcams'
  | 'printers_scanners';

export type InventoryStatus = 'in_use' | 'available' | 'repair' | 'retiring' | 'expired';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  status: InventoryStatus;
  purchase_date?: string | null;
  icon?: string;
  description?: string;
  location?: string;
  location_type?: 'home' | 'office' | null;
  department?: string;
  owner?: string;
  assigned_to?: string | null;
  notes?: string[];
}

export interface Gf1RenewalItem {
  id: string;
  company_name: string;
  renewal_due_date: string;
  is_completed: boolean;
  created_by?: string | null;
  salesperson_name?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
