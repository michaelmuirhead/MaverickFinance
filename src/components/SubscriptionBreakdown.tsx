"use client";

import { useEffect, useMemo, useState } from "react";
import BarList from "@/components/BarList";
import { useAuth } from "@/lib/auth";
import { watchCollection } from "@/lib/db";
import { fmtCurrency } from "@/lib/format";
import { FREQUENCY_PER_YEAR, type Subscription } from "@/lib/types";

type Mode = "monthly" | "yearly";

export default function SubscriptionBreakdown() {
  const { user } = useAuth();
  const [rows, setRows] = useState<(Subscription & { id: string })[]>([]);
  const [mode, setMode] = useState<Mode>("monthly");

  useEffect(() => {
    if (!user) return;
    return watchCollection<Subscription>(user.uid, "subscriptions", setRows);
  }, [user]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { value: number; count: number; names: string[] }>();
    for (const r of rows) {
      const key = (r.category ?? "Uncategorized").trim() || "Uncategorized";
      const annualized = r.amount * FREQUENCY_PER_YEAR[r.frequency];
      const value = mode === "monthly" ? annualized / 12 : annualized;
      const cur = map.get(key) ?? { value: 0, count: 0, names: [] };
      cur.value += value;
      cur.count += 1;
      cur.names.push(r.name);
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([label, v]) => ({
      label,
      value: v.value,
      sublabel: `${v.count} item${v.count === 1 ? "" : "s"}`,
    }));
  }, [rows, mode]);

  if (rows.length === 0) return null;

  return (
    <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Spend by category</h2>
        <div style={{ display: "flex", gap: 4, background: "var(--surface-2)", padding: 3, borderRadius: 8 }}>
          <ToggleBtn active={mode === "monthly"} onClick={() => setMode("monthly")}>Monthly</ToggleBtn>
          <ToggleBtn active={mode === "yearly"} onClick={() => setMode("yearly")}>Yearly</ToggleBtn>
        </div>
      </div>
      <BarList items={byCategory} formatValue={fmtCurrency} />
    </div>
  );
}

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.3rem 0.75rem",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "white" : "var(--muted)",
        fontSize: "0.85rem",
      }}
    >
      {children}
    </button>
  );
}
