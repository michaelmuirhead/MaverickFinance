# Maverick Finance

A personal finance tracker for subscriptions, debts, investments, and bank accounts, with a paycheck/tax-bracket calculator.

Built with Next.js 15 (App Router), TypeScript, and Firebase (Auth + Firestore).

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Firebase project at https://console.firebase.google.com
   - Enable **Authentication** → Email/Password.
   - Enable **Cloud Firestore** (start in production mode; rules below).
3. Copy environment template and fill in your project's web app config:
   ```
   cp .env.local.example .env.local
   ```
4. Run the dev server:
   ```
   npm run dev
   ```
   Open http://localhost:3000.

## Suggested Firestore security rules

Each user can only read/write their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Features

- **Dashboard** – net worth, cash, investments, debts, monthly outflows. **Take snapshots** to track net worth (with cash/investments/debt breakdown) over time on a line chart.
- **Subscriptions** – recurring services with frequency, monthly/yearly cost rollups, **spend-by-category** breakdown chart.
- **Debts** – credit cards, loans, mortgages with balances, APR, minimum payments, weighted average APR. Includes a **payoff projection** comparing avalanche (highest APR first) vs snowball (smallest balance first) with an extra-payment input.
- **Investments** – portfolio holdings with cost basis, current price, gain/loss.
- **Bank accounts** – checking/savings/CDs with balances and APY.
- **Paycheck calculator** – gross-to-net using configurable federal/state tax brackets, FICA (Social Security, Medicare, Additional Medicare), pre/post-tax deductions, standard deduction. Includes **state tax presets** for all 50 states (no-tax, flat, and progressive). Defaults seeded with 2025 US brackets.

## Data model

All data is stored under `users/{uid}/...` in Firestore:

- `users/{uid}/subscriptions/{id}`
- `users/{uid}/debts/{id}`
- `users/{uid}/investments/{id}`
- `users/{uid}/accounts/{id}`
- `users/{uid}/snapshots/{id}` – `{ takenAt, cash, investments, debts, netWorth }`
- `users/{uid}/settings/paycheck`
