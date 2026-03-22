# Maverick Finance

Your budget, your way — a comprehensive personal finance app built with React.

## Features

- **Paycheck Planner** — Map out every paycheck for the month with a running balance. Items sort chronologically so you can see exactly which paycheck covers which bills. Drag-to-reorder on desktop and mobile (touch support for iPhone/iPad).
- **Recurring Bills** — Track bills with due dates, categories, and automatic integration into the planner and expenses views.
- **Debt Snowball / Avalanche** — Manage debts with minimum payments, extra payments, and payoff simulations with an interactive slider.
- **Savings Goals** — Set targets and monthly contributions with progress tracking.
- **Subscriptions** — Track active subscriptions by frequency (weekly, monthly, quarterly, yearly) with automatic expense and planner integration.
- **Expenses** — View all expenses for the month in one place — recurring bills, debts, savings, subscriptions, and manual entries — with category breakdowns and pie/bar charts.
- **Net Worth Tracker** — Track assets and liabilities over time with milestone markers.
- **Cash Flow** — Visualize income vs. expenses with area charts and trend analysis.
- **Wishlist** — Save and prioritize future purchases.
- **Bill Calendar** — Monthly calendar view showing when bills are due and paychecks arrive.
- **Tax Estimator** — Estimate federal and state taxes based on income, filing status, and deductions.
- **Global Search** — Search across all tabs from the header.
- **Guided Tutorial** — 10-step walkthrough of every feature, accessible from Settings.

## Themes

Includes 15+ visual themes: Default, Pip-Boy, LEGO, Comic Book, Typewriter, Papyrus, Lionheart, The 1950s, Cyberpunk, Minimalist, Dark Academia, Retro Terminal, Pokémon (with Master Ball dark mode variant), and more.

## Cloud Sync

Optional Firebase integration for cross-device sync via Google sign-in. Works entirely offline with localStorage when Firebase is not configured. The app uses lazy dynamic imports so Firebase never blocks loading — it gracefully falls back to local-only mode in environments where Firebase isn't available.

## PWA / Mobile

- Installable as a Progressive Web App on iOS and Android
- Displays as "Maverick Finance" on the home screen
- Full-screen mobile layout with safe-area inset support for iPhone notch and home indicator
- Touch-based drag-to-reorder in the planner
- Swipe-left on planner items to reveal actions (mark paid, copy, add note, delete)

## Pay Frequencies

Supports weekly, biweekly, semi-monthly (1st and 15th — if either falls on a weekend, paid the preceding Friday), and monthly pay schedules.

## Tech Stack

- **React 18** with hooks (useState, useMemo, useEffect, useRef) — single-file component (~6600 lines)
- **Recharts** for charts and visualizations
- **Lucide React** for icons
- **Tailwind CSS 3** for styling
- **Vite** for development and builds
- **Firebase** (optional) for authentication and Firestore cloud sync

## Getting Started

```bash
npm install
npm run dev
```

To deploy:

```bash
npm run build
```

The build output in `dist/` can be deployed to Vercel, Netlify, or any static host.

## Firebase Setup (Optional)

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable Google sign-in under Authentication → Sign-in method
3. Create a Firestore database
4. Copy your web app config into the `FIREBASE_CONFIG` object in `PaycheckPlanner.jsx`
5. Add your deployment domain to Authentication → Settings → Authorized domains

## License

MIT
