/**
 * SUTA rates and Workers' Comp rate classes for PEO proposals
 */

export type USState = 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD' | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ' | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export type WCRateClass = 'office' | 'retail' | 'warehouse' | 'manufacturing' | 'construction' | 'healthcare' | 'hospitality' | 'other';

// SUTA rates by state (from Feb 2026 spreadsheet). Unlisted states default to 1.7.
export const SUTA_RATES: Partial<Record<USState, number>> = {
  'AL': 1.7,
  'AZ': 2.28875,
  'CA': 3.3416666667,
  'CO': 1.6427272727,
  'CT': 2.0,
  'DE': 1.2,
  'FL': 1.4621052632,
  'GA': 1.8135294118,
  'IA': 1.0,
  'ID': 0.81464,
  'IL': 1.9138888889,
  'IN': 2.5,
  'KS': 1.965,
  'LA': 1.813125,
  'MA': 2.885,
  'MD': 4.3,
  'MI': 2.7326666667,
  'MN': 1.54,
  'MO': 1.8237,
  'MS': 1.1,
  'NC': 1.0527272727,
  'NH': 1.86,
  'NJ': 2.9711363636,
  'NM': 1.11,
  'NY': 2.8916666667,
  'OH': 2.7,
  'OK': 1.5,
  'OR': 2.04,
  'SC': 1.0,
  'SD': 0.7333333333,
  'TN': 0.98,
  'TX': 1.0461538462,
  'UT': 2.9375,
  'VA': 1.0792307692,
  'WA': 1.44,
  'WI': 2.3885714286,
  'WV': 2.4333333333,
};

// Workers' Comp rates by class (typical ranges as % of payroll)
export const WC_RATES: Record<WCRateClass, { min: number; max: number; typical: number }> = {
  'office': { min: 0.25, max: 0.50, typical: 0.35 },
  'retail': { min: 0.50, max: 1.00, typical: 0.75 },
  'warehouse': { min: 1.50, max: 3.00, typical: 2.25 },
  'manufacturing': { min: 2.00, max: 5.00, typical: 3.50 },
  'construction': { min: 5.00, max: 15.00, typical: 10.00 },
  'healthcare': { min: 1.50, max: 3.00, typical: 2.25 },
  'hospitality': { min: 1.00, max: 2.50, typical: 1.75 },
  'other': { min: 0.50, max: 2.00, typical: 1.00 },
};

export function getSUTARate(state: USState): number {
  const rate = SUTA_RATES[state] ?? 1.7;
  return Number(rate.toFixed(2));
}

export function getWCRate(rateClass: WCRateClass): { min: number; max: number; typical: number } {
  return WC_RATES[rateClass] || WC_RATES['other'];
}

export function calculateEstimatedWCPremium(
  annualPayroll: number,
  wcRateClass: WCRateClass,
  modFactor: number = 1.0
): number {
  const wcRate = getWCRate(wcRateClass);
  return (annualPayroll * (wcRate.typical / 100)) * modFactor;
}

export function calculateEstimatedSUTA(
  annualPayroll: number,
  state: USState,
  employeeCount: number
): number {
  const sutaRate = getSUTARate(state);
  // SUTA max wage base varies by state, typically $9k-$43k
  // For estimates, use simplified calculation
  const estimatedMaxWageBase = 12000;
  const employeesToMaxOut = Math.min(employeeCount, Math.floor(annualPayroll / estimatedMaxWageBase));
  const estimatedTaxableWages = employeesToMaxOut * estimatedMaxWageBase;
  return estimatedTaxableWages * (sutaRate / 100);
}

export const US_STATES: { label: string; value: USState }[] = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];
