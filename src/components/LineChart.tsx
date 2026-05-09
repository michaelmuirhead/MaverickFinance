"use client";

import { useMemo, useState } from "react";

export type LineSeries = {
  name: string;
  color: string;
  points: { x: number; y: number }[];
};

type Props = {
  series: LineSeries[];
  height?: number;
  formatX: (v: number) => string;
  formatY: (v: number) => string;
  yMinZero?: boolean;
};

const PAD = { left: 64, right: 16, top: 16, bottom: 30 };

export default function LineChart({ series, height = 240, formatX, formatY, yMinZero = true }: Props) {
  const [hover, setHover] = useState<{ x: number; idx: number } | null>(null);

  const all = useMemo(() => series.flatMap((s) => s.points), [series]);

  if (all.length === 0) {
    return <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Not enough data to plot.</div>;
  }

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = yMinZero ? Math.min(0, ...ys) : Math.min(...ys);
  const yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.1 || 1;
  const yLo = yMin - (yMin < 0 ? yPad : 0);
  const yHi = yMax + yPad;

  const W = 800;
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const sy = (y: number) => PAD.top + (1 - (y - yLo) / (yHi - yLo || 1)) * innerH;

  const yTicks = niceTicks(yLo, yHi, 4);
  const xTicks = pickXTicks(xs, 6);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block" }}>
        {/* Y grid + labels */}
        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line x1={PAD.left} y1={sy(t)} x2={W - PAD.right} y2={sy(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={sy(t)} fill="var(--muted)" fontSize="11" textAnchor="end" dominantBaseline="middle">
              {formatY(t)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xTicks.map((t) => (
          <text key={`x-${t}`} x={sx(t)} y={H - 10} fill="var(--muted)" fontSize="11" textAnchor="middle">
            {formatX(t)}
          </text>
        ))}

        {/* Series */}
        {series.map((s) => {
          if (s.points.length === 0) return null;
          const path = s.points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
            .join(" ");
          return (
            <g key={s.name}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} />
              {s.points.length <= 60 &&
                s.points.map((p, i) => (
                  <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.5} fill={s.color} />
                ))}
            </g>
          );
        })}

        {/* Hover guide */}
        {hover && (
          <line x1={sx(hover.x)} y1={PAD.top} x2={sx(hover.x)} y2={H - PAD.bottom} stroke="var(--accent)" strokeDasharray="3 3" />
        )}

        {/* Hit area */}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * W;
            const x = xMin + ((px - PAD.left) / innerW) * (xMax - xMin);
            // Find the point in the first series closest to x.
            const first = series[0]?.points ?? [];
            let best = 0;
            let bestDx = Infinity;
            for (let i = 0; i < first.length; i++) {
              const dx = Math.abs(first[i].x - x);
              if (dx < bestDx) { bestDx = dx; best = i; }
            }
            const px2 = first[best]?.x ?? x;
            setHover({ x: px2, idx: best });
          }}
        />
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "0.5rem", fontSize: "0.85rem" }}>
          {series.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, display: "inline-block" }} />
              <span style={{ color: "var(--muted)" }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hover tooltip */}
      {hover && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.5rem 0.75rem",
            fontSize: "0.85rem",
            pointerEvents: "none",
          }}
        >
          <div style={{ color: "var(--muted)", marginBottom: 4 }}>{formatX(hover.x)}</div>
          {series.map((s) => {
            const p = s.points[hover.idx];
            if (!p) return null;
            return (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <span style={{ color: s.color }}>{s.name}</span>
                <span>{formatY(p.y)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function niceTicks(lo: number, hi: number, count: number): number[] {
  const range = hi - lo;
  if (range === 0) return [lo];
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step: number;
  if (norm < 1.5) step = mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const start = Math.ceil(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= hi + step * 0.001; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

function pickXTicks(xs: number[], count: number): number[] {
  if (xs.length <= count) return [...new Set(xs)].sort((a, b) => a - b);
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(min + ((max - min) / (count - 1)) * i);
  }
  return ticks;
}
