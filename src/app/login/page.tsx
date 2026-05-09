"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, configured, signIn } = useAuth();
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
      await signIn(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "5rem auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "1.25rem" }}>Sign in</h1>
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
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: "var(--negative)", fontSize: "0.9rem" }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={submitting || !configured}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: "var(--accent)" }}>Sign up</Link>
        </div>
      </form>
    </main>
  );
}
