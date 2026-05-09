"use client";

export type BarItem = {
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
};

type Props = {
  items: BarItem[];
  formatValue: (v: number) => string;
  showPercent?: boolean;
};

const DEFAULT_COLORS = ["#4f8cff", "#3ecf8e", "#ff9f4a", "#c084fc", "#ff6b6b", "#22d3ee", "#facc15", "#a78bfa"];

export default function BarList({ items, formatValue, showPercent = true }: Props) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No data.</div>;
  }
  const sorted = [...items].sort((a, b) => b.value - a.value);
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      {sorted.map((item, i) => {
        const color = item.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        const widthPct = max > 0 ? (item.value / max) * 100 : 0;
        const sharePct = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: 4 }}>
              <span>
                {item.label}
                {item.sublabel && <span style={{ color: "var(--muted)", marginLeft: 6 }}>{item.sublabel}</span>}
              </span>
              <span>
                {formatValue(item.value)}
                {showPercent && (
                  <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                    {sharePct.toFixed(1)}%
                  </span>
                )}
              </span>
            </div>
            <div style={{ background: "var(--surface-2)", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: color,
                  transition: "width 200ms ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
