"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import Stat from "@/components/Stat";
import { useAuth } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/db";
import { fmtCurrency, fmtPercent } from "@/lib/format";
import {
  calculatePaycheck,
  DEFAULT_PAYCHECK_SETTINGS,
  FEDERAL_BRACKETS_2025,
  STANDARD_DEDUCTION_2025,
} from "@/lib/tax";
import { STATE_PRESETS, bracketsForPreset } from "@/lib/state-tax";
import type { FilingStatus, Frequency, PaycheckSettings, TaxBracket } from "@/lib/types";

export default function PaycheckPage() {
  return (
    <Shell>
      <Paycheck />
    </Shell>
  );
}

function Paycheck() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PaycheckSettings>(DEFAULT_PAYCHECK_SETTINGS);
  const [annualGross, setAnnualGross] = useState<number>(85000);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const remote = await getSettings<PaycheckSettings & { annualGross?: number }>(user.uid);
      if (remote) {
        setSettings({ ...DEFAULT_PAYCHECK_SETTINGS, ...remote });
        if (typeof remote.annualGross === "number") setAnnualGross(remote.annualGross);
      }
      setLoaded(true);
    })();
  }, [user]);

  const breakdown = useMemo(() => calculatePaycheck(annualGross, settings), [annualGross, settings]);

  function update<K extends keyof PaycheckSettings>(key: K, value: PaycheckSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function applyFilingStatusDefaults(status: FilingStatus) {
    setSettings((s) => {
      const next: PaycheckSettings = {
        ...s,
        filingStatus: status,
        federalBrackets: FEDERAL_BRACKETS_2025[status],
        standardDeduction: STANDARD_DEDUCTION_2025[status],
      };
      // Re-apply the current state preset for the new filing status, if one is selected.
      const preset = STATE_PRESETS.find((p) => p.code === s.statePresetCode);
      if (preset && preset.code !== "CUSTOM") {
        next.stateBrackets = bracketsForPreset(preset, status);
      }
      return next;
    });
  }

  function applyStatePreset(code: string) {
    const preset = STATE_PRESETS.find((p) => p.code === code);
    if (!preset) return;
    setSettings((s) => ({
      ...s,
      statePresetCode: code,
      stateBrackets:
        preset.code === "CUSTOM" ? s.stateBrackets : bracketsForPreset(preset, s.filingStatus),
    }));
  }

  async function onSave() {
    if (!user) return;
    await saveSettings(user.uid, { ...settings, annualGross });
    setSavedAt(new Date().toLocaleTimeString());
  }

  const periodLabel: Record<Frequency, string> = {
    weekly: "weekly",
    biweekly: "biweekly",
    monthly: "monthly",
    quarterly: "quarterly",
    yearly: "yearly",
  };

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Paycheck calculator</h1>
          <p style={{ color: "var(--muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Gross-to-net based on configurable federal/state brackets and FICA.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {savedAt && <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Saved at {savedAt}</span>}
          <button className="btn btn-primary" onClick={onSave} disabled={!loaded}>Save settings</button>
        </div>
      </header>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1.4fr)" }}>
        <div className="card" style={{ padding: "1.25rem", display: "grid", gap: "0.85rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Inputs</h2>
          <div>
            <label className="label">Annual gross salary</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={annualGross}
              onChange={(e) => setAnnualGross(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Pay frequency</label>
            <select
              className="select"
              value={settings.payFrequency}
              onChange={(e) => update("payFrequency", e.target.value as Frequency)}
            >
              <option value="weekly">Weekly (52/yr)</option>
              <option value="biweekly">Biweekly (26/yr)</option>
              <option value="monthly">Monthly (12/yr)</option>
            </select>
          </div>
          <div>
            <label className="label">Filing status</label>
            <select
              className="select"
              value={settings.filingStatus}
              onChange={(e) => applyFilingStatusDefaults(e.target.value as FilingStatus)}
            >
              <option value="single">Single</option>
              <option value="married-joint">Married filing jointly</option>
              <option value="married-separate">Married filing separately</option>
              <option value="head-of-household">Head of household</option>
            </select>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              Resets federal brackets and standard deduction to 2025 defaults.
            </p>
          </div>
          <div>
            <label className="label">Standard deduction</label>
            <input
              className="input"
              type="number"
              step="1"
              value={settings.standardDeduction}
              onChange={(e) => update("standardDeduction", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Pre-tax deductions (annual)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={settings.pretaxDeductionsAnnual}
              onChange={(e) => update("pretaxDeductionsAnnual", Number(e.target.value))}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              401(k), HSA, traditional pre-tax health premiums.
            </p>
          </div>
          <div>
            <label className="label">Post-tax deductions (annual)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={settings.posttaxDeductionsAnnual}
              onChange={(e) => update("posttaxDeductionsAnnual", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Net pay</h2>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <Stat label={`Gross / ${periodLabel[settings.payFrequency]}`} value={fmtCurrency(breakdown.perPeriod.gross)} />
            <Stat label={`Net / ${periodLabel[settings.payFrequency]}`} value={fmtCurrency(breakdown.perPeriod.net)} tone="positive" />
            <Stat label="Annual gross" value={fmtCurrency(breakdown.annual.gross)} />
            <Stat label="Annual net" value={fmtCurrency(breakdown.annual.net)} tone="positive" />
            <Stat label="Effective tax rate" value={fmtPercent(breakdown.annual.effectiveRate)} />
            <Stat label="Federal marginal" value={fmtPercent(breakdown.annual.federalMarginalRate)} />
          </div>

          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th style={{ textAlign: "right" }}>Annual</th>
                <th style={{ textAlign: "right" }}>Per {periodLabel[settings.payFrequency]}</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Gross income" annual={breakdown.annual.gross} period={breakdown.perPeriod.gross} />
              <Row label="Pre-tax deductions" annual={-breakdown.annual.pretaxDeductions} period={-breakdown.perPeriod.pretaxDeductions} negative />
              <Row label="Federal income tax" annual={-breakdown.annual.federalTax} period={-breakdown.perPeriod.federalTax} negative />
              <Row label="State income tax" annual={-breakdown.annual.stateTax} period={-breakdown.perPeriod.stateTax} negative />
              <Row label="Social Security (6.2%)" annual={-breakdown.annual.socialSecurity} period={-breakdown.perPeriod.socialSecurity} negative />
              <Row label="Medicare (1.45%)" annual={-breakdown.annual.medicare} period={-breakdown.perPeriod.medicare} negative />
              {breakdown.annual.additionalMedicare > 0 && (
                <Row label="Additional Medicare (0.9%)" annual={-breakdown.annual.additionalMedicare} period={-breakdown.perPeriod.additionalMedicare} negative />
              )}
              <Row label="Post-tax deductions" annual={-breakdown.annual.posttaxDeductions} period={-breakdown.perPeriod.posttaxDeductions} negative />
              <tr style={{ borderTop: "2px solid var(--border)" }}>
                <td style={{ fontWeight: 600 }}>Take-home</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtCurrency(breakdown.annual.net)}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtCurrency(breakdown.perPeriod.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", marginTop: "1rem" }}>
        <BracketEditor
          title="Federal tax brackets"
          brackets={settings.federalBrackets}
          onChange={(b) => update("federalBrackets", b)}
          help="Edit thresholds (annual) and rates. Lowest bracket should start at 0."
        />
        <BracketEditor
          title="State tax brackets"
          brackets={settings.stateBrackets}
          onChange={(b) => {
            update("stateBrackets", b);
            // Manual edits switch the selector to "Custom" so we don't claim a preset is active.
            if (settings.statePresetCode && settings.statePresetCode !== "CUSTOM") {
              update("statePresetCode", "CUSTOM");
            }
          }}
          help={(() => {
            const preset = STATE_PRESETS.find((p) => p.code === settings.statePresetCode);
            return preset?.notes ?? "Pick a state preset or set a single 0% bracket for no-income-tax states.";
          })()}
          presetSelector={
            <div>
              <label className="label">State preset</label>
              <select
                className="select"
                value={settings.statePresetCode ?? "CUSTOM"}
                onChange={(e) => applyStatePreset(e.target.value)}
              >
                {STATE_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
          }
        />
      </div>

      <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>FICA &amp; thresholds</h2>
        <div style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <NumberField label="Social Security rate" value={settings.ficaSocialSecurityRate * 100} onChange={(v) => update("ficaSocialSecurityRate", v / 100)} suffix="%" />
          <NumberField label="Medicare rate" value={settings.ficaMedicareRate * 100} onChange={(v) => update("ficaMedicareRate", v / 100)} suffix="%" />
          <NumberField label="Additional Medicare rate" value={settings.additionalMedicareRate * 100} onChange={(v) => update("additionalMedicareRate", v / 100)} suffix="%" />
          <NumberField label="Additional Medicare threshold" value={settings.additionalMedicareThreshold} onChange={(v) => update("additionalMedicareThreshold", v)} />
          <NumberField label="Social Security wage base" value={settings.socialSecurityWageBase} onChange={(v) => update("socialSecurityWageBase", v)} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, annual, period, negative }: { label: string; annual: number; period: number; negative?: boolean }) {
  const color = negative ? "var(--negative)" : "var(--text)";
  return (
    <tr>
      <td>{label}</td>
      <td style={{ textAlign: "right", color }}>{fmtCurrency(annual)}</td>
      <td style={{ textAlign: "right", color }}>{fmtCurrency(period)}</td>
    </tr>
  );
}

function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div>
      <label className="label">{label}{suffix ? ` (${suffix})` : ""}</label>
      <input className="input" type="number" step="0.001" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function BracketEditor({
  title,
  brackets,
  onChange,
  help,
  presetSelector,
}: {
  title: string;
  brackets: TaxBracket[];
  onChange: (b: TaxBracket[]) => void;
  help?: string;
  presetSelector?: React.ReactNode;
}) {
  function update(i: number, patch: Partial<TaxBracket>) {
    const next = brackets.map((b, idx) => (idx === i ? { ...b, ...patch } : b));
    onChange(next);
  }
  function add() {
    const last = brackets[brackets.length - 1];
    onChange([...brackets, { min: (last?.min ?? 0) + 10000, rate: last?.rate ?? 0.1 }]);
  }
  function remove(i: number) {
    onChange(brackets.filter((_, idx) => idx !== i));
  }
  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{title}</h2>
        <button className="btn" onClick={add}>+ Add bracket</button>
      </div>
      {help && <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.75rem" }}>{help}</p>}
      {presetSelector && <div style={{ marginBottom: "0.75rem" }}>{presetSelector}</div>}
      <table>
        <thead>
          <tr>
            <th>Income at or above</th>
            <th>Rate (%)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {brackets.map((b, i) => (
            <tr key={i}>
              <td>
                <input
                  className="input"
                  type="number"
                  step="1"
                  value={b.min}
                  onChange={(e) => update(i, { min: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  className="input"
                  type="number"
                  step="0.001"
                  value={b.rate * 100}
                  onChange={(e) => update(i, { rate: Number(e.target.value) / 100 })}
                />
              </td>
              <td style={{ width: 1 }}>
                <button className="btn btn-danger" onClick={() => remove(i)} disabled={brackets.length <= 1}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
