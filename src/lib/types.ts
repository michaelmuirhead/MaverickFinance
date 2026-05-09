export type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export const FREQUENCY_PER_YEAR: Record<Frequency, number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export type Subscription = {
  id?: string;
  name: string;
  amount: number;
  frequency: Frequency;
  category?: string;
  nextBillingDate?: string;
  notes?: string;
};

export type DebtType = "credit-card" | "student-loan" | "auto-loan" | "mortgage" | "personal-loan" | "other";

export type Debt = {
  id?: string;
  name: string;
  type: DebtType;
  balance: number;
  originalAmount?: number;
  interestRate: number;
  minPayment?: number;
  dueDay?: number;
  notes?: string;
};

export type InvestmentType = "stock" | "etf" | "mutual-fund" | "bond" | "crypto" | "real-estate" | "other";

export type Investment = {
  id?: string;
  name: string;
  symbol?: string;
  type: InvestmentType;
  account?: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  notes?: string;
};

export type AccountType = "checking" | "savings" | "money-market" | "cd" | "cash" | "other";

export type BankAccount = {
  id?: string;
  name: string;
  institution?: string;
  type: AccountType;
  balance: number;
  apy?: number;
  notes?: string;
};

export type Snapshot = {
  id?: string;
  takenAt: number;
  cash: number;
  investments: number;
  debts: number;
  netWorth: number;
};

export type FilingStatus = "single" | "married-joint" | "married-separate" | "head-of-household";

export type TaxBracket = {
  min: number;
  rate: number;
};

export type PaycheckSettings = {
  filingStatus: FilingStatus;
  payFrequency: Frequency;
  federalBrackets: TaxBracket[];
  stateBrackets: TaxBracket[];
  statePresetCode?: string;
  ficaSocialSecurityRate: number;
  ficaMedicareRate: number;
  additionalMedicareRate: number;
  additionalMedicareThreshold: number;
  socialSecurityWageBase: number;
  standardDeduction: number;
  pretaxDeductionsAnnual: number;
  posttaxDeductionsAnnual: number;
};
