import type {
  AgreementCalculationResult,
  AgreementFormValues,
  AgreementScenarioResult,
  AgreementTaxSummary,
  AgreementWorkersCompLine,
} from './agreements-types';

const PAY_PERIODS_BY_FREQUENCY: Record<AgreementFormValues['payrollFrequency'], number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

const DEFAULT_RATES = {
  socialSecurityRate: 6.2,
  medicareRate: 1.45,
  futaRate: 0.6,
  sutaRate: 0.95,
};

const DEFAULT_WAGE_BASES = {
  socialSecurityWageBase: 168600,
  futaWageBase: 7000,
  sutaWageBase: 8000,
};

const clampNumber = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const calcTaxes = ({
  annualGross,
  employees,
  payPeriods,
  socialSecurityRate,
  medicareRate,
  futaRate,
  sutaRate,
  socialSecurityWageBase,
  futaWageBase,
  sutaWageBase,
}: {
  annualGross: number;
  employees: number;
  payPeriods: number;
  socialSecurityRate: number;
  medicareRate: number;
  futaRate: number;
  sutaRate: number;
  socialSecurityWageBase: number;
  futaWageBase: number;
  sutaWageBase: number;
}): AgreementTaxSummary => {
  const employeeCount = clampNumber(employees);
  const cappedSocialSecurityWages = Math.min(annualGross, employeeCount * socialSecurityWageBase);
  const cappedFutaWages = Math.min(annualGross, employeeCount * futaWageBase);
  const cappedSutaWages = Math.min(annualGross, employeeCount * sutaWageBase);

  const socialSecurityAnnual = clampNumber(cappedSocialSecurityWages * (socialSecurityRate / 100));
  const medicareAnnual = clampNumber(annualGross * (medicareRate / 100));
  const futaAnnual = clampNumber(cappedFutaWages * (futaRate / 100));
  const sutaAnnual = clampNumber(cappedSutaWages * (sutaRate / 100));

  const totalAnnual = socialSecurityAnnual + medicareAnnual + futaAnnual + sutaAnnual;
  const safePayPeriods = Math.max(1, payPeriods);

  return {
    socialSecurityAnnual,
    socialSecurityPerPayroll: socialSecurityAnnual / safePayPeriods,
    medicareAnnual,
    medicarePerPayroll: medicareAnnual / safePayPeriods,
    futaAnnual,
    futaPerPayroll: futaAnnual / safePayPeriods,
    sutaAnnual,
    sutaPerPayroll: sutaAnnual / safePayPeriods,
    totalAnnual,
    totalPerPayroll: totalAnnual / safePayPeriods,
  };
};

const calcWorkersComp = (
  rows: AgreementFormValues['workersCompClasses'],
  rateKey: 'currentRate' | 'galacticRate',
  payPeriods: number
): { totalAnnual: number; totalPerPayroll: number; lines: AgreementWorkersCompLine[] } => {
  const safePayPeriods = Math.max(1, payPeriods);
  const lines = rows.map((row) => {
    const annual = clampNumber(row.annualPayroll) * (clampNumber(row[rateKey]) / 100);
    return {
      code: row.code,
      description: row.description,
      annual,
      perPayroll: annual / safePayPeriods,
    };
  });

  const totalAnnual = sum(lines.map((line) => line.annual));
  return {
    totalAnnual,
    totalPerPayroll: totalAnnual / safePayPeriods,
    lines,
  };
};

const calcAdminFee = (
  basis: AgreementFormValues['adminFeeBasis'],
  rate: number,
  grossPerPayroll: number,
  minimumPerEmployeePerMonth: number,
  employeeCount: number,
  payPeriods: number
): { perPayroll: number; annual: number } => {
  const safePayPeriods = Math.max(1, payPeriods);
  const rawAdmin = basis === 'percent_of_gross'
    ? grossPerPayroll * (clampNumber(rate) / 100)
    : clampNumber(rate);
  const minAnnual = clampNumber(minimumPerEmployeePerMonth) * clampNumber(employeeCount) * 12;
  const minPerPayroll = minAnnual / safePayPeriods;
  const perPayroll = Math.max(rawAdmin, minPerPayroll);
  return {
    perPayroll,
    annual: perPayroll * safePayPeriods,
  };
};

const buildScenario = ({
  annualGross,
  grossPerPayroll,
  payPeriods,
  employees,
  form,
  rateKey,
  adminRate,
}: {
  annualGross: number;
  grossPerPayroll: number;
  payPeriods: number;
  employees: number;
  form: AgreementFormValues;
  rateKey: 'currentRate' | 'galacticRate';
  adminRate: number;
}): AgreementScenarioResult => {
  const taxes = calcTaxes({
    annualGross,
    employees,
    payPeriods,
    socialSecurityRate: clampNumber(form.socialSecurityRate || DEFAULT_RATES.socialSecurityRate),
    medicareRate: clampNumber(form.medicareRate || DEFAULT_RATES.medicareRate),
    futaRate: clampNumber(form.futaRate || DEFAULT_RATES.futaRate),
    sutaRate: clampNumber(form.sutaRate || DEFAULT_RATES.sutaRate),
    socialSecurityWageBase: clampNumber(form.socialSecurityWageBase || DEFAULT_WAGE_BASES.socialSecurityWageBase),
    futaWageBase: clampNumber(form.futaWageBase || DEFAULT_WAGE_BASES.futaWageBase),
    sutaWageBase: clampNumber(form.sutaWageBase || DEFAULT_WAGE_BASES.sutaWageBase),
  });

  const wc = calcWorkersComp(form.workersCompClasses, rateKey, payPeriods);

  const admin = calcAdminFee(
    form.adminFeeBasis,
    adminRate,
    grossPerPayroll,
    form.minimumAdminFeePerEmployeePerMonth,
    employees,
    payPeriods
  );

  const benefitsPerPayroll =
    clampNumber(form.healthPerPayroll) +
    clampNumber(form.dentalPerPayroll) +
    clampNumber(form.lifeDisabilityPerPayroll);
  const benefitsAnnual = benefitsPerPayroll * Math.max(1, payPeriods);

  const creditsPerPayroll =
    clampNumber(form.creditForAdvancePerPayroll) +
    clampNumber(form.deductionsCreditPerPayroll);

  const totalPerPayroll =
    grossPerPayroll +
    taxes.totalPerPayroll +
    wc.totalPerPayroll +
    admin.perPayroll +
    benefitsPerPayroll -
    creditsPerPayroll;
  const totalAnnual = totalPerPayroll * Math.max(1, payPeriods);

  return {
    grossAnnual: annualGross,
    grossPerPayroll,
    taxes,
    adminFeeAnnual: admin.annual,
    adminFeePerPayroll: admin.perPayroll,
    workersCompAnnual: wc.totalAnnual,
    workersCompPerPayroll: wc.totalPerPayroll,
    workersCompLines: wc.lines,
    benefitsPerPayroll,
    benefitsAnnual,
    creditsPerPayroll,
    totalPerPayroll,
    totalAnnual,
  };
};

export function derivePayPeriods(payrollFrequency: AgreementFormValues['payrollFrequency']): number {
  return PAY_PERIODS_BY_FREQUENCY[payrollFrequency] ?? 26;
}

export function calculateAgreement(form: AgreementFormValues): AgreementCalculationResult {
  const payPeriods = form.payPeriodsOverride
    ? Math.max(1, clampNumber(form.payPeriodsPerYear))
    : derivePayPeriods(form.payrollFrequency);
  const employeeCount = clampNumber(form.estimatedEmployees);
  const grossFromWc = sum(form.workersCompClasses.map((row) => clampNumber(row.annualPayroll)));
  const annualGross = form.grossPayrollOverrideEnabled
    ? clampNumber(form.grossPayrollOverride)
    : grossFromWc;
  const grossPerPayroll = payPeriods > 0 ? annualGross / payPeriods : 0;

  const current = buildScenario({
    annualGross,
    grossPerPayroll,
    payPeriods,
    employees: employeeCount,
    form,
    rateKey: 'currentRate',
    adminRate: form.currentAdminRate,
  });

  const proposed = buildScenario({
    annualGross,
    grossPerPayroll,
    payPeriods,
    employees: employeeCount,
    form,
    rateKey: 'galacticRate',
    adminRate: form.galacticAdminRate,
  });

  const savingsPerPayroll = current.totalPerPayroll - proposed.totalPerPayroll;
  const savingsAnnual = current.totalAnnual - proposed.totalAnnual;

  const firstInvoiceTotal =
    proposed.totalPerPayroll +
    clampNumber(form.conversionFee) +
    clampNumber(form.workersCompDeposit) +
    clampNumber(form.timeAndAttendanceSetupFee ?? 0);

  return {
    payPeriodsPerYear: payPeriods,
    employeeCount,
    proposedGrossPayroll: annualGross,
    firstInvoiceTotal,
    costAnalysis: {
      current,
      proposed,
      savingsPerPayroll,
      savingsAnnual,
    },
  };
}

export const AGREEMENT_DEFAULT_RATES = {
  ...DEFAULT_RATES,
  ...DEFAULT_WAGE_BASES,
};
