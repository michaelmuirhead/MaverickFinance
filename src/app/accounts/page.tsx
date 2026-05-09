"use client";

import EntityPage, { type ColumnDef, type FieldDef } from "@/components/EntityPage";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import { fmtCurrency, fmtPercent } from "@/lib/format";
import type { BankAccount } from "@/lib/types";

const fields: FieldDef<BankAccount>[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Primary checking" },
  { name: "institution", label: "Institution", type: "text", placeholder: "Ally Bank" },
  {
    name: "type",
    label: "Type",
    type: "select",
    required: true,
    options: [
      { value: "checking", label: "Checking" },
      { value: "savings", label: "Savings" },
      { value: "money-market", label: "Money market" },
      { value: "cd", label: "CD" },
      { value: "cash", label: "Cash" },
      { value: "other", label: "Other" },
    ],
  },
  { name: "balance", label: "Balance", type: "currency", required: true },
  { name: "apy", label: "APY (%)", type: "percent" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const TYPE_LABELS: Record<BankAccount["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  "money-market": "Money market",
  cd: "CD",
  cash: "Cash",
  other: "Other",
};

const columns: ColumnDef<BankAccount>[] = [
  { header: "Name", render: (r) => r.name },
  { header: "Institution", render: (r) => r.institution ?? "—" },
  { header: "Type", render: (r) => TYPE_LABELS[r.type] },
  { header: "APY", render: (r) => (r.apy ? fmtPercent(r.apy) : "—"), align: "right" },
  { header: "Balance", render: (r) => fmtCurrency(r.balance), align: "right" },
];

export default function AccountsPage() {
  return (
    <Shell>
      <EntityPage<BankAccount>
        title="Bank accounts"
        description="Cash positions across institutions."
        collectionName="accounts"
        fields={fields}
        columns={columns}
        emptyDefaults={{ name: "", type: "checking", balance: 0 }}
        computeSummary={(rows) => {
          const total = rows.reduce((s, r) => s + r.balance, 0);
          const interest = rows.reduce((s, r) => s + r.balance * (r.apy ?? 0), 0);
          return (
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <Stat label="Total cash" value={fmtCurrency(total)} tone="positive" />
              <Stat label="Annual interest (APY)" value={fmtCurrency(interest)} />
            </div>
          );
        }}
      />
    </Shell>
  );
}
