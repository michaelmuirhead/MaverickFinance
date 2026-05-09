"use client";

import EntityPage, { type ColumnDef, type FieldDef } from "@/components/EntityPage";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import { fmtCurrency, fmtPercent } from "@/lib/format";
import type { Investment } from "@/lib/types";

const fields: FieldDef<Investment>[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Vanguard Total Stock Market" },
  { name: "symbol", label: "Symbol", type: "text", placeholder: "VTSAX" },
  {
    name: "type",
    label: "Type",
    type: "select",
    required: true,
    options: [
      { value: "stock", label: "Stock" },
      { value: "etf", label: "ETF" },
      { value: "mutual-fund", label: "Mutual fund" },
      { value: "bond", label: "Bond" },
      { value: "crypto", label: "Crypto" },
      { value: "real-estate", label: "Real estate" },
      { value: "other", label: "Other" },
    ],
  },
  { name: "account", label: "Account / brokerage", type: "text", placeholder: "Roth IRA" },
  { name: "shares", label: "Shares / units", type: "number", required: true, step: 0.0001 },
  { name: "costBasis", label: "Cost basis (per share)", type: "currency", required: true },
  { name: "currentPrice", label: "Current price", type: "currency", required: true },
  { name: "notes", label: "Notes", type: "textarea" },
];

const TYPE_LABELS: Record<Investment["type"], string> = {
  stock: "Stock",
  etf: "ETF",
  "mutual-fund": "Mutual fund",
  bond: "Bond",
  crypto: "Crypto",
  "real-estate": "Real estate",
  other: "Other",
};

function marketValue(r: Investment) {
  return r.shares * r.currentPrice;
}
function gain(r: Investment) {
  return r.shares * (r.currentPrice - r.costBasis);
}
function gainPct(r: Investment) {
  return r.costBasis > 0 ? (r.currentPrice - r.costBasis) / r.costBasis : 0;
}

const columns: ColumnDef<Investment>[] = [
  { header: "Name", render: (r) => (r.symbol ? `${r.name} (${r.symbol})` : r.name) },
  { header: "Type", render: (r) => TYPE_LABELS[r.type] },
  { header: "Account", render: (r) => r.account ?? "—" },
  { header: "Shares", render: (r) => r.shares.toLocaleString(undefined, { maximumFractionDigits: 4 }), align: "right" },
  { header: "Price", render: (r) => fmtCurrency(r.currentPrice), align: "right" },
  { header: "Value", render: (r) => fmtCurrency(marketValue(r)), align: "right" },
  {
    header: "Gain/Loss",
    render: (r) => (
      <span style={{ color: gain(r) >= 0 ? "var(--positive)" : "var(--negative)" }}>
        {fmtCurrency(gain(r))} ({fmtPercent(gainPct(r))})
      </span>
    ),
    align: "right",
  },
];

export default function InvestmentsPage() {
  return (
    <Shell>
      <EntityPage<Investment>
        title="Investments"
        description="Portfolio holdings across brokerages and accounts."
        collectionName="investments"
        fields={fields}
        columns={columns}
        emptyDefaults={{ name: "", type: "etf", shares: 0, costBasis: 0, currentPrice: 0 }}
        computeSummary={(rows) => {
          const value = rows.reduce((s, r) => s + marketValue(r), 0);
          const cost = rows.reduce((s, r) => s + r.shares * r.costBasis, 0);
          const totalGain = value - cost;
          const totalPct = cost > 0 ? totalGain / cost : 0;
          return (
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <Stat label="Market value" value={fmtCurrency(value)} tone="positive" />
              <Stat label="Cost basis" value={fmtCurrency(cost)} />
              <Stat
                label="Total gain/loss"
                value={`${fmtCurrency(totalGain)} (${fmtPercent(totalPct)})`}
                tone={totalGain >= 0 ? "positive" : "negative"}
              />
            </div>
          );
        }}
      />
    </Shell>
  );
}
