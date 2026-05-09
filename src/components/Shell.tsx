"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/debts", label: "Debts" },
  { href: "/investments", label: "Investments" },
  { href: "/accounts", label: "Accounts" },
  { href: "/paycheck", label: "Paycheck" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, loading, configured, signOutUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/login");
  }, [user, loading, configured, router]);

  if (!configured) {
    return (
      <main style={{ maxWidth: 720, margin: "4rem auto", padding: "2rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h1 style={{ fontSize: "1.4rem", marginBottom: "0.75rem" }}>Firebase not configured</h1>
          <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
            Copy <code>.env.local.example</code> to <code>.env.local</code> and fill in your Firebase
            project credentials, then restart the dev server.
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Create a project at <a href="https://console.firebase.google.com">console.firebase.google.com</a>,
            enable Email/Password auth and Cloud Firestore, and copy the SDK config values.
          </p>
        </div>
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main style={{ maxWidth: 720, margin: "4rem auto", padding: "2rem", color: "var(--muted)" }}>
        Loading...
      </main>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          borderRight: "1px solid var(--border)",
          padding: "1.25rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1.1rem", padding: "0.25rem 0.5rem 1rem" }}>
          Maverick Finance
        </div>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                color: active ? "var(--text)" : "var(--muted)",
                background: active ? "var(--surface-2)" : "transparent",
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: "0.8rem", color: "var(--muted)", padding: "0.5rem", overflow: "hidden", textOverflow: "ellipsis" }}>
          {user.email}
        </div>
        <button
          className="btn"
          onClick={() => {
            void signOutUser();
          }}
        >
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, padding: "2rem", maxWidth: 1100 }}>{children}</main>
    </div>
  );
}
