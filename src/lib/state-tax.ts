import type { FilingStatus, TaxBracket } from "./types";

export type StatePreset = {
  code: string;
  name: string;
  /** Per filing status, or a single bracket array applied to all statuses. */
  brackets: Record<FilingStatus, TaxBracket[]> | TaxBracket[];
  notes?: string;
};

const flat = (rate: number): TaxBracket[] => [{ min: 0, rate }];
const ZERO: TaxBracket[] = [{ min: 0, rate: 0 }];

// 2025 state income tax brackets. Approximate; users can edit after applying.
// No-tax states: AK, FL, NV, NH, SD, TN, TX, WA, WY (all wages).
const NO_TAX_STATES: { code: string; name: string }[] = [
  { code: "AK", name: "Alaska" },
  { code: "FL", name: "Florida" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "WA", name: "Washington" },
  { code: "WY", name: "Wyoming" },
];

const FLAT_TAX_STATES: { code: string; name: string; rate: number }[] = [
  { code: "AZ", name: "Arizona", rate: 0.025 },
  { code: "CO", name: "Colorado", rate: 0.044 },
  { code: "GA", name: "Georgia", rate: 0.0539 },
  { code: "ID", name: "Idaho", rate: 0.05695 },
  { code: "IL", name: "Illinois", rate: 0.0495 },
  { code: "IN", name: "Indiana", rate: 0.03 },
  { code: "IA", name: "Iowa", rate: 0.038 },
  { code: "KY", name: "Kentucky", rate: 0.04 },
  { code: "MA", name: "Massachusetts", rate: 0.05 },
  { code: "MI", name: "Michigan", rate: 0.0425 },
  { code: "MS", name: "Mississippi", rate: 0.047 },
  { code: "NC", name: "North Carolina", rate: 0.0425 },
  { code: "PA", name: "Pennsylvania", rate: 0.0307 },
  { code: "UT", name: "Utah", rate: 0.0455 },
];

const PROGRESSIVE_PRESETS: StatePreset[] = [
  {
    code: "CA",
    name: "California",
    brackets: {
      single: [
        { min: 0, rate: 0.01 },
        { min: 10756, rate: 0.02 },
        { min: 25499, rate: 0.04 },
        { min: 40245, rate: 0.06 },
        { min: 55866, rate: 0.08 },
        { min: 70606, rate: 0.093 },
        { min: 360659, rate: 0.103 },
        { min: 432787, rate: 0.113 },
        { min: 721314, rate: 0.123 },
      ],
      "married-joint": [
        { min: 0, rate: 0.01 },
        { min: 21512, rate: 0.02 },
        { min: 50998, rate: 0.04 },
        { min: 80490, rate: 0.06 },
        { min: 111732, rate: 0.08 },
        { min: 141212, rate: 0.093 },
        { min: 721318, rate: 0.103 },
        { min: 865574, rate: 0.113 },
        { min: 1442628, rate: 0.123 },
      ],
      "married-separate": [
        { min: 0, rate: 0.01 },
        { min: 10756, rate: 0.02 },
        { min: 25499, rate: 0.04 },
        { min: 40245, rate: 0.06 },
        { min: 55866, rate: 0.08 },
        { min: 70606, rate: 0.093 },
        { min: 360659, rate: 0.103 },
        { min: 432787, rate: 0.113 },
        { min: 721314, rate: 0.123 },
      ],
      "head-of-household": [
        { min: 0, rate: 0.01 },
        { min: 21527, rate: 0.02 },
        { min: 51000, rate: 0.04 },
        { min: 65744, rate: 0.06 },
        { min: 81364, rate: 0.08 },
        { min: 96107, rate: 0.093 },
        { min: 490493, rate: 0.103 },
        { min: 588593, rate: 0.113 },
        { min: 980987, rate: 0.123 },
      ],
    },
    notes: "Excludes 1% Mental Health Services Tax on income over $1M.",
  },
  {
    code: "NY",
    name: "New York",
    brackets: {
      single: [
        { min: 0, rate: 0.04 },
        { min: 8500, rate: 0.045 },
        { min: 11700, rate: 0.0525 },
        { min: 13900, rate: 0.055 },
        { min: 80650, rate: 0.06 },
        { min: 215400, rate: 0.0685 },
        { min: 1077550, rate: 0.0965 },
        { min: 5000000, rate: 0.103 },
        { min: 25000000, rate: 0.109 },
      ],
      "married-joint": [
        { min: 0, rate: 0.04 },
        { min: 17150, rate: 0.045 },
        { min: 23600, rate: 0.0525 },
        { min: 27900, rate: 0.055 },
        { min: 161550, rate: 0.06 },
        { min: 323200, rate: 0.0685 },
        { min: 2155350, rate: 0.0965 },
        { min: 5000000, rate: 0.103 },
        { min: 25000000, rate: 0.109 },
      ],
      "married-separate": [
        { min: 0, rate: 0.04 },
        { min: 8500, rate: 0.045 },
        { min: 11700, rate: 0.0525 },
        { min: 13900, rate: 0.055 },
        { min: 80650, rate: 0.06 },
        { min: 215400, rate: 0.0685 },
        { min: 1077550, rate: 0.0965 },
        { min: 5000000, rate: 0.103 },
        { min: 25000000, rate: 0.109 },
      ],
      "head-of-household": [
        { min: 0, rate: 0.04 },
        { min: 12800, rate: 0.045 },
        { min: 17650, rate: 0.0525 },
        { min: 20900, rate: 0.055 },
        { min: 107650, rate: 0.06 },
        { min: 269300, rate: 0.0685 },
        { min: 1616450, rate: 0.0965 },
        { min: 5000000, rate: 0.103 },
        { min: 25000000, rate: 0.109 },
      ],
    },
    notes: "Excludes NYC and Yonkers local taxes.",
  },
  {
    code: "NJ",
    name: "New Jersey",
    brackets: {
      single: [
        { min: 0, rate: 0.014 },
        { min: 20000, rate: 0.0175 },
        { min: 35000, rate: 0.035 },
        { min: 40000, rate: 0.05525 },
        { min: 75000, rate: 0.0637 },
        { min: 500000, rate: 0.0897 },
        { min: 1000000, rate: 0.1075 },
      ],
      "married-joint": [
        { min: 0, rate: 0.014 },
        { min: 20000, rate: 0.0175 },
        { min: 50000, rate: 0.0245 },
        { min: 70000, rate: 0.035 },
        { min: 80000, rate: 0.05525 },
        { min: 150000, rate: 0.0637 },
        { min: 500000, rate: 0.0897 },
        { min: 1000000, rate: 0.1075 },
      ],
      "married-separate": [
        { min: 0, rate: 0.014 },
        { min: 20000, rate: 0.0175 },
        { min: 35000, rate: 0.035 },
        { min: 40000, rate: 0.05525 },
        { min: 75000, rate: 0.0637 },
        { min: 500000, rate: 0.0897 },
        { min: 1000000, rate: 0.1075 },
      ],
      "head-of-household": [
        { min: 0, rate: 0.014 },
        { min: 20000, rate: 0.0175 },
        { min: 50000, rate: 0.0245 },
        { min: 70000, rate: 0.035 },
        { min: 80000, rate: 0.05525 },
        { min: 150000, rate: 0.0637 },
        { min: 500000, rate: 0.0897 },
        { min: 1000000, rate: 0.1075 },
      ],
    },
  },
  {
    code: "OR",
    name: "Oregon",
    brackets: {
      single: [
        { min: 0, rate: 0.0475 },
        { min: 4400, rate: 0.0675 },
        { min: 11050, rate: 0.0875 },
        { min: 125000, rate: 0.099 },
      ],
      "married-joint": [
        { min: 0, rate: 0.0475 },
        { min: 8800, rate: 0.0675 },
        { min: 22100, rate: 0.0875 },
        { min: 250000, rate: 0.099 },
      ],
      "married-separate": [
        { min: 0, rate: 0.0475 },
        { min: 4400, rate: 0.0675 },
        { min: 11050, rate: 0.0875 },
        { min: 125000, rate: 0.099 },
      ],
      "head-of-household": [
        { min: 0, rate: 0.0475 },
        { min: 8800, rate: 0.0675 },
        { min: 22100, rate: 0.0875 },
        { min: 250000, rate: 0.099 },
      ],
    },
  },
  {
    code: "VA",
    name: "Virginia",
    brackets: {
      single: [
        { min: 0, rate: 0.02 },
        { min: 3000, rate: 0.03 },
        { min: 5000, rate: 0.05 },
        { min: 17000, rate: 0.0575 },
      ],
      "married-joint": [
        { min: 0, rate: 0.02 },
        { min: 3000, rate: 0.03 },
        { min: 5000, rate: 0.05 },
        { min: 17000, rate: 0.0575 },
      ],
      "married-separate": [
        { min: 0, rate: 0.02 },
        { min: 3000, rate: 0.03 },
        { min: 5000, rate: 0.05 },
        { min: 17000, rate: 0.0575 },
      ],
      "head-of-household": [
        { min: 0, rate: 0.02 },
        { min: 3000, rate: 0.03 },
        { min: 5000, rate: 0.05 },
        { min: 17000, rate: 0.0575 },
      ],
    },
  },
];

export const STATE_PRESETS: StatePreset[] = [
  { code: "CUSTOM", name: "Custom (no preset)", brackets: ZERO },
  ...NO_TAX_STATES.map<StatePreset>((s) => ({
    code: s.code,
    name: `${s.name} (no income tax)`,
    brackets: ZERO,
  })),
  ...FLAT_TAX_STATES.map<StatePreset>((s) => ({
    code: s.code,
    name: `${s.name} (flat ${(s.rate * 100).toFixed(2)}%)`,
    brackets: flat(s.rate),
  })),
  ...PROGRESSIVE_PRESETS,
].sort((a, b) => {
  if (a.code === "CUSTOM") return -1;
  if (b.code === "CUSTOM") return 1;
  return a.name.localeCompare(b.name);
});

export function bracketsForPreset(preset: StatePreset, status: FilingStatus): TaxBracket[] {
  if (Array.isArray(preset.brackets)) return preset.brackets;
  return preset.brackets[status];
}
