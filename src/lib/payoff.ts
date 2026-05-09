import type { Debt } from "./types";

export type PayoffStrategy = "avalanche" | "snowball";

export type PayoffSeriesPoint = {
  month: number;
  totalBalance: number;
  perDebt: Record<string, number>;
};

export type PayoffResult = {
  strategy: PayoffStrategy;
  feasible: boolean;
  months: number;
  totalInterest: number;
  totalPaid: number;
  payoffMonths: Record<string, number>;
  series: PayoffSeriesPoint[];
};

const MAX_MONTHS = 600; // 50 years cap

function rank(strategy: PayoffStrategy, debts: { id: string; balance: number; apr: number }[]): string[] {
  const live = debts.filter((d) => d.balance > 0);
  if (strategy === "avalanche") {
    live.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
  } else {
    live.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  }
  return live.map((d) => d.id);
}

export function simulatePayoff(
  debts: (Debt & { id: string })[],
  extraPerMonth: number,
  strategy: PayoffStrategy
): PayoffResult {
  // Working state.
  const state = debts
    .filter((d) => d.balance > 0)
    .map((d) => ({
      id: d.id,
      balance: d.balance,
      apr: d.interestRate,
      minPayment: Math.max(0, d.minPayment ?? 0),
    }));

  if (state.length === 0) {
    return {
      strategy,
      feasible: true,
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      payoffMonths: {},
      series: [{ month: 0, totalBalance: 0, perDebt: {} }],
    };
  }

  const payoffMonths: Record<string, number> = {};
  const series: PayoffSeriesPoint[] = [];

  // Initial point at month 0.
  series.push({
    month: 0,
    totalBalance: state.reduce((s, d) => s + d.balance, 0),
    perDebt: Object.fromEntries(state.map((d) => [d.id, d.balance])),
  });

  let totalInterest = 0;
  let totalPaid = 0;

  for (let month = 1; month <= MAX_MONTHS; month++) {
    // Accrue interest for all live debts.
    let monthlyInterest = 0;
    for (const d of state) {
      if (d.balance <= 0) continue;
      const interest = d.balance * (d.apr / 12);
      d.balance += interest;
      monthlyInterest += interest;
    }
    totalInterest += monthlyInterest;

    // Total budget = sum of all min payments + extra.
    let budget = state.reduce((s, d) => s + (d.balance > 0 ? d.minPayment : 0), 0) + extraPerMonth;

    // First pay each debt up to its min (capped to balance).
    const paidThisMonth: Record<string, number> = {};
    for (const d of state) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, budget);
      d.balance -= pay;
      budget -= pay;
      paidThisMonth[d.id] = (paidThisMonth[d.id] ?? 0) + pay;
    }

    // Apply extra to top-ranked debt(s) until budget is exhausted or all paid.
    const order = rank(strategy, state);
    for (const id of order) {
      if (budget <= 0) break;
      const d = state.find((x) => x.id === id);
      if (!d || d.balance <= 0) continue;
      const pay = Math.min(d.balance, budget);
      d.balance -= pay;
      budget -= pay;
      paidThisMonth[d.id] = (paidThisMonth[d.id] ?? 0) + pay;
    }

    totalPaid += Object.values(paidThisMonth).reduce((s, v) => s + v, 0);

    // Record any debts that hit zero this month.
    for (const d of state) {
      if (d.balance <= 0.005 && payoffMonths[d.id] === undefined) {
        d.balance = 0;
        payoffMonths[d.id] = month;
      }
    }

    series.push({
      month,
      totalBalance: state.reduce((s, d) => s + d.balance, 0),
      perDebt: Object.fromEntries(state.map((d) => [d.id, d.balance])),
    });

    if (state.every((d) => d.balance <= 0)) {
      return {
        strategy,
        feasible: true,
        months: month,
        totalInterest,
        totalPaid,
        payoffMonths,
        series,
      };
    }

    // Detect runaway: if min payments don't even cover interest and there's no extra,
    // bail early so we don't loop until MAX_MONTHS.
    if (extraPerMonth === 0 && monthlyInterest > state.reduce((s, d) => s + (d.balance > 0 ? d.minPayment : 0), 0)) {
      return {
        strategy,
        feasible: false,
        months: MAX_MONTHS,
        totalInterest,
        totalPaid,
        payoffMonths,
        series,
      };
    }
  }

  return {
    strategy,
    feasible: false,
    months: MAX_MONTHS,
    totalInterest,
    totalPaid,
    payoffMonths,
    series,
  };
}

export function formatMonths(n: number): string {
  if (n < 12) return `${n} mo`;
  const y = Math.floor(n / 12);
  const m = n % 12;
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`;
}
