"use client";

import { useEffect, useMemo, useState } from "react";
import LineChart, { type LineSeries } from "@/components/LineChart";
import Stat from "@/components/Stat";
import { useAuth } from "@/lib/auth";
import { watchCollection } from "@/lib/db";
import { fmtCurrency } from "@/lib/format";
import { formatMonths, simulatePayoff, type PayoffResult, type PayoffStrategy } from "@/lib/payoff";
import type { Debt } from "@/lib/types";

export default function PayoffPanel() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<(Debt & { id: string })[]>([]);
  const [extra, setExtra] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    return watchCollection<Debt>(user.uid, "debts", setDebts);
  }, [user]);

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const minSum = debts.reduce((s, d) => s + (d.minPayment ?? 0), 0);

  const avalanche = useMemo(() => simulatePayoff(debts, extra, "avalanche"), [debts, extra]);
  const snowball = useMemo(() => simulatePayoff(debts, extra, "snowball"), [debts, extra]);

  if (debts.length === 0 || totalBalance === 0) return null;

  return (
    <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Payoff projection</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Compares avalanche (highest APR first) vs snowball (smallest balance first).
          </p>
        </div>
        <div style={{ minWidth: 220 }}>
          <label className="label">Extra payment per month (above minimums)</label>
          <input
            className="input"
            type="number"
            step="10"
            min={0}
            value={extra}
            onChange={(e) => setExtra(Math.max(0, Number(e.target.value)))}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Total monthly: {fmtCurrency(minSum + extra)}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
        <StrategyCard title="Avalanche" subtitle="Highest APR first" result={avalanche} highlight={isWinner(avalanche, snowball)} />
        <StrategyCard title="Snowball" subtitle="Smallest balance first" result={snowball} highlight={isWinner(snowball, avalanche)} />
      </div>

      {(avalanche.feasible || snowball.feasible) && (
        <div style={{ marginTop: "1.25rem" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>Balance over time</h3>
          <LineChart
            height={220}
            yMinZero
            series={buildChartSeries(avalanche, snowball)}
            formatX={(m) => formatMonths(Math.round(m))}
            formatY={(v) => fmtCurrency(v)}
          />
        </div>
      )}
    </div>
  );
}

function isWinner(a: PayoffResult, b: PayoffResult): boolean {
  if (!a.feasible) return false;
  if (!b.feasible) return true;
  if (a.totalInterest === b.totalInterest) return a.months < b.months;
  return a.totalInterest < b.totalInterest;
}

function buildChartSeries(a: PayoffResult, b: PayoffResult): LineSeries[] {
  return [
    {
      name: "Avalanche",
      color: "#4f8cff",
      points: thinSeries(a.series.map((p) => ({ x: p.month, y: p.totalBalance }))),
    },
    {
      name: "Snowball",
      color: "#ff9f4a",
      points: thinSeries(b.series.map((p) => ({ x: p.month, y: p.totalBalance }))),
    },
  ];
}

function thinSeries(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 120) return points;
  const stride = Math.ceil(points.length / 120);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}

function StrategyCard({ title, subtitle, result, highlight }: { title: string; subtitle: string; result: PayoffResult; highlight: boolean }) {
  return (
    <div
      className="card"
      style={{
        padding: "1rem",
        borderColor: highlight ? "var(--accent)" : "var(--border)",
        background: highlight ? "rgba(79, 140, 255, 0.05)" : "var(--surface)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{subtitle}</div>
        </div>
        {highlight && (
          <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 999, background: "var(--accent)", color: "white" }}>
            Best
          </span>
        )}
      </div>
      {!result.feasible ? (
        <div style={{ color: "var(--negative)", fontSize: "0.9rem" }}>
          Minimum payments don&apos;t cover interest. Increase the extra payment to make this feasible.
        </div>
      ) : (
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Stat label="Time to debt-free" value={formatMonths(result.months)} />
          <Stat label="Total interest" value={fmtCurrency(result.totalInterest)} tone="negative" />
          <Stat label="Total paid" value={fmtCurrency(result.totalPaid)} />
        </div>
      )}
    </div>
  );
}
