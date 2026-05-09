"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { user, loading, configured, signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "5rem auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.25rem" }}>Create account</h1>
      {!configured && (
        <p style={{ color: "var(--negative)", marginBottom: "1rem" }}>
          Firebase is not configured. See <code>.env.local.example</code>.
        </p>
      )}
      <form onSubmit={onSubmit} className="card" style={{ padding: "1.25rem", display: "grid", gap: "0.9rem" }}>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="label">Password (6+ characters)</label>
          <input className="input" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: "var(--negative)", fontSize: "0.9rem" }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={submitting || !configured}>
          {submitting ? "Creating..." : "Create account"}
        </button>
        <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
        </div>
      </form>
    </main>
  );
}
