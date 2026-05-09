"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LineChart, { type LineSeries } from "@/components/LineChart";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import { useAuth } from "@/lib/auth";
import {
  createSnapshot,
  deleteSnapshot,
  watchCollection,
  watchSnapshots,
} from "@/lib/db";
import { fmtCurrency, fmtPercent } from "@/lib/format";
import {
  FREQUENCY_PER_YEAR,
  type BankAccount,
  type Debt,
  type Investment,
  type Snapshot,
  type Subscription,
} from "@/lib/types";

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
  const [snapshots, setSnapshots] = useState<(Snapshot & { id: string })[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = watchCollection<Subscription>(user.uid, "subscriptions", setSubs);
    const u2 = watchCollection<Debt>(user.uid, "debts", setDebts);
    const u3 = watchCollection<Investment>(user.uid, "investments", setInvs);
    const u4 = watchCollection<BankAccount>(user.uid, "accounts", setAccts);
    const u5 = watchSnapshots(user.uid, setSnapshots);
    return () => { u1(); u2(); u3(); u4(); u5(); };
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

  const chartSeries = useMemo<LineSeries[]>(() => {
    if (snapshots.length === 0) return [];
    return [
      {
        name: "Net worth",
        color: "#4f8cff",
        points: snapshots.map((s) => ({ x: s.takenAt, y: s.netWorth })),
      },
      {
        name: "Cash",
        color: "#3ecf8e",
        points: snapshots.map((s) => ({ x: s.takenAt, y: s.cash })),
      },
      {
        name: "Investments",
        color: "#c084fc",
        points: snapshots.map((s) => ({ x: s.takenAt, y: s.investments })),
      },
      {
        name: "Debts",
        color: "#ff6b6b",
        points: snapshots.map((s) => ({ x: s.takenAt, y: s.debts })),
      },
    ];
  }, [snapshots]);

  const latest = snapshots[snapshots.length - 1];
  const change = useMemo(() => {
    if (snapshots.length < 2) return null;
    const prev = snapshots[snapshots.length - 2];
    const cur = snapshots[snapshots.length - 1];
    const delta = cur.netWorth - prev.netWorth;
    const pct = prev.netWorth !== 0 ? delta / Math.abs(prev.netWorth) : 0;
    return { delta, pct };
  }, [snapshots]);

  async function takeSnapshot() {
    if (!user) return;
    setBusy(true);
    try {
      await createSnapshot(user.uid, {
        takenAt: Date.now(),
        cash,
        investments,
        debts: debt,
        netWorth,
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeSnapshot(id: string) {
    if (!user) return;
    if (!confirm("Delete this snapshot?")) return;
    await deleteSnapshot(user.uid, id);
  }

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Snapshot of your finances.
          </p>
        </div>
        <button className="btn btn-primary" onClick={takeSnapshot} disabled={busy}>
          {busy ? "Saving..." : "+ Take snapshot"}
        </button>
      </header>

      <div className="card" style={{ padding: "1.5rem", marginBottom: "1rem", display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
        <Stat
          label="Net worth"
          value={fmtCurrency(netWorth)}
          tone={netWorth >= 0 ? "positive" : "negative"}
        />
        {change && (
          <Stat
            label="Change since last snapshot"
            value={`${change.delta >= 0 ? "+" : ""}${fmtCurrency(change.delta)} (${fmtPercent(change.pct)})`}
            tone={change.delta >= 0 ? "positive" : "negative"}
          />
        )}
        {latest && (
          <Stat
            label="Last snapshot"
            value={new Date(latest.takenAt).toLocaleDateString()}
          />
        )}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Net worth over time</h2>
          {snapshots.length > 0 && (
            <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {snapshots.length} snapshot{snapshots.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {snapshots.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: "0.9rem", padding: "2rem 0", textAlign: "center" }}>
            Click <strong>Take snapshot</strong> to start tracking how your net worth changes over time.
          </div>
        ) : snapshots.length === 1 ? (
          <div style={{ color: "var(--muted)", fontSize: "0.9rem", padding: "2rem 0", textAlign: "center" }}>
            One snapshot saved. Take another to draw a trend line.
          </div>
        ) : (
          <LineChart
            series={chartSeries}
            height={260}
            yMinZero={false}
            formatX={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            formatY={(v) => fmtCurrency(v)}
          />
        )}
      </div>

      {snapshots.length > 0 && (
        <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Snapshot history</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Cash</th>
                <th style={{ textAlign: "right" }}>Investments</th>
                <th style={{ textAlign: "right" }}>Debts</th>
                <th style={{ textAlign: "right" }}>Net worth</th>
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.takenAt).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>{fmtCurrency(s.cash)}</td>
                  <td style={{ textAlign: "right" }}>{fmtCurrency(s.investments)}</td>
                  <td style={{ textAlign: "right" }}>{fmtCurrency(s.debts)}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtCurrency(s.netWorth)}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => removeSnapshot(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
