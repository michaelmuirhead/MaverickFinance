"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createDoc, deleteRecord, updateRecord, watchCollection, type CollectionName } from "@/lib/db";
import { fmtCurrency, fmtPercent } from "@/lib/format";

export type FieldType = "text" | "textarea" | "number" | "currency" | "percent" | "select" | "date";

export type FieldDef<T> = {
  name: keyof T & string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: number;
  placeholder?: string;
};

export type ColumnDef<T> = {
  header: string;
  render: (row: T & { id: string }) => React.ReactNode;
  align?: "left" | "right";
};

type Props<T> = {
  title: string;
  description?: string;
  collectionName: CollectionName;
  fields: FieldDef<T>[];
  columns: ColumnDef<T>[];
  emptyDefaults: T;
  computeSummary?: (rows: (T & { id: string })[]) => React.ReactNode;
};

function emptyToInputValue(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function parseFieldValue<T>(field: FieldDef<T>, raw: string): unknown {
  if (raw === "" && !field.required) return undefined;
  switch (field.type) {
    case "number":
    case "currency":
      return raw === "" ? 0 : Number(raw);
    case "percent":
      return raw === "" ? 0 : Number(raw) / 100;
    default:
      return raw;
  }
}

function fieldValueToInput<T>(field: FieldDef<T>, value: unknown): string {
  if (value === undefined || value === null) return "";
  if (field.type === "percent" && typeof value === "number") return String(value * 100);
  return String(value);
}

export default function EntityPage<T extends Record<string, unknown>>(props: Props<T>) {
  const { user } = useAuth();
  const [rows, setRows] = useState<(T & { id: string })[]>([]);
  const [editing, setEditing] = useState<(T & { id?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    return watchCollection<T>(user.uid, props.collectionName, setRows);
  }, [user, props.collectionName]);

  const formValues = useMemo(() => {
    const v: Record<string, string> = {};
    if (editing) {
      for (const f of props.fields) v[f.name] = fieldValueToInput(f, editing[f.name]);
    }
    return v;
  }, [editing, props.fields]);

  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    setDraft(formValues);
  }, [formValues]);

  function startCreate() {
    setEditing({ ...props.emptyDefaults });
    setError(null);
  }

  function startEdit(row: T & { id: string }) {
    setEditing({ ...row });
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !editing) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of props.fields) {
        const parsed = parseFieldValue(f, draft[f.name] ?? "");
        if (parsed !== undefined) payload[f.name] = parsed;
      }
      if (editing.id) {
        await updateRecord(user.uid, props.collectionName, editing.id, payload);
      } else {
        await createDoc(user.uid, props.collectionName, payload);
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!user) return;
    if (!confirm("Delete this entry?")) return;
    await deleteRecord(user.uid, props.collectionName, id);
  }

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>{props.title}</h1>
          {props.description && (
            <p style={{ color: "var(--muted)", marginTop: "0.25rem", fontSize: "0.9rem" }}>{props.description}</p>
          )}
        </div>
        <button className="btn btn-primary" onClick={startCreate}>+ Add</button>
      </header>

      {props.computeSummary && rows.length > 0 && (
        <div className="card" style={{ padding: "1rem", marginBottom: "1rem" }}>
          {props.computeSummary(rows)}
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            No entries yet. Click <strong>Add</strong> to get started.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {props.columns.map((c) => (
                  <th key={c.header} style={{ textAlign: c.align ?? "left" }}>{c.header}</th>
                ))}
                <th style={{ width: 1 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {props.columns.map((c) => (
                    <td key={c.header} style={{ textAlign: c.align ?? "left" }}>{c.render(row)}</td>
                  ))}
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn" onClick={() => startEdit(row)} style={{ marginRight: 6 }}>Edit</button>
                    <button className="btn btn-danger" onClick={() => onDelete(row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div
          onClick={() => !busy && setEditing(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{ padding: "1.5rem", width: "100%", maxWidth: 520, display: "grid", gap: "0.85rem" }}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
              {editing.id ? "Edit" : "New"} {props.title.replace(/s$/i, "").toLowerCase()}
            </h2>
            {props.fields.map((f) => (
              <div key={f.name}>
                <label className="label">{f.label}{f.required && " *"}</label>
                {f.type === "select" ? (
                  <select
                    className="select"
                    value={draft[f.name] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
                    required={f.required}
                  >
                    <option value="" disabled>Select...</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    className="textarea"
                    rows={3}
                    value={draft[f.name] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
                    required={f.required}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    className="input"
                    type={f.type === "date" ? "date" : f.type === "text" ? "text" : "number"}
                    step={f.step ?? (f.type === "currency" ? "0.01" : f.type === "percent" ? "0.01" : undefined)}
                    value={draft[f.name] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
                    required={f.required}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
            {error && <div style={{ color: "var(--negative)", fontSize: "0.9rem" }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button type="button" className="btn" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export const renderHelpers = { fmtCurrency, fmtPercent };
