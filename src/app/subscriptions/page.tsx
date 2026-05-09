"use client";

import EntityPage, { type ColumnDef, type FieldDef } from "@/components/EntityPage";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import SubscriptionBreakdown from "@/components/SubscriptionBreakdown";
import { fmtCurrency } from "@/lib/format";
import { FREQUENCY_PER_YEAR, type Subscription } from "@/lib/types";

const fields: FieldDef<Subscription>[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Netflix" },
  { name: "amount", label: "Amount", type: "currency", required: true },
  {
    name: "frequency",
    label: "Frequency",
    type: "select",
    required: true,
    options: [
      { value: "weekly", label: "Weekly" },
      { value: "biweekly", label: "Biweekly" },
      { value: "monthly", label: "Monthly" },
      { value: "quarterly", label: "Quarterly" },
      { value: "yearly", label: "Yearly" },
    ],
  },
  { name: "category", label: "Category", type: "text", placeholder: "Streaming" },
  { name: "nextBillingDate", label: "Next billing date", type: "date" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const columns: ColumnDef<Subscription>[] = [
  { header: "Name", render: (r) => r.name },
  { header: "Category", render: (r) => r.category ?? "—" },
  { header: "Amount", render: (r) => fmtCurrency(r.amount), align: "right" },
  { header: "Frequency", render: (r) => r.frequency },
  { header: "Next bill", render: (r) => r.nextBillingDate ?? "—" },
  {
    header: "Annualized",
    render: (r) => fmtCurrency(r.amount * FREQUENCY_PER_YEAR[r.frequency]),
    align: "right",
  },
];

export default function SubscriptionsPage() {
  return (
    <Shell>
      <EntityPage<Subscription>
        title="Subscriptions"
        description="Recurring services and memberships."
        collectionName="subscriptions"
        fields={fields}
        columns={columns}
        emptyDefaults={{ name: "", amount: 0, frequency: "monthly" }}
        computeSummary={(rows) => {
          const monthly = rows.reduce((s, r) => s + (r.amount * FREQUENCY_PER_YEAR[r.frequency]) / 12, 0);
          const yearly = monthly * 12;
          return (
            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              <Stat label="Subscriptions" value={String(rows.length)} />
              <Stat label="Monthly cost" value={fmtCurrency(monthly)} />
              <Stat label="Yearly cost" value={fmtCurrency(yearly)} />
            </div>
          );
        }}
      />
      <SubscriptionBreakdown />
    </Shell>
  );
}
