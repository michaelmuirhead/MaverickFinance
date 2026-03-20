import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Landmark, CreditCard, PiggyBank, Calendar, Plus, Trash2, Check, X, AlertCircle, Target, Wallet, Bell, ChevronLeft, ChevronRight, BarChart3, Zap, ClipboardList, Copy, CheckCircle, Circle, GripVertical, Sun, Moon, Settings, Download, Upload, StickyNote, Calculator, Clock, Heart, Shield, Search, ChevronDown, Minus, ArrowDownCircle, ArrowUpCircle, GitBranch, Repeat, Eye, Sparkles, CalendarDays } from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));
const uid = () => Math.random().toString(36).slice(2, 10);
const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const daysBetween = (a, b) => Math.round((b - a) / 86400000);

const PAY_FREQUENCIES = [
  { label: "Weekly", value: "weekly", days: 7 },
  { label: "Biweekly", value: "biweekly", days: 14 },
  { label: "Semi-monthly", value: "semimonthly", days: 0 },
  { label: "Monthly", value: "monthly", days: 0 },
];

const EXPENSE_CATEGORIES = [
  "Housing", "Utilities", "Transportation", "Food & Groceries",
  "Insurance", "Healthcare", "Entertainment", "Subscriptions",
  "Personal Care", "Education", "Childcare", "Clothing", "Debt Payment", "Savings", "Other"
];

const COLORS = [
  "#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e",
  "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#a855f7", "#64748b"
];

const THEMES = {
  default: { name: "Default", emoji: "🎨", bg: "", cardClass: "", headerClass: "", textClass: "", accentColor: "#6366f1", fontFamily: "", borderStyle: "", specialEffect: "" },
  pipboy: { name: "Pip-Boy", emoji: "☢️", bg: "bg-black", cardClass: "border-green-500/30 bg-black/80 shadow-[0_0_15px_rgba(0,255,0,0.08)]", headerClass: "bg-black/95 border-green-500/30", textClass: "text-green-400", accentColor: "#00ff00", fontFamily: "'Share Tech Mono', 'Courier New', monospace", borderStyle: "border-green-500/20", specialEffect: "pipboy" },
  lego: { name: "LEGO", emoji: "🧱", bg: "bg-yellow-50", cardClass: "border-2 border-red-400 bg-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]", headerClass: "bg-red-600 border-red-700", textClass: "text-red-700", accentColor: "#dc2626", fontFamily: "'Arial Black', sans-serif", borderStyle: "border-red-400", specialEffect: "lego" },
  comic: { name: "Comic Book", emoji: "💥", bg: "bg-sky-300", cardClass: "border-[3px] border-black bg-yellow-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded-none", headerClass: "bg-red-600 border-black border-b-[3px]", textClass: "text-black", accentColor: "#dc2626", fontFamily: "'Bangers', 'Comic Sans MS', cursive", borderStyle: "border-black border-2", specialEffect: "comic" },
  newspaper: { name: "Newspaper", emoji: "📰", bg: "bg-amber-50", cardClass: "border border-amber-900/20 bg-amber-50/50 shadow-none", headerClass: "bg-amber-100/80 border-amber-900/20", textClass: "text-amber-950", accentColor: "#78350f", fontFamily: "'Georgia', 'Times New Roman', serif", borderStyle: "border-amber-900/20", specialEffect: "newspaper" },
  papyrus: { name: "Papyrus", emoji: "🏺", bg: "bg-amber-100", cardClass: "border border-amber-700/30 bg-gradient-to-b from-amber-100 to-amber-200/60 shadow-inner", headerClass: "bg-amber-200/80 border-amber-700/30", textClass: "text-amber-900", accentColor: "#b45309", fontFamily: "'Palatino Linotype', 'Book Antiqua', serif", borderStyle: "border-amber-700/30", specialEffect: "papyrus" },
  lionheart: { name: "Lionheart", emoji: "🦁", bg: "bg-red-950", cardClass: "border border-yellow-600/40 bg-red-950/80 shadow-lg shadow-yellow-900/10", headerClass: "bg-red-950/90 border-yellow-600/40", textClass: "text-yellow-100", accentColor: "#ca8a04", fontFamily: "'Palatino Linotype', serif", borderStyle: "border-yellow-600/30", specialEffect: "lionheart" },
  fifties: { name: "The 1950s", emoji: "🎸", bg: "bg-pink-50", cardClass: "border-2 border-pink-300 bg-white rounded-2xl shadow-md", headerClass: "bg-gradient-to-r from-pink-400 via-sky-300 to-mint-300 border-pink-300", textClass: "text-pink-800", accentColor: "#ec4899", fontFamily: "'Georgia', serif", borderStyle: "border-pink-300", specialEffect: "fifties" },
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Wallet },
  { id: "planner", label: "Planner", icon: ClipboardList },
  { id: "bills", label: "Bills", icon: Calendar },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "debt", label: "Debt", icon: CreditCard },
  { id: "networth", label: "Net Worth", icon: Landmark },
  { id: "paycalc", label: "Pay Calc", icon: Calculator },
  { id: "health", label: "Health", icon: Heart },
  { id: "flow", label: "Flow", icon: GitBranch },
  { id: "subscriptions", label: "Subs", icon: Repeat },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "yearly", label: "Year", icon: BarChart3 },
];

// ─── Generate paycheck dates for a given month ────────────────────────────
function generatePayDates(source, year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const results = [];

  if (source.frequency === "monthly") {
    // Pay on the reference day each month (or last day if month is shorter)
    const refDay = new Date(source.referenceDate + "T12:00:00").getDate();
    const day = Math.min(refDay, lastOfMonth.getDate());
    results.push(new Date(year, month, day));
  } else if (source.frequency === "semimonthly") {
    // Semi-monthly: 15th and last day of month
    // If 15th falls on Saturday → Friday the 14th; Sunday → Friday the 13th
    const adjustForWeekend = (d) => {
      const dow = d.getDay(); // 0=Sun, 6=Sat
      if (dow === 6) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1); // Sat→Fri
      if (dow === 0) return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 2); // Sun→Fri
      return d;
    };
    const mid = adjustForWeekend(new Date(year, month, 15));
    const last = adjustForWeekend(lastOfMonth);
    results.push(mid);
    if (last.getTime() !== mid.getTime()) results.push(last);
  } else {
    // weekly or biweekly — chain from reference date
    const ref = new Date(source.referenceDate + "T12:00:00");
    const interval = source.frequency === "weekly" ? 7 : 14;

    // Find the first occurrence on or after the start of month
    const diffDays = daysBetween(ref, firstOfMonth);
    let stepsNeeded = Math.floor(diffDays / interval);
    if (stepsNeeded * interval < diffDays) stepsNeeded++;
    // Could also be negative if ref is in the future
    let cursor = new Date(ref.getTime() + stepsNeeded * interval * 86400000);

    // Step back one interval if we overshot, then scan forward
    if (cursor > lastOfMonth) return results;
    if (cursor < firstOfMonth) cursor = new Date(cursor.getTime() + interval * 86400000);

    while (cursor <= lastOfMonth) {
      if (cursor >= firstOfMonth) {
        results.push(new Date(cursor));
      }
      cursor = new Date(cursor.getTime() + interval * 86400000);
    }
  }
  return results;
}

// ─── Reusable UI Components ───────────────────────────────────────────────
function Card({ children, className = "", darkMode = false, themeCard = "" }) {
  return <div className={`${themeCard ? themeCard : (darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100')} rounded-2xl shadow-sm border p-5 ${className}`}>{children}</div>;
}

function StatCard({ icon: Icon, label, value, sub, color = "indigo", darkMode = false, themeCard = "" }) {
  const bgMap = { indigo: "bg-indigo-50", green: "bg-emerald-50", amber: "bg-amber-50", rose: "bg-rose-50", cyan: "bg-cyan-50" };
  const txtMap = { indigo: "text-indigo-600", green: "text-emerald-600", amber: "text-amber-600", rose: "text-rose-600", cyan: "text-cyan-600" };
  return (
    <Card darkMode={darkMode} themeCard={themeCard}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${bgMap[color]}`}>
          <Icon size={18} className={`sm:w-5 sm:h-5 ${txtMap[color]}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] sm:text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wide`}>{label}</p>
          <p className={`text-base sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-0.5 break-all sm:break-normal`}>{value}</p>
          {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

function ProgressBar({ value, max, color = "#6366f1", height = 8 }) {
  const p = pct(value, max);
  return (
    <div className="w-full rounded-full bg-gray-100" style={{ height }}>
      <div className="rounded-full transition-all duration-500" style={{ width: `${Math.min(p, 100)}%`, height, backgroundColor: color }} />
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon size={40} strokeWidth={1.2} />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}

// ─── Swipeable Row (touch + mouse drag to reveal actions) ─────────────────
function SwipeRow({ children, actions, isOpen, onToggle, darkMode }) {
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const actionsWidth = actions.length * 64; // 64px per action button

  const handleStart = (x) => { setStartX(x); setDragging(true); };
  const handleMove = (x) => {
    if (!dragging || startX === null) return;
    const diff = x - startX;
    if (isOpen) {
      // Already open — allow dragging right to close
      const newX = Math.max(-actionsWidth, Math.min(0, -actionsWidth + diff));
      setDragX(newX);
    } else {
      // Closed — only allow dragging left to open
      const newX = Math.min(0, Math.max(-actionsWidth, diff));
      setDragX(newX);
    }
  };
  const handleEnd = () => {
    if (!dragging) return;
    setDragging(false);
    setStartX(null);
    const threshold = actionsWidth / 3;
    if (isOpen) {
      // If dragged right past threshold, close
      if (dragX > -actionsWidth + threshold) { setDragX(0); onToggle(false); }
      else { setDragX(-actionsWidth); }
    } else {
      // If dragged left past threshold, open
      if (dragX < -threshold) { setDragX(-actionsWidth); onToggle(true); }
      else { setDragX(0); }
    }
  };

  // Sync position when isOpen changes externally
  const targetX = isOpen ? -actionsWidth : 0;
  const displayX = dragging ? dragX : targetX;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Actions revealed behind */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch" style={{ width: actionsWidth }}>
        {actions.map((action, i) => (
          <button key={i} onClick={() => { action.onClick(); onToggle(false); }}
            className={`flex flex-col items-center justify-center gap-1 text-white text-[10px] font-semibold ${action.className}`}
            style={{ width: 64 }}>
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      {/* Main content — slides left */}
      <div
        className={`relative z-10 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
        style={{ transform: `translateX(${displayX}px)`, transition: dragging ? "none" : "transform 0.25s ease-out" }}
        onTouchStart={(e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; handleStart(e.touches[0].clientX); }}
        onTouchMove={(e) => { if (startX !== null) handleMove(e.touches[0].clientX); }}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; e.preventDefault(); handleStart(e.clientX); }}
        onMouseMove={(e) => { if (dragging) handleMove(e.clientX); }}
        onMouseUp={handleEnd}
        onMouseLeave={() => { if (dragging) handleEnd(); }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────

// ─── Helper: Build planner items for a given month (avoids duplication) ────
function buildPlannerItemsForMonth(year, month, incomeSources, bills, debts, goals, extraChecks, incomeOverrides, plannerDismissedByMonth) {
  const key = monthKey(year, month);
  const dismissed = plannerDismissedByMonth[key] || [];
  const overrides = incomeOverrides[key] || {};
  
  const autoItems = [];
  // Income from paychecks
  incomeSources.forEach((src) => {
    const dates = generatePayDates(src, year, month);
    dates.forEach((d) => {
      const checkId = `${src.id}-${d.toISOString()}`;
      const pid = `planner-income-${checkId}`;
      const amt = overrides[checkId] !== undefined ? overrides[checkId] : src.amount;
      autoItems.push({ id: pid, amount: amt, type: "income", paid: false });
    });
  });
  // Extra checks
  const extras = extraChecks[key] || [];
  extras.forEach((e) => {
    const pid = `planner-income-${e.id}`;
    autoItems.push({ id: pid, amount: e.amount, type: "income", paid: false });
  });
  // Bills
  bills.forEach((b) => {
    autoItems.push({ id: `planner-bill-${b.id}`, amount: b.amount, type: "expense", paid: false });
  });
  // Debts
  debts.forEach((d) => {
    autoItems.push({ id: `planner-debt-${d.id}`, amount: d.minPayment + d.extraPayment, type: "expense", paid: false });
  });
  // Savings
  goals.filter((g) => g.monthlyContribution > 0).forEach((g) => {
    autoItems.push({ id: `planner-savings-${g.id}`, amount: g.monthlyContribution, type: "expense", paid: false });
  });
  
  return { autoItems, dismissed };
}

// ─── LocalStorage persistence ───
const STORAGE_KEY = "maverick-finance-data";
const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const savedData = loadSaved();
const init = (key, fallback) => savedData && savedData[key] !== undefined ? savedData[key] : fallback;

export default function PaycheckPlanner() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  
  // ─── Feature 5: Dark mode ───
  const [darkMode, setDarkMode] = useState(init("darkMode", false));
  const dm = (light, dark) => darkMode ? dark : light;

  // ─── Theme system ───
  const [activeTheme, setActiveTheme] = useState(init("activeTheme", "default"));
  const theme = THEMES[activeTheme] || THEMES.default;
  const isThemed = activeTheme !== "default";
  
  // ─── Onboarding wizard ───
  const [onboardingStep, setOnboardingStep] = useState(0); // 0 = not started / done
  const [showOnboarding, setShowOnboarding] = useState(!savedData); // auto-show on first visit only
  const [onboardingData, setOnboardingData] = useState({
    name: "", payAmount: "", payFrequency: "biweekly", referenceDate: "",
    rent: "", rentDay: 1, carPayment: "", carDay: 5, utilities: "", utilDay: 15,
    savingsGoal: "", savingsMonthly: ""
  });

  // ─── Feature 2: Dismissed suggestions ───
  const [dismissedSuggestions, setDismissedSuggestions] = useState({});
  
  // ─── Feature 3: Custom categories ───
  const [customCategories, setCustomCategories] = useState(init("customCategories",
    EXPENSE_CATEGORIES.map(name => ({ name, color: COLORS[EXPENSE_CATEGORIES.indexOf(name) % COLORS.length] }))
  ));
  const [newCatDraft, setNewCatDraft] = useState(null);

  // ─── Feature 4: Import/Export ───
  // (added implicitly via export/import functions)

  // ─── Feature 6: Planner notes ───
  const [plannerNotesByMonth, setPlannerNotesByMonth] = useState(init("plannerNotesByMonth", {}));
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  
  // ─── Feature 7: Budget targets per category ───
  const [categoryBudgets, setCategoryBudgets] = useState(init("categoryBudgets", {
    "Food & Groceries": 500,
    "Entertainment": 200,
    "Transportation": 300,
  }));
  const [budgetDraft, setBudgetDraft] = useState(null);
  const [editingBudgetCat, setEditingBudgetCat] = useState(null);
  const [tab, setTab] = useState("dashboard");

  // ── Month navigation ──
  const goMonth = (dir) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const vKey = monthKey(viewYear, viewMonth);

  // ═══════════════════════════════════════════════════════════════════════
  // RECURRING DATA (templates that repeat every month)
  // ═══════════════════════════════════════════════════════════════════════

  // Income sources — define frequency + a reference pay date to anchor from
  const [incomeSources, setIncomeSources] = useState(init("incomeSources", [
    { id: uid(), name: "Primary Job", amount: 2560, frequency: "biweekly", referenceDate: "2026-03-07" },
  ]));
  const [incomeDraft, setIncomeDraft] = useState(null);

  // Recurring bills
  const [bills, setBills] = useState(init("bills", [
    { id: uid(), name: "Rent", amount: 1200, dueDay: 1, category: "Housing", autopay: true },
    { id: uid(), name: "Electric", amount: 120, dueDay: 15, category: "Utilities", autopay: false },
    { id: uid(), name: "Car Payment", amount: 350, dueDay: 5, category: "Transportation", autopay: true },
    { id: uid(), name: "Internet", amount: 65, dueDay: 20, category: "Utilities", autopay: true },
  ]));
  const [billDraft, setBillDraft] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Savings goals (recurring monthly contribution)
  const [goals, setGoals] = useState(init("goals", [
    { id: uid(), name: "Emergency Fund", target: 10000, saved: 3500, monthlyContribution: 200, color: "#6366f1" },
    { id: uid(), name: "Vacation", target: 3000, saved: 850, monthlyContribution: 150, color: "#22d3ee" },
  ]));
  const [goalDraft, setGoalDraft] = useState(null);
  const [savingsTransactions, setSavingsTransactions] = useState(init("savingsTransactions", {}));
  const [savingsWithdrawDraft, setSavingsWithdrawDraft] = useState(null);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  // Debts (recurring payments)
  const [debts, setDebts] = useState(init("debts", [
    { id: uid(), name: "Student Loan", balance: 18500, rate: 5.5, minPayment: 220, extraPayment: 0, frequency: "monthly", dueDay: 15 },
    { id: uid(), name: "Credit Card", balance: 3200, rate: 19.99, minPayment: 75, extraPayment: 50, frequency: "monthly", dueDay: 1 },
  ]));
  const [debtDraft, setDebtDraft] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════
  // MONTH-SPECIFIC DATA (one-off expenses stored per month key)
  // ═══════════════════════════════════════════════════════════════════════
  const [expensesByMonth, setExpensesByMonth] = useState(init("expensesByMonth", {
    "2026-03": [
      { id: uid(), description: "Groceries", amount: 85, category: "Food & Groceries", date: "2026-03-15", merchant: "Kroger" },
      { id: uid(), description: "Gas", amount: 45, category: "Transportation", date: "2026-03-14", merchant: "Shell" },
      { id: uid(), description: "Netflix", amount: 15.99, category: "Subscriptions", date: "2026-03-01", merchant: "Netflix" },
      { id: uid(), description: "Haircut", amount: 30, category: "Personal Care", date: "2026-03-10", merchant: "Great Clips" },
    ],
  }));
  const [expDraft, setExpDraft] = useState(null);

  // Quick-add floating expense
  const [quickAdd, setQuickAdd] = useState(null);

  // Per-month overrides for generated paycheck amounts { "2026-03": { "srcId-isoDate": 2400 } }
  const [incomeOverrides, setIncomeOverrides] = useState(init("incomeOverrides", {}));
  const [editingCheckId, setEditingCheckId] = useState(null);
  const [editingCheckAmount, setEditingCheckAmount] = useState("");

  // One-off bonus / extra paychecks per month (on top of recurring)
  const [extraChecks, setExtraChecks] = useState(init("extraChecks", {}));
  const [extraCheckDraft, setExtraCheckDraft] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════
  // PLANNER (Fudget-style) — line-item budget per month
  // ═══════════════════════════════════════════════════════════════════════
  // Manual items added directly in planner (user-created only)
  const [plannerManualByMonth, setPlannerManualByMonth] = useState(init("plannerManualByMonth", {}));
  // Dismissed auto-generated items per month { "2026-03": ["planner-income-srcId-iso", ...] }
  const [plannerDismissedByMonth, setPlannerDismissedByMonth] = useState(init("plannerDismissedByMonth", {}));
  // Paid status for auto-generated items { "2026-03": { "planner-income-srcId-iso": true } }
  const [plannerPaidByMonth, setPlannerPaidByMonth] = useState(init("plannerPaidByMonth", {}));
  const [plannerDraft, setPlannerDraft] = useState(null);
  const [swipedItemId, setSwipedItemId] = useState(null);
  const [plannerOrderByMonth, setPlannerOrderByMonth] = useState(init("plannerOrderByMonth", {}));
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);

  // State for donut chart category drill-down
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [simExtraPayment, setSimExtraPayment] = useState(0);

  // ═══════════════════════════════════════════════════════════════════════
  // NET WORTH TRACKER
  // ═══════════════════════════════════════════════════════════════════════
  const [assets, setAssets] = useState(init("assets", [
    { id: uid(), name: "Checking Account", category: "Cash", balance: 2500 },
    { id: uid(), name: "Savings Account", category: "Cash", balance: 8500 },
    { id: uid(), name: "401(k)", category: "Investments", balance: 24000 },
  ]));
  const [assetDraft, setAssetDraft] = useState(null);
  const [liabilities, setLiabilities] = useState(init("liabilities", []));
  const [liabilityDraft, setLiabilityDraft] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState(init("netWorthHistory", []));
  const [nwMilestones, setNwMilestones] = useState(init("nwMilestones", [
    { id: uid(), label: "$50K", target: 50000 },
    { id: uid(), label: "$100K", target: 100000 },
  ]));
  const [milestoneDraft, setMilestoneDraft] = useState(null);
  const [balanceHistory, setBalanceHistory] = useState(init("balanceHistory", {}));

  // ═══════════════════════════════════════════════════════════════════════
  // PAY CALCULATOR
  // ═══════════════════════════════════════════════════════════════════════
  const [payCalcEntries, setPayCalcEntries] = useState(init("payCalcEntries", []));
  const [payCalcDraft, setPayCalcDraft] = useState(null);
  const [payCalcSettings, setPayCalcSettings] = useState(init("payCalcSettings", {
    hourlyRate: 15, federalRate: 12, stateRate: 5, ficaRate: 7.65, otRate: 1.5,
    preTaxDeductions: 0, name: "Partner", filingStatus: "single", state: "TX",
    hoursPerWeek: 40, weeksPerYear: 52, autoTax: true, householdIncome: 0
  }));

  // ═══════════════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS TRACKER
  // ═══════════════════════════════════════════════════════════════════════
  const [subscriptions, setSubscriptions] = useState(init("subscriptions", [
    { id: uid(), name: "Netflix", amount: 15.99, frequency: "monthly", category: "Entertainment", nextBillDate: "2026-04-01", active: true },
    { id: uid(), name: "Spotify", amount: 10.99, frequency: "monthly", category: "Entertainment", nextBillDate: "2026-04-05", active: true },
  ]));
  const [subDraft, setSubDraft] = useState(null);
  const [editingSubId, setEditingSubId] = useState(null);
  const addSub = (s) => { setSubscriptions([...subscriptions, { ...s, id: uid(), active: true }]); setSubDraft(null); setEditingSubId(null); };
  const removeSub = (id) => setSubscriptions(subscriptions.filter(s => s.id !== id));
  const updateSub = (id, updates) => { setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, ...updates } : s)); setEditingSubId(null); setSubDraft(null); };
  const startEditSub = (s) => { setSubDraft({ name: s.name, amount: s.amount, frequency: s.frequency, category: s.category, nextBillDate: s.nextBillDate }); setEditingSubId(s.id); };
  const toggleSub = (id) => setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, active: !s.active } : s));

  // Bill Calendar view mode
  const [billCalendarView, setBillCalendarView] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH
  // ═══════════════════════════════════════════════════════════════════════
  const [globalSearch, setGlobalSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // ─── Auto-save to localStorage ───
  useEffect(() => {
    try {
      const data = {
        incomeSources, bills, goals, debts, expensesByMonth, extraChecks, incomeOverrides,
        plannerManualByMonth, plannerDismissedByMonth, plannerPaidByMonth, plannerNotesByMonth,
        customCategories, categoryBudgets, darkMode, activeTheme,
        assets, liabilities, netWorthHistory, nwMilestones, balanceHistory,
        payCalcEntries, payCalcSettings, savingsTransactions, plannerOrderByMonth, subscriptions
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* storage full or unavailable — silent fail */ }
  }, [incomeSources, bills, goals, debts, expensesByMonth, extraChecks, incomeOverrides,
    plannerManualByMonth, plannerDismissedByMonth, plannerPaidByMonth, plannerNotesByMonth,
    customCategories, categoryBudgets, darkMode, activeTheme,
    assets, liabilities, netWorthHistory, nwMilestones, balanceHistory,
    payCalcEntries, payCalcSettings, savingsTransactions, plannerOrderByMonth, subscriptions]);

  // ═══════════════════════════════════════════════════════════════════════
  // DERIVED DATA for the viewed month
  // ═══════════════════════════════════════════════════════════════════════

  // Generate paychecks for viewed month from all income sources
  const monthOverrides = incomeOverrides[vKey] || {};
  const monthPaychecks = useMemo(() => {
    const generated = [];
    incomeSources.forEach((src) => {
      const dates = generatePayDates(src, viewYear, viewMonth);
      dates.forEach((d) => {
        const checkId = `${src.id}-${d.toISOString()}`;
        const overriddenAmount = monthOverrides[checkId];
        generated.push({
          id: checkId,
          label: src.name,
          amount: overriddenAmount !== undefined ? overriddenAmount : src.amount,
          baseAmount: src.amount,
          isOverridden: overriddenAmount !== undefined,
          date: d,
          frequency: src.frequency,
          sourceId: src.id,
          isGenerated: true,
        });
      });
    });
    // Add any extra / one-off checks for this month
    const extras = extraChecks[vKey] || [];
    extras.forEach((e) => {
      generated.push({ ...e, date: new Date(e.date + "T12:00:00"), isGenerated: false, isOverridden: false });
    });
    return generated.sort((a, b) => a.date - b.date);
  }, [incomeSources, extraChecks, viewYear, viewMonth, vKey, monthOverrides]);

  const manualExpenses = expensesByMonth[vKey] || [];

  const totalPaychecks = monthPaychecks.reduce((s, p) => s + p.amount, 0);
  const avgPaycheck = monthPaychecks.length > 0 ? totalPaychecks / monthPaychecks.length : 0;
  const monthlyIncome = totalPaychecks;
  const totalDebtBalance = debts.reduce((s, d) => s + d.balance, 0);

  // Build combined expenses: recurring bills + debt payments + savings + manual expenses
  const recurringBillExpenses = useMemo(() => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    return bills.map((b) => ({
      id: `bill-${b.id}`,
      description: b.name,
      amount: b.amount,
      category: b.category,
      date: `${viewYear}-${mm}-${String(Math.min(b.dueDay, new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0")}`,
      recurring: true,
      type: "bill",
    }));
  }, [bills, viewYear, viewMonth]);

  const recurringDebtExpenses = useMemo(() => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    return debts.map((d) => ({
      id: `debt-${d.id}`,
      description: `${d.name} payment`,
      amount: d.minPayment + d.extraPayment,
      category: "Debt Payment",
      date: `${viewYear}-${mm}-01`,
      recurring: true,
      type: "debt",
    }));
  }, [debts, viewYear, viewMonth]);

  // Savings contributions as expenses
  const recurringSavingsExpenses = useMemo(() => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    return goals.filter((g) => g.monthlyContribution > 0).map((g) => ({
      id: `savings-${g.id}`,
      description: `${g.name} contribution`,
      amount: g.monthlyContribution,
      category: "Savings",
      date: `${viewYear}-${mm}-01`,
      recurring: true,
      type: "savings",
      goalId: g.id,
    }));
  }, [goals, viewYear, viewMonth]);

  // All expenses for the month (recurring bills + debt + savings + manual)
  const allMonthExpenses = useMemo(() => {
    return [...recurringBillExpenses, ...recurringDebtExpenses, ...recurringSavingsExpenses, ...manualExpenses.map((e) => ({ ...e, recurring: false, type: "manual" }))];
  }, [recurringBillExpenses, recurringDebtExpenses, recurringSavingsExpenses, manualExpenses]);

  const totalBills = bills.reduce((s, b) => s + b.amount, 0);
  const totalDebtPayments = debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0);
  const totalSavingsContrib = goals.reduce((s, g) => s + g.monthlyContribution, 0);
  const totalManualExpenses = manualExpenses.reduce((s, e) => s + e.amount, 0);
  const totalAllExpenses = allMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const remainingBudget = monthlyIncome - totalAllExpenses;

  const checkCount = monthPaychecks.length || 1;
  const perPaycheckBills = totalBills / checkCount;
  const perPaycheckSavings = totalSavingsContrib / checkCount;
  const perPaycheckDebt = totalDebtPayments / checkCount;

  // Expense by category (from ALL expenses)
  const expByCategory = useMemo(() => {
    const map = {};
    allMonthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [allMonthExpenses]);

  // Upcoming bills (days until due from today, only for current month view)
  const upcomingBills = useMemo(() => {
    const currentDay = isCurrentMonth ? today.getDate() : 1;
    return bills.map((b) => {
      let daysUntil = b.dueDay - currentDay;
      if (daysUntil < 0) daysUntil += 30;
      const dueDate = new Date(viewYear, viewMonth, b.dueDay);
      const urgency = isCurrentMonth ? (daysUntil <= 3 ? "urgent" : daysUntil <= 7 ? "soon" : "upcoming") : "upcoming";
      return { ...b, daysUntil, dueDate, urgency };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }, [bills, viewYear, viewMonth, isCurrentMonth]);

  // Bill assignment to paychecks
  const billsByPaycheck = useMemo(() => {
    const sorted = [...monthPaychecks];
    if (sorted.length === 0) return [{ label: "No paychecks", bills: [...bills].sort((a, b) => a.dueDay - b.dueDay) }];
    if (sorted.length === 1) return [{ label: sorted[0].label, payDate: sorted[0].date, bills: [...bills].sort((a, b) => a.dueDay - b.dueDay) }];
    return sorted.map((check, i) => {
      const startDay = check.date.getDate();
      const endDay = i < sorted.length - 1 ? sorted[i + 1].date.getDate() - 1 : new Date(viewYear, viewMonth + 1, 0).getDate();
      return {
        label: check.label,
        payDate: check.date,
        bills: bills.filter((b) => b.dueDay >= startDay && b.dueDay <= endDay).sort((a, b) => a.dueDay - b.dueDay),
      };
    });
  }, [bills, monthPaychecks, viewYear, viewMonth]);

  // Trend data — generate for last 6 months from Planner data (ONLY PAID items)
  const trendData = useMemo(() => {
    const points = [];
    for (let i = 5; i >= 0; i--) {
      let tY = viewYear;
      let tM = viewMonth - i;
      while (tM < 0) { tM += 12; tY--; }
      const key = monthKey(tY, tM);
      const label = new Date(tY, tM, 1).toLocaleDateString("en-US", { month: "short" });
      const paidMap = plannerPaidByMonth[key] || {};
      
      const { autoItems, dismissed } = buildPlannerItemsForMonth(tY, tM, incomeSources, bills, debts, goals, extraChecks, incomeOverrides, plannerDismissedByMonth);
      
      const active = autoItems.filter((item) => !dismissed.includes(item.id) && paidMap[item.id]);
      const manual = (plannerManualByMonth[key] || []).filter((mi) => mi.paid);
      const all = [...active, ...manual];

      const income = all.filter((item) => item.type === "income").reduce((s, item) => s + item.amount, 0);
      const spending = all.filter((item) => item.type === "expense").reduce((s, item) => s + item.amount, 0);
      const saved = Math.max(income - spending, 0);

      points.push({ month: label, income, spending, saved });
    }
    return points;
  }, [incomeSources, extraChecks, bills, debts, goals, incomeOverrides, plannerDismissedByMonth, plannerManualByMonth, plannerPaidByMonth, viewYear, viewMonth]);

  // Cash flow timeline — day-by-day for the viewed month
  const cashFlowTimeline = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const events = [];
    // Income events
    monthPaychecks.forEach((p) => {
      events.push({ day: p.date.getDate(), amount: p.amount, label: p.label, type: "income" });
    });
    // Bill events
    bills.forEach((b) => {
      const day = Math.min(b.dueDay, daysInMonth);
      events.push({ day, amount: -b.amount, label: b.name, type: "bill" });
    });
    // Debt payment events
    debts.forEach((d) => {
      events.push({ day: 1, amount: -(d.minPayment + d.extraPayment), label: `${d.name} payment`, type: "debt" });
    });
    // Savings events
    goals.forEach((g) => {
      if (g.monthlyContribution > 0) events.push({ day: 1, amount: -g.monthlyContribution, label: `${g.name} savings`, type: "savings" });
    });

    // Build running balance by day
    const byDay = {};
    events.forEach((e) => {
      if (!byDay[e.day]) byDay[e.day] = [];
      byDay[e.day].push(e);
    });

    const timeline = [];
    let balance = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = byDay[d] || [];
      const dayIn = dayEvents.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
      const dayOut = dayEvents.filter((e) => e.type !== "income").reduce((s, e) => s + Math.abs(e.amount), 0);
      balance += dayIn - dayOut;
      timeline.push({ day: d, balance, income: dayIn, expenses: dayOut, events: dayEvents });
    }
    return timeline;
  }, [monthPaychecks, bills, debts, goals, viewYear, viewMonth]);

  // Year-at-a-glance data — derived from Planner items per month (ONLY PAID items)
  const yearData = useMemo(() => {
    const months = [];
    for (let m = 0; m < 12; m++) {
      const key = monthKey(viewYear, m);
      const label = new Date(viewYear, m, 1).toLocaleDateString("en-US", { month: "short" });
      const paidMap = plannerPaidByMonth[key] || {};
      
      const { autoItems, dismissed } = buildPlannerItemsForMonth(viewYear, m, incomeSources, bills, debts, goals, extraChecks, incomeOverrides, plannerDismissedByMonth);

      // Filter dismissed and ONLY PAID items (both income AND expenses must be marked paid)
      const active = autoItems.filter((i) => !dismissed.includes(i.id) && paidMap[i.id]);
      const manual = (plannerManualByMonth[key] || []).filter((mi) => mi.paid);
      const all = [...active, ...manual];

      const income = all.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
      const expenses = all.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
      const savingsExp = all.filter((i) => i.id.startsWith("planner-savings-") && i.type === "expense").reduce((s, i) => s + i.amount, 0);
      const net = income - expenses;

      months.push({ month: label, monthIdx: m, income, expenses, savings: savingsExp, net });
    }
    return months;
  }, [incomeSources, extraChecks, bills, debts, goals, incomeOverrides, plannerDismissedByMonth, plannerPaidByMonth, plannerManualByMonth, viewYear]);

  // Previous year data for year-over-year comparison
  const prevYearData = useMemo(() => {
    const py = viewYear - 1;
    const months = [];
    for (let m = 0; m < 12; m++) {
      const key = monthKey(py, m);
      const label = new Date(py, m, 1).toLocaleDateString("en-US", { month: "short" });
      const paidMap = plannerPaidByMonth[key] || {};
      const { autoItems, dismissed } = buildPlannerItemsForMonth(py, m, incomeSources, bills, debts, goals, extraChecks, incomeOverrides, plannerDismissedByMonth);
      const active = autoItems.filter((i) => !dismissed.includes(i.id) && paidMap[i.id]);
      const manual = (plannerManualByMonth[key] || []).filter((mi) => mi.paid);
      const all = [...active, ...manual];
      const income = all.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
      const expenses = all.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
      const savingsExp = all.filter((i) => i.id.startsWith("planner-savings-") && i.type === "expense").reduce((s, i) => s + i.amount, 0);
      const net = income - expenses;
      months.push({ month: label, monthIdx: m, income, expenses, savings: savingsExp, net });
    }
    return months;
  }, [incomeSources, extraChecks, bills, debts, goals, incomeOverrides, plannerDismissedByMonth, plannerPaidByMonth, plannerManualByMonth, viewYear]);

  // Debt payoff timelines
  const debtTimelines = useMemo(() => {
    return debts.map((d) => {
      const monthlyRate = d.rate / 100 / 12;
      const payment = d.minPayment + d.extraPayment;
      if (payment <= 0) return { ...d, months: Infinity, totalInterest: Infinity };
      let balance = d.balance;
      let months = 0;
      let totalInterest = 0;
      while (balance > 0 && months < 600) {
        const interest = balance * monthlyRate;
        totalInterest += interest;
        balance = balance + interest - payment;
        months++;
        if (balance < 0) balance = 0;
      }
      return { ...d, months, totalInterest };
    });
  }, [debts]);

  // Snowball vs Avalanche comparison
  const debtStrategies = useMemo(() => {
    if (debts.length < 2) return null;
    const simulate = (sortFn) => {
      let pool = debts.map(d => ({ ...d, bal: d.balance }));
      let months = 0, totalInterest = 0;
      const totalMonthlyPayment = debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0);
      while (pool.some(d => d.bal > 0) && months < 600) {
        months++;
        let extra = totalMonthlyPayment;
        pool.forEach(d => {
          const interest = d.bal * (d.rate / 100 / 12);
          totalInterest += interest;
          d.bal += interest;
        });
        pool = pool.sort(sortFn);
        pool.forEach(d => {
          if (d.bal <= 0) return;
          const pay = Math.min(d.bal, extra);
          d.bal -= pay;
          extra -= pay;
          if (d.bal < 0.01) d.bal = 0;
        });
      }
      return { months, totalInterest, totalPaid: debts.reduce((s, d) => s + d.balance, 0) + totalInterest };
    };
    const avalanche = simulate((a, b) => b.rate - a.rate);
    const snowball = simulate((a, b) => a.bal - b.bal);
    return { avalanche, snowball };
  }, [debts]);

  // Goal timelines
  const goalTimelines = useMemo(() => {
    return goals.map((g) => {
      // Adjust saved amount based on how many months from current month to viewed month
      const monthDiff = (viewYear - today.getFullYear()) * 12 + (viewMonth - today.getMonth());
      const projectedSaved = Math.min(g.saved + Math.max(monthDiff, 0) * g.monthlyContribution, g.target);
      const remaining = g.target - projectedSaved;
      const months = g.monthlyContribution > 0 ? Math.ceil(remaining / g.monthlyContribution) : Infinity;
      return { ...g, saved: projectedSaved, months, remaining };
    });
  }, [goals, viewYear, viewMonth]);

  // ── CRUD helpers ──
  // Feature 4: Export/Import helpers
  const handleExport = () => {
    const data = {
      incomeSources, bills, goals, debts, expensesByMonth, extraChecks, incomeOverrides,
      plannerManualByMonth, plannerDismissedByMonth, plannerPaidByMonth, plannerNotesByMonth,
      customCategories, categoryBudgets, darkMode, activeTheme,
      assets, liabilities, netWorthHistory, nwMilestones, balanceHistory,
      payCalcEntries, payCalcSettings, savingsTransactions, plannerOrderByMonth, subscriptions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paycheck-planner-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result || '{}');
        if (data.incomeSources) setIncomeSources(data.incomeSources);
        if (data.bills) setBills(data.bills);
        if (data.goals) setGoals(data.goals);
        if (data.debts) setDebts(data.debts);
        if (data.expensesByMonth) setExpensesByMonth(data.expensesByMonth);
        if (data.extraChecks) setExtraChecks(data.extraChecks);
        if (data.incomeOverrides) setIncomeOverrides(data.incomeOverrides);
        if (data.plannerManualByMonth) setPlannerManualByMonth(data.plannerManualByMonth);
        if (data.plannerDismissedByMonth) setPlannerDismissedByMonth(data.plannerDismissedByMonth);
        if (data.plannerPaidByMonth) setPlannerPaidByMonth(data.plannerPaidByMonth);
        if (data.plannerNotesByMonth) setPlannerNotesByMonth(data.plannerNotesByMonth);
        if (data.customCategories) setCustomCategories(data.customCategories);
        if (data.categoryBudgets) setCategoryBudgets(data.categoryBudgets);
        if (data.darkMode !== undefined) setDarkMode(data.darkMode);
        if (data.activeTheme && THEMES[data.activeTheme]) setActiveTheme(data.activeTheme);
        if (data.assets) setAssets(data.assets);
        if (data.liabilities) setLiabilities(data.liabilities);
        if (data.netWorthHistory) setNetWorthHistory(data.netWorthHistory);
        if (data.nwMilestones) setNwMilestones(data.nwMilestones);
        if (data.balanceHistory) setBalanceHistory(data.balanceHistory);
        if (data.payCalcEntries) setPayCalcEntries(data.payCalcEntries);
        if (data.payCalcSettings) setPayCalcSettings(data.payCalcSettings);
        if (data.savingsTransactions) setSavingsTransactions(data.savingsTransactions);
        if (data.plannerOrderByMonth) setPlannerOrderByMonth(data.plannerOrderByMonth);
        if (data.subscriptions) setSubscriptions(data.subscriptions);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const saveCheckOverride = (checkId, amount) => {
    const key = vKey;
    const existing = incomeOverrides[key] || {};
    setIncomeOverrides({ ...incomeOverrides, [key]: { ...existing, [checkId]: amount } });
    setEditingCheckId(null);
    setEditingCheckAmount("");
  };
  const clearCheckOverride = (checkId) => {
    const key = vKey;
    const existing = { ...(incomeOverrides[key] || {}) };
    delete existing[checkId];
    setIncomeOverrides({ ...incomeOverrides, [key]: existing });
  };
  const addIncomeSource = (s) => { setIncomeSources([...incomeSources, { ...s, id: uid() }]); setIncomeDraft(null); };
  const removeIncomeSource = (id) => setIncomeSources(incomeSources.filter((s) => s.id !== id));
  const addExtraCheck = (c) => {
    const key = vKey;
    setExtraChecks({ ...extraChecks, [key]: [...(extraChecks[key] || []), { ...c, id: uid() }] });
    setExtraCheckDraft(null);
  };
  const removeExtraCheck = (id) => {
    const key = vKey;
    setExtraChecks({ ...extraChecks, [key]: (extraChecks[key] || []).filter((c) => c.id !== id) });
  };
  const addBill = (b) => { setBills([...bills, { ...b, id: uid() }]); setBillDraft(null); };
  const removeBill = (id) => setBills(bills.filter((b) => b.id !== id));
  const updateBill = (id, updates) => { setBills(bills.map(b => b.id === id ? { ...b, ...updates } : b)); setEditingBillId(null); setBillDraft(null); };
  const startEditBill = (b) => { setBillDraft({ name: b.name, amount: b.amount, dueDay: b.dueDay, category: b.category, autopay: b.autopay }); setEditingBillId(b.id); };
  const addGoal = (g) => { setGoals([...goals, { ...g, id: uid(), color: COLORS[goals.length % COLORS.length] }]); setGoalDraft(null); };
  const removeGoal = (id) => setGoals(goals.filter((g) => g.id !== id));
  const withdrawFromGoal = (goalId, amount, description) => {
    setGoals(goals.map(g => g.id === goalId ? { ...g, saved: Math.max(0, g.saved - amount) } : g));
    const txn = { id: uid(), amount, description, date: new Date().toISOString().slice(0, 10), type: "withdrawal" };
    setSavingsTransactions(prev => ({ ...prev, [goalId]: [...(prev[goalId] || []), txn] }));
    setSavingsWithdrawDraft(null);
  };
  const depositToGoal = (goalId, amount, description) => {
    setGoals(goals.map(g => g.id === goalId ? { ...g, saved: g.saved + amount } : g));
    const txn = { id: uid(), amount, description, date: new Date().toISOString().slice(0, 10), type: "deposit" };
    setSavingsTransactions(prev => ({ ...prev, [goalId]: [...(prev[goalId] || []), txn] }));
    setSavingsWithdrawDraft(null);
  };
  const addExpense = (e) => {
    const key = vKey;
    const newExp = { ...e, id: uid() };
    setExpensesByMonth({ ...expensesByMonth, [key]: [...(expensesByMonth[key] || []), newExp] });
    // If this is a savings contribution, credit the goal
    if (e.category === "Savings" && e.goalId) {
      setGoals(goals.map((g) => g.id === e.goalId ? { ...g, saved: g.saved + (+e.amount || 0) } : g));
    }
    setExpDraft(null);
  };
  const removeExpense = (id) => {
    const key = vKey;
    setExpensesByMonth({ ...expensesByMonth, [key]: (expensesByMonth[key] || []).filter((e) => e.id !== id) });
  };
  const addDebt = (d) => { setDebts([...debts, { ...d, id: uid() }]); setDebtDraft(null); setEditingDebtId(null); };
  const removeDebt = (id) => setDebts(debts.filter((d) => d.id !== id));
  const updateDebt = (id, updates) => { setDebts(debts.map(d => d.id === id ? { ...d, ...updates } : d)); setEditingDebtId(null); setDebtDraft(null); };
  const startEditDebt = (d) => { setDebtDraft({ name: d.name, balance: d.balance, rate: d.rate, minPayment: d.minPayment, extraPayment: d.extraPayment, frequency: d.frequency || "monthly", dueDay: d.dueDay || 1 }); setEditingDebtId(d.id); };

  const updateGoal = (id, updates) => { setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g)); setEditingGoalId(null); setGoalDraft(null); };
  const startEditGoal = (g) => { setGoalDraft({ name: g.name, target: g.target, saved: g.saved, monthlyContribution: g.monthlyContribution }); setEditingGoalId(g.id); };

  // Planner — auto-generate items from Dashboard data, merge with manual, filter dismissed
  const plannerDismissed = plannerDismissedByMonth[vKey] || [];
  const plannerPaidMap = plannerPaidByMonth[vKey] || {};
  const plannerManualItems = plannerManualByMonth[vKey] || [];

  const plannerItems = useMemo(() => {
    const auto = [];
    // Income: from monthPaychecks (generated + extras)
    monthPaychecks.forEach((p) => {
      const pid = `planner-income-${p.id}`;
      auto.push({ id: pid, label: p.label, amount: p.amount, type: "income", paid: !!plannerPaidMap[pid], auto: true, source: "income",
        dateSortKey: p.date.toISOString(), dateLabel: p.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
    });
    // Recurring bills
    const mm = String(viewMonth + 1).padStart(2, "0");
    bills.forEach((b) => {
      const pid = `planner-bill-${b.id}`;
      const dayStr = String(Math.min(b.dueDay, new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0");
      auto.push({ id: pid, label: b.name, amount: b.amount, type: "expense", paid: !!plannerPaidMap[pid], auto: true, source: "bill",
        dateSortKey: `${viewYear}-${mm}-${dayStr}`, dateLabel: `Due ${b.dueDay}` });
    });
    // Debt payments
    debts.forEach((d) => {
      const pid = `planner-debt-${d.id}`;
      auto.push({ id: pid, label: `${d.name} payment`, amount: d.minPayment + d.extraPayment, type: "expense", paid: !!plannerPaidMap[pid], auto: true, source: "debt",
        dateSortKey: `${viewYear}-${mm}-01`, dateLabel: "Monthly" });
    });
    // Savings contributions
    goals.filter((g) => g.monthlyContribution > 0).forEach((g) => {
      const pid = `planner-savings-${g.id}`;
      auto.push({ id: pid, label: `${g.name} contribution`, amount: g.monthlyContribution, type: "expense", paid: !!plannerPaidMap[pid], auto: true, source: "savings",
        dateSortKey: `${viewYear}-${mm}-01`, dateLabel: "Monthly" });
    });
    // Filter out dismissed auto items
    const filtered = auto.filter((item) => !plannerDismissed.includes(item.id));
    // Add manual items
    const manual = plannerManualItems.map((m) => ({ ...m, auto: false, source: "manual" }));
    return [...filtered, ...manual];
  }, [monthPaychecks, bills, debts, goals, plannerDismissed, plannerPaidMap, plannerManualItems, viewYear, viewMonth]);

  const addPlannerItem = (item) => {
    const key = vKey;
    const newItem = { ...item, id: uid() };
    setPlannerManualByMonth({ ...plannerManualByMonth, [key]: [...(plannerManualByMonth[key] || []), newItem] });
    setPlannerDraft(null);
  };
  const removePlannerItem = (id) => {
    const key = vKey;
    const item = plannerItems.find((i) => i.id === id);
    if (item && item.auto) {
      // Dismiss auto item (doesn't delete from Dashboard)
      setPlannerDismissedByMonth({ ...plannerDismissedByMonth, [key]: [...(plannerDismissedByMonth[key] || []), id] });
    } else {
      // Remove manual item
      setPlannerManualByMonth({ ...plannerManualByMonth, [key]: (plannerManualByMonth[key] || []).filter((i) => i.id !== id) });
    }
    setSwipedItemId(null);
  };
  const togglePlannerPaid = (id) => {
    const key = vKey;
    const item = plannerItems.find((i) => i.id === id);
    if (item && item.auto) {
      const existing = { ...(plannerPaidByMonth[key] || {}) };
      existing[id] = !existing[id];
      setPlannerPaidByMonth({ ...plannerPaidByMonth, [key]: existing });
    } else {
      setPlannerManualByMonth({ ...plannerManualByMonth, [key]: (plannerManualByMonth[key] || []).map((i) => i.id === id ? { ...i, paid: !i.paid } : i) });
    }
    setSwipedItemId(null);
  };
  const duplicatePlannerItem = (id) => {
    const item = plannerItems.find((i) => i.id === id);
    if (item) {
      const copy = { id: uid(), label: item.label, amount: item.amount, type: item.type, paid: false };
      const key = vKey;
      setPlannerManualByMonth({ ...plannerManualByMonth, [key]: [...(plannerManualByMonth[key] || []), copy] });
    }
    setSwipedItemId(null);
  };
  const reorderPlannerItem = (fromId, toId) => {
    const key = vKey;
    const currentOrder = plannerOrderByMonth[key] || plannerItems.map(i => i.id);
    const fromIdx = currentOrder.indexOf(fromId);
    const toIdx = currentOrder.indexOf(toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const newOrder = [...currentOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, fromId);
    setPlannerOrderByMonth({ ...plannerOrderByMonth, [key]: newOrder });
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // ── Net Worth CRUD ──
  const ASSET_CATEGORIES = ["Cash", "Investments", "Retirement", "Property", "Vehicle", "Other"];
  const addAsset = (a) => { setAssets([...assets, { ...a, id: uid() }]); setAssetDraft(null); };
  const removeAsset = (id) => setAssets(assets.filter((a) => a.id !== id));
  const updateAssetBalance = (id, balance) => setAssets(assets.map((a) => a.id === id ? { ...a, balance } : a));
  const addLiability = (l) => { setLiabilities([...liabilities, { ...l, id: uid() }]); setLiabilityDraft(null); };
  const removeLiability = (id) => setLiabilities(liabilities.filter((l) => l.id !== id));
  const updateLiabilityBalance = (id, balance) => setLiabilities(liabilities.map((l) => l.id === id ? { ...l, balance } : l));
  const addMilestone = (m) => { setNwMilestones([...nwMilestones, { ...m, id: uid() }]); setMilestoneDraft(null); };
  const removeMilestone = (id) => setNwMilestones(nwMilestones.filter((m) => m.id !== id));

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const debtLiabilities = debts.map((d) => ({ id: `debt-${d.id}`, name: d.name, category: "Debt", balance: d.balance, fromDebt: true }));
  const allLiabilities = [...debtLiabilities, ...liabilities];
  const totalLiabilities = allLiabilities.reduce((s, l) => s + l.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const snapshotNetWorth = () => {
    const entry = { date: new Date().toISOString().slice(0, 7), assets: totalAssets, liabilities: totalLiabilities, netWorth };
    setNetWorthHistory((prev) => {
      const existing = prev.findIndex((e) => e.date === entry.date);
      if (existing >= 0) { const updated = [...prev]; updated[existing] = entry; return updated; }
      return [...prev, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const snapshotBalances = () => {
    const date = new Date().toISOString().slice(0, 7);
    const entry = {};
    assets.forEach(a => { entry[`asset-${a.id}`] = { name: a.name, type: 'asset', balance: a.balance }; });
    liabilities.forEach(l => { entry[`liability-${l.id}`] = { name: l.name, type: 'liability', balance: l.balance }; });
    setBalanceHistory(prev => ({ ...prev, [date]: entry }));
  };

  const savePlannerNote = (id) => {
    const key = vKey;
    const notes = { ...(plannerNotesByMonth[key] || {}) };
    if (editingNoteText.trim()) notes[id] = editingNoteText.trim();
    else delete notes[id];
    setPlannerNotesByMonth({ ...plannerNotesByMonth, [key]: notes });
    setEditingNoteId(null);
    setEditingNoteText("");
  };
  const cancelPlannerNote = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };
  // Feature 2: Detect recurring manual expenses
  const recurringExpenseSuggestion = useMemo(() => {
    const labelCounts = {};
    const labelMonths = {};
    
    // Scan all manual items across all months
    Object.entries(plannerManualByMonth).forEach(([monthKey, items]) => {
      items.forEach((item) => {
        if (item.type === "expense" || !item.type) {
          const label = item.label || "";
          if (!labelCounts[label]) {
            labelCounts[label] = 0;
            labelMonths[label] = new Set();
          }
          labelMonths[label].add(monthKey);
        }
      });
    });
    
    // Find labels appearing 3+ months
    for (const label in labelMonths) {
      if (labelMonths[label].size >= 3 && !dismissedSuggestions[label]) {
        return { label, monthCount: labelMonths[label].size };
      }
    }
    return null;
  }, [plannerManualByMonth, dismissedSuggestions]);

  // ── Global Search ──
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    const results = [];
    incomeSources.forEach(s => { if (s.name.toLowerCase().includes(q)) results.push({ tab: 'dashboard', type: 'Income', name: s.name, detail: `${fmt(s.amount)} ${s.frequency}` }); });
    bills.forEach(b => { if (b.name.toLowerCase().includes(q)) results.push({ tab: 'bills', type: 'Bill', name: b.name, detail: `${fmt(b.amount)} due on ${b.dueDay}` }); });
    goals.forEach(g => { if (g.name.toLowerCase().includes(q)) results.push({ tab: 'savings', type: 'Goal', name: g.name, detail: `${fmt(g.saved)} / ${fmt(g.target)}` }); });
    debts.forEach(d => { if (d.name.toLowerCase().includes(q)) results.push({ tab: 'debt', type: 'Debt', name: d.name, detail: `${fmt(d.balance)} at ${d.rate}%` }); });
    assets.forEach(a => { if (a.name.toLowerCase().includes(q)) results.push({ tab: 'networth', type: 'Asset', name: a.name, detail: fmt(a.balance) }); });
    Object.entries(expensesByMonth).forEach(([key, exps]) => {
      exps.forEach(e => { if (e.description.toLowerCase().includes(q)) results.push({ tab: 'expenses', type: 'Expense', name: e.description, detail: `${fmt(e.amount)} — ${e.category}` }); });
    });
    plannerItems.forEach(i => { if (i.label.toLowerCase().includes(q)) results.push({ tab: 'planner', type: 'Planner', name: i.label, detail: `${i.type} ${fmt(i.amount)}` }); });
    return results.slice(0, 15);
  }, [globalSearch, incomeSources, bills, goals, debts, assets, expensesByMonth, plannerItems]);

  // Apply custom ordering to planner items
  const sortedPlannerItems = useMemo(() => {
    const order = plannerOrderByMonth[vKey];
    if (!order) return plannerItems;
    const orderMap = {};
    order.forEach((id, idx) => { orderMap[id] = idx; });
    const ordered = [...plannerItems].sort((a, b) => {
      const ai = orderMap[a.id] !== undefined ? orderMap[a.id] : 9999;
      const bi = orderMap[b.id] !== undefined ? orderMap[b.id] : 9999;
      return ai - bi;
    });
    return ordered;
  }, [plannerItems, plannerOrderByMonth, vKey]);

  const plannerTotalIncome = plannerItems.filter((i) => i.type === "income").reduce((s, i) => s + i.amount, 0);
  const plannerTotalExpenses = plannerItems.filter((i) => i.type === "expense").reduce((s, i) => s + i.amount, 0);
  const plannerBalance = plannerTotalIncome - plannerTotalExpenses;
  const plannerPaidExpenses = plannerItems.filter((i) => i.type === "expense" && i.paid).reduce((s, i) => s + i.amount, 0);
  const plannerUnpaidExpenses = plannerTotalExpenses - plannerPaidExpenses;

  // ─── TAX BRACKET CALCULATOR ─────────────────────────────────────────────
  const taxEstimate = useMemo(() => {
    const s = payCalcSettings;
    const wageGross = s.hourlyRate * s.hoursPerWeek * s.weeksPerYear;
    const annualGross = s.householdIncome > 0 ? s.householdIncome : wageGross;
    const annualPreTax = s.preTaxDeductions * 26; // assume biweekly
    const taxableIncome = Math.max(0, annualGross - annualPreTax);

    // 2026 projected Federal brackets (inflation-adjusted from 2025)
    const fedBrackets = s.filingStatus === "married" ? [
      [24800, 0.10], [101400, 0.12], [215950, 0.22], [412750, 0.24], [524100, 0.32], [785800, 0.35], [Infinity, 0.37]
    ] : s.filingStatus === "head" ? [
      [17750, 0.10], [67900, 0.12], [108000, 0.22], [206350, 0.24], [262000, 0.32], [654950, 0.35], [Infinity, 0.37]
    ] : [
      [12400, 0.10], [50700, 0.12], [108000, 0.22], [206350, 0.24], [262000, 0.32], [654950, 0.35], [Infinity, 0.37]
    ];
    const stdDed = s.filingStatus === "married" ? 31400 : s.filingStatus === "head" ? 23550 : 15700;
    const fedTaxable = Math.max(0, taxableIncome - stdDed);
    let fedTax = 0, prev = 0;
    for (const [limit, rate] of fedBrackets) {
      if (fedTaxable <= prev) break;
      fedTax += (Math.min(fedTaxable, limit) - prev) * rate;
      prev = limit;
    }
    const effFedRate = taxableIncome > 0 ? (fedTax / taxableIncome) * 100 : 0;

    // 2026 State tax rates (flat/effective approximations)
    const stateRates = {
      AL: 4.0, AK: 0, AZ: 2.5, AR: 3.9, CA: 6.0, CO: 4.4, CT: 5.0, DE: 4.8,
      FL: 0, GA: 5.39, HI: 6.0, ID: 5.8, IL: 4.95, IN: 3.05, IA: 5.7, KS: 5.25,
      KY: 4.0, LA: 3.0, ME: 5.8, MD: 4.75, MA: 5.0, MI: 4.25, MN: 5.35,
      MS: 4.0, MO: 4.8, MT: 5.9, NE: 5.01, NV: 0, NH: 0, NJ: 5.525,
      NM: 4.9, NY: 5.5, NC: 4.25, ND: 1.95, OH: 3.5, OK: 4.75, OR: 8.75,
      PA: 3.07, RI: 4.75, SC: 6.4, SD: 0, TN: 0, TX: 0, UT: 4.65,
      VT: 6.0, VA: 5.75, WA: 0, WV: 5.12, WI: 5.3, WY: 0, DC: 6.5
    };
    const stateRate = stateRates[s.state] || 0;
    const ficaRate = 7.65;

    return { annualGross, wageGross, taxableIncome, fedTax, effFedRate: Math.round(effFedRate * 100) / 100,
      stateRate, ficaRate, stdDed, fedTaxable, marginalBracket: fedBrackets.find(([l]) => fedTaxable <= l)?.[1] * 100 || 37,
      totalEffRate: Math.round((effFedRate + stateRate + ficaRate) * 100) / 100,
      annualNet: taxableIncome - fedTax - (taxableIncome * stateRate / 100) - (taxableIncome * ficaRate / 100)
    };
  }, [payCalcSettings]);

  // Auto-apply estimated rates when autoTax is on
  const pcFedRate = payCalcSettings.autoTax ? taxEstimate.effFedRate : payCalcSettings.federalRate;
  const pcStateRate = payCalcSettings.autoTax ? taxEstimate.stateRate : payCalcSettings.stateRate;
  const pcFicaRate = payCalcSettings.autoTax ? taxEstimate.ficaRate : payCalcSettings.ficaRate;

  // ─── Onboarding wizard helpers ───
  const finishOnboarding = () => {
    const d = onboardingData;
    if (d.payAmount) {
      setIncomeSources([{ id: uid(), name: d.name || "Primary Job", amount: parseFloat(d.payAmount) || 0, frequency: d.payFrequency, referenceDate: d.referenceDate || "2026-03-07" }]);
    }
    const newBills = [];
    if (d.rent && parseFloat(d.rent) > 0) newBills.push({ id: uid(), name: "Rent / Mortgage", amount: parseFloat(d.rent), dueDay: d.rentDay || 1, category: "Housing", autopay: false });
    if (d.carPayment && parseFloat(d.carPayment) > 0) newBills.push({ id: uid(), name: "Car Payment", amount: parseFloat(d.carPayment), dueDay: d.carDay || 5, category: "Transportation", autopay: false });
    if (d.utilities && parseFloat(d.utilities) > 0) newBills.push({ id: uid(), name: "Utilities", amount: parseFloat(d.utilities), dueDay: d.utilDay || 15, category: "Utilities", autopay: false });
    if (newBills.length > 0) setBills(newBills);
    if (d.savingsGoal && d.savingsMonthly && parseFloat(d.savingsMonthly) > 0) {
      setGoals([{ id: uid(), name: d.savingsGoal || "Savings", target: 10000, saved: 0, monthlyContribution: parseFloat(d.savingsMonthly), color: "#6366f1" }]);
    }
    setShowOnboarding(false);
    setOnboardingStep(0);
  };

  const onboardingSteps = [
    { title: "Welcome to MaverickFinance", icon: "👋", desc: "Let's set up your budget in under 2 minutes. We'll walk you through adding your income, bills, and savings goals." },
    { title: "Your Income", icon: "💰", desc: "How much do you get paid, and how often?" },
    { title: "Your Bills", icon: "📋", desc: "Add your biggest recurring bills. You can always add more later." },
    { title: "Savings Goals", icon: "🎯", desc: "Set up a savings goal to start building toward something." },
    { title: "You're All Set!", icon: "🎉", desc: "Your budget is ready. You can customize everything from the main app." },
  ];

  // ─── RENDER ─────────────────────────────────────────────────────────────

  if (showOnboarding && onboardingStep > 0) {
    const stepInfo = onboardingSteps[onboardingStep - 1];
    const od = onboardingData;
    const setOd = (k, v) => setOnboardingData(prev => ({ ...prev, [k]: v }));
    const canNext = () => {
      if (onboardingStep === 1) return true; // welcome is always passable
      if (onboardingStep === 2) return od.payAmount && parseFloat(od.payAmount) > 0;
      return true;
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div className="h-full bg-indigo-500 transition-all duration-500 rounded-r-full" style={{ width: `${((onboardingStep) / onboardingSteps.length) * 100}%` }} />
          </div>
          <div className="p-8">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Step {onboardingStep} of {onboardingSteps.length}</span>
              <button onClick={() => { setShowOnboarding(false); setOnboardingStep(0); }} className="text-xs text-gray-400 hover:text-gray-600 transition">Skip setup</button>
            </div>
            {/* Icon + Title */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{stepInfo.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepInfo.title}</h2>
              <p className="text-gray-500 text-sm">{stepInfo.desc}</p>
            </div>
            {/* Step Content */}
            <div className="space-y-4 mb-8">
              {onboardingStep === 1 && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                    <Wallet size={16} /> Takes about 2 minutes
                  </div>
                </div>
              )}
              {onboardingStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Income source name</label>
                    <input type="text" placeholder="e.g. Primary Job" value={od.name} onChange={e => setOd("name", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Take-home pay</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" placeholder="0.00" value={od.payAmount} onChange={e => setOd("payAmount", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pay frequency</label>
                      <select value={od.payFrequency} onChange={e => setOd("payFrequency", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white">
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="semimonthly">Semi-Monthly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last paycheck date</label>
                    <input type="date" value={od.referenceDate} onChange={e => setOd("referenceDate", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                  </div>
                </>
              )}
              {onboardingStep === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rent / Mortgage</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" placeholder="0" value={od.rent} onChange={e => setOd("rent", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due day</label>
                      <input type="number" min="1" max="31" value={od.rentDay} onChange={e => setOd("rentDay", parseInt(e.target.value) || 1)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Car Payment</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" placeholder="0" value={od.carPayment} onChange={e => setOd("carPayment", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due day</label>
                      <input type="number" min="1" max="31" value={od.carDay} onChange={e => setOd("carDay", parseInt(e.target.value) || 5)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Utilities</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input type="number" placeholder="0" value={od.utilities} onChange={e => setOd("utilities", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due day</label>
                      <input type="number" min="1" max="31" value={od.utilDay} onChange={e => setOd("utilDay", parseInt(e.target.value) || 15)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Leave any field at $0 to skip it. Add more bills later from the Bills tab.</p>
                </>
              )}
              {onboardingStep === 4 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What are you saving for?</label>
                    <input type="text" placeholder="e.g. Emergency Fund, Vacation" value={od.savingsGoal} onChange={e => setOd("savingsGoal", e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly contribution</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input type="number" placeholder="0" value={od.savingsMonthly} onChange={e => setOd("savingsMonthly", e.target.value)}
                        className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Optional — you can set this up later from the Savings tab.</p>
                </>
              )}
              {onboardingStep === 5 && (
                <div className="text-center space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {od.payAmount && <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-green-600 font-medium">Income</p><p className="text-lg font-bold text-green-700">${parseFloat(od.payAmount || 0).toLocaleString()}</p><p className="text-[10px] text-green-500">{od.payFrequency}</p></div>}
                    {(od.rent || od.carPayment || od.utilities) && <div className="bg-rose-50 rounded-xl p-3"><p className="text-xs text-rose-600 font-medium">Bills</p><p className="text-lg font-bold text-rose-700">${((parseFloat(od.rent||0))+(parseFloat(od.carPayment||0))+(parseFloat(od.utilities||0))).toLocaleString()}</p><p className="text-[10px] text-rose-500">/month</p></div>}
                    {od.savingsMonthly && <div className="bg-indigo-50 rounded-xl p-3"><p className="text-xs text-indigo-600 font-medium">Savings</p><p className="text-lg font-bold text-indigo-700">${parseFloat(od.savingsMonthly||0).toLocaleString()}</p><p className="text-[10px] text-indigo-500">/month</p></div>}
                  </div>
                </div>
              )}
            </div>
            {/* Navigation */}
            <div className="flex items-center justify-between">
              {onboardingStep > 1 ? (
                <button onClick={() => setOnboardingStep(s => s - 1)} className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1"><ChevronLeft size={16} /> Back</button>
              ) : <div />}
              {onboardingStep < onboardingSteps.length ? (
                <button onClick={() => canNext() && setOnboardingStep(s => s + 1)} disabled={!canNext()}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${canNext() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  {onboardingStep === 1 ? "Let's Go" : "Next"} <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={finishOnboarding}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center gap-2">
                  Launch My Budget <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isThemed ? theme.bg : dm('bg-gradient-to-br from-slate-50 via-gray-50 to-indigo-50', 'bg-slate-950')}`} style={isThemed ? { fontFamily: theme.fontFamily } : {}}>
      {/* Theme special effects */}
      {activeTheme === 'pipboy' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        *, ::before, ::after { border-color: rgba(0,255,0,0.15) !important; }
        .min-h-screen {
          background: #000 !important;
          background-image:
            repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 3px),
            radial-gradient(ellipse at 50% 30%, rgba(0,80,0,0.35) 0%, transparent 70%) !important;
        }
        .min-h-screen::after {
          content: '';
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
          pointer-events: none; z-index: 9999;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #00ff00 !important;
          text-shadow: 0 0 8px rgba(0,255,0,0.4), 0 0 2px rgba(0,255,0,0.2) !important;
        }
        input, select, textarea {
          background: rgba(0,20,0,0.8) !important;
          color: #00ff00 !important;
          border-color: rgba(0,255,0,0.3) !important;
          text-shadow: 0 0 5px rgba(0,255,0,0.3) !important;
          caret-color: #00ff00 !important;
        }
        input::placeholder, select option { color: rgba(0,255,0,0.4) !important; }
        svg { color: #00ff00 !important; filter: drop-shadow(0 0 3px rgba(0,255,0,0.3)); }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 4px !important; }
      `}</style>}
      {activeTheme === 'comic' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
        .min-h-screen {
          background: #87ceeb !important;
          background-image:
            radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px),
            repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.08) 0deg 10deg, transparent 10deg 20deg) !important;
          background-size: 8px 8px, 100% 100% !important;
        }
        h1, h2, h3, h4, h5 {
          color: #000 !important;
          text-shadow: 2px 2px 0 #fbbf24, -1px -1px 0 #000 !important;
          letter-spacing: 1px !important;
        }
        .rounded-2xl, .rounded-xl { border-radius: 0 !important; }
        input, select, textarea {
          background: #fffde7 !important;
          border: 2px solid #000 !important;
          border-radius: 0 !important;
          font-family: 'Bangers', 'Comic Sans MS', cursive !important;
        }
        button { text-transform: uppercase !important; letter-spacing: 1px !important; }
      `}</style>}
      {activeTheme === 'newspaper' && <style>{`
        .min-h-screen { background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4a574' fill-opacity='0.08'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E") !important; }
      `}</style>}
      {activeTheme === 'papyrus' && <style>{`
        .min-h-screen { background: linear-gradient(180deg, #fde68a 0%, #d97706 5%, #fbbf24 10%, #fde68a 50%, #f59e0b 90%, #d97706 100%) !important; background-size: 100% 200% !important; }
      `}</style>}
      {activeTheme === 'lionheart' && <style>{`
        .min-h-screen { background: linear-gradient(180deg, #450a0a 0%, #1c1917 50%, #450a0a 100%) !important; }
        input, select, textarea { background: rgba(69,10,10,0.8) !important; color: #fef3c7 !important; border-color: rgba(202,138,4,0.3) !important; }
      `}</style>}
      {activeTheme === 'fifties' && <style>{`
        .min-h-screen { background: linear-gradient(135deg, #fce7f3 0%, #e0f2fe 50%, #d1fae5 100%) !important; }
      `}</style>}
      {activeTheme === 'lego' && <style>{`
        .min-h-screen { background: #fef9c3 !important; background-image: radial-gradient(circle, rgba(220,38,38,0.08) 1px, transparent 1px) !important; background-size: 24px 24px !important; }
      `}</style>}
      {/* Header */}
      <header className={`${isThemed ? theme.headerClass : dm('bg-white/80', 'bg-slate-900/80')} backdrop-blur-md ${isThemed ? '' : dm('border-gray-200', 'border-slate-700')} border-b sticky top-0 z-30`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`${isThemed ? '' : 'bg-indigo-600'} text-white p-2 rounded-xl`} style={isThemed ? { background: theme.accentColor } : {}}><Wallet size={20} /></div>
            <div>
              <h1 className={`text-lg font-bold ${isThemed ? theme.textClass : dm('text-gray-900', 'text-white')} leading-tight`}>MaverickFinance</h1>
              <p className={`text-xs ${isThemed ? 'opacity-60 ' + theme.textClass : dm('text-gray-500', 'text-gray-400')}`}>{isThemed ? `${theme.emoji} ${theme.name} Theme` : 'Your budget, your way'}</p>
            </div>
          </div>
          {/* Month Switcher */}
          <div className="flex items-center gap-2">
            <button onClick={() => goMonth(-1)} className={`p-1.5 rounded-lg transition ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')}`}><ChevronLeft size={18} /></button>
            <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${isCurrentMonth ? "bg-indigo-100 text-indigo-700" : dm("bg-gray-100 text-gray-700 hover:bg-gray-200", "bg-slate-700 text-slate-300 hover:bg-slate-600")}`}>
              {monthLabel(viewYear, viewMonth)}
            </button>
            <button onClick={() => goMonth(1)} className={`p-1.5 rounded-lg transition ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')}`}><ChevronRight size={18} /></button>
          </div>
          {/* Feature 5 + 4: Dark mode toggle and Settings */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-lg ${dm('hover:bg-gray-100', 'hover:bg-slate-800')} transition`}>
              <Search size={18} className={dm('text-gray-500', 'text-gray-400')} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode" className={`p-1.5 rounded-lg transition ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')}`}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative group">
              <button className={`p-1.5 rounded-lg transition ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')}`}>
                <Settings size={18} />
              </button>
              <div className={`absolute right-0 mt-2 w-48 ${dm('bg-white border-gray-200', 'bg-slate-800 border-slate-700')} border rounded-lg shadow-lg p-2 hidden group-hover:block z-50`}>
                <button onClick={handleExport} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 transition ${dm('hover:bg-gray-100 text-gray-700', 'hover:bg-slate-700 text-slate-100')}`}>
                  <Download size={14} /> Export Data
                </button>
                <label className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 cursor-pointer transition ${dm('hover:bg-gray-100 text-gray-700', 'hover:bg-slate-700 text-slate-100')}`}>
                  <Upload size={14} /> Import Data
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                <div className={`border-t ${dm('border-gray-100', 'border-slate-700')} my-1 pt-1`}>
                  <p className={`px-3 py-1 text-[10px] font-semibold uppercase ${dm('text-gray-400', 'text-gray-500')}`}>Themes</p>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button key={key} onClick={() => setActiveTheme(key)}
                      className={`w-full text-left px-3 py-1.5 rounded flex items-center gap-2 text-xs transition ${activeTheme === key ? dm('bg-indigo-50 text-indigo-700 font-semibold', 'bg-indigo-900/50 text-indigo-300 font-semibold') : dm('hover:bg-gray-100 text-gray-600', 'hover:bg-slate-700 text-slate-300')}`}>
                      <span>{t.emoji}</span> {t.name} {activeTheme === key && '✓'}
                    </button>
                  ))}
                </div>
                <div className={`border-t ${dm('border-gray-100', 'border-slate-700')} my-1 pt-1`}>
                  <button onClick={() => { setOnboardingStep(1); setShowOnboarding(true); }}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-gray-100 text-gray-600', 'hover:bg-slate-700 text-slate-300')}`}>
                    👋 Run Setup Wizard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Overlay */}
      {showSearch && (
        <div className={`sticky top-[57px] z-20 ${dm('bg-white border-gray-200', 'bg-slate-900 border-slate-700')} border-b shadow-lg`}>
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="relative">
              <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dm('text-gray-400', 'text-gray-500')}`} />
              <input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Search everything..."
                className={`w-full pl-10 pr-10 py-2 border rounded-xl text-sm ${dm('border-gray-200 bg-white', 'border-slate-700 bg-slate-800 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} autoFocus />
              <button onClick={() => { setShowSearch(false); setGlobalSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={16} className={dm('text-gray-400', 'text-gray-500')} />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => { setTab(r.tab); setShowSearch(false); setGlobalSearch(""); }}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-800')} transition`}>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${dm('bg-indigo-100 text-indigo-700', 'bg-indigo-900 text-indigo-300')}`}>{r.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{r.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.detail}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}
            {globalSearch.trim() && searchResults.length === 0 && (
              <p className={`text-sm text-center py-4 ${dm('text-gray-400', 'text-gray-500')}`}>No results found</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className={`${dm('bg-white border-gray-100', 'bg-slate-900 border-slate-700')} border-b sticky top-[57px] z-20`}>
        <div className="max-w-6xl mx-auto px-4 flex gap-0.5 overflow-x-auto pb-px" style={{ WebkitOverflowScrolling: 'touch' }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 px-2.5 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className={`max-w-6xl mx-auto px-4 py-6 space-y-6 ${dm('', 'text-white')}`}>

        {/* ═══════ DASHBOARD ═══════ */}
        {tab === "dashboard" && (
          <>

            {/* Feature 7: Budget warning if over */}
            {(() => {
              const overBudgetCats = Object.entries(categoryBudgets).filter(([cat, budget]) => {
                const spent = expByCategory.find((c) => c.name === cat)?.value || 0;
                return spent > budget;
              });
              return overBudgetCats.length > 0 ? (
                <div className={`p-4 rounded-xl border-l-4 border-rose-500 ${darkMode ? 'bg-rose-950/30' : 'bg-rose-50'} mb-4`}>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-rose-200' : 'text-rose-900'}`}>⚠️ Over budget in {overBudgetCats.length} categor{overBudgetCats.length === 1 ? 'y' : 'ies'}</p>
                  <p className={`text-xs ${darkMode ? 'text-rose-300' : 'text-rose-700'} mt-1`}>{overBudgetCats.map(([cat]) => cat).join(", ")}</p>
                </div>
              ) : null;
            })()}
                        {/* Income Sources + Paychecks for this month */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Paychecks — {monthLabel(viewYear, viewMonth)}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{monthPaychecks.length} check{monthPaychecks.length !== 1 ? "s" : ""} this month</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExtraCheckDraft({ label: "", amount: "", date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-15` })}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition">
                    <Plus size={14} /> Extra Check
                  </button>
                  <button onClick={() => setIncomeDraft({ name: "", amount: "", frequency: "biweekly", referenceDate: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01` })}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                    <Plus size={14} /> Income Source
                  </button>
                </div>
              </div>

              {/* Add income source form */}
              {incomeDraft && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <input placeholder="Source name" value={incomeDraft.name} onChange={(e) => setIncomeDraft({ ...incomeDraft, name: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Per check" value={incomeDraft.amount} onChange={(e) => setIncomeDraft({ ...incomeDraft, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <select value={incomeDraft.frequency} onChange={(e) => setIncomeDraft({ ...incomeDraft, frequency: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {PAY_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <div>
                    <input type="date" value={incomeDraft.referenceDate} onChange={(e) => setIncomeDraft({ ...incomeDraft, referenceDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <p className="text-xs text-gray-400 mt-0.5 pl-1">First / reference pay date</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if (incomeDraft.name && incomeDraft.amount) addIncomeSource({ ...incomeDraft, amount: +incomeDraft.amount }); }}
                      className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-1"><Check size={14} /> Save</button>
                    <button onClick={() => setIncomeDraft(null)} className="px-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                </div>
              )}

              {/* Add extra one-off check form */}
              {extraCheckDraft && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <input placeholder="Label (e.g. Bonus)" value={extraCheckDraft.label} onChange={(e) => setExtraCheckDraft({ ...extraCheckDraft, label: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Amount" value={extraCheckDraft.amount} onChange={(e) => setExtraCheckDraft({ ...extraCheckDraft, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <input type="date" value={extraCheckDraft.date} onChange={(e) => setExtraCheckDraft({ ...extraCheckDraft, date: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="flex gap-2">
                    <button onClick={() => { if (extraCheckDraft.amount) addExtraCheck({ ...extraCheckDraft, amount: +extraCheckDraft.amount, label: extraCheckDraft.label || "Bonus" }); }}
                      className="flex-1 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-1"><Check size={14} /> Save</button>
                    <button onClick={() => setExtraCheckDraft(null)} className="px-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                </div>
              )}

              {/* Income sources list */}
              {incomeSources.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Recurring Income Sources</p>
                  <div className="space-y-1.5">
                    {incomeSources.map((src) => {
                      const freqLabel = PAY_FREQUENCIES.find((f) => f.value === src.frequency)?.label || src.frequency;
                      const checksThisMonth = monthPaychecks.filter((p) => p.sourceId === src.id).length;
                      return (
                        <div key={src.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-indigo-50/40 border border-indigo-100 group">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">{freqLabel.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{src.name}</p>
                            <p className="text-xs text-gray-400">{freqLabel} · {fmt(src.amount)}/check · {checksThisMonth} this month</p>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">{fmt(src.amount * checksThisMonth)}</span>
                          <button onClick={() => removeIncomeSource(src.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition"><Trash2 size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Generated paycheck dates */}
              {monthPaychecks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pay Dates This Month</p>
                  <div className="space-y-1.5">
                    {monthPaychecks.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-emerald-50/60 border border-emerald-100 group">
                        <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center">
                          {p.date.getDate()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{p.label}{!p.isGenerated ? " (one-off)" : ""}</p>
                          <p className="text-xs text-gray-400">
                            {p.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            {p.frequency ? ` · ${PAY_FREQUENCIES.find((f) => f.value === p.frequency)?.label || p.frequency}` : ""}
                            {p.isOverridden && " · edited"}
                          </p>
                        </div>
                        {editingCheckId === p.id ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                              <input type="number" value={editingCheckAmount} onChange={(e) => setEditingCheckAmount(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && editingCheckAmount) saveCheckOverride(p.id, +editingCheckAmount); if (e.key === "Escape") setEditingCheckId(null); }}
                                className="w-24 pl-5 pr-2 py-1 border border-emerald-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
                            </div>
                            <button onClick={() => { if (editingCheckAmount) saveCheckOverride(p.id, +editingCheckAmount); }}
                              className="p-1 text-emerald-600 hover:text-emerald-700"><Check size={14} /></button>
                            <button onClick={() => setEditingCheckId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingCheckId(p.id); setEditingCheckAmount(String(p.amount)); }}
                            className="text-base font-bold text-emerald-700 hover:text-emerald-900 hover:underline decoration-dashed underline-offset-2 transition flex-shrink-0 cursor-pointer"
                            title="Click to edit amount for this month">
                            {fmt(p.amount)}
                          </button>
                        )}
                        {p.isOverridden && editingCheckId !== p.id && (
                          <button onClick={() => clearCheckOverride(p.id)} title="Reset to default"
                            className="text-gray-300 hover:text-amber-500 transition flex-shrink-0 text-xs">↺</button>
                        )}
                        {!p.isGenerated && (
                          <button onClick={() => removeExtraCheck(p.id)} className="text-gray-300 hover:text-rose-500 transition flex-shrink-0"><Trash2 size={14} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly total */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">Total income — {monthLabel(viewYear, viewMonth)}</span>
                <span className="text-lg font-bold text-emerald-600">{fmt(totalPaychecks)}</span>
              </div>
            </Card>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={DollarSign} label="Monthly Income" value={fmt(monthlyIncome)} sub={`${monthPaychecks.length} check${monthPaychecks.length !== 1 ? "s" : ""} · avg ${fmt(avgPaycheck)}`} color="green" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Calendar} label="Total Outgoing" value={fmt(totalAllExpenses)} sub={`Bills · Debt · Savings · Spending`} color="amber" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={PiggyBank} label="Savings" value={fmt(totalSavingsContrib)} sub={`${goals.length} goals (incl. in total)`} color="cyan" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Wallet} label="Remaining" value={fmt(remainingBudget)} sub={remainingBudget < 0 ? "Over budget!" : "After all obligations"} color={remainingBudget < 0 ? "rose" : "indigo"} />
            </div>

            {/* Per-Paycheck Allocation Bar */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Avg Per-Paycheck Allocation</h2>
              <div className="space-y-2.5">
                {[
                  { label: "Bills", value: perPaycheckBills, color: "#f59e0b" },
                  { label: "Savings", value: perPaycheckSavings, color: "#22d3ee" },
                  { label: "Debt Payments", value: perPaycheckDebt, color: "#f43f5e" },
                  { label: "Remaining", value: avgPaycheck - perPaycheckBills - perPaycheckSavings - perPaycheckDebt, color: "#6366f1" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-gray-500 text-right">{r.label}</span>
                    <div className="flex-1"><ProgressBar value={Math.max(r.value, 0)} max={avgPaycheck} color={r.color} /></div>
                    <span className="w-24 text-xs font-medium text-gray-700 text-right">{fmt(r.value)}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Budget Pie (clickable) + Expense Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Monthly Budget Breakdown</h2>
                <p className="text-xs text-gray-400 mb-3">Click a slice to see expenses</p>
                {(() => {
                  const donutSlices = [
                    { name: "Bills", value: totalBills, color: "#f59e0b", filterType: "bill" },
                    { name: "Debt", value: totalDebtPayments, color: "#f43f5e", filterType: "debt" },
                    { name: "Savings", value: totalSavingsContrib, color: "#22d3ee", filterType: "savings" },
                    { name: "Other Spending", value: totalManualExpenses, color: "#8b5cf6", filterType: "manual" },
                    { name: "Remaining", value: Math.max(remainingBudget, 0), color: "#6366f1", filterType: null },
                  ].filter(d => d.value > 0);
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={donutSlices} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            onClick={(_, index) => {
                              const slice = donutSlices[index];
                              if (slice && slice.filterType) {
                                setSelectedCategory(selectedCategory === slice.name ? null : slice.name);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {donutSlices.map((d, i) => (
                              <Cell key={i} fill={d.color} stroke={selectedCategory === d.name ? "#1e1b4b" : "transparent"} strokeWidth={selectedCategory === d.name ? 3 : 0}
                                opacity={selectedCategory && selectedCategory !== d.name ? 0.4 : 1} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Drill-down panel */}
                      {selectedCategory && (() => {
                        const typeMap = { "Bills": "bill", "Debt": "debt", "Savings": "savings", "Other Spending": "manual" };
                        const filterType = typeMap[selectedCategory];
                        const filtered = allMonthExpenses.filter((e) => e.type === filterType);
                        const sliceColor = donutSlices.find((s) => s.name === selectedCategory)?.color || "#6366f1";
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sliceColor }} />
                                <span className="text-sm font-semibold text-gray-700">{selectedCategory}</span>
                                <span className="text-xs text-gray-400">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
                              </div>
                              <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                            {filtered.length === 0 ? (
                              <p className="text-xs text-gray-400 italic py-2">No items in this category</p>
                            ) : (
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {filtered.sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
                                  <div key={e.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 text-sm">
                                    <span className="text-xs text-gray-400 w-12 flex-shrink-0">{new Date(e.date + "T12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                    <span className="flex-1 text-gray-700 truncate">{e.description}</span>
                                    <span className="font-semibold text-gray-800 flex-shrink-0">{fmt(e.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between text-xs">
                              <span className="text-gray-400">Total</span>
                              <span className="font-bold" style={{ color: sliceColor }}>{fmt(filtered.reduce((s, e) => s + e.amount, 0))}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </Card>
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Spending by Category</h2>
                {expByCategory.length === 0 ? <EmptyState icon={DollarSign} message="No expenses logged this month" /> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={expByCategory} layout="vertical" margin={{ left: 80, right: 20 }}>
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={11} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={75} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {expByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Upcoming Bills Calendar */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Bell size={15} className="text-amber-500" /> Upcoming Bills — {monthLabel(viewYear, viewMonth)}
              </h2>
              {upcomingBills.length === 0 ? <EmptyState icon={Calendar} message="No bills to show" /> : (
                <div className="space-y-2">
                  {upcomingBills.map((b) => {
                    const urgencyStyles = {
                      urgent: { bg: "bg-rose-50", border: "border-rose-200", badge: "bg-rose-500 text-white", text: "text-rose-700" },
                      soon: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-400 text-white", text: "text-amber-700" },
                      upcoming: { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-200 text-gray-600", text: "text-gray-600" },
                    };
                    const s = urgencyStyles[b.urgency];
                    return (
                      <div key={b.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl ${s.bg} border ${s.border}`}>
                        <div className="flex flex-col items-center w-14 flex-shrink-0">
                          <span className="text-xs text-gray-400 uppercase">{b.dueDate.toLocaleDateString("en-US", { month: "short" })}</span>
                          <span className="text-lg font-bold text-gray-800">{b.dueDay}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{b.name}</p>
                          <p className="text-xs text-gray-400">{b.category}{b.autopay ? " · Autopay" : ""}</p>
                        </div>
                        {isCurrentMonth && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
                            {b.daysUntil === 0 ? "Due today" : b.daysUntil === 1 ? "Tomorrow" : `${b.daysUntil} days`}
                          </span>
                        )}
                        <span className={`text-sm font-bold ${s.text}`}>{fmt(b.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {isCurrentMonth && upcomingBills.filter((b) => b.urgency === "urgent").length > 0 && (
                <div className="mt-3 pt-3 border-t border-rose-100 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-500" />
                  <span className="text-xs text-rose-600 font-medium">
                    {upcomingBills.filter((b) => b.urgency === "urgent").length} bill{upcomingBills.filter((b) => b.urgency === "urgent").length !== 1 ? "s" : ""} due within 3 days totaling {fmt(upcomingBills.filter((b) => b.urgency === "urgent").reduce((s, b) => s + b.amount, 0))}
                  </span>
                </div>
              )}
            </Card>

            {/* Cash Flow Timeline */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-500" /> Cash Flow Timeline
              </h2>
              <p className="text-xs text-gray-400 mb-4">Running balance through {monthLabel(viewYear, viewMonth)}</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cashFlowTimeline} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white shadow-lg border border-gray-200 rounded-lg p-2.5 text-xs">
                        <p className="font-semibold text-gray-700">Day {d.day}</p>
                        {d.income > 0 && <p className="text-emerald-600">+ {fmt(d.income)} income</p>}
                        {d.expenses > 0 && <p className="text-rose-500">- {fmt(d.expenses)} out</p>}
                        <p className={`font-bold mt-1 ${d.balance >= 0 ? "text-indigo-600" : "text-rose-600"}`}>Balance: {fmt(d.balance)}</p>
                        {d.events.length > 0 && (
                          <div className="mt-1 pt-1 border-t border-gray-100">
                            {d.events.map((e, i) => <p key={i} className="text-gray-500">{e.label}</p>)}
                          </div>
                        )}
                      </div>
                    );
                  }} />
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2.5} fill="url(#balanceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Low balance warning */}
              {cashFlowTimeline.some((d) => d.balance < 0) && (
                <div className="mt-3 pt-3 border-t border-rose-100 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-500" />
                  <span className="text-xs text-rose-600 font-medium">
                    Your balance goes negative around day {cashFlowTimeline.find((d) => d.balance < 0)?.day} — consider shifting bill due dates or timing an extra check.
                  </span>
                </div>
              )}
            </Card>

            {/* Income vs Spending Trends */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <TrendingUp size={15} className="text-indigo-500" /> Income vs. Spending Trends
              </h2>
              <p className="text-xs text-gray-400 mb-4">Last 6 months ending {monthLabel(viewYear, viewMonth)}</p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ r: 4, fill: "#10b981" }} />
                  <Area type="monotone" dataKey="spending" name="Spending" stroke="#f43f5e" strokeWidth={2.5} fill="url(#spendingGrad)" dot={{ r: 4, fill: "#f43f5e" }} />
                  <Line type="monotone" dataKey="saved" name="Saved" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#6366f1" }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-400">Avg Income</p>
                  <p className="text-sm font-bold text-emerald-600">{fmt(trendData.reduce((s, d) => s + d.income, 0) / trendData.length)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg Spending</p>
                  <p className="text-sm font-bold text-rose-500">{fmt(trendData.reduce((s, d) => s + d.spending, 0) / trendData.length)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg Savings Rate</p>
                  <p className="text-sm font-bold text-indigo-600">
                    {(() => {
                      const avgInc = trendData.reduce((s, d) => s + d.income, 0) / trendData.length;
                      const avgSave = trendData.reduce((s, d) => s + d.saved, 0) / trendData.length;
                      return `${pct(avgSave, avgInc)}%`;
                    })()}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ═══════ PLANNER TAB (Fudget-style) ═══════ */}
        {tab === "planner" && (
          <>
            {/* Feature 2: Recurring expense suggestion banner */}
            {recurringExpenseSuggestion && (
              <div className={`p-4 rounded-xl border-l-4 border-amber-500 ${dm('bg-amber-50', 'bg-amber-950/30')} mb-4`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${dm('text-amber-900', 'text-amber-200')}`}>
                    <p className="font-semibold">Make "{recurringExpenseSuggestion.label}" recurring?</p>
                    <p className="text-xs mt-0.5 opacity-75">Appears {recurringExpenseSuggestion.monthCount} months in a row</p>
                  </div>
                  <button onClick={() => setDismissedSuggestions({ ...dismissedSuggestions, [recurringExpenseSuggestion.label]: true })}
                    className={`text-xs px-3 py-1 rounded ${dm('bg-amber-100 text-amber-700 hover:bg-amber-200', 'bg-amber-900 text-amber-100 hover:bg-amber-800')} transition`}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Header balance card */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
              <div className="text-center">
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">
                  {monthLabel(viewYear, viewMonth)} Balance
                </p>
                <p className={`text-3xl font-bold ${plannerBalance < 0 ? "text-rose-300" : "text-white"}`}>
                  {fmt(plannerBalance)}
                </p>
                <div className="flex justify-center gap-6 mt-3 text-sm">
                  <div>
                    <span className="text-indigo-200 text-xs">Income</span>
                    <p className="font-semibold text-emerald-300">{fmt(plannerTotalIncome)}</p>
                  </div>
                  <div className="w-px bg-indigo-400" />
                  <div>
                    <span className="text-indigo-200 text-xs">Expenses</span>
                    <p className="font-semibold text-rose-300">{fmt(plannerTotalExpenses)}</p>
                  </div>
                  <div className="w-px bg-indigo-400" />
                  <div>
                    <span className="text-indigo-200 text-xs">Unpaid</span>
                    <p className="font-semibold text-amber-300">{fmt(plannerUnpaidExpenses)}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Add item buttons */}
            <div className="flex gap-2">
              <button onClick={() => setPlannerDraft({ label: "", amount: "", type: "income" })}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-emerald-700 transition">
                <Plus size={16} /> Add Income
              </button>
              <button onClick={() => setPlannerDraft({ label: "", amount: "", type: "expense" })}
                className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-rose-600 transition">
                <Plus size={16} /> Add Expense
              </button>
            </div>

            {/* Add item form */}
            {plannerDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className={`${plannerDraft.type === "income" ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"}`}>
                <div className="flex gap-3">
                  <input placeholder={plannerDraft.type === "income" ? "Income label" : "Expense label"}
                    value={plannerDraft.label} onChange={(e) => setPlannerDraft({ ...plannerDraft, label: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Amount" value={plannerDraft.amount}
                      onChange={(e) => setPlannerDraft({ ...plannerDraft, amount: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && plannerDraft.label && plannerDraft.amount) addPlannerItem({ ...plannerDraft, amount: +plannerDraft.amount, paid: false });
                        if (e.key === "Escape") setPlannerDraft(null);
                      }}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <button onClick={() => { if (plannerDraft.label && plannerDraft.amount) addPlannerItem({ ...plannerDraft, amount: +plannerDraft.amount, paid: false }); }}
                    className={`px-4 text-white rounded-lg text-sm font-medium transition flex items-center gap-1 ${plannerDraft.type === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-500 hover:bg-rose-600"}`}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => setPlannerDraft(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
              </Card>
            )}

            {/* Swipe hint */}
            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
              <ChevronLeft size={12} /> Swipe left on items for actions
            </p>

            {/* Line items with running balance */}
            {sortedPlannerItems.length === 0 ? (
              <EmptyState icon={ClipboardList} message="No items yet — add income and expenses!" />
            ) : (
              <div className="space-y-1.5">
                {(() => {
                  let runningBalance = 0;
                  return sortedPlannerItems.map((item) => {
                    if (item.type === "income") runningBalance += item.amount;
                    else runningBalance -= item.amount;
                    const isIncome = item.type === "income";

                    return (
                      <SwipeRow darkMode={darkMode}
                        key={item.id}
                        isOpen={swipedItemId === item.id}
                        onToggle={(open) => setSwipedItemId(open ? item.id : null)}
                        actions={[
                          {
                            label: item.paid ? "Unpaid" : "Paid",
                            icon: item.paid ? <Circle size={16} /> : <CheckCircle size={16} />,
                            onClick: () => togglePlannerPaid(item.id),
                            className: item.paid ? "bg-gray-500" : "bg-emerald-500",
                          },
                          {
                            label: "Copy",
                            icon: <Copy size={16} />,
                            onClick: () => duplicatePlannerItem(item.id),
                            className: "bg-indigo-500",
                          },
                          {
                            label: "Note",
                            icon: <StickyNote size={16} />,
                            onClick: () => {
                              setEditingNoteId(item.id);
                              setEditingNoteText((plannerNotesByMonth[vKey] || {})[item.id] || "");
                            },
                            className: "bg-amber-500",
                          },
                          {
                            label: "Delete",
                            icon: <Trash2 size={16} />,
                            onClick: () => removePlannerItem(item.id),
                            className: "bg-rose-500",
                          },
                        ]}
                      >
                        <div className={`flex items-center gap-3 py-3 px-4 border rounded-xl transition ${
                          item.paid
                            ? "bg-gray-50 border-gray-200"
                            : isIncome
                              ? "bg-emerald-50/40 border-emerald-100"
                              : "bg-white border-gray-100"
                        }`}>
                          {/* Drag handle */}
                          <div className="flex-shrink-0"
                            draggable
                            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedItemId(item.id); }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverItemId(item.id); }}
                            onDragEnd={() => { if (draggedItemId && dragOverItemId && draggedItemId !== dragOverItemId) reorderPlannerItem(draggedItemId, dragOverItemId); else { setDraggedItemId(null); setDragOverItemId(null); } }}
                            onDrop={(e) => { e.preventDefault(); if (draggedItemId && dragOverItemId) reorderPlannerItem(draggedItemId, dragOverItemId); }}
                          >
                            <GripVertical size={14} className={`cursor-grab active:cursor-grabbing ${dragOverItemId === item.id ? 'text-indigo-500' : 'text-gray-300'}`} />
                          </div>
                          {/* Clickable paid toggle */}
                          <button onClick={() => togglePlannerPaid(item.id)} className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95" title={item.paid ? "Mark unpaid" : "Mark paid"}>
                            {item.paid ? (
                              <CheckCircle size={18} className="text-emerald-500" />
                            ) : (
                              <Circle size={18} className={isIncome ? "text-emerald-300 hover:text-emerald-400" : "text-gray-300 hover:text-gray-400"} />
                            )}
                          </button>

                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-medium truncate ${item.paid ? "line-through text-gray-400" : "text-gray-800"}`}>
                                {item.label}
                              </p>
                              {item.auto && (() => {
                                const badge = { income: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Income" },
                                  bill: { bg: "bg-amber-100", text: "text-amber-700", label: "Bill" },
                                  debt: { bg: "bg-rose-100", text: "text-rose-700", label: "Debt" },
                                  savings: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Savings" },
                                }[item.source];
                                return badge ? <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}>{badge.label}</span> : null;
                              })()}
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {item.type}{item.paid ? " · paid" : ""}{item.auto ? " · synced" : ""}{item.dateLabel ? ` · ${item.dateLabel}` : ""}
                            </p>
                            {editingNoteId === item.id ? (
                              <div className="mt-2 flex gap-2">
                                <input
                                  autoFocus
                                  type="text"
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  placeholder="Add a note..."
                                  className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                                <button onClick={() => savePlannerNote(item.id)} className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600"><Check size={12} /></button>
                                <button onClick={cancelPlannerNote} className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400"><X size={12} /></button>
                              </div>
                            ) : (
                              (plannerNotesByMonth[vKey] || {})[item.id] && (
                                <p className="mt-1 text-xs italic text-gray-400">{(plannerNotesByMonth[vKey] || {})[item.id]}</p>
                              )
                            )}
                          </div>

                          {/* Amount */}
                          <span className={`text-sm font-bold flex-shrink-0 ${
                            item.paid
                              ? "text-gray-400"
                              : isIncome
                                ? "text-emerald-600"
                                : "text-rose-500"
                          }`}>
                            {isIncome ? "+" : "−"}{fmt(item.amount)}
                          </span>

                          {/* Running balance */}
                          <span className={`text-xs font-semibold w-20 text-right flex-shrink-0 ${
                            runningBalance >= 0 ? "text-indigo-600" : "text-rose-600"
                          }`}>
                            {fmt(runningBalance)}
                          </span>
                        </div>
                      </SwipeRow>
                    );
                  });
                })()}
              </div>
            )}

            {/* Bottom summary */}
            {plannerItems.length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Income</span>
                    <span className="text-sm font-bold text-emerald-600">{fmt(plannerTotalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Total Expenses</span>
                    <span className="text-sm font-bold text-rose-500">{fmt(plannerTotalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Paid Expenses</span>
                    <span className="text-sm font-semibold text-gray-400 line-through">{fmt(plannerPaidExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Still Owed</span>
                    <span className="text-sm font-bold text-amber-600">{fmt(plannerUnpaidExpenses)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Remaining After All</span>
                    <span className={`text-lg font-bold ${plannerBalance >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{fmt(plannerBalance)}</span>
                  </div>
                  {plannerBalance < 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <AlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                      <span className="text-xs text-rose-600 font-medium">You're over budget by {fmt(Math.abs(plannerBalance))} — remove expenses or add income.</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Progress bar: paid vs unpaid */}
            {plannerTotalExpenses > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Progress</h3>
                <div className="w-full h-4 rounded-full bg-gray-100 overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                    style={{ width: `${pct(plannerPaidExpenses, plannerTotalExpenses)}%` }} />
                  <div className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pct(plannerUnpaidExpenses, plannerTotalExpenses)}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-emerald-600 font-medium">{pct(plannerPaidExpenses, plannerTotalExpenses)}% paid</span>
                  <span className="text-amber-600 font-medium">{pct(plannerUnpaidExpenses, plannerTotalExpenses)}% remaining</span>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ═══════ BILLS TAB ═══════ */}
        {tab === "bills" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recurring Bills</h2>
              <button onClick={() => { setBillDraft({ name: "", amount: "", dueDay: 1, category: "Other", autopay: false }); setEditingBillId(null); }}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                <Plus size={16} /> Add Bill
              </button>
            </div>

            {billDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="border-indigo-200 bg-indigo-50/30">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <input placeholder="Bill name" value={billDraft.name} onChange={(e) => setBillDraft({ ...billDraft, name: e.target.value })}
                    className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Amount" value={billDraft.amount} onChange={(e) => setBillDraft({ ...billDraft, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <input type="number" min="1" max="31" placeholder="Due day" value={billDraft.dueDay} onChange={(e) => setBillDraft({ ...billDraft, dueDay: +e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={billDraft.category} onChange={(e) => setBillDraft({ ...billDraft, category: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => { if (billDraft.name && billDraft.amount) { if (editingBillId) updateBill(editingBillId, { ...billDraft, amount: +billDraft.amount }); else addBill({ ...billDraft, amount: +billDraft.amount }); } }}
                      className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-1"><Check size={14} /> {editingBillId ? 'Update' : 'Save'}</button>
                    <button onClick={() => { setBillDraft(null); setEditingBillId(null); }} className="px-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                </div>
              </Card>
            )}

            {/* Bills assigned to paychecks for this month */}
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Bills by Paycheck — {monthLabel(viewYear, viewMonth)}</p>
            {billsByPaycheck.map((group, gi) => (
              <Card key={gi}>
                <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <Calendar size={15} className="text-amber-500" /> {group.label}
                  {group.payDate && <span className="text-xs font-normal text-gray-400">({group.payDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})</span>}
                  <span className="ml-auto text-xs font-normal text-gray-400">{fmt(group.bills.reduce((s, b) => s + b.amount, 0))} total</span>
                </h3>
                {group.bills.length === 0 ? <p className="text-sm text-gray-400 italic">No bills in this window</p> : (
                  <div className="space-y-2">
                    {group.bills.map((b) => (
                      <SwipeRow key={b.id} darkMode={darkMode}
                        isOpen={swipedItemId === `bill-${b.id}`}
                        onToggle={(open) => setSwipedItemId(open ? `bill-${b.id}` : null)}
                        actions={[
                          { label: "Edit", icon: <Settings size={16} />, onClick: () => startEditBill(b), className: "bg-indigo-500" },
                          { label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeBill(b.id), className: "bg-rose-500" },
                        ]}>
                        <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold flex items-center justify-center">{b.dueDay}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')}`}>{b.name}</p>
                            <p className="text-xs text-gray-400">{b.category}{b.autopay ? " · Autopay" : ""}</p>
                          </div>
                          <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>{fmt(b.amount)}</span>
                        </div>
                      </SwipeRow>
                    ))}
                  </div>
                )}
              </Card>
            ))}

            {/* Bill Calendar View */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} flex items-center gap-2`}><CalendarDays size={16} className="text-indigo-500" /> Bill Calendar — {monthLabel(viewYear, viewMonth)}</h3>
                <button onClick={() => setBillCalendarView(!billCalendarView)} className={`text-xs px-2.5 py-1 rounded-lg transition ${dm('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-slate-700 text-slate-300 hover:bg-slate-600')}`}>
                  {billCalendarView ? 'Hide' : 'Show'}
                </button>
              </div>
              {billCalendarView && (() => {
                const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                const firstDow = new Date(viewYear, viewMonth, 1).getDay();
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const billMap = {};
                bills.forEach(b => { const d = b.dueDay <= daysInMonth ? b.dueDay : daysInMonth; if (!billMap[d]) billMap[d] = []; billMap[d].push(b); });
                const debtMap = {};
                debts.forEach(d => { const day = (d.dueDay || 1) <= daysInMonth ? (d.dueDay || 1) : daysInMonth; if (!debtMap[day]) debtMap[day] = []; debtMap[day].push(d); });
                const subMap = {};
                subscriptions.filter(s => s.active).forEach(s => {
                  if (s.nextBillDate) { const nd = new Date(s.nextBillDate); if (nd.getMonth() === viewMonth && nd.getFullYear() === viewYear) { const day = nd.getDate(); if (!subMap[day]) subMap[day] = []; subMap[day].push(s); } }
                });
                const payDates = new Set();
                paychecks.forEach(pc => { const d = new Date(pc.date); if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) payDates.add(d.getDate()); });
                const cells = [];
                for (let i = 0; i < firstDow; i++) cells.push(null);
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                return (
                  <div>
                    <div className="grid grid-cols-7 gap-px mb-1">
                      {dayNames.map(n => <div key={n} className={`text-[10px] font-semibold text-center py-1 ${dm('text-gray-400', 'text-gray-500')}`}>{n}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-px">
                      {cells.map((day, i) => {
                        if (!day) return <div key={`e${i}`} className="h-16" />;
                        const hasBill = billMap[day];
                        const hasDebt = debtMap[day];
                        const hasSub = subMap[day];
                        const isPay = payDates.has(day);
                        const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                        return (
                          <div key={day} className={`h-16 rounded-lg p-1 text-[10px] border transition ${isToday ? dm('border-indigo-400 bg-indigo-50', 'border-indigo-500 bg-indigo-950/30') : dm('border-gray-100 bg-gray-50/50', 'border-slate-700 bg-slate-800/50')}`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold ${isToday ? 'text-indigo-600' : dm('text-gray-600', 'text-gray-400')}`}>{day}</span>
                              {isPay && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Payday" />}
                            </div>
                            <div className="space-y-px mt-0.5 overflow-hidden max-h-[36px]">
                              {hasBill && hasBill.map(b => <div key={b.id} className="truncate text-[9px] text-amber-700 bg-amber-100 rounded px-0.5">{b.name}</div>)}
                              {hasDebt && hasDebt.map(d => <div key={d.id} className="truncate text-[9px] text-rose-700 bg-rose-100 rounded px-0.5">{d.name}</div>)}
                              {hasSub && hasSub.map(s => <div key={s.id} className="truncate text-[9px] text-purple-700 bg-purple-100 rounded px-0.5">{s.name}</div>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> Bills</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-400" /> Debts</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-400" /> Subs</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Payday</span>
                    </div>
                  </div>
                );
              })()}
            </Card>

            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="bg-amber-50/50 border-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Budget Check</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Your recurring bills ({fmt(totalBills)}) use {pct(totalBills, monthlyIncome)}% of this month's income ({fmt(monthlyIncome)}).
                    {monthlyIncome > 0 && totalBills > monthlyIncome * 0.5 ? " Consider reducing fixed costs — the 50/30/20 rule suggests bills should be under 50%." : monthlyIncome > 0 ? " Within a healthy range." : ""}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ═══════ SAVINGS TAB ═══════ */}
        {tab === "savings" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Savings Goals</h2>
              <button onClick={() => { setGoalDraft({ name: "", target: "", saved: "", monthlyContribution: "" }); setEditingGoalId(null); }}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                <Plus size={16} /> Add Goal
              </button>
            </div>

            {goalDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="border-indigo-200 bg-indigo-50/30">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <input placeholder="Goal name" value={goalDraft.name} onChange={(e) => setGoalDraft({ ...goalDraft, name: e.target.value })}
                    className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Target" value={goalDraft.target} onChange={(e) => setGoalDraft({ ...goalDraft, target: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Saved so far" value={goalDraft.saved} onChange={(e) => setGoalDraft({ ...goalDraft, saved: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Monthly" value={goalDraft.monthlyContribution} onChange={(e) => setGoalDraft({ ...goalDraft, monthlyContribution: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if (goalDraft.name && goalDraft.target) { const g = { ...goalDraft, target: +goalDraft.target, saved: +goalDraft.saved || 0, monthlyContribution: +goalDraft.monthlyContribution || 0 }; if (editingGoalId) updateGoal(editingGoalId, g); else addGoal(g); } }}
                      className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-1"><Check size={14} /> {editingGoalId ? 'Update' : 'Save'}</button>
                    <button onClick={() => { setGoalDraft(null); setEditingGoalId(null); }} className="px-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                </div>
              </Card>
            )}

            <p className="text-xs text-gray-400">Projected as of {monthLabel(viewYear, viewMonth)}</p>

            {goalTimelines.length === 0 ? <EmptyState icon={PiggyBank} message="No savings goals yet — add one!" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalTimelines.map((g) => {
                  const txns = savingsTransactions[g.id] || [];
                  const isExpanded = expandedGoalId === g.id;
                  return (
                    <SwipeRow key={g.id} darkMode={darkMode}
                      isOpen={swipedItemId === `goal-${g.id}`}
                      onToggle={(open) => setSwipedItemId(open ? `goal-${g.id}` : null)}
                      actions={[
                        { label: "Edit", icon: <Settings size={16} />, onClick: () => startEditGoal(g), className: "bg-indigo-500" },
                        { label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeGoal(g.id), className: "bg-rose-500" },
                      ]}>
                    <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{g.name}</h3>
                          <p className="text-xs text-gray-400">{fmt(g.monthlyContribution)}/mo · {g.months === Infinity ? "No contributions" : g.months <= 0 ? "Goal reached!" : `${g.months} months to go`}</p>
                        </div>
                      </div>
                      <ProgressBar value={g.saved} max={g.target} color={g.color} height={10} />
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>{fmt(g.saved)} saved</span>
                        <span className="font-medium">{pct(g.saved, g.target)}%</span>
                        <span>{fmt(g.target)} goal</span>
                      </div>
                      {g.months !== Infinity && g.months > 0 && (
                        <p className="mt-2 text-xs text-indigo-500 flex items-center gap-1"><Target size={12} /> Target date: {new Date(viewYear, viewMonth + g.months, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                      )}

                      {/* Withdraw / Deposit buttons */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setSavingsWithdrawDraft({ goalId: g.id, type: "withdrawal", amount: "", description: "" })}
                          className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition ${dm('bg-rose-50 text-rose-600 hover:bg-rose-100', 'bg-rose-950/30 text-rose-400 hover:bg-rose-950/50')}`}>
                          <ArrowUpCircle size={14} /> Withdraw
                        </button>
                        <button onClick={() => setSavingsWithdrawDraft({ goalId: g.id, type: "deposit", amount: "", description: "" })}
                          className={`flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg transition ${dm('bg-emerald-50 text-emerald-600 hover:bg-emerald-100', 'bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50')}`}>
                          <ArrowDownCircle size={14} /> Deposit
                        </button>
                      </div>

                      {/* Withdraw/Deposit form */}
                      {savingsWithdrawDraft && savingsWithdrawDraft.goalId === g.id && (
                        <div className={`mt-3 p-3 rounded-xl border ${savingsWithdrawDraft.type === "withdrawal" ? dm('bg-rose-50/50 border-rose-200', 'bg-rose-950/20 border-rose-800') : dm('bg-emerald-50/50 border-emerald-200', 'bg-emerald-950/20 border-emerald-800')}`}>
                          <p className={`text-xs font-semibold mb-2 ${savingsWithdrawDraft.type === "withdrawal" ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {savingsWithdrawDraft.type === "withdrawal" ? "Withdraw from" : "Deposit to"} {g.name}
                          </p>
                          <div className="flex gap-2">
                            <input placeholder="What for?" value={savingsWithdrawDraft.description}
                              onChange={(e) => setSavingsWithdrawDraft({ ...savingsWithdrawDraft, description: e.target.value })}
                              className={`flex-1 px-3 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} autoFocus />
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                              <input type="number" placeholder="Amount" value={savingsWithdrawDraft.amount}
                                onChange={(e) => setSavingsWithdrawDraft({ ...savingsWithdrawDraft, amount: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && savingsWithdrawDraft.amount && savingsWithdrawDraft.description) {
                                    if (savingsWithdrawDraft.type === "withdrawal") withdrawFromGoal(g.id, +savingsWithdrawDraft.amount, savingsWithdrawDraft.description);
                                    else depositToGoal(g.id, +savingsWithdrawDraft.amount, savingsWithdrawDraft.description);
                                  }
                                }}
                                className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => {
                              if (savingsWithdrawDraft.amount && savingsWithdrawDraft.description) {
                                if (savingsWithdrawDraft.type === "withdrawal") withdrawFromGoal(g.id, +savingsWithdrawDraft.amount, savingsWithdrawDraft.description);
                                else depositToGoal(g.id, +savingsWithdrawDraft.amount, savingsWithdrawDraft.description);
                              }
                            }} className={`flex-1 text-white rounded-lg text-xs font-medium py-1.5 transition ${savingsWithdrawDraft.type === "withdrawal" ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                              <Check size={12} className="inline mr-1" /> Confirm
                            </button>
                            <button onClick={() => setSavingsWithdrawDraft(null)} className="px-3 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Transaction history dropdown */}
                      {txns.length > 0 && (
                        <div className="mt-3">
                          <button onClick={() => setExpandedGoalId(isExpanded ? null : g.id)}
                            className={`w-full flex items-center justify-between text-xs font-medium py-1.5 px-2 rounded-lg transition ${dm('text-gray-400 hover:bg-slate-700', 'text-gray-500 hover:bg-gray-100')}`}>
                            <span>{txns.length} transaction{txns.length > 1 ? 's' : ''}</span>
                            <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {isExpanded && (
                            <div className={`mt-1 space-y-1 max-h-48 overflow-y-auto rounded-lg ${dm('bg-slate-700/30', 'bg-gray-50')} p-2`}>
                              {[...txns].reverse().map((txn) => (
                                <div key={txn.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${dm('hover:bg-slate-600/50', 'hover:bg-white')} transition`}>
                                  {txn.type === "withdrawal" ? (
                                    <ArrowUpCircle size={14} className="text-rose-500 flex-shrink-0" />
                                  ) : (
                                    <ArrowDownCircle size={14} className="text-emerald-500 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium ${dm('text-gray-200', 'text-gray-700')} truncate`}>{txn.description}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(txn.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                  </div>
                                  <span className={`text-xs font-bold flex-shrink-0 ${txn.type === "withdrawal" ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {txn.type === "withdrawal" ? "−" : "+"}{fmt(txn.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                    </SwipeRow>
                  );
                })}
              </div>
            )}

            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Savings Projection</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={goalTimelines.map((g) => ({ name: g.name, Saved: g.saved, Remaining: Math.max(g.target - g.saved, 0) }))}>
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis tickFormatter={(v) => `$${v}`} fontSize={11} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Saved" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Remaining" stackId="a" fill="#e0e7ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {/* ═══════ EXPENSES TAB ═══════ */}
        {tab === "expenses" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Expenses — {monthLabel(viewYear, viewMonth)}</h2>
              <button onClick={() => setExpDraft({ description: "", amount: "", category: "Other", date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0")}`, merchant: "" })}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                <Plus size={16} /> Add Expense
              </button>
            </div>

            {/* Feature 3: Manage Categories */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className={`border-l-4 border-indigo-500 mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Manage Categories</h3>
                <button onClick={() => setNewCatDraft({ name: "", color: COLORS[0] })} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Plus size={16} /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {customCategories.map((cat, idx) => (
                  <div key={cat.name} className={`p-2 rounded flex items-center gap-2 ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{cat.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            {newCatDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="border-indigo-200 mb-4">
                <div className="space-y-3">
                  <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Add New Category</h4>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCatDraft.name}
                      onChange={(e) => setNewCatDraft({ ...newCatDraft, name: e.target.value })}
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200'}`}
                    />
                    <div className="flex items-center gap-2">
                      <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Color:</label>
                      <input
                        type="color"
                        value={newCatDraft.color}
                        onChange={(e) => setNewCatDraft({ ...newCatDraft, color: e.target.value })}
                        className="w-10 h-10 border rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        if (newCatDraft.name.trim()) {
                          setCustomCategories([...customCategories, { name: newCatDraft.name.trim(), color: newCatDraft.color }]);
                          setNewCatDraft(null);
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      <Check size={14} className="inline mr-1" /> Save
                    </button>
                    <button onClick={() => setNewCatDraft(null)} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                      <X size={14} className="inline mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Budget Targets Card */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className={`border-l-4 ${dm('border-purple-500', 'border-purple-400')} mb-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${dm('text-gray-700', 'text-gray-200')}`}>Budget Targets</h3>

              {Object.entries(categoryBudgets).length > 0 ? (
                <div className="space-y-3 mb-4">
                  {Object.entries(categoryBudgets).map(([catName, budgetAmount]) => {
                    const spent = expByCategory.find(e => e.name === catName)?.value || 0;
                    const isOverBudget = spent > budgetAmount;
                    const pctSpent = pct(spent, budgetAmount);
                    return (
                      <SwipeRow key={catName} darkMode={darkMode}
                        isOpen={swipedItemId === `budget-${catName}`}
                        onToggle={(open) => setSwipedItemId(open ? `budget-${catName}` : null)}
                        actions={[
                          { label: "Edit", icon: <Settings size={16} />, onClick: () => { setBudgetDraft({ category: catName, amount: budgetAmount }); setEditingBudgetCat(catName); }, className: "bg-indigo-500" },
                          { label: "Delete", icon: <Trash2 size={16} />, onClick: () => { const nb = { ...categoryBudgets }; delete nb[catName]; setCategoryBudgets(nb); }, className: "bg-rose-500" },
                        ]}>
                        {editingBudgetCat === catName && budgetDraft ? (
                          <div className={`p-3 rounded-lg ${dm('bg-indigo-50', 'bg-slate-700/50')} space-y-2`}>
                            <div className="flex gap-2 items-center">
                              <span className={`text-sm font-medium flex-1 ${dm('text-gray-700', 'text-gray-200')}`}>{catName}</span>
                              <div className="relative w-28">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input type="number" value={budgetDraft.amount} onChange={(e) => setBudgetDraft({ ...budgetDraft, amount: e.target.value })}
                                  className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                              </div>
                              <button onClick={() => { if (budgetDraft.amount) { setCategoryBudgets({ ...categoryBudgets, [catName]: +budgetDraft.amount }); setEditingBudgetCat(null); setBudgetDraft(null); } }}
                                className="p-1.5 bg-indigo-600 text-white rounded-lg"><Check size={14} /></button>
                              <button onClick={() => { setEditingBudgetCat(null); setBudgetDraft(null); }}
                                className="p-1.5 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-lg ${dm('bg-gray-50', 'bg-slate-700/50')}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')}`}>{catName}</h4>
                                <div className="flex gap-4 text-xs mt-1">
                                  <span className={dm('text-gray-600', 'text-gray-400')}>Target: {fmt(budgetAmount)}</span>
                                  <span className={`font-medium ${isOverBudget ? 'text-rose-500' : dm('text-emerald-600', 'text-emerald-400')}`}>Spent: {fmt(spent)}</span>
                                </div>
                              </div>
                            </div>
                            <ProgressBar value={spent} max={budgetAmount} color={isOverBudget ? "#f43f5e" : "#6366f1"} height={6} />
                            {isOverBudget && (
                              <div className={`flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md text-xs font-medium ${dm('bg-rose-50 text-rose-600', 'bg-rose-950/30 text-rose-400')}`}>
                                <AlertCircle size={12} />
                                <span>Over budget by {fmt(spent - budgetAmount)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </SwipeRow>
                    );
                  })}
                </div>
              ) : (
                <p className={`text-xs text-center py-3 ${dm('text-gray-500', 'text-gray-400')}`}>No budget targets set</p>
              )}

              {budgetDraft ? (
                <div className={`p-3 rounded-lg border-2 ${dm('bg-indigo-50 border-indigo-200', 'bg-slate-700/50 border-slate-600')} space-y-2`}>
                  <h4 className={`text-xs font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Add Budget Target</h4>
                  <div className="flex gap-2">
                    <select
                      value={budgetDraft.category}
                      onChange={(e) => setBudgetDraft({ ...budgetDraft, category: e.target.value })}
                      className={`flex-1 px-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${dm('bg-white border-gray-200', 'bg-slate-600 border-slate-500 text-white')}`}
                    >
                      <option value="">Select category...</option>
                      {customCategories.filter(cat => !categoryBudgets[cat.name]).map(cat => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${dm('text-gray-500', 'text-gray-400')}`}>$</span>
                      <input
                        type="number"
                        placeholder="Amount"
                        value={budgetDraft.amount}
                        onChange={(e) => setBudgetDraft({ ...budgetDraft, amount: e.target.value })}
                        className={`w-20 pl-6 pr-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${dm('bg-white border-gray-200', 'bg-slate-600 border-slate-500 text-white')}`}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (budgetDraft.category && budgetDraft.amount) {
                          setCategoryBudgets({ ...categoryBudgets, [budgetDraft.category]: +budgetDraft.amount });
                          setBudgetDraft(null);
                          setEditingBudgetCat(null);
                        }
                      }}
                      className="flex-1 px-2 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setBudgetDraft(null)}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${dm('bg-slate-600 text-gray-200 hover:bg-slate-500', 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setBudgetDraft({ category: "", amount: "" })}
                  className={`w-full px-3 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition ${dm('border-slate-600 text-purple-300 hover:bg-slate-700/30', 'border-purple-300 text-purple-600 hover:bg-purple-50')}`}
                >
                  <Plus size={14} className="inline mr-1" /> Add Budget Target
                </button>
              )}
            </Card>

            {/* Spending Alerts */}
            {Object.entries(categoryBudgets).some(([cat, budget]) => {
              const spent = expByCategory.find(e => e.name === cat)?.value || 0;
              return spent >= budget * 0.75;
            }) && (
              <div className="space-y-2">
                {Object.entries(categoryBudgets).map(([cat, budget]) => {
                  const spent = expByCategory.find(e => e.name === cat)?.value || 0;
                  const ratio = spent / budget;
                  if (ratio < 0.75) return null;
                  const level = ratio >= 1 ? { bg: dm('bg-rose-50 border-rose-200', 'bg-rose-950/30 border-rose-800'), text: dm('text-rose-700', 'text-rose-300'), icon: 'text-rose-500', label: 'Over budget!' }
                    : ratio >= 0.9 ? { bg: dm('bg-amber-50 border-amber-200', 'bg-amber-950/30 border-amber-800'), text: dm('text-amber-700', 'text-amber-300'), icon: 'text-amber-500', label: '90% spent' }
                    : { bg: dm('bg-yellow-50 border-yellow-200', 'bg-yellow-950/30 border-yellow-800'), text: dm('text-yellow-700', 'text-yellow-300'), icon: 'text-yellow-500', label: '75% spent' };
                  return (
                    <div key={cat} className={`flex items-center gap-3 p-3 rounded-xl border ${level.bg}`}>
                      <AlertCircle size={18} className={level.icon} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${level.text}`}>{cat}: {level.label}</p>
                        <p className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>{fmt(spent)} of {fmt(budget)} ({Math.round(ratio * 100)}%)</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {expDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="border-indigo-200 bg-indigo-50/30">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <input placeholder="Description" value={expDraft.description} onChange={(e) => setExpDraft({ ...expDraft, description: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input placeholder="Merchant (optional)" value={expDraft.merchant || ""} onChange={(e) => setExpDraft({ ...expDraft, merchant: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" placeholder="Amount" value={expDraft.amount} onChange={(e) => setExpDraft({ ...expDraft, amount: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <select value={expDraft.category} onChange={(e) => {
                      const cat = e.target.value;
                      setExpDraft({ ...expDraft, category: cat, goalId: cat === "Savings" ? (goals[0]?.id || "") : "", description: cat === "Savings" && !expDraft.description ? (goals[0]?.name || "") + " contribution" : expDraft.description });
                    }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input type="date" value={expDraft.date} onChange={(e) => setExpDraft({ ...expDraft, date: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  {expDraft.category === "Savings" && (
                    <div className="flex items-center gap-3 p-2.5 bg-cyan-50 rounded-lg border border-cyan-100">
                      <PiggyBank size={16} className="text-cyan-500 flex-shrink-0" />
                      <select value={expDraft.goalId || ""} onChange={(e) => {
                        const goal = goals.find((g) => g.id === e.target.value);
                        setExpDraft({ ...expDraft, goalId: e.target.value, description: goal ? `${goal.name} contribution` : expDraft.description });
                      }}
                        className="flex-1 px-3 py-1.5 border border-cyan-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <option value="">Select savings goal...</option>
                        {goals.map((g) => <option key={g.id} value={g.id}>{g.name} ({fmt(g.saved)} / {fmt(g.target)})</option>)}
                      </select>
                      <span className="text-xs text-cyan-600 font-medium whitespace-nowrap">Credits goal</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { if (expDraft.description && expDraft.amount && (expDraft.category !== "Savings" || expDraft.goalId)) addExpense({ ...expDraft, amount: +expDraft.amount }); }}
                      className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium py-2 hover:bg-indigo-700 transition flex items-center justify-center gap-1"><Check size={14} /> Save</button>
                    <button onClick={() => setExpDraft(null)} className="px-4 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </div>
                </div>
              </Card>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Calendar} label="Recurring Bills" value={fmt(totalBills)} sub={`${bills.length} bills`} color="amber" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={CreditCard} label="Debt Payments" value={fmt(totalDebtPayments)} sub={`${debts.length} debts`} color="rose" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={PiggyBank} label="Savings" value={fmt(totalSavingsContrib)} sub={`${goals.length} goals`} color="cyan" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={DollarSign} label="Other Spending" value={fmt(totalManualExpenses)} sub={`${manualExpenses.length} items`} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="lg:col-span-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">By Category</h3>
                {expByCategory.length === 0 ? <EmptyState icon={DollarSign} message="No expenses this month" /> : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={expByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                          {expByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {expByCategory.map((c, i) => (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-gray-600">{c.name}</span>
                          <span className="font-medium text-gray-800">{fmt(c.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">All Expenses This Month</h3>
                {allMonthExpenses.length === 0 ? <EmptyState icon={DollarSign} message="No expenses this month" /> : (
                  <div className="space-y-1.5 max-h-[28rem] overflow-y-auto">
                    {[...allMonthExpenses].sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
                      const typeBadge = {
                        bill: { bg: "bg-amber-100", text: "text-amber-700", label: "Bill", iconBg: "bg-amber-50", iconText: "text-amber-500" },
                        debt: { bg: "bg-rose-100", text: "text-rose-700", label: "Debt", iconBg: "bg-rose-50", iconText: "text-rose-500" },
                        savings: { bg: "bg-cyan-100", text: "text-cyan-700", label: "Savings", iconBg: "bg-cyan-50", iconText: "text-cyan-500" },
                        manual: { bg: "bg-indigo-100", text: "text-indigo-700", label: "", iconBg: "bg-indigo-50", iconText: "text-indigo-500" },
                      }[e.type];
                      return !e.recurring ? (
                        <SwipeRow key={e.id} darkMode={darkMode}
                          isOpen={swipedItemId === `exp-${e.id}`}
                          onToggle={(open) => setSwipedItemId(open ? `exp-${e.id}` : null)}
                          actions={[{ label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeExpense(e.id), className: "bg-rose-500" }]}>
                          <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                            <div className={`w-8 h-8 flex-shrink-0 rounded-lg ${typeBadge.iconBg} ${typeBadge.iconText} text-xs font-bold flex items-center justify-center`}>
                              {new Date(e.date + "T12:00").getDate()}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{e.description}</p>
                              </div>
                              <p className="text-xs text-gray-400 truncate">
                                {e.merchant ? `${e.merchant} · ` : ''}{e.category}
                                {e.goalId && (() => { const goal = goals.find((g) => g.id === e.goalId); return goal ? ` · ${goal.name} (${pct(goal.saved, goal.target)}%)` : ""; })()}
                              </p>
                            </div>
                            <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} flex-shrink-0`}>{fmt(e.amount)}</span>
                          </div>
                        </SwipeRow>
                      ) : (
                        <div key={e.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                          <div className={`w-8 h-8 flex-shrink-0 rounded-lg ${typeBadge.iconBg} ${typeBadge.iconText} text-xs font-bold flex items-center justify-center`}>
                            {new Date(e.date + "T12:00").getDate()}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{e.description}</p>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeBadge.bg} ${typeBadge.text}`}>{typeBadge.label}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate">
                              {e.merchant ? `${e.merchant} · ` : ''}{e.category}
                              {e.goalId && (() => { const goal = goals.find((g) => g.id === e.goalId); return goal ? ` · ${goal.name} (${pct(goal.saved, goal.target)}%)` : ""; })()}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} flex-shrink-0`}>{fmt(e.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Bills</span><span>{fmt(totalBills)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Debt payments</span><span>{fmt(totalDebtPayments)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Savings contributions</span><span>{fmt(totalSavingsContrib)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Other spending</span><span>{fmt(totalManualExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100">
                    <span className="text-gray-600">Total — {monthLabel(viewYear, viewMonth)}</span>
                    <span className="text-gray-900">{fmt(totalAllExpenses)}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Merchant Tracking */}
            {allMonthExpenses.filter(e => !e.recurring).length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Top Merchants</h3>
                <div className="space-y-2">
                  {(() => {
                    const merchants = {};
                    allMonthExpenses.filter(e => !e.recurring).forEach(e => {
                      const name = e.description || 'Unknown';
                      if (!merchants[name]) merchants[name] = { count: 0, total: 0 };
                      merchants[name].count++;
                      merchants[name].total += e.amount;
                    });
                    return Object.entries(merchants)
                      .sort((a, b) => b[1].total - a[1].total)
                      .slice(0, 10)
                      .map(([name, data], i) => (
                        <div key={name} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${dm('bg-gray-50 hover:bg-gray-100', 'bg-slate-700/40 hover:bg-slate-700')} transition`}>
                          <div className={`w-8 h-8 rounded-lg ${dm('bg-indigo-100', 'bg-slate-700')} ${dm('text-indigo-600', 'text-indigo-400')} text-xs font-bold flex items-center justify-center`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{name}</p>
                            <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>{data.count} transaction{data.count > 1 ? 's' : ''}</p>
                          </div>
                          <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>{fmt(data.total)}</span>
                        </div>
                      ));
                  })()}
                </div>
              </Card>
            )}
          </>
        )}

        {/* ═══════ DEBT TAB ═══════ */}
        {tab === "debt" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Debt Payoff Tracker</h2>
              <button onClick={() => { setDebtDraft({ name: "", balance: "", rate: "", minPayment: "", extraPayment: "", frequency: "monthly", dueDay: 1 }); setEditingDebtId(null); }}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                <Plus size={16} /> Add Debt
              </button>
            </div>

            {debtDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className={dm('border-indigo-200 bg-indigo-50/30', 'border-indigo-800 bg-indigo-950/30')}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input placeholder="Debt name" value={debtDraft.name} onChange={(e) => setDebtDraft({ ...debtDraft, name: e.target.value })}
                    className={`col-span-2 px-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Balance" value={debtDraft.balance} onChange={(e) => setDebtDraft({ ...debtDraft, balance: e.target.value })}
                      className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" placeholder="APR %" value={debtDraft.rate} onChange={(e) => setDebtDraft({ ...debtDraft, rate: e.target.value })}
                      className={`w-full pr-7 pl-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Min payment" value={debtDraft.minPayment} onChange={(e) => setDebtDraft({ ...debtDraft, minPayment: e.target.value })}
                      className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="number" placeholder="Extra payment" value={debtDraft.extraPayment} onChange={(e) => setDebtDraft({ ...debtDraft, extraPayment: e.target.value })}
                      className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                  <select value={debtDraft.frequency || "monthly"} onChange={(e) => setDebtDraft({ ...debtDraft, frequency: e.target.value })}
                    className={`px-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <div className="relative">
                    <input type="number" min="1" max="31" placeholder="Due day" value={debtDraft.dueDay || ''} onChange={(e) => setDebtDraft({ ...debtDraft, dueDay: +e.target.value || 1 })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>day</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { if (debtDraft.name && debtDraft.balance) { const d = { ...debtDraft, balance: +debtDraft.balance, rate: +debtDraft.rate || 0, minPayment: +debtDraft.minPayment || 0, extraPayment: +debtDraft.extraPayment || 0, frequency: debtDraft.frequency || "monthly", dueDay: +debtDraft.dueDay || 1 }; if (editingDebtId) updateDebt(editingDebtId, d); else addDebt(d); } }}
                    className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium py-2 hover:bg-indigo-700 transition flex items-center justify-center gap-1"><Check size={14} /> {editingDebtId ? 'Update' : 'Save'}</button>
                  <button onClick={() => { setDebtDraft(null); setEditingDebtId(null); }} className="px-4 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={CreditCard} label="Total Debt" value={fmt(totalDebtBalance)} color="rose" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={DollarSign} label="Monthly Payments" value={fmt(totalDebtPayments)} sub="Min + extra" color="amber" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={TrendingUp} label="Debt-to-Income" value={`${pct(totalDebtPayments, monthlyIncome)}%`} sub={monthlyIncome > 0 && pct(totalDebtPayments, monthlyIncome) > 36 ? "Above recommended 36%" : "Healthy ratio"} color={monthlyIncome > 0 && pct(totalDebtPayments, monthlyIncome) > 36 ? "rose" : "green"} />
            </div>

            {debtTimelines.length === 0 ? <EmptyState icon={CreditCard} message="No debts tracked — add one!" /> : (
              <div className="space-y-4">
                {debtTimelines.map((d) => (
                  <SwipeRow key={d.id} darkMode={darkMode}
                    isOpen={swipedItemId === `debt-${d.id}`}
                    onToggle={(open) => setSwipedItemId(open ? `debt-${d.id}` : null)}
                    actions={[
                      { label: "Edit", icon: <Settings size={16} />, onClick: () => startEditDebt(d), className: "bg-indigo-500" },
                      { label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeDebt(d.id), className: "bg-rose-500" },
                    ]}>
                  <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{d.name}</h3>
                        <p className="text-xs text-gray-400">{d.rate}% APR · {fmt(d.minPayment)} min{d.extraPayment > 0 ? ` + ${fmt(d.extraPayment)} extra` : ""} · {d.frequency || 'monthly'} · due {d.dueDay || 1}{['st','nd','rd'][((d.dueDay || 1) % 10) - 1] && (d.dueDay || 1) < 4 || (d.dueDay || 1) > 20 && (d.dueDay || 1) < 24 ? ['st','nd','rd'][((d.dueDay || 1) % 10) - 1] : 'th'}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{fmt(0)}</span>
                        <span className="font-medium text-gray-700">{fmt(d.balance)} remaining</span>
                      </div>
                      <ProgressBar value={d.balance} max={d.balance + d.totalInterest} color="#f43f5e" height={10} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-xs text-gray-400">Payoff</p>
                        <p className="text-sm font-bold text-gray-800">{d.months === Infinity ? "N/A" : `${Math.floor(d.months / 12)}y ${d.months % 12}m`}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-xs text-gray-400">Total Interest</p>
                        <p className="text-sm font-bold text-rose-600">{d.totalInterest === Infinity ? "N/A" : fmt(d.totalInterest)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-xs text-gray-400">Debt-Free Date</p>
                        <p className="text-sm font-bold text-emerald-600">{d.months === Infinity ? "N/A" : new Date(viewYear, viewMonth + d.months, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                  </Card>
                  </SwipeRow>
                ))}
              </div>
            )}

            {debtTimelines.length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Debt Comparison</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={debtTimelines.map((d) => ({ name: d.name, Balance: d.balance, Interest: d.totalInterest === Infinity ? 0 : Math.round(d.totalInterest) }))}>
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis tickFormatter={(v) => `$${v}`} fontSize={11} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Balance" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Interest" fill="#fda4af" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Snowball vs Avalanche */}
            {debtStrategies && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Snowball vs Avalanche</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border-2 ${dm('border-cyan-200 bg-cyan-50/50', 'border-cyan-700 bg-cyan-950/20')}`}>
                    <h4 className={`text-sm font-bold ${dm('text-cyan-700', 'text-cyan-300')} mb-2`}>Avalanche <span className="text-xs font-normal">(highest rate first)</span></h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Payoff time</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{Math.floor(debtStrategies.avalanche.months / 12)}y {debtStrategies.avalanche.months % 12}m</span></div>
                      <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total interest</span><span className="font-bold text-rose-500">{fmt(debtStrategies.avalanche.totalInterest)}</span></div>
                      <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total paid</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{fmt(debtStrategies.avalanche.totalPaid)}</span></div>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border-2 ${dm('border-amber-200 bg-amber-50/50', 'border-amber-700 bg-amber-950/20')}`}>
                    <h4 className={`text-sm font-bold ${dm('text-amber-700', 'text-amber-300')} mb-2`}>Snowball <span className="text-xs font-normal">(smallest balance first)</span></h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Payoff time</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{Math.floor(debtStrategies.snowball.months / 12)}y {debtStrategies.snowball.months % 12}m</span></div>
                      <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total interest</span><span className="font-bold text-rose-500">{fmt(debtStrategies.snowball.totalInterest)}</span></div>
                      <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total paid</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{fmt(debtStrategies.snowball.totalPaid)}</span></div>
                    </div>
                  </div>
                </div>
                {debtStrategies.avalanche.totalInterest < debtStrategies.snowball.totalInterest && (
                  <p className={`text-xs mt-3 ${dm('text-cyan-600', 'text-cyan-400')} font-medium`}>
                    Avalanche saves you {fmt(debtStrategies.snowball.totalInterest - debtStrategies.avalanche.totalInterest)} in interest!
                  </p>
                )}
              </Card>
            )}

            {/* Extra Payment Simulator */}
            {debts.length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Extra Payment Simulator</h3>
                <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')} mb-3`}>See how extra monthly payments affect your payoff timeline.</p>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-sm ${dm('text-gray-600', 'text-gray-300')}`}>Extra/mo:</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input type="range" min="0" max="1000" step="25" value={simExtraPayment}
                      onChange={(e) => setSimExtraPayment(+e.target.value)}
                      className="w-full" />
                  </div>
                  <span className={`text-sm font-bold ${dm('text-gray-900', 'text-white')} w-20 text-right`}>{fmt(simExtraPayment)}</span>
                </div>
                <div className="space-y-2">
                  {debts.map((d) => {
                    const monthlyRate = d.rate / 100 / 12;
                    const basePay = d.minPayment + d.extraPayment;
                    const boostPay = basePay + simExtraPayment;
                    const calc = (pay) => {
                      if (pay <= 0) return { months: Infinity, interest: Infinity };
                      let bal = d.balance, mo = 0, int = 0;
                      while (bal > 0 && mo < 600) { const i = bal * monthlyRate; int += i; bal = bal + i - pay; mo++; if (bal < 0) bal = 0; }
                      return { months: mo, interest: int };
                    };
                    const base = calc(basePay);
                    const boosted = calc(boostPay);
                    const savedMonths = base.months - boosted.months;
                    const savedInterest = base.interest - boosted.interest;
                    return (
                      <div key={d.id} className={`p-3 rounded-lg ${dm('bg-gray-50', 'bg-slate-700/50')} flex items-center justify-between`}>
                        <div>
                          <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')}`}>{d.name}</p>
                          <p className="text-xs text-gray-400">{fmt(d.balance)} at {d.rate}%</p>
                        </div>
                        <div className="text-right">
                          {simExtraPayment > 0 ? (
                            <>
                              <p className="text-sm font-bold text-emerald-500">Save {savedMonths > 0 ? `${savedMonths} months` : "—"}</p>
                              <p className="text-xs text-emerald-400">{savedInterest > 0 ? `${fmt(savedInterest)} less interest` : ""}</p>
                            </>
                          ) : (
                            <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Drag slider to simulate</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
        {/* ═══════ NET WORTH TAB ═══════ */}
        {tab === "networth" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Net Worth</h2>
              <button onClick={() => { snapshotNetWorth(); snapshotBalances(); }}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                <Check size={16} /> Snapshot
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={TrendingUp} label="Total Assets" value={fmt(totalAssets)} color="green" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={TrendingDown} label="Total Liabilities" value={fmt(totalLiabilities)} color="rose" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Landmark} label="Net Worth" value={fmt(netWorth)} sub={netWorth >= 0 ? "Positive" : "Negative"} color={netWorth >= 0 ? "green" : "rose"} />

            </div>

            {/* Net Worth bar visualization */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Assets vs Liabilities</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={dm('text-gray-600', 'text-gray-400')}>Assets</span>
                    <span className="text-emerald-600 font-medium">{fmt(totalAssets)}</span>
                  </div>
                  <div className={`w-full h-5 rounded-full ${dm('bg-gray-100', 'bg-slate-700')} overflow-hidden`}>
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${totalAssets + totalLiabilities > 0 ? (totalAssets / (totalAssets + totalLiabilities)) * 100 : 50}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={dm('text-gray-600', 'text-gray-400')}>Liabilities</span>
                    <span className="text-rose-500 font-medium">{fmt(totalLiabilities)}</span>
                  </div>
                  <div className={`w-full h-5 rounded-full ${dm('bg-gray-100', 'bg-slate-700')} overflow-hidden`}>
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${totalAssets + totalLiabilities > 0 ? (totalLiabilities / (totalAssets + totalLiabilities)) * 100 : 50}%` }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Asset Allocation Pie Chart */}
            {assets.length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Asset Allocation</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={(() => {
                        const map = {};
                        assets.forEach(a => { map[a.category] = (map[a.category] || 0) + a.balance; });
                        return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                      })()} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                        {(() => {
                          const map = {};
                          assets.forEach(a => { map[a.category] = (map[a.category] || 0) + a.balance; });
                          return Object.entries(map).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />);
                        })()}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {(() => {
                      const map = {};
                      assets.forEach(a => { map[a.category] = (map[a.category] || 0) + a.balance; });
                      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, val], i) => (
                        <div key={cat} className="flex items-center gap-2 text-sm">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className={`flex-1 ${dm('text-gray-300', 'text-gray-600')}`}>{cat}</span>
                          <span className={`font-medium ${dm('text-gray-200', 'text-gray-800')}`}>{fmt(val)}</span>
                          <span className="text-xs text-gray-400">{pct(val, totalAssets)}%</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ── Assets ── */}
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Assets</h3>
                  <button onClick={() => setAssetDraft({ name: "", category: "Cash", balance: "" })}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>

                {assetDraft && (
                  <div className={`p-3 rounded-xl border mb-3 ${dm('bg-emerald-50/50 border-emerald-200', 'bg-emerald-950/30 border-emerald-800')}`}>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Name" value={assetDraft.name} onChange={(e) => setAssetDraft({ ...assetDraft, name: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <select value={assetDraft.category} onChange={(e) => setAssetDraft({ ...assetDraft, category: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        {ASSET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" placeholder="Balance" value={assetDraft.balance} onChange={(e) => setAssetDraft({ ...assetDraft, balance: e.target.value })}
                          className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { if (assetDraft.name && assetDraft.balance) addAsset({ ...assetDraft, balance: +assetDraft.balance }); }}
                        className="flex-1 bg-emerald-600 text-white rounded-lg text-xs font-medium py-1.5 hover:bg-emerald-700 transition">Save</button>
                      <button onClick={() => setAssetDraft(null)} className="px-3 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {assets.length === 0 ? <EmptyState icon={Wallet} message="No assets tracked yet" /> : (
                  <div className="space-y-1.5">
                    {assets.map((a) => (
                      <SwipeRow key={a.id} darkMode={darkMode}
                        isOpen={swipedItemId === `asset-${a.id}`}
                        onToggle={(open) => setSwipedItemId(open ? `asset-${a.id}` : null)}
                        actions={[{ label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeAsset(a.id), className: "bg-rose-500" }]}>
                        <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center">
                            {a.category.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{a.name}</p>
                            <p className="text-xs text-gray-400">{a.category}</p>
                          </div>
                          <input type="number" value={a.balance} onChange={(e) => updateAssetBalance(a.id, +e.target.value)}
                            className={`w-24 text-right text-sm font-semibold ${dm('text-emerald-600 bg-transparent', 'text-emerald-400 bg-transparent')} border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none py-1`} />
                        </div>
                      </SwipeRow>
                    ))}
                    <div className={`flex justify-between pt-2 mt-2 border-t ${dm('border-gray-100', 'border-slate-700')}`}>
                      <span className={`text-sm font-semibold ${dm('text-gray-600', 'text-gray-300')}`}>Total Assets</span>
                      <span className="text-sm font-bold text-emerald-600">{fmt(totalAssets)}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* ── Liabilities ── */}
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Liabilities</h3>
                  <button onClick={() => setLiabilityDraft({ name: "", category: "Other", balance: "" })}
                    className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg hover:bg-rose-600 transition flex items-center gap-1">
                    <Plus size={12} /> Add
                  </button>
                </div>

                {liabilityDraft && (
                  <div className={`p-3 rounded-xl border mb-3 ${dm('bg-rose-50/50 border-rose-200', 'bg-rose-950/30 border-rose-800')}`}>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="Name" value={liabilityDraft.name} onChange={(e) => setLiabilityDraft({ ...liabilityDraft, name: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      <select value={liabilityDraft.category} onChange={(e) => setLiabilityDraft({ ...liabilityDraft, category: e.target.value })}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                        {["Mortgage", "Medical", "Personal Loan", "Credit Card", "Tax", "Other"].map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input type="number" placeholder="Balance" value={liabilityDraft.balance} onChange={(e) => setLiabilityDraft({ ...liabilityDraft, balance: e.target.value })}
                          className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => { if (liabilityDraft.name && liabilityDraft.balance) addLiability({ ...liabilityDraft, balance: +liabilityDraft.balance }); }}
                        className="flex-1 bg-rose-500 text-white rounded-lg text-xs font-medium py-1.5 hover:bg-rose-600 transition">Save</button>
                      <button onClick={() => setLiabilityDraft(null)} className="px-3 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {allLiabilities.length === 0 ? <EmptyState icon={CreditCard} message="No liabilities — great!" /> : (
                  <div className="space-y-1.5">
                    {allLiabilities.map((l) => l.fromDebt ? (
                      <div key={l.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold flex items-center justify-center">{l.category.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{l.name}</p>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">From Debts</span>
                          </div>
                          <p className="text-xs text-gray-400">{l.category}</p>
                        </div>
                        <span className="text-sm font-semibold text-rose-500">{fmt(l.balance)}</span>
                      </div>
                    ) : (
                      <SwipeRow key={l.id} darkMode={darkMode}
                        isOpen={swipedItemId === `liab-${l.id}`}
                        onToggle={(open) => setSwipedItemId(open ? `liab-${l.id}` : null)}
                        actions={[{ label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeLiability(l.id), className: "bg-rose-500" }]}>
                        <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center">{l.category.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')} truncate`}>{l.name}</p>
                            <p className="text-xs text-gray-400">{l.category}</p>
                          </div>
                          <input type="number" value={l.balance} onChange={(e) => updateLiabilityBalance(l.id, +e.target.value)}
                            className={`w-24 text-right text-sm font-semibold ${dm('text-rose-500 bg-transparent', 'text-rose-400 bg-transparent')} border-b border-transparent hover:border-gray-300 focus:border-rose-500 focus:outline-none py-1`} />
                        </div>
                      </SwipeRow>
                    ))}
                    <div className={`flex justify-between pt-2 mt-2 border-t ${dm('border-gray-100', 'border-slate-700')}`}>
                      <span className={`text-sm font-semibold ${dm('text-gray-600', 'text-gray-300')}`}>Total Liabilities</span>
                      <span className="text-sm font-bold text-rose-500">{fmt(totalLiabilities)}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* ── Trend Chart ── */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Net Worth Over Time</h3>
              {netWorthHistory.length < 2 ? (
                <div className={`text-center py-8 ${dm('text-gray-400', 'text-gray-500')}`}>
                  <TrendingUp size={32} strokeWidth={1.2} className="mx-auto mb-2" />
                  <p className="text-sm">Click "Snapshot" each month to build your trend.</p>
                  <p className="text-xs mt-1">You have {netWorthHistory.length} snapshot{netWorthHistory.length !== 1 ? 's' : ''} so far.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={netWorthHistory}>
                    <defs>
                      <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => { const [y, m] = d.split('-'); return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); }} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                    <Tooltip formatter={(v) => fmt(v)} labelFormatter={(d) => { const [y, m] = d.split('-'); return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }} />
                    <Area type="monotone" dataKey="netWorth" stroke="#6366f1" fill="url(#nwFill)" strokeWidth={2.5} name="Net Worth" />
                    <Line type="monotone" dataKey="assets" stroke="#10b981" strokeWidth={1.5} dot={false} name="Assets" />
                    <Line type="monotone" dataKey="liabilities" stroke="#f43f5e" strokeWidth={1.5} dot={false} name="Liabilities" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* ── Balance History ── */}
            {Object.keys(balanceHistory).length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Account Balance History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={dm('border-b border-slate-700', 'border-b border-gray-200')}>
                        <th className={`text-left py-2 px-2 font-medium ${dm('text-gray-400', 'text-gray-500')}`}>Account</th>
                        {Object.keys(balanceHistory).sort().map(date => (
                          <th key={date} className={`text-right py-2 px-2 font-medium ${dm('text-gray-400', 'text-gray-500')}`}>
                            {(() => { const [y, m] = date.split('-'); return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); })()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const allAccounts = {};
                        Object.values(balanceHistory).forEach(snap => {
                          Object.entries(snap).forEach(([key, info]) => { allAccounts[key] = info; });
                        });
                        return Object.entries(allAccounts).map(([key, info]) => (
                          <tr key={key} className={dm('border-b border-slate-800', 'border-b border-gray-100')}>
                            <td className={`py-1.5 px-2 ${dm('text-gray-300', 'text-gray-700')} font-medium`}>
                              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${info.type === 'asset' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {info.name}
                            </td>
                            {Object.keys(balanceHistory).sort().map(date => {
                              const snap = balanceHistory[date];
                              const val = snap[key]?.balance;
                              return (
                                <td key={date} className={`py-1.5 px-2 text-right ${val !== undefined ? (info.type === 'asset' ? 'text-emerald-500' : 'text-rose-500') : dm('text-gray-600', 'text-gray-400')}`}>
                                  {val !== undefined ? fmt(val) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Milestones ── */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Milestones</h3>
                <button onClick={() => setMilestoneDraft({ label: "", target: "" })}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1">
                  <Plus size={12} /> Add
                </button>
              </div>

              {milestoneDraft && (
                <div className={`p-3 rounded-xl border mb-3 ${dm('bg-indigo-50/50 border-indigo-200', 'bg-indigo-950/30 border-indigo-800')}`}>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Label (e.g. $50K)" value={milestoneDraft.label} onChange={(e) => setMilestoneDraft({ ...milestoneDraft, label: e.target.value })}
                      className="col-span-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input type="number" placeholder="Target amount" value={milestoneDraft.target} onChange={(e) => setMilestoneDraft({ ...milestoneDraft, target: e.target.value })}
                        className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { if (milestoneDraft.label && milestoneDraft.target) addMilestone({ ...milestoneDraft, target: +milestoneDraft.target }); }}
                        className="flex-1 bg-indigo-600 text-white rounded-lg text-xs font-medium py-1.5 hover:bg-indigo-700 transition">Save</button>
                      <button onClick={() => setMilestoneDraft(null)} className="px-2 text-gray-400 hover:text-gray-600 text-xs">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {nwMilestones.length === 0 ? (
                <p className={`text-sm ${dm('text-gray-400', 'text-gray-500')} text-center py-4`}>Set milestones to track your progress!</p>
              ) : (
                <div className="space-y-3">
                  {nwMilestones.sort((a, b) => a.target - b.target).map((m) => {
                    const progress = Math.max(0, Math.min(100, (netWorth / m.target) * 100));
                    const reached = netWorth >= m.target;
                    return (
                      <div key={m.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {reached ? <CheckCircle size={16} className="text-emerald-500" /> : <Target size={16} className={dm('text-gray-400', 'text-gray-500')} />}
                            <span className={`text-sm font-medium ${reached ? 'text-emerald-600' : dm('text-gray-700', 'text-gray-300')}`}>{m.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>{fmt(netWorth)} / {fmt(m.target)}</span>
                            <button onClick={() => removeMilestone(m.id)} className="text-gray-300 hover:text-rose-500 transition"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <ProgressBar value={Math.max(0, netWorth)} max={m.target} color={reached ? "#10b981" : "#6366f1"} height={8} />
                        <p className={`text-xs mt-0.5 ${reached ? 'text-emerald-500 font-medium' : dm('text-gray-400', 'text-gray-500')}`}>
                          {reached ? "Milestone reached!" : `${Math.round(progress)}% — ${fmt(m.target - netWorth)} to go`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}

        {/* ═══════ PAY CALCULATOR TAB ═══════ */}
        {tab === "paycalc" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>{payCalcSettings.name}'s Pay Calculator</h2>
              <button onClick={() => setPayCalcDraft({ hours: "", otHours: "", date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`, tips: "" })}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                <Plus size={16} /> Log Hours
              </button>
            </div>

            {/* Pay & Tax Profile */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Pay & Tax Profile</h3>
                <button onClick={() => setPayCalcSettings({ ...payCalcSettings, autoTax: !payCalcSettings.autoTax })}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition ${payCalcSettings.autoTax ? 'bg-emerald-100 text-emerald-700' : dm('bg-gray-100 text-gray-600', 'bg-slate-700 text-gray-300')}`}>
                  {payCalcSettings.autoTax ? '✓ Auto Tax Rates' : 'Manual Tax Rates'}
                </button>
              </div>

              {/* Row 1: Name, Rate, OT, Deductions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Name</label>
                  <input value={payCalcSettings.name} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, name: e.target.value })}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                </div>
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Hourly Rate</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input type="number" value={payCalcSettings.hourlyRate || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, hourlyRate: e.target.value === '' ? 0 : +e.target.value })}
                      className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>OT Multiplier</label>
                  <input type="number" step="0.1" value={payCalcSettings.otRate || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, otRate: e.target.value === '' ? 0 : +e.target.value })}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                </div>
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Pre-Tax Deductions</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input type="number" value={payCalcSettings.preTaxDeductions || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, preTaxDeductions: e.target.value === '' ? 0 : +e.target.value })}
                      className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                </div>
              </div>

              {/* Row 2: Filing Status, State, Hours/Week */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Filing Status</label>
                  <select value={payCalcSettings.filingStatus} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, filingStatus: e.target.value })}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    <option value="single">Single</option>
                    <option value="married">Married Filing Jointly</option>
                    <option value="head">Head of Household</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>State</label>
                  <select value={payCalcSettings.state} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, state: e.target.value })}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
                    {["AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"].map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Hours/Week</label>
                  <input type="number" value={payCalcSettings.hoursPerWeek || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, hoursPerWeek: e.target.value === '' ? 0 : +e.target.value })}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                </div>
                <div>
                  <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Weeks/Year</label>
                  <input type="number" value={payCalcSettings.weeksPerYear || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, weeksPerYear: e.target.value === '' ? 0 : +e.target.value })}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                </div>
              </div>

              {/* Row 3: Household Income */}
              {payCalcSettings.autoTax && (
                <div className="mt-3">
                  <div className={`p-3 rounded-xl border ${dm('bg-amber-50/50 border-amber-200', 'bg-amber-950/20 border-amber-800')}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign size={14} className={dm('text-amber-600', 'text-amber-400')} />
                      <p className={`text-xs font-semibold ${dm('text-amber-700', 'text-amber-300')}`}>Total Household Gross Income</p>
                    </div>
                    <p className={`text-[10px] mb-2 ${dm('text-amber-600', 'text-amber-500')}`}>Enter total annual gross income for all earners to get the most accurate federal tax bracket. Leave at $0 to use your hourly wage estimate ({fmt(taxEstimate.wageGross)}/yr).</p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input type="number" value={payCalcSettings.householdIncome || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, householdIncome: e.target.value === '' ? 0 : +e.target.value })}
                        placeholder="0 = use hourly wage estimate"
                        className={`w-full sm:w-64 pl-7 pr-3 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-amber-500`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Rate Summary / Override */}
              <div className={`mt-4 p-3 rounded-xl border ${dm('bg-indigo-50/50 border-indigo-200', 'bg-indigo-950/30 border-indigo-800')}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-semibold ${dm('text-indigo-700', 'text-indigo-300')}`}>
                    {payCalcSettings.autoTax ? 'Estimated Tax Rates' : 'Manual Tax Rates'} — Est. Annual Gross: {fmt(taxEstimate.annualGross)}
                  </p>
                  <p className={`text-[10px] ${dm('text-indigo-500', 'text-indigo-400')}`}>Marginal bracket: {taxEstimate.marginalBracket}%</p>
                </div>
                {payCalcSettings.autoTax ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-2.5 rounded-lg text-center ${dm('bg-white', 'bg-slate-700/50')}`}>
                      <p className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>Federal (eff.)</p>
                      <p className={`text-lg font-bold ${dm('text-gray-800', 'text-gray-200')}`}>{pcFedRate}%</p>
                    </div>
                    <div className={`p-2.5 rounded-lg text-center ${dm('bg-white', 'bg-slate-700/50')}`}>
                      <p className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>State ({payCalcSettings.state})</p>
                      <p className={`text-lg font-bold ${dm('text-gray-800', 'text-gray-200')}`}>{pcStateRate}%</p>
                    </div>
                    <div className={`p-2.5 rounded-lg text-center ${dm('bg-white', 'bg-slate-700/50')}`}>
                      <p className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>FICA</p>
                      <p className={`text-lg font-bold ${dm('text-gray-800', 'text-gray-200')}`}>{pcFicaRate}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>Federal %</label>
                      <input type="number" step="0.5" value={payCalcSettings.federalRate || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, federalRate: e.target.value === '' ? 0 : +e.target.value })}
                        className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    </div>
                    <div>
                      <label className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>State %</label>
                      <input type="number" step="0.5" value={payCalcSettings.stateRate || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, stateRate: e.target.value === '' ? 0 : +e.target.value })}
                        className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    </div>
                    <div>
                      <label className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>FICA %</label>
                      <input type="number" step="0.01" value={payCalcSettings.ficaRate || ''} onFocus={(e) => e.target.select()} onChange={(e) => setPayCalcSettings({ ...payCalcSettings, ficaRate: e.target.value === '' ? 0 : +e.target.value })}
                        className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-0.5 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    </div>
                  </div>
                )}
                <p className={`text-[10px] mt-2 ${dm('text-indigo-400', 'text-indigo-500')}`}>
                  Combined effective rate: {taxEstimate.totalEffRate}% · Std deduction: {fmt(taxEstimate.stdDed)} · {payCalcSettings.filingStatus === 'married' ? 'MFJ' : payCalcSettings.filingStatus === 'head' ? 'HoH' : 'Single'}
                </p>
              </div>
            </Card>

            {/* Log Hours Form */}
            {payCalcDraft && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className={dm('border-indigo-200 bg-indigo-50/30', 'border-indigo-800 bg-indigo-950/30')}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Regular Hours</label>
                    <input type="number" step="0.25" placeholder="40" value={payCalcDraft.hours} onChange={(e) => setPayCalcDraft({ ...payCalcDraft, hours: e.target.value })}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} autoFocus />
                  </div>
                  <div>
                    <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>OT Hours</label>
                    <input type="number" step="0.25" placeholder="0" value={payCalcDraft.otHours} onChange={(e) => setPayCalcDraft({ ...payCalcDraft, otHours: e.target.value })}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                  <div>
                    <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Tips</label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                      <input type="number" placeholder="0" value={payCalcDraft.tips} onChange={(e) => setPayCalcDraft({ ...payCalcDraft, tips: e.target.value })}
                        className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Pay Period End</label>
                    <input type="date" value={payCalcDraft.date} onChange={(e) => setPayCalcDraft({ ...payCalcDraft, date: e.target.value })}
                      className={`w-full px-3 py-1.5 border rounded-lg text-sm mt-1 ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => {
                    if (payCalcDraft.hours) {
                      setPayCalcEntries([...payCalcEntries, { ...payCalcDraft, id: Math.random().toString(36).slice(2, 10), hours: +payCalcDraft.hours || 0, otHours: +payCalcDraft.otHours || 0, tips: +payCalcDraft.tips || 0 }]);
                      setPayCalcDraft(null);
                    }
                  }} className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium py-2 hover:bg-indigo-700 transition flex items-center justify-center gap-1">
                    <Check size={14} /> Save
                  </button>
                  <button onClick={() => setPayCalcDraft(null)} className="px-4 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
              </Card>
            )}

            {/* Pay entries */}
            {payCalcEntries.length === 0 ? (
              <EmptyState icon={Clock} message="Log hours to see pay calculations" />
            ) : (
              <div className="space-y-3">
                {[...payCalcEntries].reverse().map((entry) => {
                  const regPay = entry.hours * payCalcSettings.hourlyRate;
                  const otPay = entry.otHours * payCalcSettings.hourlyRate * payCalcSettings.otRate;
                  const grossPay = regPay + otPay + entry.tips;
                  const taxableIncome = grossPay - payCalcSettings.preTaxDeductions;
                  const federal = taxableIncome * (pcFedRate / 100);
                  const state = taxableIncome * (pcStateRate / 100);
                  const fica = taxableIncome * (pcFicaRate / 100);
                  const totalTax = federal + state + fica;
                  const netPay = grossPay - payCalcSettings.preTaxDeductions - totalTax;
                  return (
                    <SwipeRow key={entry.id} darkMode={darkMode}
                      isOpen={swipedItemId === `pay-${entry.id}`}
                      onToggle={(open) => setSwipedItemId(open ? `pay-${entry.id}` : null)}
                      actions={[{ label: "Delete", icon: <Trash2 size={16} />, onClick: () => setPayCalcEntries(payCalcEntries.filter(e => e.id !== entry.id)), className: "bg-rose-500" }]}>
                    <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className={`text-sm font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>
                            Pay Period: {new Date(entry.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-gray-400">{entry.hours}h regular{entry.otHours > 0 ? ` + ${entry.otHours}h OT` : ''}{entry.tips > 0 ? ` + ${fmt(entry.tips)} tips` : ''}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-lg ${dm('bg-emerald-50', 'bg-emerald-950/30')}`}>
                          <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')} mb-1`}>Gross Pay</p>
                          <p className={`text-lg font-bold ${dm('text-emerald-700', 'text-emerald-400')}`}>{fmt(grossPay)}</p>
                          <div className={`text-xs ${dm('text-gray-500', 'text-gray-400')} mt-1 space-y-0.5`}>
                            <div className="flex justify-between"><span>Regular ({entry.hours}h × {fmt(payCalcSettings.hourlyRate)})</span><span>{fmt(regPay)}</span></div>
                            {entry.otHours > 0 && <div className="flex justify-between"><span>OT ({entry.otHours}h × {fmt(payCalcSettings.hourlyRate * payCalcSettings.otRate)})</span><span>{fmt(otPay)}</span></div>}
                            {entry.tips > 0 && <div className="flex justify-between"><span>Tips</span><span>{fmt(entry.tips)}</span></div>}
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${dm('bg-indigo-50', 'bg-indigo-950/30')}`}>
                          <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')} mb-1`}>Net Pay (Take Home)</p>
                          <p className={`text-lg font-bold ${dm('text-indigo-700', 'text-indigo-400')}`}>{fmt(netPay)}</p>
                          <div className={`text-xs ${dm('text-gray-500', 'text-gray-400')} mt-1 space-y-0.5`}>
                            {payCalcSettings.preTaxDeductions > 0 && <div className="flex justify-between"><span>Pre-tax ded.</span><span className="text-rose-400">-{fmt(payCalcSettings.preTaxDeductions)}</span></div>}
                            <div className="flex justify-between"><span>Federal ({pcFedRate}%)</span><span className="text-rose-400">-{fmt(federal)}</span></div>
                            <div className="flex justify-between"><span>State ({pcStateRate}%)</span><span className="text-rose-400">-{fmt(state)}</span></div>
                            <div className="flex justify-between"><span>FICA ({pcFicaRate}%)</span><span className="text-rose-400">-{fmt(fica)}</span></div>
                          </div>
                        </div>
                      </div>
                    </Card>
                    </SwipeRow>
                  );
                })}
                {/* Summary */}
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="bg-gradient-to-br from-indigo-600 to-indigo-700 border-0 text-white">
                  <h3 className="text-sm font-semibold text-indigo-200 mb-2">Period Summary ({payCalcEntries.length} entries)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-indigo-200 text-xs">Total Hours</p>
                      <p className="text-xl font-bold">{payCalcEntries.reduce((s, e) => s + e.hours + e.otHours, 0)}</p>
                    </div>
                    <div>
                      <p className="text-indigo-200 text-xs">Total Gross</p>
                      <p className="text-xl font-bold">{fmt(payCalcEntries.reduce((s, e) => {
                        const r = e.hours * payCalcSettings.hourlyRate;
                        const o = e.otHours * payCalcSettings.hourlyRate * payCalcSettings.otRate;
                        return s + r + o + e.tips;
                      }, 0))}</p>
                    </div>
                    <div>
                      <p className="text-indigo-200 text-xs">Total Net</p>
                      <p className="text-xl font-bold">{fmt(payCalcEntries.reduce((s, e) => {
                        const r = e.hours * payCalcSettings.hourlyRate;
                        const o = e.otHours * payCalcSettings.hourlyRate * payCalcSettings.otRate;
                        const gross = r + o + e.tips;
                        const taxable = gross - payCalcSettings.preTaxDeductions;
                        const tax = taxable * ((pcFedRate + pcStateRate + pcFicaRate) / 100);
                        return s + gross - payCalcSettings.preTaxDeductions - tax;
                      }, 0))}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ═══════ FINANCIAL HEALTH TAB ═══════ */}
        {tab === "health" && (
          <>
            <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Financial Health Score</h2>
            {(() => {
              const scores = [];
              // 1. Emergency fund (0-20)
              const monthlyExp = bills.reduce((s, b) => s + b.amount, 0) + debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0);
              const emergencyTarget = monthlyExp * 3;
              const emergencyFund = assets.filter(a => a.category === 'Cash').reduce((s, a) => s + a.balance, 0);
              const efScore = Math.min(20, Math.round((emergencyFund / Math.max(emergencyTarget, 1)) * 20));
              scores.push({ label: 'Emergency Fund', score: efScore, max: 20, detail: `${fmt(emergencyFund)} of ${fmt(emergencyTarget)} (3 months)`, color: efScore >= 15 ? 'emerald' : efScore >= 10 ? 'amber' : 'rose' });

              // 2. Debt-to-income (0-20)
              const dti = monthlyIncome > 0 ? (debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0)) / monthlyIncome : 1;
              const dtiScore = dti <= 0.1 ? 20 : dti <= 0.2 ? 16 : dti <= 0.36 ? 12 : dti <= 0.5 ? 6 : 0;
              scores.push({ label: 'Debt-to-Income', score: dtiScore, max: 20, detail: `${Math.round(dti * 100)}% DTI ratio`, color: dtiScore >= 15 ? 'emerald' : dtiScore >= 10 ? 'amber' : 'rose' });

              // 3. Savings rate (0-20)
              const savingsRate = monthlyIncome > 0 ? goals.reduce((s, g) => s + g.monthlyContribution, 0) / monthlyIncome : 0;
              const srScore = savingsRate >= 0.2 ? 20 : savingsRate >= 0.15 ? 16 : savingsRate >= 0.1 ? 12 : savingsRate >= 0.05 ? 6 : 0;
              scores.push({ label: 'Savings Rate', score: srScore, max: 20, detail: `${Math.round(savingsRate * 100)}% of income`, color: srScore >= 15 ? 'emerald' : srScore >= 10 ? 'amber' : 'rose' });

              // 4. Bill coverage (0-20)
              const billCoverage = monthlyIncome > 0 ? bills.reduce((s, b) => s + b.amount, 0) / monthlyIncome : 1;
              const bcScore = billCoverage <= 0.3 ? 20 : billCoverage <= 0.4 ? 16 : billCoverage <= 0.5 ? 12 : billCoverage <= 0.6 ? 6 : 0;
              scores.push({ label: 'Bills to Income', score: bcScore, max: 20, detail: `${Math.round(billCoverage * 100)}% of income`, color: bcScore >= 15 ? 'emerald' : bcScore >= 10 ? 'amber' : 'rose' });

              // 5. Net worth trend (0-20)
              const nwPositive = netWorth > 0;
              const nwScore = nwPositive ? (netWorthHistory.length >= 2 && netWorthHistory[netWorthHistory.length - 1].netWorth > netWorthHistory[netWorthHistory.length - 2].netWorth ? 20 : 14) : 0;
              scores.push({ label: 'Net Worth', score: nwScore, max: 20, detail: nwPositive ? `${fmt(netWorth)} positive` : 'Negative net worth', color: nwScore >= 15 ? 'emerald' : nwScore >= 10 ? 'amber' : 'rose' });

              const totalScore = scores.reduce((s, sc) => s + sc.score, 0);
              const grade = totalScore >= 85 ? 'A' : totalScore >= 70 ? 'B' : totalScore >= 55 ? 'C' : totalScore >= 40 ? 'D' : 'F';
              const gradeColor = totalScore >= 85 ? 'text-emerald-500' : totalScore >= 70 ? 'text-cyan-500' : totalScore >= 55 ? 'text-amber-500' : 'text-rose-500';

              return (
                <>
                  {/* Score Overview */}
                  <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="text-center">
                    <div className="relative inline-flex items-center justify-center w-36 h-36 mx-auto mb-3">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke={darkMode ? '#1e293b' : '#f1f5f9'} strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={totalScore >= 85 ? '#10b981' : totalScore >= 70 ? '#06b6d4' : totalScore >= 55 ? '#f59e0b' : '#f43f5e'} strokeWidth="8"
                          strokeLinecap="round" strokeDasharray={`${totalScore * 2.64} 264`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-black ${gradeColor}`}>{grade}</span>
                        <span className={`text-sm font-medium ${dm('text-gray-600', 'text-gray-400')}`}>{totalScore}/100</span>
                      </div>
                    </div>
                    <p className={`text-sm ${dm('text-gray-600', 'text-gray-400')}`}>
                      {totalScore >= 85 ? 'Excellent! Your finances are in great shape.' : totalScore >= 70 ? 'Good — a few areas could use attention.' : totalScore >= 55 ? 'Fair — there\'s room for improvement.' : 'Needs work — let\'s build a stronger foundation.'}
                    </p>
                  </Card>

                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    {scores.map((sc) => {
                      const colorMap = { emerald: { bg: dm('bg-emerald-950/30', 'bg-emerald-50'), text: 'text-emerald-500', bar: '#10b981' }, amber: { bg: dm('bg-amber-950/30', 'bg-amber-50'), text: 'text-amber-500', bar: '#f59e0b' }, rose: { bg: dm('bg-rose-950/30', 'bg-rose-50'), text: 'text-rose-500', bar: '#f43f5e' } };
                      const c = colorMap[sc.color];
                      return (
                        <Card key={sc.label} darkMode={darkMode}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className={`text-sm font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{sc.label}</h4>
                              <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>{sc.detail}</p>
                            </div>
                            <span className={`text-lg font-black ${c.text}`}>{sc.score}/{sc.max}</span>
                          </div>
                          <ProgressBar value={sc.score} max={sc.max} color={c.bar} height={8} />
                        </Card>
                      );
                    })}
                  </div>

                  {/* Tips */}
                  <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                    <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3 flex items-center gap-2`}><Shield size={16} className="text-indigo-500" /> Improvement Tips</h3>
                    <div className="space-y-2">
                      {scores.filter(sc => sc.score < sc.max * 0.75).map(sc => (
                        <div key={sc.label} className={`p-3 rounded-lg ${dm('bg-gray-50', 'bg-slate-700/50')}`}>
                          <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')}`}>{sc.label}</p>
                          <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')} mt-0.5`}>
                            {sc.label === 'Emergency Fund' && 'Build up 3-6 months of expenses in a savings account.'}
                            {sc.label === 'Debt-to-Income' && 'Focus on paying down debt — consider the avalanche method.'}
                            {sc.label === 'Savings Rate' && 'Aim to save at least 20% of your income each month.'}
                            {sc.label === 'Bills to Income' && 'Look for ways to reduce fixed costs — renegotiate or switch providers.'}
                            {sc.label === 'Net Worth' && 'Keep tracking and growing assets while reducing liabilities.'}
                          </p>
                        </div>
                      ))}
                      {scores.every(sc => sc.score >= sc.max * 0.75) && (
                        <p className={`text-sm text-center py-4 ${dm('text-emerald-600', 'text-emerald-400')} font-medium`}>You're doing great across the board! Keep it up.</p>
                      )}
                    </div>
                  </Card>
                </>
              );
            })()}
          </>
        )}

        {/* ═══════ MONEY FLOW TAB ═══════ */}
        {tab === "flow" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Money Flow — {monthLabel(viewYear, viewMonth)}</h2>
            </div>

            {monthlyIncome === 0 && totalAllExpenses === 0 ? (
              <EmptyState icon={GitBranch} message="Add income and expenses to see your money flow" />
            ) : (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="overflow-x-auto">
                  {(() => {
                    // Build flow data
                    const sources = monthPaychecks.map(p => ({ name: p.label, amount: p.amount }));
                    const extras = (extraChecks[vKey] || []);
                    extras.forEach(e => sources.push({ name: e.label || 'Bonus', amount: e.amount }));
                    const totalInc = sources.reduce((s, p) => s + p.amount, 0);
                    if (totalInc === 0) return <p className={`text-sm text-center py-8 ${dm('text-gray-400', 'text-gray-500')}`}>No income this month</p>;

                    // Categories for outflow
                    const outflows = [];
                    if (totalBills > 0) outflows.push({ name: 'Bills', amount: totalBills, color: '#f59e0b' });
                    if (totalDebtPayments > 0) outflows.push({ name: 'Debt', amount: totalDebtPayments, color: '#f43f5e' });
                    if (totalSavingsContrib > 0) outflows.push({ name: 'Savings', amount: totalSavingsContrib, color: '#6366f1' });
                    // Add manual expense categories
                    const manualByCat = {};
                    manualExpenses.forEach(e => { manualByCat[e.category] = (manualByCat[e.category] || 0) + e.amount; });
                    Object.entries(manualByCat).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
                      outflows.push({ name: cat, amount: amt, color: '#64748b' });
                    });
                    const totalOut = outflows.reduce((s, o) => s + o.amount, 0);
                    const remaining = Math.max(0, totalInc - totalOut);
                    if (remaining > 0) outflows.push({ name: 'Remaining', amount: remaining, color: '#10b981' });

                    // SVG dimensions
                    const W = 800, colW = 140, midX = W / 2 - colW / 2;
                    const leftX = 20, rightX = W - colW - 20;
                    const gap = 6, minH = 24;

                    // Scale heights
                    const maxTotal = Math.max(totalInc, totalOut + remaining);
                    const availH = Math.max(300, Math.max(sources.length, outflows.length) * 50);
                    const scale = (amt) => Math.max(minH, (amt / maxTotal) * (availH - gap * Math.max(sources.length, outflows.length)));

                    // Left column positions (income sources)
                    let leftY = 20;
                    const leftItems = sources.map(s => {
                      const h = scale(s.amount);
                      const item = { ...s, y: leftY, h, midY: leftY + h / 2 };
                      leftY += h + gap;
                      return item;
                    });

                    // Right column positions (outflows)
                    let rightY = 20;
                    const rightItems = outflows.map(o => {
                      const h = scale(o.amount);
                      const item = { ...o, y: rightY, h, midY: rightY + h / 2 };
                      rightY += h + gap;
                      return item;
                    });

                    // Middle pool
                    const midH = Math.max(leftY, rightY) - 20;
                    const midY = 20;
                    const svgH = Math.max(leftY, rightY) + 20;

                    return (
                      <svg viewBox={`0 0 ${W} ${svgH}`} className="w-full" style={{ minHeight: 300 }}>
                        {/* Left: Income sources */}
                        {leftItems.map((item, i) => (
                          <g key={`l-${i}`}>
                            <rect x={leftX} y={item.y} width={colW} height={item.h} rx={6} fill="#6366f1" opacity={0.85} />
                            <text x={leftX + colW / 2} y={item.midY - 6} textAnchor="middle" fill="white" fontSize={11} fontWeight="600">{item.name}</text>
                            <text x={leftX + colW / 2} y={item.midY + 10} textAnchor="middle" fill="#c7d2fe" fontSize={10}>{fmt(item.amount)}</text>
                            {/* Flow curve to middle */}
                            <path d={`M${leftX + colW},${item.midY} C${leftX + colW + 60},${item.midY} ${midX - 60},${midY + midH / 2} ${midX},${midY + midH / 2}`}
                              fill="none" stroke="#6366f1" strokeWidth={Math.max(2, item.h * 0.4)} opacity={0.12} />
                            <path d={`M${leftX + colW},${item.midY} C${leftX + colW + 60},${item.midY} ${midX - 60},${midY + midH / 2} ${midX},${midY + midH / 2}`}
                              fill="none" stroke="#6366f1" strokeWidth={1.5} opacity={0.3} />
                          </g>
                        ))}

                        {/* Middle: Total Income pool */}
                        <rect x={midX} y={midY} width={colW} height={midH} rx={8} fill="#10b981" opacity={0.1} stroke="#10b981" strokeWidth={1.5} />
                        <text x={midX + colW / 2} y={midY + midH / 2 - 8} textAnchor="middle" fill="#059669" fontSize={13} fontWeight="700">Total Income</text>
                        <text x={midX + colW / 2} y={midY + midH / 2 + 10} textAnchor="middle" fill="#059669" fontSize={12}>{fmt(totalInc)}</text>

                        {/* Right: Outflow categories */}
                        {rightItems.map((item, i) => (
                          <g key={`r-${i}`}>
                            <rect x={rightX} y={item.y} width={colW} height={item.h} rx={6} fill={item.color} opacity={0.15} stroke={item.color} strokeWidth={1} />
                            <text x={rightX + colW / 2} y={item.midY - 6} textAnchor="middle" fill={item.color} fontSize={11} fontWeight="600">{item.name}</text>
                            <text x={rightX + colW / 2} y={item.midY + 10} textAnchor="middle" fill={item.color} fontSize={10} opacity={0.8}>{fmt(item.amount)} ({pct(item.amount, totalInc)}%)</text>
                            {/* Flow curve from middle */}
                            <path d={`M${midX + colW},${midY + midH / 2} C${midX + colW + 60},${midY + midH / 2} ${rightX - 60},${item.midY} ${rightX},${item.midY}`}
                              fill="none" stroke={item.color} strokeWidth={Math.max(2, item.h * 0.4)} opacity={0.1} />
                            <path d={`M${midX + colW},${midY + midH / 2} C${midX + colW + 60},${midY + midH / 2} ${rightX - 60},${item.midY} ${rightX},${item.midY}`}
                              fill="none" stroke={item.color} strokeWidth={1.5} opacity={0.3} />
                          </g>
                        ))}

                        {/* Column labels */}
                        <text x={leftX + colW / 2} y={svgH - 5} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="600">INCOME</text>
                        <text x={midX + colW / 2} y={svgH - 5} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="600">TOTAL</text>
                        <text x={rightX + colW / 2} y={svgH - 5} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="600">OUTFLOW</text>
                      </svg>
                    );
                  })()}
                </div>
              </Card>
            )}

            {/* Flow Summary Table */}
            {monthlyIncome > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Flow Breakdown</h3>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${dm('bg-emerald-50', 'bg-emerald-950/20')}`}>
                    <span className={`text-sm font-medium ${dm('text-emerald-700', 'text-emerald-400')}`}>Total Income</span>
                    <span className={`text-sm font-bold ${dm('text-emerald-700', 'text-emerald-500')}`}>{fmt(monthlyIncome)}</span>
                  </div>
                  {totalBills > 0 && (
                    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${dm('bg-amber-50', 'bg-slate-700/30')}`}>
                      <span className={`text-sm font-medium ${dm('text-amber-700', 'text-gray-300')}`}>Bills & Utilities</span>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{fmt(totalBills)}</span>
                        <span className={`text-xs ${dm('text-amber-500', 'text-gray-400')} ml-2`}>{pct(totalBills, monthlyIncome)}%</span>
                      </div>
                    </div>
                  )}
                  {totalDebtPayments > 0 && (
                    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${dm('bg-rose-50', 'bg-slate-700/30')}`}>
                      <span className={`text-sm font-medium ${dm('text-rose-700', 'text-gray-300')}`}>Debt Payments</span>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{fmt(totalDebtPayments)}</span>
                        <span className={`text-xs ${dm('text-rose-500', 'text-gray-400')} ml-2`}>{pct(totalDebtPayments, monthlyIncome)}%</span>
                      </div>
                    </div>
                  )}
                  {totalSavingsContrib > 0 && (
                    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${dm('bg-cyan-50', 'bg-slate-700/30')}`}>
                      <span className={`text-sm font-medium ${dm('text-cyan-700', 'text-gray-300')}`}>Savings</span>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{fmt(totalSavingsContrib)}</span>
                        <span className={`text-xs ${dm('text-cyan-500', 'text-gray-400')} ml-2`}>{pct(totalSavingsContrib, monthlyIncome)}%</span>
                      </div>
                    </div>
                  )}
                  {totalManualExpenses > 0 && (
                    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${dm('bg-indigo-50', 'bg-slate-700/30')}`}>
                      <span className={`text-sm font-medium ${dm('text-indigo-700', 'text-gray-300')}`}>Other Spending</span>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${dm('text-gray-800', 'text-gray-200')}`}>{fmt(totalManualExpenses)}</span>
                        <span className={`text-xs ${dm('text-indigo-500', 'text-gray-400')} ml-2`}>{pct(totalManualExpenses, monthlyIncome)}%</span>
                      </div>
                    </div>
                  )}
                  <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg border-t-2 ${dm('border-gray-200', 'border-slate-700')} mt-1 pt-3`}>
                    <span className={`text-sm font-semibold ${remainingBudget >= 0 ? dm('text-emerald-700', 'text-emerald-400') : dm('text-rose-600', 'text-rose-400')}`}>
                      {remainingBudget >= 0 ? 'Remaining' : 'Over Budget'}
                    </span>
                    <span className={`text-sm font-bold ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(Math.abs(remainingBudget))}</span>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ═══════ SUBSCRIPTIONS TAB ═══════ */}
        {tab === "subscriptions" && (() => {
          const activeSubs = subscriptions.filter(s => s.active);
          const pausedSubs = subscriptions.filter(s => !s.active);
          const monthlyTotal = activeSubs.reduce((sum, s) => {
            if (s.frequency === "monthly") return sum + s.amount;
            if (s.frequency === "yearly") return sum + s.amount / 12;
            if (s.frequency === "weekly") return sum + s.amount * 4.33;
            if (s.frequency === "quarterly") return sum + s.amount / 3;
            return sum + s.amount;
          }, 0);
          const yearlyTotal = monthlyTotal * 12;
          const byCat = {};
          activeSubs.forEach(s => { byCat[s.category] = (byCat[s.category] || 0) + (s.frequency === "monthly" ? s.amount : s.frequency === "yearly" ? s.amount / 12 : s.frequency === "weekly" ? s.amount * 4.33 : s.frequency === "quarterly" ? s.amount / 3 : s.amount); });
          const catData = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value: Math.round(value * 100) / 100, fill: COLORS[i % COLORS.length] }));
          return (
            <>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Subscriptions</h2>
                <button onClick={() => { setSubDraft({ name: "", amount: "", frequency: "monthly", category: "Subscriptions", nextBillDate: "" }); setEditingSubId(null); }}
                  className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-purple-700 transition">
                  <Plus size={16} /> Add Sub
                </button>
              </div>

              {/* Monthly & Annual Rollup */}
              <div className="grid grid-cols-2 gap-3">
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${dm('text-gray-500', 'text-gray-400')}`}>Monthly Cost</p>
                    <p className={`text-2xl font-bold ${dm('text-purple-700', 'text-purple-400')}`}>{fmt(monthlyTotal)}</p>
                    <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>{activeSubs.length} active subscription{activeSubs.length !== 1 ? 's' : ''}</p>
                  </div>
                </Card>
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${dm('text-gray-500', 'text-gray-400')}`}>Annual Cost</p>
                    <p className={`text-2xl font-bold ${dm('text-rose-600', 'text-rose-400')}`}>{fmt(yearlyTotal)}</p>
                    <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>{pct(monthlyTotal, monthlyIncome)}% of monthly income</p>
                  </div>
                </Card>
              </div>

              {/* Spending by category pie */}
              {catData.length > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Cost by Category</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart><Pie data={catData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                      {catData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie><Tooltip formatter={(v) => fmt(v)} /><Legend /></PieChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Add/Edit form */}
              {subDraft && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="border-purple-200 bg-purple-50/30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <input placeholder="Service name" value={subDraft.name} onChange={(e) => setSubDraft({ ...subDraft, name: e.target.value })}
                      className="col-span-2 sm:col-span-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" placeholder="Amount" value={subDraft.amount} onChange={(e) => setSubDraft({ ...subDraft, amount: e.target.value })}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <select value={subDraft.frequency} onChange={(e) => setSubDraft({ ...subDraft, frequency: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="weekly">Weekly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                    <select value={subDraft.category} onChange={(e) => setSubDraft({ ...subDraft, category: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                      {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input type="date" value={subDraft.nextBillDate} onChange={(e) => setSubDraft({ ...subDraft, nextBillDate: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="flex gap-2">
                      <button onClick={() => { if (subDraft.name && subDraft.amount) { if (editingSubId) updateSub(editingSubId, { ...subDraft, amount: +subDraft.amount }); else addSub({ ...subDraft, amount: +subDraft.amount }); } }}
                        className="flex-1 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition flex items-center justify-center gap-1"><Check size={14} /> {editingSubId ? 'Update' : 'Save'}</button>
                      <button onClick={() => { setSubDraft(null); setEditingSubId(null); }} className="px-3 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Active subs list */}
              {activeSubs.length > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3 flex items-center gap-2`}><Repeat size={15} className="text-purple-500" /> Active Subscriptions</h3>
                  <div className="space-y-2">
                    {activeSubs.map(s => (
                      <SwipeRow key={s.id} darkMode={darkMode}
                        isOpen={swipedItemId === `sub-${s.id}`}
                        onToggle={(open) => setSwipedItemId(open ? `sub-${s.id}` : null)}
                        actions={[
                          { label: "Edit", icon: <Settings size={16} />, onClick: () => startEditSub(s), className: "bg-purple-500" },
                          { label: "Pause", icon: <X size={16} />, onClick: () => toggleSub(s.id), className: "bg-amber-500" },
                          { label: "Delete", icon: <Trash2 size={16} />, onClick: () => removeSub(s.id), className: "bg-rose-500" },
                        ]}>
                        <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Repeat size={14} /></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')}`}>{s.name}</p>
                            <p className="text-xs text-gray-400">{s.category} · {s.frequency}{s.nextBillDate ? ` · Next: ${new Date(s.nextBillDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>{fmt(s.amount)}</span>
                            <p className="text-[10px] text-gray-400">/{s.frequency === 'yearly' ? 'yr' : s.frequency === 'quarterly' ? 'qtr' : s.frequency === 'weekly' ? 'wk' : 'mo'}</p>
                          </div>
                        </div>
                      </SwipeRow>
                    ))}
                  </div>
                </Card>
              )}

              {/* Paused subs */}
              {pausedSubs.length > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-500', 'text-gray-400')} mb-3`}>Paused ({pausedSubs.length})</h3>
                  <div className="space-y-2 opacity-60">
                    {pausedSubs.map(s => (
                      <div key={s.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg`}>
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center"><Repeat size={14} /></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${dm('text-gray-500', 'text-gray-500')} line-through`}>{s.name}</p>
                          <p className="text-xs text-gray-400">{fmt(s.amount)}/{s.frequency === 'yearly' ? 'yr' : 'mo'}</p>
                        </div>
                        <button onClick={() => toggleSub(s.id)} className="text-xs text-indigo-500 font-medium hover:text-indigo-700">Resume</button>
                        <button onClick={() => removeSub(s.id)} className="text-xs text-rose-400 hover:text-rose-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {activeSubs.length === 0 && pausedSubs.length === 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <div className="text-center py-8 text-gray-400">
                    <Repeat size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No subscriptions yet. Add your first one above.</p>
                  </div>
                </Card>
              )}
            </>
          );
        })()}

        {/* ═══════ INSIGHTS TAB ═══════ */}
        {tab === "insights" && (() => {
          const curExpenses = expenses;
          const curTotal = curExpenses.reduce((s, e) => s + e.amount, 0);
          const prevKey = viewMonth === 0 ? monthKey(viewYear - 1, 11) : monthKey(viewYear, viewMonth - 1);
          const prevExpenses = expensesByMonth[prevKey] || [];
          const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

          // Category breakdown comparison
          const curByCat = {};
          curExpenses.forEach(e => { curByCat[e.category] = (curByCat[e.category] || 0) + e.amount; });
          const prevByCat = {};
          prevExpenses.forEach(e => { prevByCat[e.category] = (prevByCat[e.category] || 0) + e.amount; });

          const allCats = [...new Set([...Object.keys(curByCat), ...Object.keys(prevByCat)])];
          const catInsights = allCats.map(cat => {
            const cur = curByCat[cat] || 0;
            const prev = prevByCat[cat] || 0;
            const change = prev > 0 ? ((cur - prev) / prev * 100) : cur > 0 ? 100 : 0;
            return { cat, cur, prev, change };
          }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

          // Budget adherence
          const budgetInsights = Object.entries(categoryBudgets).map(([cat, budget]) => {
            const spent = curByCat[cat] || 0;
            return { cat, budget, spent, pctUsed: budget > 0 ? Math.round(spent / budget * 100) : 0 };
          }).sort((a, b) => b.pctUsed - a.pctUsed);

          // Bills vs discretionary
          const billsTotal = totalBills + debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0) + subscriptions.filter(s => s.active).reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.frequency === 'yearly' ? s.amount / 12 : s.frequency === 'weekly' ? s.amount * 4.33 : s.amount / 3), 0);
          const discretionary = curTotal;
          const savingsTotal = goals.reduce((s, g) => s + g.monthlyContribution, 0);
          const totalOut = billsTotal + discretionary + savingsTotal;
          const needsPct = monthlyIncome > 0 ? Math.round(billsTotal / monthlyIncome * 100) : 0;
          const wantsPct = monthlyIncome > 0 ? Math.round(discretionary / monthlyIncome * 100) : 0;
          const savesPct = monthlyIncome > 0 ? Math.round(savingsTotal / monthlyIncome * 100) : 0;

          // Streaks
          const monthsUnderBudget = (() => {
            let streak = 0;
            for (let i = 0; i < 12; i++) {
              const m = viewMonth - i < 0 ? viewMonth - i + 12 : viewMonth - i;
              const y = viewMonth - i < 0 ? viewYear - 1 : viewYear;
              const mk = monthKey(y, m);
              const me = (expensesByMonth[mk] || []).reduce((s, e) => s + e.amount, 0);
              if (me + billsTotal <= monthlyIncome && monthlyIncome > 0) streak++;
              else break;
            }
            return streak;
          })();

          return (
            <>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')} flex items-center gap-2`}><Sparkles size={20} className="text-amber-500" /> Spending Insights</h2>
                <span className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>{monthLabel(viewYear, viewMonth)}</span>
              </div>

              {/* Monthly Report Card */}
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Monthly Report Card</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`text-center p-3 rounded-xl ${dm('bg-blue-50', 'bg-blue-950/30')}`}>
                    <p className={`text-[10px] font-semibold uppercase ${dm('text-blue-600', 'text-blue-400')}`}>Needs</p>
                    <p className={`text-xl font-bold ${dm('text-blue-700', 'text-blue-300')}`}>{needsPct}%</p>
                    <p className={`text-[10px] ${needsPct <= 50 ? 'text-green-500' : 'text-amber-500'}`}>{needsPct <= 50 ? '✓ On target' : 'Above 50%'}</p>
                  </div>
                  <div className={`text-center p-3 rounded-xl ${dm('bg-purple-50', 'bg-purple-950/30')}`}>
                    <p className={`text-[10px] font-semibold uppercase ${dm('text-purple-600', 'text-purple-400')}`}>Wants</p>
                    <p className={`text-xl font-bold ${dm('text-purple-700', 'text-purple-300')}`}>{wantsPct}%</p>
                    <p className={`text-[10px] ${wantsPct <= 30 ? 'text-green-500' : 'text-amber-500'}`}>{wantsPct <= 30 ? '✓ On target' : 'Above 30%'}</p>
                  </div>
                  <div className={`text-center p-3 rounded-xl ${dm('bg-emerald-50', 'bg-emerald-950/30')}`}>
                    <p className={`text-[10px] font-semibold uppercase ${dm('text-emerald-600', 'text-emerald-400')}`}>Savings</p>
                    <p className={`text-xl font-bold ${dm('text-emerald-700', 'text-emerald-300')}`}>{savesPct}%</p>
                    <p className={`text-[10px] ${savesPct >= 20 ? 'text-green-500' : 'text-amber-500'}`}>{savesPct >= 20 ? '✓ On target' : 'Below 20%'}</p>
                  </div>
                </div>
                <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')} text-center`}>Based on the 50/30/20 rule (Needs / Wants / Savings)</p>
              </Card>

              {/* Month-over-Month */}
              {prevTotal > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Month-over-Month</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex-1 p-3 rounded-xl text-center ${curTotal <= prevTotal ? dm('bg-green-50', 'bg-green-950/30') : dm('bg-rose-50', 'bg-rose-950/30')}`}>
                      <p className={`text-lg font-bold ${curTotal <= prevTotal ? 'text-green-600' : 'text-rose-600'}`}>
                        {curTotal <= prevTotal ? '↓' : '↑'} {Math.abs(Math.round((curTotal - prevTotal) / prevTotal * 100))}%
                      </p>
                      <p className={`text-[10px] ${dm('text-gray-500', 'text-gray-400')}`}>{curTotal <= prevTotal ? `You spent ${fmt(prevTotal - curTotal)} less` : `You spent ${fmt(curTotal - prevTotal)} more`}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>Last month</p>
                      <p className={`text-sm font-semibold ${dm('text-gray-600', 'text-gray-300')}`}>{fmt(prevTotal)}</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>This month</p>
                      <p className={`text-sm font-semibold ${dm('text-gray-600', 'text-gray-300')}`}>{fmt(curTotal)}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Top Merchants */}
              {(() => {
                const merchantMap = {};
                curExpenses.forEach(e => {
                  const m = (e.merchant || '').trim();
                  if (m) { if (!merchantMap[m]) merchantMap[m] = { total: 0, count: 0 }; merchantMap[m].total += e.amount; merchantMap[m].count++; }
                });
                const topMerchants = Object.entries(merchantMap).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
                if (topMerchants.length === 0) return null;
                const maxVal = topMerchants[0]?.[1].total || 1;
                return (
                  <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                    <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3 flex items-center gap-2`}><Target size={15} className="text-indigo-500" /> Top Merchants</h3>
                    <div className="space-y-2.5">
                      {topMerchants.map(([name, data], i) => (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : dm('bg-gray-50 text-gray-500', 'bg-slate-700 text-gray-400')}`}>{i + 1}</span>
                              <span className={`text-sm font-medium ${dm('text-gray-700', 'text-gray-300')}`}>{name}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>{fmt(data.total)}</span>
                              <span className={`text-[10px] ml-1.5 ${dm('text-gray-400', 'text-gray-500')}`}>{data.count} txn{data.count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className={`h-1.5 rounded-full ${dm('bg-gray-100', 'bg-slate-700')} overflow-hidden`}>
                            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(data.total / maxVal) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })()}

              {/* Category Trends */}
              {catInsights.filter(c => c.change !== 0).length > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Category Trends vs Last Month</h3>
                  <div className="space-y-2">
                    {catInsights.filter(c => c.prev > 0 || c.cur > 0).slice(0, 6).map(c => (
                      <div key={c.cat} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('bg-gray-50', 'bg-slate-800/50')}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${dm('text-gray-700', 'text-gray-300')}`}>{c.cat}</p>
                          <p className="text-[10px] text-gray-400">{fmt(c.prev)} → {fmt(c.cur)}</p>
                        </div>
                        <span className={`text-sm font-bold ${c.change <= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                          {c.change > 0 ? '+' : ''}{Math.round(c.change)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Budget Adherence */}
              {budgetInsights.length > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Budget Adherence</h3>
                  <div className="space-y-3">
                    {budgetInsights.map(b => (
                      <div key={b.cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${dm('text-gray-700', 'text-gray-300')}`}>{b.cat}</span>
                          <span className={`text-xs font-semibold ${b.pctUsed <= 100 ? dm('text-gray-500', 'text-gray-400') : 'text-rose-500'}`}>{fmt(b.spent)} / {fmt(b.budget)}</span>
                        </div>
                        <div className={`h-2 rounded-full ${dm('bg-gray-100', 'bg-slate-700')} overflow-hidden`}>
                          <div className={`h-full rounded-full transition-all ${b.pctUsed <= 75 ? 'bg-green-500' : b.pctUsed <= 100 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(b.pctUsed, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Streaks & Badges */}
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Achievements</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl text-center ${monthsUnderBudget >= 1 ? dm('bg-amber-50', 'bg-amber-950/30') : dm('bg-gray-50', 'bg-slate-800/50')}`}>
                    <p className="text-2xl mb-1">{monthsUnderBudget >= 3 ? '🔥' : monthsUnderBudget >= 1 ? '✨' : '🎯'}</p>
                    <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{monthsUnderBudget} Month Streak</p>
                    <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>Under budget</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${goals.some(g => g.saved >= g.target) ? dm('bg-green-50', 'bg-green-950/30') : dm('bg-gray-50', 'bg-slate-800/50')}`}>
                    <p className="text-2xl mb-1">{goals.filter(g => g.saved >= g.target).length > 0 ? '🏆' : '🎯'}</p>
                    <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{goals.filter(g => g.saved >= g.target).length} Goals Hit</p>
                    <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>Savings targets met</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${dm('bg-indigo-50', 'bg-indigo-950/30')}`}>
                    <p className="text-2xl mb-1">{subscriptions.filter(s => !s.active).length > 0 ? '💪' : '📋'}</p>
                    <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{subscriptions.filter(s => !s.active).length} Subs Paused</p>
                    <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>Saving {fmt(subscriptions.filter(s => !s.active).reduce((sum, s) => sum + s.amount, 0))}/mo</p>
                  </div>
                  <div className={`p-3 rounded-xl text-center ${dm('bg-purple-50', 'bg-purple-950/30')}`}>
                    <p className="text-2xl mb-1">{savesPct >= 20 ? '💰' : '📈'}</p>
                    <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{savesPct}% Savings Rate</p>
                    <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>{savesPct >= 20 ? 'Excellent!' : 'Goal: 20%+'}</p>
                  </div>
                </div>
              </Card>
            </>
          );
        })()}

        {/* ═══════ YEAR TAB ═══════ */}
        {tab === "yearly" && (() => {
          const curTotals = { income: yearData.reduce((s, m) => s + m.income, 0), expenses: yearData.reduce((s, m) => s + m.expenses, 0), savings: yearData.reduce((s, m) => s + m.savings, 0), net: yearData.reduce((s, m) => s + m.net, 0) };
          const prevTotals = { income: prevYearData.reduce((s, m) => s + m.income, 0), expenses: prevYearData.reduce((s, m) => s + m.expenses, 0), savings: prevYearData.reduce((s, m) => s + m.savings, 0), net: prevYearData.reduce((s, m) => s + m.net, 0) };
          const yoyPct = (cur, prev) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / Math.abs(prev)) * 100);
          const yoyArrow = (cur, prev, invert) => { const d = cur - prev; if (d === 0) return null; const up = d > 0; const good = invert ? !up : up; return <span className={`text-[10px] font-bold ${good ? 'text-emerald-500' : 'text-rose-500'}`}>{up ? '▲' : '▼'} {Math.abs(yoyPct(cur, prev))}%</span>; };
          const hasPrevData = prevTotals.income > 0 || prevTotals.expenses > 0;
          return (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>{viewYear} at a Glance</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewYear(viewYear - 1)} className={`p-1.5 rounded-lg ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')} transition`}><ChevronLeft size={18} /></button>
                <span className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-300')} px-2`}>{viewYear}</span>
                <button onClick={() => setViewYear(viewYear + 1)} className={`p-1.5 rounded-lg ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')} transition`}><ChevronRight size={18} /></button>
              </div>
            </div>

            {/* Annual summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={DollarSign} label="Annual Income" value={fmt(curTotals.income)} sub={hasPrevData ? `vs ${fmt(prevTotals.income)} in ${viewYear - 1}` : `${viewYear}`} color="green" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Calendar} label="Annual Expenses" value={fmt(curTotals.expenses)} sub={hasPrevData ? `vs ${fmt(prevTotals.expenses)} in ${viewYear - 1}` : undefined} color="amber" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={PiggyBank} label="Annual Savings" value={fmt(curTotals.savings)} sub={hasPrevData ? `vs ${fmt(prevTotals.savings)} in ${viewYear - 1}` : undefined} color="cyan" />
              <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Wallet} label="Annual Net" value={fmt(curTotals.net)} sub={hasPrevData ? `vs ${fmt(prevTotals.net)} in ${viewYear - 1}` : undefined} color={curTotals.net >= 0 ? "indigo" : "rose"} />
            </div>

            {/* Year-over-Year Comparison */}
            {hasPrevData && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch size={16} className={dm('text-indigo-600', 'text-indigo-400')} />
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Year-over-Year: {viewYear - 1} vs {viewYear}</h3>
                </div>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Income", cur: curTotals.income, prev: prevTotals.income, color: dm('bg-emerald-50 border-emerald-200', 'bg-emerald-950/20 border-emerald-800'), txt: dm('text-emerald-700', 'text-emerald-400'), invert: false },
                    { label: "Expenses", cur: curTotals.expenses, prev: prevTotals.expenses, color: dm('bg-rose-50 border-rose-200', 'bg-rose-950/20 border-rose-800'), txt: dm('text-rose-700', 'text-rose-400'), invert: true },
                    { label: "Savings", cur: curTotals.savings, prev: prevTotals.savings, color: dm('bg-cyan-50 border-cyan-200', 'bg-cyan-950/20 border-cyan-800'), txt: dm('text-cyan-700', 'text-cyan-400'), invert: false },
                    { label: "Net", cur: curTotals.net, prev: prevTotals.net, color: dm('bg-indigo-50 border-indigo-200', 'bg-indigo-950/20 border-indigo-800'), txt: dm('text-indigo-700', 'text-indigo-400'), invert: false }
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl border ${item.color}`}>
                      <p className={`text-[10px] font-medium ${dm('text-gray-500', 'text-gray-400')} uppercase`}>{item.label}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className={`text-sm font-bold ${item.txt}`}>{fmt(item.cur - item.prev)}</span>
                        {yoyArrow(item.cur, item.prev, item.invert)}
                      </div>
                      <p className={`text-[10px] mt-0.5 ${dm('text-gray-400', 'text-gray-500')}`}>{fmt(item.prev)} → {fmt(item.cur)}</p>
                    </div>
                  ))}
                </div>
                {/* Month-by-month YoY comparison chart */}
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={yearData.map((m, i) => ({ month: m.month, [`${viewYear}`]: m.net, [`${viewYear - 1}`]: prevYearData[i]?.net || 0 }))} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                    <XAxis dataKey="month" fontSize={11} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Legend />
                    <Bar dataKey={`${viewYear - 1}`} name={`${viewYear - 1} Net`} fill={dm('#94a3b8', '#475569')} radius={[3, 3, 0, 0]} />
                    <Bar dataKey={`${viewYear}`} name={`${viewYear} Net`} fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Monthly comparison chart */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Income vs. Expenses by Month</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yearData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Net cash flow line */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Net Cash Flow</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={yearData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Area type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2.5} fill="url(#netGrad)" dot={{ r: 4, fill: "#6366f1" }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Month-by-month table */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Monthly Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${dm('border-gray-200', 'border-slate-700')}`}>
                      <th className={`text-left py-2 px-2 text-xs font-medium ${dm('text-gray-400', 'text-gray-500')} uppercase`}>Month</th>
                      <th className={`text-right py-2 px-2 text-xs font-medium ${dm('text-gray-400', 'text-gray-500')} uppercase`}>Income</th>
                      <th className={`text-right py-2 px-2 text-xs font-medium ${dm('text-gray-400', 'text-gray-500')} uppercase`}>Expenses</th>
                      <th className={`text-right py-2 px-2 text-xs font-medium ${dm('text-gray-400', 'text-gray-500')} uppercase`}>Savings</th>
                      <th className={`text-right py-2 px-2 text-xs font-medium ${dm('text-gray-400', 'text-gray-500')} uppercase`}>Net</th>
                      {hasPrevData && <th className={`text-right py-2 px-2 text-xs font-medium ${dm('text-gray-400', 'text-gray-500')} uppercase`}>vs {viewYear - 1}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.map((m, i) => {
                      const isCurrent = m.monthIdx === viewMonth && viewYear === today.getFullYear();
                      const prevNet = prevYearData[i]?.net || 0;
                      const netDiff = m.net - prevNet;
                      return (
                        <tr key={m.month} className={`border-b ${dm('border-gray-50', 'border-slate-800')} ${isCurrent ? dm("bg-indigo-50/50", "bg-indigo-950/30") : dm("hover:bg-gray-50", "hover:bg-slate-800/50")} cursor-pointer transition`}
                          onClick={() => { setViewMonth(m.monthIdx); setTab("dashboard"); }}>
                          <td className={`py-2.5 px-2 font-medium ${isCurrent ? "text-indigo-600" : dm("text-gray-700", "text-gray-300")}`}>
                            {m.month}{isCurrent ? " ●" : ""}
                          </td>
                          <td className="py-2.5 px-2 text-right text-emerald-600 font-medium">{fmt(m.income)}</td>
                          <td className="py-2.5 px-2 text-right text-rose-500">{fmt(m.expenses)}</td>
                          <td className="py-2.5 px-2 text-right text-cyan-600">{fmt(m.savings)}</td>
                          <td className={`py-2.5 px-2 text-right font-bold ${m.net >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{fmt(m.net)}</td>
                          {hasPrevData && <td className={`py-2.5 px-2 text-right text-xs font-medium ${netDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{netDiff >= 0 ? '+' : ''}{fmt(netDiff)}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={`border-t-2 ${dm('border-gray-200', 'border-slate-700')}`}>
                      <td className={`py-2.5 px-2 font-bold ${dm('text-gray-800', 'text-gray-200')}`}>Total</td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-600">{fmt(curTotals.income)}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-rose-500">{fmt(curTotals.expenses)}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-cyan-600">{fmt(curTotals.savings)}</td>
                      <td className={`py-2.5 px-2 text-right font-bold ${curTotals.net >= 0 ? "text-indigo-600" : "text-rose-600"}`}>{fmt(curTotals.net)}</td>
                      {hasPrevData && <td className={`py-2.5 px-2 text-right text-xs font-bold ${curTotals.net - prevTotals.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{curTotals.net - prevTotals.net >= 0 ? '+' : ''}{fmt(curTotals.net - prevTotals.net)}</td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className={`text-xs ${dm('text-gray-400', 'text-gray-500')} mt-3`}>Click any month to jump to it</p>
            </Card>
          </>
          );
        })()}
      </main>

      {/* ═══════ FLOATING QUICK-ADD EXPENSE BUTTON ═══════ */}
      {!quickAdd && (
        <button onClick={() => setQuickAdd({ description: "", amount: "", category: "Other", date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0")}`, merchant: "" })}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center group"
          title="Quick add expense">
          <Plus size={24} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {quickAdd && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Zap size={14} className="text-indigo-500" /> Quick Add Expense</h3>
            <button onClick={() => setQuickAdd(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="space-y-2.5">
            <input placeholder="What did you spend on?" value={quickAdd.description} onChange={(e) => setQuickAdd({ ...quickAdd, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
            <input placeholder="Merchant (optional)" value={quickAdd.merchant || ""} onChange={(e) => setQuickAdd({ ...quickAdd, merchant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" placeholder="Amount" value={quickAdd.amount} onChange={(e) => setQuickAdd({ ...quickAdd, amount: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={quickAdd.category} onChange={(e) => {
              const cat = e.target.value;
              setQuickAdd({ ...quickAdd, category: cat, goalId: cat === "Savings" ? (goals[0]?.id || "") : "", description: cat === "Savings" && !quickAdd.description ? (goals[0]?.name || "") + " contribution" : quickAdd.description });
            }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {EXPENSE_CATEGORIES.filter((c) => c !== "Debt Payment").map((c) => <option key={c}>{c}</option>)}
            </select>
            {quickAdd.category === "Savings" && (
              <select value={quickAdd.goalId || ""} onChange={(e) => {
                const goal = goals.find((g) => g.id === e.target.value);
                setQuickAdd({ ...quickAdd, goalId: e.target.value, description: goal ? `${goal.name} contribution` : quickAdd.description });
              }}
                className="w-full px-3 py-1.5 border border-cyan-200 rounded-lg text-sm bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="">Select savings goal...</option>
                {goals.map((g) => <option key={g.id} value={g.id}>{g.name} ({fmt(g.saved)} / {fmt(g.target)})</option>)}
              </select>
            )}
            <input type="date" value={quickAdd.date} onChange={(e) => setQuickAdd({ ...quickAdd, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={() => {
              if (quickAdd.description && quickAdd.amount && (quickAdd.category !== "Savings" || quickAdd.goalId)) {
                addExpense({ ...quickAdd, amount: +quickAdd.amount });
                setQuickAdd(null);
              }
            }} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-1.5">
              <Check size={14} /> Add Expense
            </button>
          </div>
        </div>
      )}

      <footer className={`text-center py-6 text-xs ${isThemed ? 'opacity-50 ' + theme.textClass : 'text-gray-400'}`}>
        MaverickFinance {isThemed ? `· ${theme.emoji} ${theme.name} Edition` : '· Your budget, your way'}
      </footer>
    </div>
  );
}