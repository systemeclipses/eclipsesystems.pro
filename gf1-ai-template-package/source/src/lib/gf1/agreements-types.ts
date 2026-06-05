export type AgreementServiceType = 'PEO' | 'ASO' | 'Payroll';
export type AgreementPayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
export type AgreementAdminFeeBasis = 'per_payroll' | 'percent_of_gross';

export type AgreementContact = {
  name: string;
  title: string;
  phone: string;
  email: string;
};

export type AgreementAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type WorkersCompClass = {
  id: string;
  code: string;
  description: string;
  annualPayroll: number;
  currentRate: number;
  galacticRate: number;
};

export type AgreementFormValues = {
  legalName: string;
  dbaName: string;
  fein: string;
  primaryContact: AgreementContact;
  additionalContacts: AgreementContact[];
  physicalAddress: AgreementAddress;
  shippingAddress: AgreementAddress;
  shippingSameAsPhysical: boolean;
  serviceType: AgreementServiceType;
  serviceName: string;
  activationDate: string;
  payrollFrequency: AgreementPayFrequency;
  payPeriodsPerYear: number;
  payPeriodsOverride: boolean;
  payrollMethod: string;
  payrollProcessDay: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  firstCheckDate: string;
  checksDeliveryMethod: string;
  reportsDeliveryMethod: string;
  paymentMethod: string;
  estimatedEmployees: number;
  workersCompClasses: WorkersCompClass[];
  grossPayrollOverrideEnabled: boolean;
  grossPayrollOverride: number;
  adminFeeBasis: AgreementAdminFeeBasis;
  currentAdminRate: number;
  galacticAdminRate: number;
  minimumAdminFeePerEmployeePerMonth: number;
  healthPerPayroll: number;
  dentalPerPayroll: number;
  lifeDisabilityPerPayroll: number;
  creditForAdvancePerPayroll: number;
  deductionsCreditPerPayroll: number;
  conversionFee: number;
  workersCompDeposit: number;
  timeAndAttendancePerEmployee: number;
  timeAndAttendanceSetupFee: number;
  initialTermMonths: number;
  agreementDate: string;
  clientSignatoryName: string;
  clientSignatoryTitle: string;
  socialSecurityRate: number;
  medicareRate: number;
  futaRate: number;
  sutaRate: number;
  socialSecurityWageBase: number;
  futaWageBase: number;
  sutaWageBase: number;
  currentProviderName: string;
  sutaState: string;
};

export type AgreementTaxSummary = {
  socialSecurityAnnual: number;
  socialSecurityPerPayroll: number;
  medicareAnnual: number;
  medicarePerPayroll: number;
  futaAnnual: number;
  futaPerPayroll: number;
  sutaAnnual: number;
  sutaPerPayroll: number;
  totalAnnual: number;
  totalPerPayroll: number;
};

export type AgreementWorkersCompLine = {
  code: string;
  description: string;
  annual: number;
  perPayroll: number;
};

export type AgreementScenarioResult = {
  grossAnnual: number;
  grossPerPayroll: number;
  taxes: AgreementTaxSummary;
  adminFeeAnnual: number;
  adminFeePerPayroll: number;
  workersCompAnnual: number;
  workersCompPerPayroll: number;
  workersCompLines: AgreementWorkersCompLine[];
  benefitsPerPayroll: number;
  benefitsAnnual: number;
  creditsPerPayroll: number;
  totalPerPayroll: number;
  totalAnnual: number;
};

export type CostAnalysisResult = {
  current: AgreementScenarioResult;
  proposed: AgreementScenarioResult;
  savingsPerPayroll: number;
  savingsAnnual: number;
};

export type AgreementCalculationResult = {
  payPeriodsPerYear: number;
  employeeCount: number;
  costAnalysis: CostAnalysisResult;
  proposedGrossPayroll: number;
  firstInvoiceTotal: number;
};
