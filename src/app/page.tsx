"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import { useAuth } from "@/lib/auth";
import { watchCollection } from "@/lib/db";
import { fmtCurrency, fmtPercent } from "@/lib/format";
import { FREQUENCY_PER_YEAR, type BankAccount, type Debt, type Investment, type Subscription } from "@/lib/types";

export default function DashboardPage() {
  return (
    <Shell>
      <Dashboard />
    </Shell>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<(Subscription & { id: string })[]>([]);
  const [debts, setDebts] = useState<(Debt & { id: string })[]>([]);
  const [invs, setInvs] = useState<(Investment & { id: string })[]>([]);
  const [accts, setAccts] = useState<(BankAccount & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    const u1 = watchCollection<Subscription>(user.uid, "subscriptions", setSubs);
    const u2 = watchCollection<Debt>(user.uid, "debts", setDebts);
    const u3 = watchCollection<Investment>(user.uid, "investments", setInvs);
    const u4 = watchCollection<BankAccount>(user.uid, "accounts", setAccts);
    return () => { u1(); u2(); u3(); u4(); };
  }, [user]);

  const cash = accts.reduce((s, r) => s + r.balance, 0);
  const investments = invs.reduce((s, r) => s + r.shares * r.currentPrice, 0);
  const debt = debts.reduce((s, r) => s + r.balance, 0);
  const netWorth = cash + investments - debt;

  const monthlySubs = subs.reduce(
    (s, r) => s + (r.amount * FREQUENCY_PER_YEAR[r.frequency]) / 12,
    0
  );
  const monthlyDebtMin = debts.reduce((s, r) => s + (r.minPayment ?? 0), 0);
  const monthlyInterest = debts.reduce((s, r) => s + (r.balance * r.interestRate) / 12, 0);
  const debtAvgRate = debt > 0 ? debts.reduce((s, r) => s + r.balance * r.interestRate, 0) / debt : 0;

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.25rem" }}>Dashboard</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        Snapshot of your finances.
      </p>

      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <Stat
          label="Net worth"
          value={fmtCurrency(netWorth)}
          tone={netWorth >= 0 ? "positive" : "negative"}
        />
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <DashCard href="/accounts" title="Cash">
          <Stat label="Total balance" value={fmtCurrency(cash)} tone="positive" />
          <Stat label="Accounts" value={String(accts.length)} />
        </DashCard>
        <DashCard href="/investments" title="Investments">
          <Stat label="Market value" value={fmtCurrency(investments)} tone="positive" />
          <Stat label="Holdings" value={String(invs.length)} />
        </DashCard>
        <DashCard href="/debts" title="Debts">
          <Stat label="Total owed" value={fmtCurrency(debt)} tone={debt > 0 ? "negative" : "default"} />
          <Stat label="Avg APR" value={fmtPercent(debtAvgRate)} />
          <Stat label="Monthly interest" value={fmtCurrency(monthlyInterest)} />
        </DashCard>
        <DashCard href="/subscriptions" title="Subscriptions">
          <Stat label="Monthly cost" value={fmtCurrency(monthlySubs)} />
          <Stat label="Yearly cost" value={fmtCurrency(monthlySubs * 12)} />
          <Stat label="Active" value={String(subs.length)} />
        </DashCard>
      </div>

      <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Monthly outflows</h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <Stat label="Subscriptions" value={fmtCurrency(monthlySubs)} />
          <Stat label="Debt minimums" value={fmtCurrency(monthlyDebtMin)} />
          <Stat label="Total" value={fmtCurrency(monthlySubs + monthlyDebtMin)} tone="negative" />
        </div>
      </div>
    </div>
  );
}

function DashCard({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="card" style={{ padding: "1.25rem", textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.75rem", fontWeight: 500 }}>{title}</div>
      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>{children}</div>
    </Link>
  );
}
