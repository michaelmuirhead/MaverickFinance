# MaverickFinance

A comprehensive personal budget and finance app built with React. Track your income, expenses, bills, debts, savings goals, subscriptions, and net worth — all in one place.

## Features

### Core Budget Management
- **Dashboard** — Monthly overview with income vs. expenses, category breakdown donut chart, budget alerts, and smart suggestions
- **Planner** — Fudget-style line-item budget with drag-to-reorder, paid/dismissed status, and running balance
- **Expenses** — Track one-off expenses with description, merchant, amount, category, and date. Swipe-to-edit/delete on mobile
- **Recurring Bills** — Manage monthly bills with due days, categories, autopay status, and paycheck assignment
- **Bill Calendar** — Visual month calendar showing bills, debts, subscriptions, and paydays at a glance

### Income & Pay
- **Multiple Income Sources** — Support for weekly, biweekly, semi-monthly, and monthly pay frequencies
- **Pay Calculator** — Hourly rate calculator with auto tax estimation (2026 federal brackets, all 50 states + DC)
- **Semi-Monthly Logic** — Pays on 15th and last day of month with weekend-to-Friday adjustment
- **Paycheck Overrides** — Edit individual paycheck amounts and add one-off bonus checks

### Debt & Savings
- **Debt Tracker** — Track balances, interest rates, minimum/extra payments with frequency and due dates
- **Debt Payoff Simulator** — Avalanche vs. Snowball strategy comparison with projected payoff dates
- **Savings Goals** — Set targets with monthly contributions, track progress, and log deposits/withdrawals
- **Swipe Actions** — Edit and delete debts and savings goals with swipe-left gestures

### Subscriptions
- **Subscription Tracker** — Manage all recurring subscriptions (monthly, yearly, weekly, quarterly)
- **Annual Rollup** — See total monthly and yearly subscription cost with income percentage
- **Pause/Resume** — Temporarily pause subscriptions to track savings from cancelled services
- **Category Breakdown** — Donut chart showing subscription spend by category

### Financial Health
- **Net Worth Tracker** — Assets, liabilities, and net worth history with milestone tracking
- **Financial Health Score** — Overall score based on savings rate, debt-to-income, and emergency fund coverage
- **Cash Flow Forecast** — 30/60/90-day projected balance based on recurring income and expenses

### Spending Insights
- **50/30/20 Report Card** — Needs/Wants/Savings breakdown graded against the 50/30/20 rule
- **Month-over-Month Comparison** — Spending trend with percentage change and dollar difference
- **Top Merchants** — Ranked list of where you spend the most with transaction counts
- **Category Trends** — Which categories went up or down vs. last month
- **Budget Adherence** — Progress bars showing how close you are to each category budget
- **Achievements** — Streaks, goals hit, paused subs savings, and savings rate badges

### Year in Review
- **Annual Summary** — Total income, expenses, savings, and net for the full year
- **Year-over-Year Comparison** — Current year vs. previous year with percentage changes
- **Monthly Trend Charts** — Area chart showing income and expenses across all 12 months

### Customization
- **8 Visual Themes** — Default, Pip-Boy (CRT terminal), LEGO, Comic Book, Newspaper, Papyrus, Lionheart, The 1950s
- **Dark Mode** — Full dark mode support across all tabs and components
- **Custom Categories** — Add your own expense categories with custom colors
- **Budget Targets** — Set spending limits per category with progress tracking

### Data & Setup
- **Onboarding Wizard** — 5-step guided setup for new users (income, bills, savings)
- **localStorage Persistence** — All data auto-saves locally and restores on reload
- **Import/Export** — Full JSON backup and restore of all budget data
- **Global Search** — Search across all tabs for bills, expenses, goals, debts, and more

## Tech Stack

- **React** with hooks (useState, useMemo, useEffect)
- **Tailwind CSS** for styling
- **Recharts** for charts and data visualization
- **Lucide React** for icons
- **Single-file architecture** — entire app in one `.jsx` component

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/maverick-finance.git
cd maverick-finance
npm install
npm run dev
```

### Deployment

The app is configured for deployment on Vercel:

```bash
npm run build
```

Or connect your GitHub repo to Vercel for automatic deployments on push.

### PWA Support

MaverickFinance includes a web app manifest and icons for adding to your home screen on mobile devices. After deploying, visit your app URL in Safari or Chrome and use "Add to Home Screen" for a native app experience.

## Project Structure

```
paycheck-planner-app/
  public/
    manifest.json          # PWA manifest
    icon-512.svg           # App icon (SVG source)
    icon-512.png           # App icon (512x512)
    icon-192.png           # App icon (192x192)
    apple-touch-icon.png   # iOS home screen icon
    favicon-32.png         # Browser favicon
  src/
    PaycheckPlanner.jsx    # Main app component (single file)
    main.jsx               # React entry point
  index.html
  package.json
  vite.config.js
```

## Roadmap

- [ ] Firebase cloud sync (Google Sign-In + Firestore)
- [ ] Receipt photo capture with OCR
- [ ] Shared/split expenses with partner
- [ ] Financial goal celebrations with confetti
- [ ] Budget templates (zero-based, bare-bones survival)
- [ ] CSV import from bank statements

## License

MIT
