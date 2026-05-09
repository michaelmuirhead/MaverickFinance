"use client";

import EntityPage, { type ColumnDef, type FieldDef } from "@/components/EntityPage";
import PayoffPanel from "@/components/PayoffPanel";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import { fmtCurrency, fmtPercent } from "@/lib/format";
import type { Debt } from "@/lib/types";

const fields: FieldDef<Debt>[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Chase Sapphire" },
  {
    name: "type",
    label: "Type",
    type: "select",
    required: true,
    options: [
      { value: "credit-card", label: "Credit card" },
      { value: "student-loan", label: "Student loan" },
      { value: "auto-loan", label: "Auto loan" },
      { value: "mortgage", label: "Mortgage" },
      { value: "personal-loan", label: "Personal loan" },
      { value: "other", label: "Other" },
    ],
  },
  { name: "balance", label: "Current balance", type: "currency", required: true },
  { name: "originalAmount", label: "Original amount", type: "currency" },
  { name: "interestRate", label: "Interest rate (APR %)", type: "percent", required: true },
  { name: "minPayment", label: "Minimum payment", type: "currency" },
  { name: "dueDay", label: "Due day of month", type: "number" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const TYPE_LABELS: Record<Debt["type"], string> = {
  "credit-card": "Credit card",
  "student-loan": "Student loan",
  "auto-loan": "Auto loan",
  mortgage: "Mortgage",
  "personal-loan": "Personal loan",
  other: "Other",
};

const columns: ColumnDef<Debt>[] = [
  { header: "Name", render: (r) => r.name },
  { header: "Type", render: (r) => TYPE_LABELS[r.type] },
  { header: "Balance", render: (r) => fmtCurrency(r.balance), align: "right" },
  { header: "APR", render: (r) => fmtPercent(r.interestRate), align: "right" },
  { header: "Min payment", render: (r) => (r.minPayment ? fmtCurrency(r.minPayment) : "—"), align: "right" },
  {
    header: "Monthly interest",
    render: (r) => fmtCurrency((r.balance * r.interestRate) / 12),
    align: "right",
  },
];

export default function DebtsPage() {
  return (
    <Shell>
      <EntityPage<Debt>
        title="Debts"
        description="Loans, credit cards, and other liabilities."
        collectionName="debts"
        fields={fields}
        columns={columns}
        emptyDefaults={{ name: "", type: "credit-card", balance: 0, interestRate: 0 }}
        computeSummary={(rows) => {
          const total = rows.reduce((s, r) => s + r.balance, 0);
          const minPay = rows.reduce((s, r) => s + (r.minPayment ?? 0), 0);
          const weightedRate =
            total > 0 ? rows.reduce((s, r) => s + r.balance * r.interestRate, 0) / total : 0;
          const monthlyInterest = rows.reduce((s, r) => s + (r.balance * r.interestRate) / 12, 0);
          return (
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <Stat label="Total debt" value={fmtCurrency(total)} tone="negative" />
              <Stat label="Avg APR (weighted)" value={fmtPercent(weightedRate)} />
              <Stat label="Monthly minimums" value={fmtCurrency(minPay)} />
              <Stat label="Monthly interest" value={fmtCurrency(monthlyInterest)} tone="negative" />
            </div>
          );
        }}
      />
      <PayoffPanel />
    </Shell>
  );
}
