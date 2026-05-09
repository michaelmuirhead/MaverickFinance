import { FREQUENCY_PER_YEAR, type FilingStatus, type PaycheckSettings, type TaxBracket } from "./types";

// 2025 US federal tax brackets (ordinary income).
export const FEDERAL_BRACKETS_2025: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, rate: 0.10 },
    { min: 11925, rate: 0.12 },
    { min: 48475, rate: 0.22 },
    { min: 103350, rate: 0.24 },
    { min: 197300, rate: 0.32 },
    { min: 250525, rate: 0.35 },
    { min: 626350, rate: 0.37 },
  ],
  "married-joint": [
    { min: 0, rate: 0.10 },
    { min: 23850, rate: 0.12 },
    { min: 96950, rate: 0.22 },
    { min: 206700, rate: 0.24 },
    { min: 394600, rate: 0.32 },
    { min: 501050, rate: 0.35 },
    { min: 751600, rate: 0.37 },
  ],
  "married-separate": [
    { min: 0, rate: 0.10 },
    { min: 11925, rate: 0.12 },
    { min: 48475, rate: 0.22 },
    { min: 103350, rate: 0.24 },
    { min: 197300, rate: 0.32 },
    { min: 250525, rate: 0.35 },
    { min: 375800, rate: 0.37 },
  ],
  "head-of-household": [
    { min: 0, rate: 0.10 },
    { min: 17000, rate: 0.12 },
    { min: 64850, rate: 0.22 },
    { min: 103350, rate: 0.24 },
    { min: 197300, rate: 0.32 },
    { min: 250500, rate: 0.35 },
    { min: 626350, rate: 0.37 },
  ],
};

export const STANDARD_DEDUCTION_2025: Record<FilingStatus, number> = {
  single: 15000,
  "married-joint": 30000,
  "married-separate": 15000,
  "head-of-household": 22500,
};

export const DEFAULT_PAYCHECK_SETTINGS: PaycheckSettings = {
  filingStatus: "single",
  payFrequency: "biweekly",
  federalBrackets: FEDERAL_BRACKETS_2025.single,
  stateBrackets: [{ min: 0, rate: 0 }],
  ficaSocialSecurityRate: 0.062,
  ficaMedicareRate: 0.0145,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: 200000,
  socialSecurityWageBase: 176100,
  standardDeduction: STANDARD_DEDUCTION_2025.single,
  pretaxDeductionsAnnual: 0,
  posttaxDeductionsAnnual: 0,
};

/** Compute total tax owed on a given annual taxable income against a progressive bracket table. */
export function progressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0 || brackets.length === 0) return 0;
  const sorted = [...brackets].sort((a, b) => a.min - b.min);
  let owed = 0;
  for (let i = 0; i < sorted.length; i++) {
    const lower = sorted[i].min;
    const upper = i + 1 < sorted.length ? sorted[i + 1].min : Infinity;
    if (taxableIncome <= lower) break;
    const slice = Math.min(taxableIncome, upper) - lower;
    owed += slice * sorted[i].rate;
  }
  return owed;
}

/** Marginal rate at a given taxable income. */
export function marginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  const sorted = [...brackets].sort((a, b) => a.min - b.min);
  let rate = 0;
  for (const b of sorted) {
    if (taxableIncome >= b.min) rate = b.rate;
    else break;
  }
  return rate;
}

export type PaycheckBreakdown = {
  annual: {
    gross: number;
    pretaxDeductions: number;
    federalTaxable: number;
    federalTax: number;
    stateTaxable: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
    posttaxDeductions: number;
    net: number;
    effectiveRate: number;
    federalMarginalRate: number;
    stateMarginalRate: number;
  };
  perPeriod: {
    gross: number;
    pretaxDeductions: number;
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
    posttaxDeductions: number;
    net: number;
  };
};

export function calculatePaycheck(annualGross: number, settings: PaycheckSettings): PaycheckBreakdown {
  const periods = FREQUENCY_PER_YEAR[settings.payFrequency];

  const pretax = Math.max(0, settings.pretaxDeductionsAnnual);
  const ficaWages = Math.max(0, annualGross - pretax);

  const federalTaxable = Math.max(0, ficaWages - settings.standardDeduction);
  const federalTax = progressiveTax(federalTaxable, settings.federalBrackets);

  const stateTaxable = Math.max(0, ficaWages - settings.standardDeduction);
  const stateTax = progressiveTax(stateTaxable, settings.stateBrackets);

  const ssWageCap = Math.min(ficaWages, settings.socialSecurityWageBase);
  const socialSecurity = ssWageCap * settings.ficaSocialSecurityRate;
  const medicare = ficaWages * settings.ficaMedicareRate;
  const additionalMedicare = Math.max(0, ficaWages - settings.additionalMedicareThreshold) * settings.additionalMedicareRate;

  const posttax = Math.max(0, settings.posttaxDeductionsAnnual);

  const net = annualGross - pretax - federalTax - stateTax - socialSecurity - medicare - additionalMedicare - posttax;
  const effectiveRate = annualGross > 0 ? 1 - net / annualGross : 0;

  return {
    annual: {
      gross: annualGross,
      pretaxDeductions: pretax,
      federalTaxable,
      federalTax,
      stateTaxable,
      stateTax,
      socialSecurity,
      medicare,
      additionalMedicare,
      posttaxDeductions: posttax,
      net,
      effectiveRate,
      federalMarginalRate: marginalRate(federalTaxable, settings.federalBrackets),
      stateMarginalRate: marginalRate(stateTaxable, settings.stateBrackets),
    },
    perPeriod: {
      gross: annualGross / periods,
      pretaxDeductions: pretax / periods,
      federalTax: federalTax / periods,
      stateTax: stateTax / periods,
      socialSecurity: socialSecurity / periods,
      medicare: medicare / periods,
      additionalMedicare: additionalMedicare / periods,
      posttaxDeductions: posttax / periods,
      net: net / periods,
    },
  };
}
