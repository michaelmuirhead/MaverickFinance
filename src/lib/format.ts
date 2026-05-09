const currencyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function fmtCurrency(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "$0.00";
  return currencyFmt.format(n);
}

export function fmtPercent(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`;
}
