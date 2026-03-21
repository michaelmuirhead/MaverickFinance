import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Landmark, CreditCard, PiggyBank, Calendar, Plus, Trash2, Check, X, AlertCircle, Target, Wallet, Bell, ChevronLeft, ChevronRight, BarChart3, Zap, ClipboardList, Copy, CheckCircle, Circle, GripVertical, Sun, Moon, Settings, Download, Upload, StickyNote, Calculator, Clock, Heart, Shield, Search, ChevronDown, Minus, ArrowDownCircle, ArrowUpCircle, GitBranch, Repeat, Eye, Sparkles, CalendarDays, Star, Cloud, LogIn, LogOut, RefreshCw } from "lucide-react";

// ─── Firebase (optional cloud sync) ──────────────────────────────────────
// To enable cloud sync: npm install firebase, then fill in your config from
// Firebase Console → Project Settings → Your apps → Web app
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCW0hh0It77BPHUUuYxdQLVlKXEf52eVZo",
  authDomain: "maverickfinance.firebaseapp.com",
  projectId: "maverickfinance",
  storageBucket: "maverickfinance.firebasestorage.app",
  messagingSenderId: "1023161031744",
  appId: "1:1023161031744:web:0d896f3cd445f378dcd3a5"
};
const firebaseEnabled = !!FIREBASE_CONFIG.apiKey;
// Firebase modules loaded lazily via dynamic import — never blocks the artifact bundler
const _fb = {};
const getFb = async () => {
  if (_fb.ready) return _fb;
  if (!firebaseEnabled) return null;
  try {
    const app = await import("firebase/app");
    const auth = await import("firebase/auth");
    const fs = await import("firebase/firestore");
    _fb.app = app.initializeApp(FIREBASE_CONFIG);
    _fb.auth = auth.getAuth(_fb.app);
    _fb.db = fs.getFirestore(_fb.app);
    _fb.GoogleAuthProvider = auth.GoogleAuthProvider;
    _fb.signInWithPopup = auth.signInWithPopup;
    _fb.signOut = auth.signOut;
    _fb.onAuthStateChanged = auth.onAuthStateChanged;
    _fb.doc = fs.doc;
    _fb.getDoc = fs.getDoc;
    _fb.setDoc = fs.setDoc;
    _fb.ready = true;
    return _fb;
  } catch (e) { console.warn("Firebase not available, using localStorage only"); return null; }
};

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
  lego: { name: "LEGO", emoji: "🧱", bg: "bg-yellow-300", cardClass: "border-[3px] border-black/20 bg-red-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] rounded-lg", headerClass: "bg-yellow-400 border-b-[3px] border-black/20", textClass: "text-black", accentColor: "#dc2626", fontFamily: "'Fredoka', 'Arial Black', sans-serif", borderStyle: "border-black/20", specialEffect: "lego" },
  comic: { name: "Comic Book", emoji: "💥", bg: "bg-sky-300", cardClass: "border-[3px] border-black bg-yellow-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rounded-none", headerClass: "bg-red-600 border-black border-b-[3px]", textClass: "text-black", accentColor: "#dc2626", fontFamily: "'Bangers', 'Comic Sans MS', cursive", borderStyle: "border-black border-2", specialEffect: "comic" },
  newspaper: { name: "Typewriter", emoji: "📰", bg: "bg-amber-50", cardClass: "border border-amber-900/30 bg-amber-50/70 shadow-none rounded-none", headerClass: "bg-amber-100/90 border-amber-900/30", textClass: "text-amber-950", accentColor: "#5c3a1e", fontFamily: "'Special Elite', 'Courier New', monospace", borderStyle: "border-amber-900/25", specialEffect: "newspaper" },
  papyrus: { name: "Papyrus", emoji: "𓂀", bg: "bg-amber-100", cardClass: "border border-amber-800/30 bg-amber-100/80 shadow-inner rounded-none", headerClass: "bg-amber-900/90 border-amber-800/40", textClass: "text-amber-900", accentColor: "#92400e", fontFamily: "'Papyrus', 'Segoe Script', fantasy", borderStyle: "border-amber-800/30", specialEffect: "papyrus" },
  lionheart: { name: "Lionheart", emoji: "🦁", bg: "bg-red-950", cardClass: "border-2 border-yellow-600/40 bg-red-950/80 shadow-lg shadow-yellow-900/10", headerClass: "bg-red-950/90 border-yellow-600/50", textClass: "text-yellow-100", accentColor: "#ca8a04", fontFamily: "'MedievalSharp', 'Palatino Linotype', serif", borderStyle: "border-yellow-600/30", specialEffect: "lionheart" },
  fifties: { name: "The 1950s", emoji: "🎸", bg: "bg-pink-50", cardClass: "border-2 border-pink-300 bg-white rounded-2xl shadow-md", headerClass: "bg-gradient-to-r from-pink-400 via-sky-300 to-mint-300 border-pink-300", textClass: "text-pink-800", accentColor: "#ec4899", fontFamily: "'Georgia', serif", borderStyle: "border-pink-300", specialEffect: "fifties" },
  cyberpunk: { name: "Cyberpunk", emoji: "🌆", bg: "bg-gray-950", cardClass: "border border-pink-500/30 bg-gray-950/90 shadow-[0_0_15px_rgba(236,72,153,0.1)]", headerClass: "bg-gray-950/95 border-pink-500/30", textClass: "text-pink-400", accentColor: "#ec4899", fontFamily: "'Orbitron', 'Courier New', monospace", borderStyle: "border-pink-500/20", specialEffect: "cyberpunk" },
  minimalist: { name: "Minimalist", emoji: "◻️", bg: "bg-white", cardClass: "border border-gray-100 bg-white shadow-sm", headerClass: "bg-white border-gray-100", textClass: "text-gray-800", accentColor: "#1f2937", fontFamily: "'Inter', system-ui, sans-serif", borderStyle: "border-gray-100", specialEffect: "minimalist" },
  academia: { name: "Dark Academia", emoji: "📚", bg: "bg-stone-900", cardClass: "border border-amber-800/30 bg-stone-900/90 shadow-lg", headerClass: "bg-stone-900/95 border-amber-800/30", textClass: "text-amber-100", accentColor: "#d97706", fontFamily: "'Libre Baskerville', 'Georgia', serif", borderStyle: "border-amber-800/25", specialEffect: "academia" },
  retroterminal: { name: "Retro Terminal", emoji: "🖥️", bg: "bg-black", cardClass: "border border-amber-500/30 bg-black/80 shadow-[0_0_15px_rgba(245,158,11,0.08)]", headerClass: "bg-black/95 border-amber-500/30", textClass: "text-amber-400", accentColor: "#f59e0b", fontFamily: "'VT323', 'Courier New', monospace", borderStyle: "border-amber-500/20", specialEffect: "retroterminal" },
  win95: { name: "Windows 95", emoji: "🪟", bg: "bg-teal-600", cardClass: "border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-gray-300 shadow-none rounded-none", headerClass: "bg-gradient-to-r from-blue-800 to-blue-600 border-none", textClass: "text-black", accentColor: "#1e3a5f", fontFamily: "'MS Sans Serif', 'Segoe UI', Tahoma, sans-serif", borderStyle: "border-gray-500", specialEffect: "win95" },
  gameboy: { name: "Game Boy", emoji: "🎮", bg: "bg-lime-100", cardClass: "border-2 border-green-900/40 bg-lime-200/80 shadow-none rounded-none", headerClass: "bg-green-900/90 border-green-900/50", textClass: "text-green-900", accentColor: "#14532d", fontFamily: "'Press Start 2P', 'Courier New', monospace", borderStyle: "border-green-900/30", specialEffect: "gameboy" },
  blueprint: { name: "Blueprint", emoji: "📐", bg: "bg-blue-950", cardClass: "border border-blue-300/25 bg-blue-950/80 shadow-none", headerClass: "bg-blue-950/95 border-blue-300/25", textClass: "text-blue-100", accentColor: "#60a5fa", fontFamily: "'Courier Prime', 'Courier New', monospace", borderStyle: "border-blue-300/20", specialEffect: "blueprint" },
  space: { name: "Space", emoji: "🚀", bg: "bg-gray-950", cardClass: "border border-violet-500/20 bg-gray-950/80 shadow-[0_0_20px_rgba(139,92,246,0.06)]", headerClass: "bg-gray-950/95 border-violet-500/20", textClass: "text-violet-200", accentColor: "#8b5cf6", fontFamily: "'Exo 2', 'Segoe UI', sans-serif", borderStyle: "border-violet-500/15", specialEffect: "space" },
  consul: { name: "Consul", emoji: "🏛️", bg: "bg-stone-100", cardClass: "border border-stone-400/40 bg-stone-100/90 shadow-md rounded-none", headerClass: "bg-red-900/95 border-stone-400/40", textClass: "text-stone-800", accentColor: "#7f1d1d", fontFamily: "'Cinzel', 'Trajan Pro', serif", borderStyle: "border-stone-400/30", specialEffect: "consul" },
  pokemon: { name: "Pokémon", emoji: "🔴", bg: "bg-red-600", cardClass: "border-[3px] border-gray-800 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]", headerClass: "bg-red-600 border-gray-800 border-b-[3px]", textClass: "text-gray-900", accentColor: "#dc2626", fontFamily: "'Poppins', 'Arial', sans-serif", borderStyle: "border-gray-800", specialEffect: "pokemon" },
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Wallet },
  { id: "planner", label: "Planner", icon: ClipboardList },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "bills", label: "Bills", icon: Calendar },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "debt", label: "Debt", icon: CreditCard },
  { id: "networth", label: "Net Worth", icon: Landmark },
  { id: "paycalc", label: "Pay Calc", icon: Calculator },
  { id: "health", label: "Health", icon: Heart },
  { id: "flow", label: "Cash Flow", icon: GitBranch },
  { id: "subscriptions", label: "Subs", icon: Repeat },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "wishlist", label: "Wishlist", icon: Star },
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
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const savedData = loadSaved();
const init = (key, fallback) => {
  if (!savedData || savedData[key] === undefined || savedData[key] === null) return fallback;
  return savedData[key];
};

export default function PaycheckPlanner() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ─── Firebase Auth + Cloud Sync ───
  const [fbUser, setFbUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | error
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    let unsub = null;
    getFb().then(fb => {
      if (!fb) return;
      unsub = fb.onAuthStateChanged(fb.auth, (user) => {
        setFbUser(user);
        if (user) loadFromCloud(user.uid);
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseEnabled) return;
    try {
      const fb = await getFb();
      if (!fb) return;
      await fb.signInWithPopup(fb.auth, new fb.GoogleAuthProvider());
    } catch (e) { console.error("Sign-in failed:", e); }
  };

  const signOutUser = async () => {
    if (!firebaseEnabled) return;
    try {
      const fb = await getFb();
      if (!fb) return;
      await fb.signOut(fb.auth);
      setFbUser(null);
      setSyncStatus("idle");
    } catch (e) { console.error("Sign-out failed:", e); }
  };

  const saveToCloud = async (data) => {
    if (!firebaseEnabled || !fbUser) return;
    try {
      const fb = await getFb();
      if (!fb) return;
      setSyncStatus("syncing");
      await fb.setDoc(fb.doc(fb.db, "users", fbUser.uid), {
        data: JSON.stringify(data),
        updatedAt: new Date().toISOString(),
        email: fbUser.email || ""
      });
      setSyncStatus("synced");
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Cloud save failed:", e);
      setSyncStatus("error");
    }
  };

  const loadFromCloud = async (userId) => {
    if (!firebaseEnabled) return;
    try {
      const fb = await getFb();
      if (!fb) return;
      setSyncStatus("syncing");
      const snap = await fb.getDoc(fb.doc(fb.db, "users", userId));
      if (snap.exists()) {
        const cloudData = JSON.parse(snap.data().data);
        if (cloudData.incomeSources) setIncomeSources(cloudData.incomeSources);
        if (cloudData.bills) setBills(cloudData.bills);
        if (cloudData.goals) setGoals(cloudData.goals);
        if (cloudData.debts) setDebts(cloudData.debts);
        if (cloudData.expensesByMonth) setExpensesByMonth(cloudData.expensesByMonth);
        if (cloudData.extraChecks) setExtraChecks(cloudData.extraChecks);
        if (cloudData.incomeOverrides) setIncomeOverrides(cloudData.incomeOverrides);
        if (cloudData.plannerManualByMonth) setPlannerManualByMonth(cloudData.plannerManualByMonth);
        if (cloudData.plannerDismissedByMonth) setPlannerDismissedByMonth(cloudData.plannerDismissedByMonth);
        if (cloudData.plannerPaidByMonth) setPlannerPaidByMonth(cloudData.plannerPaidByMonth);
        if (cloudData.plannerNotesByMonth) setPlannerNotesByMonth(cloudData.plannerNotesByMonth);
        if (cloudData.customCategories) setCustomCategories(cloudData.customCategories);
        if (cloudData.categoryBudgets) setCategoryBudgets(cloudData.categoryBudgets);
        if (cloudData.darkMode !== undefined) setDarkMode(cloudData.darkMode);
        if (cloudData.activeTheme) setActiveTheme(cloudData.activeTheme);
        if (cloudData.assets) setAssets(cloudData.assets);
        if (cloudData.liabilities) setLiabilities(cloudData.liabilities);
        if (cloudData.netWorthHistory) setNetWorthHistory(cloudData.netWorthHistory);
        if (cloudData.nwMilestones) setNwMilestones(cloudData.nwMilestones);
        if (cloudData.balanceHistory) setBalanceHistory(cloudData.balanceHistory);
        if (cloudData.payCalcEntries) setPayCalcEntries(cloudData.payCalcEntries);
        if (cloudData.payCalcSettings) setPayCalcSettings(cloudData.payCalcSettings);
        if (cloudData.savingsTransactions) setSavingsTransactions(cloudData.savingsTransactions);
        if (cloudData.plannerOrderByMonth) setPlannerOrderByMonth(cloudData.plannerOrderByMonth);
        if (cloudData.subscriptions) setSubscriptions(cloudData.subscriptions);
        if (cloudData.wishlist) setWishlist(cloudData.wishlist);
        if (cloudData.expenseTemplates) setExpenseTemplates(cloudData.expenseTemplates);
        if (cloudData.debtStrategy) setDebtStrategy(cloudData.debtStrategy);
        if (cloudData.cashFlowStartBal !== undefined) setCashFlowStartBal(cloudData.cashFlowStartBal);
        if (cloudData.tabOrder) setTabOrder(cloudData.tabOrder);
        if (cloudData.showBadges !== undefined) setShowBadges(cloudData.showBadges);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
      }
      setSyncStatus("synced");
      setLastSyncTime(new Date());
    } catch (e) {
      console.error("Cloud load failed:", e);
      setSyncStatus("error");
    }
  };

  const forceSync = () => {
    if (fbUser) loadFromCloud(fbUser.uid);
  };


  // ─── Feature 5: Dark mode ───
  const [darkMode, setDarkMode] = useState(init("darkMode", false));
  const dm = (light, dark) => darkMode ? dark : light;

  // ─── Theme system ───
  const [activeTheme, setActiveTheme] = useState(init("activeTheme", "default"));
  const baseTheme = THEMES[activeTheme] || THEMES.default;
  const theme = (activeTheme === 'pokemon' && darkMode) ? {
    ...baseTheme,
    name: "Master Ball",
    emoji: "🟣",
    bg: "bg-purple-900",
    cardClass: "border-[3px] border-purple-600 bg-[#1e1233] rounded-xl shadow-[3px_3px_0px_0px_rgba(124,58,237,0.3)]",
    headerClass: "bg-gradient-to-r from-purple-800 to-fuchsia-700 border-purple-500 border-b-[3px]",
    textClass: "text-purple-200",
    accentColor: "#d946ef",
    borderStyle: "border-purple-600",
  } : baseTheme;
  const isThemed = activeTheme !== "default";
  
  // ─── Onboarding wizard ───
  const [onboardingStep, setOnboardingStep] = useState(0); // 0 = not started / done
  const [showOnboarding, setShowOnboarding] = useState(!savedData); // auto-show on first visit only
  const [onboardingData, setOnboardingData] = useState({
    incomeSources: [{ name: "Primary Job", amount: "", frequency: "biweekly", referenceDate: "" }],
    bills: [{ name: "Rent / Mortgage", amount: "", dueDay: 1 }, { name: "Car Payment", amount: "", dueDay: 5 }, { name: "Utilities", amount: "", dueDay: 15 }],
    savingsGoals: [{ name: "Emergency Fund", monthlyContribution: "", target: 10000 }]
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
  const [categoryBudgets, setCategoryBudgets] = useState(init("categoryBudgets", {}));
  const [budgetDraft, setBudgetDraft] = useState(null);
  const [editingBudgetCat, setEditingBudgetCat] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // ── Tutorial steps ──
  const tutorialSteps = [
    { tab: "dashboard", title: "Dashboard", desc: "Your financial command center. See your monthly income, bills, savings rate, and spending breakdown at a glance. The stat cards at the top show key numbers, and the chart breaks down where your money goes." },
    { tab: "planner", title: "Planner", desc: "Map out each paycheck's budget. See what bills come out of which paycheck, manually add expenses, and mark items as paid. This is where you plan how to spend each paycheck before it hits." },
    { tab: "bills", title: "Bills", desc: "Track all your recurring bills in one place. Each bill shows its due date, amount, and category. Bills are automatically assigned to paychecks based on due dates. Use the calendar view to see everything mapped out." },
    { tab: "savings", title: "Savings Goals", desc: "Set savings targets and track progress. Add monthly contributions, log deposits, and watch your progress bar fill up. Great for emergency funds, vacations, or any goal you're working toward." },
    { tab: "expenses", title: "Expenses", desc: "Log individual purchases and spending. Set category budgets to see how your actual spending compares to what you planned. You can also use recurring expense templates for regular purchases." },
    { tab: "debt", title: "Debt Payoff", desc: "Track loans and credit cards. See your total debt, choose between avalanche (highest interest first) or snowball (lowest balance first) strategies, and watch a projected payoff timeline." },
    { tab: "networth", title: "Net Worth", desc: "Track your big-picture financial health. Add assets (savings, investments, property) and liabilities (loans, credit cards) to see your total net worth and how it changes over time." },
    { tab: "flow", title: "Cash Flow", desc: "Project your cash balance forward 30-90 days. See when money comes in and goes out, and identify potential shortfalls before they happen." },
    { tab: "wishlist", title: "Wishlist", desc: "Plan future purchases. Add items you want to buy, set priorities, and track how long it'll take to save for each one based on your current savings rate." },
    { tab: "calendar", title: "Calendar", desc: "See all your financial events on a monthly calendar — paydays, bill due dates, subscription renewals, and debt payments, all color-coded and easy to scan." },
  ];

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
  const [incomeSources, setIncomeSources] = useState(init("incomeSources", []));
  const [incomeDraft, setIncomeDraft] = useState(null);

  // Recurring bills
  const [bills, setBills] = useState(init("bills", []));
  const [billDraft, setBillDraft] = useState(null);
  const [editingBillId, setEditingBillId] = useState(null);
  const [editingDebtId, setEditingDebtId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Savings goals (recurring monthly contribution)
  const [goals, setGoals] = useState(init("goals", []));
  const [goalDraft, setGoalDraft] = useState(null);
  const [savingsTransactions, setSavingsTransactions] = useState(init("savingsTransactions", {}));
  const [savingsWithdrawDraft, setSavingsWithdrawDraft] = useState(null);
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  // Debts (recurring payments)
  const [debts, setDebts] = useState(init("debts", []));
  const [debtDraft, setDebtDraft] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════
  // MONTH-SPECIFIC DATA (one-off expenses stored per month key)
  // ═══════════════════════════════════════════════════════════════════════
  const [expensesByMonth, setExpensesByMonth] = useState(init("expensesByMonth", {}));
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
  const [assets, setAssets] = useState(init("assets", []));
  const [assetDraft, setAssetDraft] = useState(null);
  const [liabilities, setLiabilities] = useState(init("liabilities", []));
  const [liabilityDraft, setLiabilityDraft] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState(init("netWorthHistory", []));
  const [nwMilestones, setNwMilestones] = useState(init("nwMilestones", []));
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
  const [subscriptions, setSubscriptions] = useState(init("subscriptions", []));
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
  // WISHLIST / PLANNED PURCHASES
  // ═══════════════════════════════════════════════════════════════════════
  const [wishlist, setWishlist] = useState(init("wishlist", []));
  const [wishDraft, setWishDraft] = useState(null);
  const [editingWishId, setEditingWishId] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════
  // EXPENSE TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════
  const [expenseTemplates, setExpenseTemplates] = useState(init("expenseTemplates", []));
  const [showTemplates, setShowTemplates] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // DEBT STRATEGY TOGGLE
  // ═══════════════════════════════════════════════════════════════════════
  const [debtStrategy, setDebtStrategy] = useState(init("debtStrategy", "avalanche"));

  // ═══════════════════════════════════════════════════════════════════════
  // GLOBAL SEARCH
  // ═══════════════════════════════════════════════════════════════════════
  const [globalSearch, setGlobalSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cashFlowRange, setCashFlowRange] = useState(90);
  const [cashFlowStartBal, setCashFlowStartBal] = useState(init("cashFlowStartBal", 0));
  const [editingStartBal, setEditingStartBal] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // NEW FEATURES: FEATURE 2 (Tab Reordering), FEATURE 4 (Notification Badges), FEATURE 1 (Calendar)
  // ═══════════════════════════════════════════════════════════════════════
  const [tabOrder, setTabOrder] = useState(init("tabOrder", null));
  const [showBadges, setShowBadges] = useState(init("showBadges", true));
  const [calendarSelectedDay, setCalendarSelectedDay] = useState(null);

  // ─── Tab order logic (Feature 2: Drag-to-Reorder Tabs) ───
  const orderedTabs = useMemo(() => {
    if (!tabOrder) return TABS;
    const ordered = tabOrder.map(id => TABS.find(t => t.id === id)).filter(Boolean);
    const newTabs = TABS.filter(t => !tabOrder.includes(t.id));
    return [...ordered, ...newTabs];
  }, [tabOrder]);

  // ─── Auto-save to localStorage + cloud ───
  useEffect(() => {
    try {
      const data = {
        incomeSources, bills, goals, debts, expensesByMonth, extraChecks, incomeOverrides,
        plannerManualByMonth, plannerDismissedByMonth, plannerPaidByMonth, plannerNotesByMonth,
        customCategories, categoryBudgets, darkMode, activeTheme,
        assets, liabilities, netWorthHistory, nwMilestones, balanceHistory,
        payCalcEntries, payCalcSettings, savingsTransactions, plannerOrderByMonth, subscriptions,
        wishlist, expenseTemplates, debtStrategy, cashFlowStartBal, tabOrder, showBadges
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      saveToCloud(data);
    } catch (e) { /* storage full or unavailable — silent fail */ }
  }, [incomeSources, bills, goals, debts, expensesByMonth, extraChecks, incomeOverrides,
    plannerManualByMonth, plannerDismissedByMonth, plannerPaidByMonth, plannerNotesByMonth,
    customCategories, categoryBudgets, darkMode, activeTheme,
    assets, liabilities, netWorthHistory, nwMilestones, balanceHistory,
    payCalcEntries, payCalcSettings, savingsTransactions, plannerOrderByMonth, subscriptions,
    wishlist, expenseTemplates, debtStrategy, cashFlowStartBal, tabOrder, showBadges]);

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
      const startDay = i === 0 ? 1 : check.date.getDate();
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

  // Notification badges (Feature 4: Notification Badges)
  const tabBadges = useMemo(() => {
    if (!showBadges) return {};
    const badges = {};
    // Bills: due within 3 days
    const todayDate = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (isCurrentMonth && bills.some(b => { const diff = b.dueDay - todayDate; return diff >= 0 && diff <= 3; })) badges.bills = true;
    // Debt: DTI > 36%
    if (monthlyIncome > 0 && (totalDebtPayments / monthlyIncome) > 0.36) badges.debt = true;
    // Expenses: over budget
    if (Object.entries(categoryBudgets).some(([cat, budget]) => {
      const spent = manualExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
      return spent > budget;
    })) badges.expenses = true;
    // Savings: goal reached
    if (goals.some(g => g.saved >= g.target)) badges.savings = true;
    // Health: score < 50 (computed inline for efficiency)
    const efScore = (() => {
      const monthlyExp = bills.reduce((s, b) => s + b.amount, 0) + debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0);
      const emergencyTarget = monthlyExp * 3;
      const emergencyFund = assets.filter(a => a.category === 'Cash').reduce((s, a) => s + a.balance, 0);
      return Math.min(20, Math.round((emergencyFund / Math.max(emergencyTarget, 1)) * 20));
    })();
    const dti = monthlyIncome > 0 ? (debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0)) / monthlyIncome : 1;
    const dtiScore = dti <= 0.1 ? 20 : dti <= 0.2 ? 16 : dti <= 0.36 ? 12 : dti <= 0.5 ? 6 : 0;
    const savingsRate = monthlyIncome > 0 ? goals.reduce((s, g) => s + g.monthlyContribution, 0) / monthlyIncome : 0;
    const srScore = savingsRate >= 0.2 ? 20 : savingsRate >= 0.15 ? 16 : savingsRate >= 0.1 ? 12 : savingsRate >= 0.05 ? 6 : 0;
    const billCoverage = monthlyIncome > 0 ? bills.reduce((s, b) => s + b.amount, 0) / monthlyIncome : 1;
    const bcScore = billCoverage <= 0.3 ? 20 : billCoverage <= 0.4 ? 16 : billCoverage <= 0.5 ? 12 : billCoverage <= 0.6 ? 6 : 0;
    const totalScore = efScore + dtiScore + srScore + bcScore + 20; // +20 for net worth
    if (totalScore < 50) badges.health = true;
    return badges;
  }, [showBadges, bills, debts, monthlyIncome, totalDebtPayments, categoryBudgets, manualExpenses, goals, assets, isCurrentMonth, today]);

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
      const payoffOrder = [];
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
          if (d.bal === 0 && !payoffOrder.find(o => o.id === d.id)) {
            payoffOrder.push({ id: d.id, name: d.name, paidOffMonth: months });
          }
        });
      }
      return { months, totalInterest, totalPaid: debts.reduce((s, d) => s + d.balance, 0) + totalInterest, payoffOrder };
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
      payCalcEntries, payCalcSettings, savingsTransactions, plannerOrderByMonth, subscriptions,
      wishlist, expenseTemplates, debtStrategy, cashFlowStartBal, tabOrder, showBadges
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
        if (data.wishlist) setWishlist(data.wishlist);
        if (data.expenseTemplates) setExpenseTemplates(data.expenseTemplates);
        if (data.debtStrategy) setDebtStrategy(data.debtStrategy);
        if (data.cashFlowStartBal !== undefined) setCashFlowStartBal(data.cashFlowStartBal);
        if (data.tabOrder) setTabOrder(data.tabOrder);
        if (data.showBadges !== undefined) setShowBadges(data.showBadges);
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleCsvExport = () => {
    const currentMonthExpenses = expensesByMonth[vKey] || [];
    const csvRows = [
      ['Date', 'Description', 'Merchant', 'Amount', 'Category'].join(',')
    ];
    currentMonthExpenses.forEach(exp => {
      const row = [
        exp.date || '',
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        `"${(exp.merchant || '').replace(/"/g, '""')}"`,
        exp.amount,
        exp.category || ''
      ].join(',');
      csvRows.push(row);
    });
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${vKey}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result || '';
        const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
        const expenses = [];
        let hasHeader = false;
        lines.forEach((line, idx) => {
          if (idx === 0 && (line.toLowerCase().includes('date') || line.toLowerCase().includes('description'))) {
            hasHeader = true;
            return;
          }
          const parts = line.split(',').map(p => p.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"'));
          if (parts.length >= 2) {
            const [date, desc, merchant, amountStr, category] = parts;
            const amount = parseFloat(amountStr) || 0;
            if (amount > 0 || desc) {
              expenses.push({
                id: uid(),
                date: date || new Date().toISOString().split('T')[0],
                description: desc,
                merchant: merchant || '',
                amount,
                category: category || 'Other'
              });
            }
          }
        });
        const key = vKey;
        setExpensesByMonth({ ...expensesByMonth, [key]: [...(expensesByMonth[key] || []), ...expenses] });
        alert(`Imported ${expenses.length} expense(s)`);
      } catch (error) {
        alert('Error importing CSV: ' + error.message);
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
    const validIncome = d.incomeSources.filter(s => s.amount && parseFloat(s.amount) > 0);
    if (validIncome.length > 0) {
      setIncomeSources(validIncome.map(s => ({ id: uid(), name: s.name || "Job", amount: parseFloat(s.amount) || 0, frequency: s.frequency, referenceDate: s.referenceDate || "2026-03-07" })));
    }
    const validBills = d.bills.filter(b => b.amount && parseFloat(b.amount) > 0);
    if (validBills.length > 0) {
      setBills(validBills.map(b => ({ id: uid(), name: b.name || "Bill", amount: parseFloat(b.amount), dueDay: b.dueDay || 1, category: "General", autopay: false })));
    }
    const validGoals = d.savingsGoals.filter(g => g.monthlyContribution && parseFloat(g.monthlyContribution) > 0);
    if (validGoals.length > 0) {
      const goalColors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
      setGoals(validGoals.map((g, i) => ({ id: uid(), name: g.name || "Savings", target: parseFloat(g.target) || 10000, saved: 0, monthlyContribution: parseFloat(g.monthlyContribution), color: goalColors[i % goalColors.length] })));
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
    const updateListItem = (listKey, index, field, value) => {
      setOnboardingData(prev => {
        const arr = [...prev[listKey]];
        arr[index] = { ...arr[index], [field]: value };
        return { ...prev, [listKey]: arr };
      });
    };
    const addListItem = (listKey, template) => {
      setOnboardingData(prev => ({ ...prev, [listKey]: [...prev[listKey], template] }));
    };
    const removeListItem = (listKey, index) => {
      setOnboardingData(prev => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== index) }));
    };
    const canNext = () => {
      if (onboardingStep === 1) return true;
      if (onboardingStep === 2) return od.incomeSources.some(s => s.amount && parseFloat(s.amount) > 0);
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
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {od.incomeSources.map((src, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
                        {od.incomeSources.length > 1 && (
                          <button onClick={() => removeListItem("incomeSources", i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition" title="Remove"><X size={14} /></button>
                        )}
                        <input type="text" placeholder="e.g. Primary Job" value={src.name} onChange={e => updateListItem("incomeSources", i, "name", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input type="number" placeholder="0.00" value={src.amount} onChange={e => updateListItem("incomeSources", i, "amount", e.target.value)}
                              className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                          </div>
                          <select value={src.frequency} onChange={e => updateListItem("incomeSources", i, "frequency", e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white">
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="semimonthly">Semi-Monthly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <input type="date" value={src.referenceDate} onChange={e => updateListItem("incomeSources", i, "referenceDate", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addListItem("incomeSources", { name: "", amount: "", frequency: "biweekly", referenceDate: "" })}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-1.5">
                    <Plus size={15} /> Add Another Income Source
                  </button>
                </>
              )}
              {onboardingStep === 3 && (
                <>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {od.bills.map((bill, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 relative">
                        {od.bills.length > 1 && (
                          <button onClick={() => removeListItem("bills", i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition" title="Remove"><X size={14} /></button>
                        )}
                        <input type="text" placeholder="Bill name" value={bill.name} onChange={e => updateListItem("bills", i, "name", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none mb-2" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <input type="number" placeholder="0" value={bill.amount} onChange={e => updateListItem("bills", i, "amount", e.target.value)}
                              className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Day</span>
                            <input type="number" min="1" max="31" value={bill.dueDay} onChange={e => updateListItem("bills", i, "dueDay", parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-200 rounded-xl pl-11 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addListItem("bills", { name: "", amount: "", dueDay: 1 })}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-1.5">
                    <Plus size={15} /> Add Another Bill
                  </button>
                  <p className="text-xs text-gray-400 text-center">Leave amount at $0 to skip any bill.</p>
                </>
              )}
              {onboardingStep === 4 && (
                <>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {od.savingsGoals.map((goal, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 relative space-y-2">
                        {od.savingsGoals.length > 1 && (
                          <button onClick={() => removeListItem("savingsGoals", i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition" title="Remove"><X size={14} /></button>
                        )}
                        <input type="text" placeholder="e.g. Emergency Fund, Vacation" value={goal.name} onChange={e => updateListItem("savingsGoals", i, "name", e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$/mo</span>
                            <input type="number" placeholder="0" value={goal.monthlyContribution} onChange={e => updateListItem("savingsGoals", i, "monthlyContribution", e.target.value)}
                              className="w-full border border-gray-200 rounded-xl pl-12 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Target $</span>
                            <input type="number" placeholder="10000" value={goal.target} onChange={e => updateListItem("savingsGoals", i, "target", e.target.value)}
                              className="w-full border border-gray-200 rounded-xl pl-16 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addListItem("savingsGoals", { name: "", monthlyContribution: "", target: 10000 })}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition flex items-center justify-center gap-1.5">
                    <Plus size={15} /> Add Another Goal
                  </button>
                  <p className="text-xs text-gray-400 text-center">Optional — you can set this up later from the Savings tab.</p>
                </>
              )}
              {onboardingStep === 5 && (() => {
                const totalIncome = od.incomeSources.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                const totalBills = od.bills.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                const totalSavings = od.savingsGoals.reduce((s, x) => s + (parseFloat(x.monthlyContribution) || 0), 0);
                const incomeCount = od.incomeSources.filter(x => parseFloat(x.amount) > 0).length;
                const billCount = od.bills.filter(x => parseFloat(x.amount) > 0).length;
                const goalCount = od.savingsGoals.filter(x => parseFloat(x.monthlyContribution) > 0).length;
                return (
                  <div className="text-center space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {totalIncome > 0 && <div className="bg-green-50 rounded-xl p-3"><p className="text-xs text-green-600 font-medium">Income</p><p className="text-lg font-bold text-green-700">${totalIncome.toLocaleString()}</p><p className="text-[10px] text-green-500">{incomeCount} source{incomeCount !== 1 ? 's' : ''}</p></div>}
                      {totalBills > 0 && <div className="bg-rose-50 rounded-xl p-3"><p className="text-xs text-rose-600 font-medium">Bills</p><p className="text-lg font-bold text-rose-700">${totalBills.toLocaleString()}</p><p className="text-[10px] text-rose-500">{billCount} bill{billCount !== 1 ? 's' : ''}/mo</p></div>}
                      {totalSavings > 0 && <div className="bg-indigo-50 rounded-xl p-3"><p className="text-xs text-indigo-600 font-medium">Savings</p><p className="text-lg font-bold text-indigo-700">${totalSavings.toLocaleString()}</p><p className="text-[10px] text-indigo-500">{goalCount} goal{goalCount !== 1 ? 's' : ''}/mo</p></div>}
                    </div>
                  </div>
                );
              })()}
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
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"], [class*="bg-red-50"],
        [class*="bg-yellow-50"], [class*="bg-orange-50"], [class*="bg-pink-50"] {
          background: rgba(0,20,0,0.6) !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: rgba(0,180,0,0.3) !important;
          border: 1px solid rgba(0,255,0,0.4) !important;
        }
        [class*="bg-rose-"], [class*="bg-red-"] {
          background: rgba(0,60,0,0.5) !important;
        }
        [class*="text-gray-"], [class*="text-slate-"], [class*="text-white"],
        [class*="text-indigo-"], [class*="text-rose-"], [class*="text-amber-"],
        [class*="text-cyan-"], [class*="text-emerald-"], [class*="text-green-"],
        [class*="text-blue-"], [class*="text-purple-"] {
          color: #00ff00 !important;
        }
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
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');
        .min-h-screen {
          background: #f5f0e1 !important;
          background-image:
            url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
            repeating-linear-gradient(0deg, transparent 0px, transparent 28px, rgba(92,58,30,0.06) 28px, rgba(92,58,30,0.06) 29px) !important;
        }
        *, ::before, ::after { border-color: rgba(92,58,30,0.2) !important; }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          font-family: 'Special Elite', 'Courier New', monospace !important;
          color: #3d2b1f !important;
        }
        h1, h2, h3 {
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
        }
        input, select, textarea {
          font-family: 'Special Elite', 'Courier New', monospace !important;
          background: rgba(245,240,225,0.9) !important;
          color: #3d2b1f !important;
          border: 1px solid rgba(92,58,30,0.3) !important;
          border-radius: 0 !important;
          box-shadow: inset 1px 1px 3px rgba(92,58,30,0.1) !important;
        }
        input::placeholder { color: rgba(61,43,31,0.4) !important; font-style: italic !important; }
        svg { color: #5c3a1e !important; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 0 !important; }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #5c3a1e !important;
          border-radius: 0 !important;
        }
        [class*="border-b-2"][class*="border-indigo-600"] {
          border-color: #5c3a1e !important;
        }
      `}</style>}
      {activeTheme === 'papyrus' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap');
        .min-h-screen {
          background: #d4a56a !important;
          background-image:
            url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.4' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E") !important;
        }
        *, ::before, ::after { border-color: rgba(120,53,15,0.25) !important; }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Amatic SC', 'Papyrus', fantasy !important;
          color: #451a03 !important;
          font-weight: 700 !important;
          font-size: 1.4em !important;
          letter-spacing: 2px !important;
          text-transform: uppercase !important;
          text-shadow: none !important;
        }
        h1 { font-size: 1.8em !important; }
        p, span, label, a, button, th, td, li, div {
          font-family: 'IM Fell English', 'Palatino Linotype', serif !important;
          color: #3b1a04 !important;
          text-shadow: none !important;
        }
        header h1, header p, header span { color: #fef3c7 !important; }
        input, select, textarea {
          background: rgba(212,165,106,0.5) !important;
          color: #3b1a04 !important;
          border: 1px solid rgba(120,53,15,0.3) !important;
          border-radius: 0 !important;
          font-family: 'IM Fell English', serif !important;
        }
        input::placeholder { color: rgba(59,26,4,0.4) !important; font-style: italic !important; }
        svg { color: #78350f !important; filter: none !important; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 0 !important; }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: rgba(190,140,80,0.35) !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #78350f !important;
          border-radius: 0 !important;
        }
        /* Decorative border on cards */
        [class*="shadow-inner"] {
          border: 2px solid rgba(120,53,15,0.2) !important;
          box-shadow: inset 0 0 20px rgba(120,53,15,0.08) !important;
        }
      `}</style>}
      {activeTheme === 'lionheart' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cinzel:wght@400;600;700&display=swap');
        .min-h-screen {
          background: #1a0a0a !important;
          background-image:
            url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L30 12 L25 15 Z' fill='rgba(202,138,4,0.04)'/%3E%3Cpath d='M5 30 L15 35 L12 30 L15 25 Z' fill='rgba(202,138,4,0.03)'/%3E%3Cpath d='M55 30 L45 25 L48 30 L45 35 Z' fill='rgba(202,138,4,0.03)'/%3E%3Cpath d='M30 55 L25 45 L30 48 L35 45 Z' fill='rgba(202,138,4,0.04)'/%3E%3C/svg%3E"),
            linear-gradient(180deg, #2d0a0a 0%, #1a0505 40%, #0d0505 100%) !important;
          background-size: 60px 60px, 100% 100% !important;
        }
        *, ::before, ::after { border-color: rgba(202,138,4,0.2) !important; }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Cinzel', 'Palatino Linotype', serif !important;
          color: #fbbf24 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 3px !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(202,138,4,0.15) !important;
        }
        p, span, label, a, button, th, td, li, div {
          font-family: 'MedievalSharp', 'Palatino Linotype', serif !important;
          color: #fde68a !important;
          text-shadow: none !important;
        }
        input, select, textarea {
          background: rgba(26,10,10,0.9) !important;
          color: #fde68a !important;
          border: 1px solid rgba(202,138,4,0.3) !important;
          font-family: 'MedievalSharp', serif !important;
        }
        input::placeholder { color: rgba(253,230,138,0.3) !important; }
        svg { color: #ca8a04 !important; filter: drop-shadow(0 0 2px rgba(202,138,4,0.2)); }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: rgba(26,10,10,0.7) !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: linear-gradient(135deg, #92400e, #78350f) !important;
          border: 1px solid rgba(202,138,4,0.4) !important;
        }
        /* Gold decorative borders on cards */
        [class*="rounded-2xl"] {
          border: 2px solid rgba(202,138,4,0.25) !important;
          box-shadow: 0 0 10px rgba(202,138,4,0.05), inset 0 0 15px rgba(0,0,0,0.2) !important;
        }
        /* Tab active = gold underline */
        [class*="border-b-2"][class*="border-indigo-600"] {
          border-color: #ca8a04 !important;
        }
      `}</style>}
      {activeTheme === 'fifties' && <style>{`
        .min-h-screen { background: linear-gradient(135deg, #fce7f3 0%, #e0f2fe 50%, #d1fae5 100%) !important; }
      `}</style>}
      {activeTheme === 'lego' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
        .min-h-screen {
          background: #f6d832 !important;
          background-image:
            radial-gradient(circle at center, rgba(0,0,0,0.08) 8px, transparent 8px),
            radial-gradient(circle at center, rgba(255,255,255,0.25) 6px, transparent 6px) !important;
          background-size: 32px 32px !important;
        }
        *, ::before, ::after { border-color: rgba(0,0,0,0.15) !important; }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          font-family: 'Fredoka', 'Arial Black', sans-serif !important;
          color: #1a1a1a !important;
          text-shadow: none !important;
        }
        h1, h2, h3 {
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
        }
        header h1, header p { color: #fff !important; }
        input, select, textarea {
          background: #fff !important;
          color: #1a1a1a !important;
          border: 3px solid rgba(0,0,0,0.2) !important;
          border-radius: 8px !important;
          font-family: 'Fredoka', sans-serif !important;
          font-weight: 500 !important;
        }
        input::placeholder { color: rgba(0,0,0,0.35) !important; }
        svg { color: #1a1a1a !important; filter: none !important; }

        /* Cards = LEGO bricks — rotate between LEGO primary colors */
        [class*="rounded-2xl"], [class*="shadow-"] {
          border-radius: 12px !important;
          border: 3px solid rgba(0,0,0,0.15) !important;
          box-shadow: 4px 4px 0px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.2) !important;
        }

        /* Color the stat cards and regular cards like LEGO bricks */
        .space-y-4 > div:nth-child(4n+1) > [class*="rounded-2xl"],
        .space-y-4 > div:nth-child(4n+1) [class*="border-l-4"] { background: #d42020 !important; }
        .space-y-4 > div:nth-child(4n+2) > [class*="rounded-2xl"] { background: #0057b8 !important; }
        .space-y-4 > div:nth-child(4n+3) > [class*="rounded-2xl"] { background: #00963e !important; }
        .space-y-4 > div:nth-child(4n+4) > [class*="rounded-2xl"] { background: #f6d832 !important; }

        .space-y-4 > div:nth-child(4n+1) h3,
        .space-y-4 > div:nth-child(4n+2) h3,
        .space-y-4 > div:nth-child(4n+3) h3,
        .space-y-4 > div:nth-child(4n+1) p,
        .space-y-4 > div:nth-child(4n+2) p,
        .space-y-4 > div:nth-child(4n+3) p,
        .space-y-4 > div:nth-child(4n+1) span,
        .space-y-4 > div:nth-child(4n+2) span,
        .space-y-4 > div:nth-child(4n+3) span { color: #fff !important; }

        /* Grid stat cards */
        .grid > div:nth-child(4n+1) [class*="rounded-2xl"] { background: #d42020 !important; }
        .grid > div:nth-child(4n+2) [class*="rounded-2xl"] { background: #0057b8 !important; }
        .grid > div:nth-child(4n+3) [class*="rounded-2xl"] { background: #00963e !important; }
        .grid > div:nth-child(4n+4) [class*="rounded-2xl"] { background: #f6d832 !important; }
        .grid > div:nth-child(4n+1) p, .grid > div:nth-child(4n+1) span,
        .grid > div:nth-child(4n+2) p, .grid > div:nth-child(4n+2) span,
        .grid > div:nth-child(4n+3) p, .grid > div:nth-child(4n+3) span { color: #fff !important; }

        /* Buttons = bright LEGO studs */
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #d42020 !important;
          border: 3px solid rgba(0,0,0,0.15) !important;
          border-radius: 8px !important;
          box-shadow: 3px 3px 0px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.25) !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }
        [class*="bg-indigo-600"]:hover, [class*="bg-indigo-700"]:hover {
          transform: translateY(1px) !important;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.25) !important;
        }

        /* Inner light backgrounds = white like LEGO baseplates */
        [class*="bg-gray-50"], [class*="bg-gray-100"], [class*="bg-slate-"] {
          background: rgba(255,255,255,0.85) !important;
          border-radius: 8px !important;
        }

        /* Tab bar active */
        [class*="border-b-2"][class*="border-indigo-600"] {
          border-color: #d42020 !important;
          color: #d42020 !important;
        }
      `}</style>}
      {activeTheme === 'cyberpunk' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');
        *, ::before, ::after { border-color: rgba(236,72,153,0.15) !important; }
        .min-h-screen {
          background: #030712 !important;
          background-image:
            linear-gradient(rgba(236,72,153,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236,72,153,0.03) 1px, transparent 1px) !important;
          background-size: 40px 40px !important;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #f9a8d4 !important;
          font-family: 'Orbitron', 'Courier New', monospace !important;
        }
        h1, h2, h3 {
          text-shadow: 0 0 10px rgba(236,72,153,0.5), 0 0 40px rgba(236,72,153,0.2) !important;
          text-transform: uppercase !important;
          letter-spacing: 2px !important;
        }
        input, select, textarea {
          background: rgba(3,7,18,0.9) !important;
          color: #f9a8d4 !important;
          border-color: rgba(236,72,153,0.3) !important;
          font-family: 'Orbitron', monospace !important;
        }
        input::placeholder { color: rgba(236,72,153,0.3) !important; }
        svg { color: #ec4899 !important; filter: drop-shadow(0 0 3px rgba(236,72,153,0.4)); }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: linear-gradient(135deg, #ec4899, #8b5cf6) !important;
        }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 2px !important; }
      `}</style>}
      {activeTheme === 'minimalist' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .min-h-screen { background: #ffffff !important; }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          font-family: 'Inter', system-ui, sans-serif !important;
          font-weight: 400 !important;
        }
        h1, h2, h3 { font-weight: 600 !important; letter-spacing: -0.02em !important; }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #1f2937 !important;
          border-radius: 6px !important;
        }
        .rounded-2xl { border-radius: 12px !important; }
      `}</style>}
      {activeTheme === 'academia' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        *, ::before, ::after { border-color: rgba(217,119,6,0.15) !important; }
        .min-h-screen {
          background: #1c1917 !important;
          background-image:
            url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E") !important;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #fef3c7 !important;
          font-family: 'Libre Baskerville', 'Georgia', serif !important;
        }
        h1, h2, h3 {
          color: #fbbf24 !important;
          letter-spacing: 0.5px !important;
        }
        input, select, textarea {
          background: rgba(28,25,23,0.9) !important;
          color: #fef3c7 !important;
          border-color: rgba(217,119,6,0.3) !important;
          font-family: 'Libre Baskerville', serif !important;
        }
        input::placeholder { color: rgba(254,243,199,0.3) !important; }
        svg { color: #d97706 !important; }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #92400e !important;
        }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"] {
          background: rgba(28,25,23,0.7) !important;
        }
      `}</style>}
      {activeTheme === 'retroterminal' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        *, ::before, ::after { border-color: rgba(245,158,11,0.15) !important; }
        .min-h-screen {
          background: #000 !important;
          background-image:
            repeating-linear-gradient(0deg, rgba(245,158,11,0.03) 0px, rgba(245,158,11,0.03) 1px, transparent 1px, transparent 3px),
            radial-gradient(ellipse at 50% 30%, rgba(80,50,0,0.35) 0%, transparent 70%) !important;
        }
        .min-h-screen::after {
          content: '';
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
          pointer-events: none; z-index: 9999;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #f59e0b !important;
          font-family: 'VT323', 'Courier New', monospace !important;
          text-shadow: 0 0 8px rgba(245,158,11,0.4), 0 0 2px rgba(245,158,11,0.2) !important;
          font-size: 1.05em !important;
        }
        input, select, textarea {
          background: rgba(20,10,0,0.8) !important;
          color: #f59e0b !important;
          border-color: rgba(245,158,11,0.3) !important;
          font-family: 'VT323', monospace !important;
          text-shadow: 0 0 5px rgba(245,158,11,0.3) !important;
          caret-color: #f59e0b !important;
        }
        input::placeholder { color: rgba(245,158,11,0.4) !important; }
        svg { color: #f59e0b !important; filter: drop-shadow(0 0 3px rgba(245,158,11,0.3)); }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 0 !important; }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: rgba(20,10,0,0.6) !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: rgba(180,100,0,0.3) !important;
          border: 1px solid rgba(245,158,11,0.4) !important;
        }
      `}</style>}
      {activeTheme === 'win95' && <style>{`
        .min-h-screen {
          background: #008080 !important;
        }
        *, ::before, ::after { border-color: #808080 !important; }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #000 !important;
          font-family: 'Segoe UI', Tahoma, 'MS Sans Serif', sans-serif !important;
          text-shadow: none !important;
        }
        [class*="bg-gradient-to-r"][class*="from-blue-800"] h1,
        [class*="bg-gradient-to-r"][class*="from-blue-800"] h2,
        [class*="bg-gradient-to-r"][class*="from-blue-800"] p,
        [class*="bg-gradient-to-r"][class*="from-blue-800"] span,
        header h1, header p { color: #fff !important; }
        input, select, textarea {
          background: #fff !important;
          color: #000 !important;
          border: 2px inset #bbb !important;
          border-radius: 0 !important;
          font-family: 'Segoe UI', Tahoma, sans-serif !important;
        }
        button {
          border-radius: 0 !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #c0c0c0 !important;
          color: #000 !important;
          border: 2px outset #fff !important;
          border-radius: 0 !important;
        }
        [class*="bg-indigo-600"]:active, [class*="bg-indigo-700"]:active {
          border: 2px inset #808080 !important;
        }
        .rounded-2xl, .rounded-xl, .rounded-lg, .rounded-full { border-radius: 0 !important; }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"] {
          background: #c0c0c0 !important;
        }
        svg { color: #000 !important; filter: none !important; }
      `}</style>}
      {activeTheme === 'gameboy' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .min-h-screen {
          background: #9bbc0f !important;
        }
        *, ::before, ::after { border-color: rgba(20,83,45,0.3) !important; }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #0f380f !important;
          font-family: 'Press Start 2P', 'Courier New', monospace !important;
          line-height: 2 !important;
          text-shadow: none !important;
        }
        h1 { font-size: 14px !important; }
        h2 { font-size: 12px !important; }
        h3 { font-size: 11px !important; }
        p, span, label, a, button, th, td, li, div { font-size: 10px !important; }
        input, select, textarea {
          background: #8bac0f !important;
          color: #0f380f !important;
          border: 2px solid #306230 !important;
          border-radius: 0 !important;
          font-family: 'Press Start 2P', monospace !important;
          font-size: 10px !important;
        }
        input::placeholder { color: #306230 !important; }
        svg { color: #0f380f !important; filter: none !important; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 0 !important; }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: #8bac0f !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #306230 !important;
          border-radius: 0 !important;
        }
      `}</style>}
      {activeTheme === 'blueprint' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
        *, ::before, ::after { border-color: rgba(147,197,253,0.2) !important; }
        .min-h-screen {
          background: #0c1e3a !important;
          background-image:
            linear-gradient(rgba(96,165,250,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,0.06) 1px, transparent 1px) !important;
          background-size: 20px 20px !important;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #bfdbfe !important;
          font-family: 'Courier Prime', 'Courier New', monospace !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }
        h1, h2, h3 {
          color: #93c5fd !important;
          text-shadow: 0 0 10px rgba(96,165,250,0.3) !important;
        }
        input, select, textarea {
          background: rgba(12,30,58,0.9) !important;
          color: #bfdbfe !important;
          border: 1px solid rgba(96,165,250,0.3) !important;
          font-family: 'Courier Prime', monospace !important;
          border-radius: 0 !important;
        }
        input::placeholder { color: rgba(191,219,254,0.3) !important; }
        svg { color: #60a5fa !important; filter: drop-shadow(0 0 2px rgba(96,165,250,0.3)); }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 0 !important; }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: rgba(12,30,58,0.7) !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: rgba(37,99,235,0.4) !important;
          border: 1px solid rgba(96,165,250,0.4) !important;
          border-radius: 0 !important;
        }
      `}</style>}
      {activeTheme === 'space' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&display=swap');
        *, ::before, ::after { border-color: rgba(139,92,246,0.15) !important; }
        .min-h-screen {
          background: #030712 !important;
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 10% 80%, rgba(139,92,246,0.7) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 70% 90%, rgba(236,72,153,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 100%),
            radial-gradient(ellipse at 30% 80%, rgba(139,92,246,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 20%, rgba(59,130,246,0.06) 0%, transparent 50%) !important;
        }
        h1, h2, h3, h4, h5, h6, p, span, label, a, button, th, td, li, div {
          color: #ddd6fe !important;
          font-family: 'Exo 2', 'Segoe UI', sans-serif !important;
        }
        h1, h2, h3 {
          color: #c4b5fd !important;
          text-shadow: 0 0 15px rgba(139,92,246,0.3) !important;
          letter-spacing: 1px !important;
        }
        input, select, textarea {
          background: rgba(3,7,18,0.9) !important;
          color: #ddd6fe !important;
          border-color: rgba(139,92,246,0.3) !important;
          font-family: 'Exo 2', sans-serif !important;
        }
        input::placeholder { color: rgba(221,214,254,0.3) !important; }
        svg { color: #8b5cf6 !important; filter: drop-shadow(0 0 3px rgba(139,92,246,0.3)); }
        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: rgba(3,7,18,0.7) !important;
        }
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
        }
      `}</style>}
      {activeTheme === 'consul' && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .min-h-screen {
          background: #e8e0d4 !important;
          background-image:
            url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E"),
            repeating-linear-gradient(0deg, transparent 0px, transparent 39px, rgba(120,80,50,0.04) 39px, rgba(120,80,50,0.04) 40px) !important;
        }
        *, ::before, ::after { border-color: rgba(120,80,50,0.2) !important; }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Cinzel', 'Trajan Pro', serif !important;
          color: #7f1d1d !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 4px !important;
          text-shadow: none !important;
        }
        h1 { letter-spacing: 6px !important; }
        p, span, label, a, button, th, td, li, div {
          font-family: 'Cormorant Garamond', 'Palatino Linotype', serif !important;
          color: #44403c !important;
          font-size: 1.05em !important;
          text-shadow: none !important;
        }
        header h1, header p, header span, header div { color: #fef3c7 !important; }
        input, select, textarea {
          background: rgba(232,224,212,0.7) !important;
          color: #44403c !important;
          border: 1px solid rgba(120,80,50,0.25) !important;
          border-radius: 0 !important;
          font-family: 'Cormorant Garamond', serif !important;
          font-size: 1.05em !important;
        }
        input::placeholder { color: rgba(68,64,60,0.4) !important; font-style: italic !important; }
        svg { color: #7f1d1d !important; filter: none !important; }
        .rounded-2xl, .rounded-xl, .rounded-lg { border-radius: 0 !important; }

        /* Cards = marble tablets */
        [class*="rounded-2xl"], [class*="shadow-md"] {
          background: linear-gradient(180deg, #f5f0e8 0%, #e8e0d4 100%) !important;
          border: 1px solid rgba(120,80,50,0.15) !important;
          border-top: 3px solid #7f1d1d !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
          border-radius: 0 !important;
        }

        [class*="bg-gray-"], [class*="bg-slate-"], [class*="bg-white"],
        [class*="bg-blue-50"], [class*="bg-purple-50"], [class*="bg-emerald-50"],
        [class*="bg-amber-50"], [class*="bg-rose-50"], [class*="bg-cyan-50"],
        [class*="bg-green-50"], [class*="bg-indigo-50"] {
          background: rgba(232,224,212,0.5) !important;
        }

        /* Buttons = imperial red */
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #7f1d1d !important;
          border: 1px solid rgba(120,80,50,0.3) !important;
          border-radius: 0 !important;
          letter-spacing: 2px !important;
          text-transform: uppercase !important;
        }

        /* Tab active = deep red underline */
        [class*="border-b-2"][class*="border-indigo-600"] {
          border-color: #7f1d1d !important;
        }

        /* Laurel wreath divider — subtle top border accent on cards */
        .space-y-4 > div:first-child [class*="rounded-2xl"] {
          border-top: 4px double #7f1d1d !important;
        }
      `}</style>}
      {activeTheme === 'pokemon' && !darkMode && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
        .min-h-screen {
          background: #dc2626 !important;
          background-image:
            radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.06) 55%, transparent 55%),
            linear-gradient(180deg, #dc2626 0%, #dc2626 48%, #1f2937 48%, #1f2937 52%, #f5f5f4 52%, #f5f5f4 100%) !important;
          background-size: 100% 100% !important;
          background-attachment: fixed !important;
        }
        *, ::before, ::after { border-color: rgba(31,41,55,0.25) !important; }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Poppins', Arial, sans-serif !important;
          color: #1f2937 !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          text-shadow: none !important;
        }
        header h1, header p, header span, header div { color: #fff !important; }
        p, span, label, a, button, th, td, li, div {
          font-family: 'Poppins', Arial, sans-serif !important;
          color: #374151 !important;
          text-shadow: none !important;
        }
        input, select, textarea {
          background: #fff !important;
          color: #1f2937 !important;
          border: 2px solid #d1d5db !important;
          border-radius: 10px !important;
          font-family: 'Poppins', sans-serif !important;
        }
        input::placeholder { color: rgba(31,41,55,0.35) !important; }
        svg { color: #1f2937 !important; filter: none !important; }

        /* Cards = Pokédex panels */
        [class*="rounded-2xl"], [class*="shadow-"] {
          background: #fff !important;
          border: 3px solid #1f2937 !important;
          border-radius: 14px !important;
          box-shadow: 3px 3px 0px rgba(0,0,0,0.25) !important;
        }

        /* Stat cards cycle through type colors */
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] { background: #ef4444 !important; border-color: #b91c1c !important; }
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] { background: #3b82f6 !important; border-color: #1d4ed8 !important; }
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] { background: #22c55e !important; border-color: #15803d !important; }
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] { background: #eab308 !important; border-color: #a16207 !important; }
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] { background: #a855f7 !important; border-color: #7e22ce !important; }
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] { background: #06b6d4 !important; border-color: #0e7490 !important; }
        /* White text only inside colored stat cards, not all grids */
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] svg { color: #fff !important; }

        /* Inner panels = light gray like Pokédex screen */
        [class*="bg-gray-50"], [class*="bg-gray-100"], [class*="bg-slate-"] {
          background: #f0fdf4 !important;
          border: 2px solid #d1d5db !important;
          border-radius: 10px !important;
        }

        /* Buttons = Pokéball red */
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: #dc2626 !important;
          border: 3px solid #1f2937 !important;
          border-radius: 25px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.2) !important;
        }
        [class*="bg-indigo-600"] span, [class*="bg-indigo-600"] svg,
        [class*="bg-indigo-700"] span, [class*="bg-indigo-700"] svg { color: #fff !important; }

        /* Tab active = red */
        [class*="border-b-2"][class*="border-indigo-600"] {
          border-color: #dc2626 !important;
        }

        /* Progress bars = rounder */
        [class*="rounded-full"] { border-radius: 9999px !important; }
      `}</style>}

      {/* Master Ball dark mode variant */}
      {activeTheme === 'pokemon' && darkMode && <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap');
        .min-h-screen {
          background: #2d1b4e !important;
          background-image:
            radial-gradient(circle at 50% 50%, transparent 45%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.12) 55%, transparent 55%),
            linear-gradient(180deg, #7b2d8e 0%, #6b21a8 48%, #1a1a2e 48%, #1a1a2e 52%, #2d1b4e 52%, #2d1b4e 100%) !important;
          background-size: 100% 100% !important;
          background-attachment: fixed !important;
        }
        *, ::before, ::after { border-color: rgba(168,85,247,0.3) !important; }
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Poppins', Arial, sans-serif !important;
          color: #e9d5ff !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          text-shadow: 0 0 12px rgba(168,85,247,0.4) !important;
        }
        header h1, header p, header span, header div { color: #fff !important; text-shadow: 0 0 15px rgba(217,70,239,0.5) !important; }
        p, span, label, a, button, th, td, li, div {
          font-family: 'Poppins', Arial, sans-serif !important;
          color: #d8b4fe !important;
          text-shadow: none !important;
        }
        input, select, textarea {
          background: #1e1233 !important;
          color: #e9d5ff !important;
          border: 2px solid #7c3aed !important;
          border-radius: 10px !important;
          font-family: 'Poppins', sans-serif !important;
        }
        input::placeholder { color: rgba(216,180,254,0.35) !important; }
        svg { color: #d8b4fe !important; filter: none !important; }

        /* Cards = Master Ball dark panels */
        [class*="rounded-2xl"], [class*="shadow-"] {
          background: #1e1233 !important;
          border: 3px solid #7c3aed !important;
          border-radius: 14px !important;
          box-shadow: 3px 3px 0px rgba(124,58,237,0.3), 0 0 15px rgba(168,85,247,0.15) !important;
        }

        /* Stat cards cycle through purple/magenta type colors */
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] { background: #7c3aed !important; border-color: #6d28d9 !important; }
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] { background: #d946ef !important; border-color: #c026d3 !important; }
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] { background: #8b5cf6 !important; border-color: #7c3aed !important; }
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] { background: #ec4899 !important; border-color: #db2777 !important; }
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] { background: #6366f1 !important; border-color: #4f46e5 !important; }
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] { background: #a855f7 !important; border-color: #9333ea !important; }
        /* White text inside colored stat cards */
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+1) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+2) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+3) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+4) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+5) [class*="rounded-2xl"] svg,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] p,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] span,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] h1,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] h2,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] h3,
        .grid > div:nth-child(6n+6) [class*="rounded-2xl"] svg { color: #fff !important; }

        /* Inner panels = deep purple */
        [class*="bg-gray-50"], [class*="bg-gray-100"], [class*="bg-slate-"], [class*="bg-white"] {
          background: #150d27 !important;
          border: 2px solid #6d28d9 !important;
          border-radius: 10px !important;
        }

        /* Buttons = Master Ball magenta */
        [class*="bg-indigo-600"], [class*="bg-indigo-700"] {
          background: linear-gradient(135deg, #9333ea, #d946ef) !important;
          border: 3px solid #1a1a2e !important;
          border-radius: 25px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.3), 0 0 10px rgba(217,70,239,0.3) !important;
        }
        [class*="bg-indigo-600"] span, [class*="bg-indigo-600"] svg,
        [class*="bg-indigo-700"] span, [class*="bg-indigo-700"] svg { color: #fff !important; }

        /* Tab active = magenta */
        [class*="border-b-2"][class*="border-indigo-600"] {
          border-color: #d946ef !important;
        }

        /* Table styling */
        table, thead, tbody, tr { background: transparent !important; border-color: rgba(124,58,237,0.3) !important; }
        th { color: #c4b5fd !important; background: rgba(124,58,237,0.15) !important; }
        td { color: #d8b4fe !important; }

        /* Progress bars = rounder + purple glow */
        [class*="rounded-full"] { border-radius: 9999px !important; }
        [class*="bg-indigo-600"][class*="rounded-full"] {
          background: linear-gradient(90deg, #9333ea, #d946ef) !important;
          box-shadow: 0 0 8px rgba(217,70,239,0.4) !important;
        }

        /* Master Ball M insignia shimmer on header */
        header::after {
          content: 'M';
          position: absolute;
          top: 50%;
          right: 120px;
          transform: translateY(-50%);
          font-family: 'Poppins', sans-serif;
          font-size: 28px;
          font-weight: 900;
          color: rgba(217,70,239,0.25);
          text-shadow: 0 0 20px rgba(217,70,239,0.3);
          pointer-events: none;
        }
      `}</style>}

      {/* Tutorial Overlay */}
      {showTutorial && tutorialSteps[tutorialStep] && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowTutorial(false)}>
          <div className={`max-w-md w-full ${dm('bg-white', 'bg-slate-800')} rounded-2xl shadow-2xl p-6 relative`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowTutorial(false)} className={`absolute top-3 right-3 ${dm('text-gray-400 hover:text-gray-600', 'text-gray-500 hover:text-gray-300')} transition`}><X size={18} /></button>
            <div className="text-center mb-4">
              <span className="text-3xl mb-2 block">{(() => { const icons = { dashboard: "📊", planner: "📋", bills: "📅", savings: "🐷", expenses: "💰", debt: "💳", networth: "🏦", flow: "📈", wishlist: "⭐", calendar: "🗓️" }; return icons[tutorialSteps[tutorialStep].tab] || "📖"; })()}</span>
              <p className={`text-xs font-semibold uppercase tracking-wider ${dm('text-indigo-600', 'text-indigo-400')} mb-1`}>Step {tutorialStep + 1} of {tutorialSteps.length}</p>
              <h3 className={`text-xl font-bold ${dm('text-gray-900', 'text-white')}`}>{tutorialSteps[tutorialStep].title}</h3>
            </div>
            <p className={`text-sm leading-relaxed ${dm('text-gray-600', 'text-gray-300')} mb-6`}>{tutorialSteps[tutorialStep].desc}</p>
            <div className="flex items-center justify-between">
              <button onClick={() => { if (tutorialStep > 0) { setTutorialStep(tutorialStep - 1); setTab(tutorialSteps[tutorialStep - 1].tab); } }}
                disabled={tutorialStep === 0}
                className={`text-sm flex items-center gap-1 ${tutorialStep === 0 ? 'text-gray-300 cursor-not-allowed' : dm('text-gray-500 hover:text-gray-700', 'text-gray-400 hover:text-gray-200')} transition`}>
                <ChevronLeft size={16} /> Back
              </button>
              <div className="flex gap-1">
                {tutorialSteps.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition ${i === tutorialStep ? 'bg-indigo-500' : dm('bg-gray-200', 'bg-slate-600')}`} />)}
              </div>
              {tutorialStep < tutorialSteps.length - 1 ? (
                <button onClick={() => { setTutorialStep(tutorialStep + 1); setTab(tutorialSteps[tutorialStep + 1].tab); }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={() => setShowTutorial(false)}
                  className="text-sm font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                  Done!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
          {/* Cloud Sync + Dark mode + Settings */}
          <div className="flex items-center gap-2">
            {firebaseEnabled && (
              fbUser ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={forceSync} title={`Synced as ${fbUser.email}${lastSyncTime ? ' • Last: ' + lastSyncTime.toLocaleTimeString() : ''}`}
                    className={`p-1.5 rounded-lg transition ${syncStatus === 'syncing' ? 'animate-pulse' : ''} ${dm('hover:bg-gray-100', 'hover:bg-slate-700')}`}>
                    {syncStatus === 'error' ? <AlertCircle size={18} className="text-red-500" /> :
                     syncStatus === 'syncing' ? <RefreshCw size={18} className={`${dm('text-indigo-500', 'text-indigo-400')} animate-spin`} /> :
                     <Cloud size={18} className={`${dm('text-green-500', 'text-green-400')}`} />}
                  </button>
                  <button onClick={signOutUser} title="Sign out" className={`p-1.5 rounded-lg transition ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')}`}>
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={signInWithGoogle} title="Sign in to sync across devices"
                  className={`p-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-medium ${dm('hover:bg-gray-100 text-gray-500', 'hover:bg-slate-700 text-slate-400')}`}>
                  <Cloud size={18} /> <span className="hidden sm:inline">Sync</span>
                </button>
              )
            )}
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
                  <p className={`px-3 py-1 text-[10px] font-semibold uppercase ${dm('text-gray-400', 'text-gray-500')}`}>CSV</p>
                  <button onClick={handleCsvExport} className={`w-full text-left px-3 py-1.5 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-gray-100 text-gray-700', 'hover:bg-slate-700 text-slate-100')}`}>
                    <Download size={12} /> Export CSV (Current Month)
                  </button>
                  <label className={`w-full text-left px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer text-xs transition ${dm('hover:bg-gray-100 text-gray-700', 'hover:bg-slate-700 text-slate-100')}`}>
                    <Upload size={12} /> Import CSV
                    <input type="file" accept=".csv" onChange={handleCsvImport} className="hidden" />
                  </label>
                </div>
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
                  <button onClick={() => setShowBadges(!showBadges)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-gray-100 text-gray-600', 'hover:bg-slate-700 text-slate-300')}`}>
                    {showBadges ? '🔔' : '🔕'} Notification Badges {showBadges ? 'On' : 'Off'}
                  </button>
                  <button onClick={() => setTabOrder(null)}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-gray-100 text-gray-600', 'hover:bg-slate-700 text-slate-300')}`}>
                    ↻ Reset Tab Order
                  </button>
                </div>
                <div className={`border-t ${dm('border-gray-100', 'border-slate-700')} my-1 pt-1`}>
                  <button onClick={() => { setOnboardingStep(1); setShowOnboarding(true); }}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-gray-100 text-gray-600', 'hover:bg-slate-700 text-slate-300')}`}>
                    👋 Run Setup Wizard
                  </button>
                  <button onClick={() => { setShowTutorial(true); setTutorialStep(0); setTab("dashboard"); }}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-gray-100 text-gray-600', 'hover:bg-slate-700 text-slate-300')}`}>
                    📖 App Tutorial
                  </button>
                  <button onClick={() => { if (window.confirm("Are you sure? This will erase ALL your budget data and start fresh. This cannot be undone.")) { localStorage.removeItem("maverick-finance-data"); window.location.reload(); }}}
                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition ${dm('hover:bg-red-50 text-red-600', 'hover:bg-red-900/30 text-red-400')}`}>
                    🔄 Reset All Data
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
              <div className="mt-2 max-h-80 overflow-y-auto space-y-1">
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
          {orderedTabs.map((t, idx) => {
            const Icon = t.icon;
            const active = tab === t.id;
            const handleDragStart = (e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('tabId', t.id);
              e.dataTransfer.setData('tabIdx', idx);
            };
            const handleDragOver = (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            };
            const handleDrop = (e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer.getData('tabId');
              const draggedIdx = parseInt(e.dataTransfer.getData('tabIdx'));
              if (draggedId === t.id) return;
              const newOrder = [...orderedTabs];
              newOrder.splice(draggedIdx, 1);
              newOrder.splice(idx, 0, orderedTabs[draggedIdx]);
              setTabOrder(newOrder.map(tab => tab.id));
            };
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                draggable onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                className={`relative flex items-center gap-1 px-2.5 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-move hover:opacity-70 ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                <Icon size={14} />{t.label}
                {tabBadges[t.id] && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5" />}
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

            {/* Feature 3: Dashboard Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => { setExpDraft({ description: "", amount: "", category: "Other", date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0")}`, merchant: "" }); setTab("expenses"); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${dm('bg-white border-indigo-200 hover:bg-indigo-50 text-indigo-700', 'bg-slate-800 border-indigo-600/50 hover:bg-slate-700 text-indigo-300')}`}>
                <DollarSign size={20} />
                <span className="text-xs font-semibold">+ Expense</span>
              </button>
              <button onClick={() => { setIncomeDraft({ name: "", amount: "", frequency: "biweekly", referenceDate: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01` }); setTab("planner"); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${dm('bg-white border-emerald-200 hover:bg-emerald-50 text-emerald-700', 'bg-slate-800 border-emerald-600/50 hover:bg-slate-700 text-emerald-300')}`}>
                <TrendingUp size={20} />
                <span className="text-xs font-semibold">+ Income</span>
              </button>
              <button onClick={() => { setBillDraft({ name: "", amount: "", dueDay: 1, category: "Utilities" }); setTab("bills"); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${dm('bg-white border-rose-200 hover:bg-rose-50 text-rose-700', 'bg-slate-800 border-rose-600/50 hover:bg-slate-700 text-rose-300')}`}>
                <Calendar size={20} />
                <span className="text-xs font-semibold">+ Bill</span>
              </button>
              <button onClick={() => { setGoalDraft({ name: "", target: "", saved: 0, monthlyContribution: "" }); setTab("savings"); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${dm('bg-white border-amber-200 hover:bg-amber-50 text-amber-700', 'bg-slate-800 border-amber-600/50 hover:bg-slate-700 text-amber-300')}`}>
                <PiggyBank size={20} />
                <span className="text-xs font-semibold">+ Goal</span>
              </button>
            </div>

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
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Expenses — {monthLabel(viewYear, viewMonth)}</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowTemplates(!showTemplates)} className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition ${dm('bg-purple-100 text-purple-700 hover:bg-purple-200', 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50')}`}>
                  <Copy size={16} /> Templates
                </button>
                <button onClick={() => setExpDraft({ description: "", amount: "", category: "Other", date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0")}`, merchant: "" })}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                  <Plus size={16} /> Add Expense
                </button>
              </div>
            </div>

            {/* Feature 3: Expense Templates Panel */}
            {showTemplates && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="mb-4 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Saved Templates</h3>
                  <button onClick={() => setShowTemplates(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>
                {expenseTemplates.length === 0 ? (
                  <p className={`text-xs text-center py-3 ${dm('text-gray-500', 'text-gray-400')}`}>No templates saved yet. Save an expense as a template to get started.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {expenseTemplates.map(t => (
                      <div key={t.id} className={`p-2.5 rounded-lg border ${dm('bg-purple-50 border-purple-200 hover:bg-purple-100', 'bg-purple-900/20 border-purple-700 hover:bg-purple-900/40')} transition cursor-pointer group`}>
                        <div onClick={() => { setExpDraft({ ...t, id: null, date: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate())).padStart(2, "0")}` }); setShowTemplates(false); }}>
                          <p className={`text-xs font-medium ${dm('text-gray-800', 'text-gray-100')}`}>{t.description}</p>
                          <p className={`text-xs ${dm('text-gray-600', 'text-gray-400')}`}>{t.merchant || t.category}</p>
                          <p className={`text-xs font-bold mt-1 ${dm('text-purple-700', 'text-purple-300')}`}>{fmt(t.amount)}</p>
                        </div>
                        <button onClick={() => setExpenseTemplates(expenseTemplates.filter(x => x.id !== t.id))} className={`mt-1.5 w-full text-xs px-2 py-1 rounded ${dm('bg-rose-100 text-rose-600 hover:bg-rose-200', 'bg-rose-900/30 text-rose-400 hover:bg-rose-900/50')} opacity-0 group-hover:opacity-100 transition`}>
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

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
                  <div className="flex gap-2 items-center">
                    <button onClick={() => { if (expDraft.description && expDraft.amount && (expDraft.category !== "Savings" || expDraft.goalId)) addExpense({ ...expDraft, amount: +expDraft.amount }); }}
                      className="flex-1 bg-indigo-600 text-white rounded-lg text-sm font-medium py-2 hover:bg-indigo-700 transition flex items-center justify-center gap-1"><Check size={14} /> Save</button>
                    <button onClick={() => { if (expDraft.description && expDraft.amount) { setExpenseTemplates([...expenseTemplates, { ...expDraft, id: uid(), amount: +expDraft.amount }]); } }} className="text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap">Save as Template</button>
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

            {/* Snowball vs Avalanche - Interactive */}
            {debtStrategies && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Payoff Strategy</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setDebtStrategy('avalanche')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${debtStrategy === 'avalanche' ? dm('bg-cyan-100 text-cyan-700', 'bg-cyan-900/40 text-cyan-300') : dm('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-slate-700 text-gray-400 hover:bg-slate-600')}`}>
                        Avalanche
                      </button>
                      <button onClick={() => setDebtStrategy('snowball')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${debtStrategy === 'snowball' ? dm('bg-amber-100 text-amber-700', 'bg-amber-900/40 text-amber-300') : dm('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-slate-700 text-gray-400 hover:bg-slate-600')}`}>
                        Snowball
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border-2 ${debtStrategy === 'avalanche' ? dm('border-cyan-200 bg-cyan-50/50', 'border-cyan-700 bg-cyan-950/20') : dm('border-amber-200 bg-amber-50/50', 'border-amber-700 bg-amber-950/20')}`}>
                      <h4 className={`text-sm font-bold mb-2 ${debtStrategy === 'avalanche' ? dm('text-cyan-700', 'text-cyan-300') : dm('text-amber-700', 'text-amber-300')}`}>
                        {debtStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'} <span className="text-xs font-normal">{debtStrategy === 'avalanche' ? '(highest rate first)' : '(smallest balance first)'}</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Payoff time</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{Math.floor(debtStrategies[debtStrategy].months / 12)}y {debtStrategies[debtStrategy].months % 12}m</span></div>
                        <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total interest</span><span className="font-bold text-rose-500">{fmt(debtStrategies[debtStrategy].totalInterest)}</span></div>
                        <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total paid</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{fmt(debtStrategies[debtStrategy].totalPaid)}</span></div>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border-2 ${debtStrategy === 'avalanche' ? dm('border-amber-200 bg-amber-50/50', 'border-amber-700 bg-amber-950/20') : dm('border-cyan-200 bg-cyan-50/50', 'border-cyan-700 bg-cyan-950/20')}`}>
                      <h4 className={`text-sm font-bold mb-2 ${debtStrategy === 'avalanche' ? dm('text-amber-700', 'text-amber-300') : dm('text-cyan-700', 'text-cyan-300')}`}>
                        {debtStrategy === 'avalanche' ? 'Snowball' : 'Avalanche'} <span className="text-xs font-normal">{debtStrategy === 'avalanche' ? '(smallest balance first)' : '(highest rate first)'}</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Payoff time</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{Math.floor(debtStrategies[debtStrategy === 'avalanche' ? 'snowball' : 'avalanche'].months / 12)}y {debtStrategies[debtStrategy === 'avalanche' ? 'snowball' : 'avalanche'].months % 12}m</span></div>
                        <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total interest</span><span className="font-bold text-rose-500">{fmt(debtStrategies[debtStrategy === 'avalanche' ? 'snowball' : 'avalanche'].totalInterest)}</span></div>
                        <div className="flex justify-between"><span className={dm('text-gray-600', 'text-gray-400')}>Total paid</span><span className={`font-bold ${dm('text-gray-900', 'text-white')}`}>{fmt(debtStrategies[debtStrategy === 'avalanche' ? 'snowball' : 'avalanche'].totalPaid)}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${dm('bg-indigo-50 border border-indigo-200', 'bg-indigo-950/20 border border-indigo-700')}`}>
                    <h5 className={`text-xs font-semibold ${dm('text-indigo-700', 'text-indigo-300')} mb-2`}>Payoff Order ({debtStrategy === 'avalanche' ? 'Highest Rate First' : 'Smallest Balance First'})</h5>
                    <div className="space-y-1">
                      {debtStrategies[debtStrategy].payoffOrder.length > 0 ? (
                        debtStrategies[debtStrategy].payoffOrder.map((item, idx) => {
                          const debt = debts.find(d => d.id === item.id);
                          return debt ? (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${dm('bg-indigo-600', 'bg-indigo-500')}`}>{idx + 1}</span>
                              <span className={`flex-1 ${dm('text-gray-700', 'text-gray-200')}`}>{debt.name}</span>
                              <span className={`font-medium ${dm('text-gray-600', 'text-gray-400')}`}>{fmt(debt.balance)} @ {debt.rate}%</span>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>No debts yet</p>
                      )}
                    </div>
                  </div>

                  {debtStrategies.avalanche.totalInterest < debtStrategies.snowball.totalInterest && (
                    <p className={`text-xs ${dm('text-cyan-600', 'text-cyan-400')} font-medium`}>
                      💡 Avalanche saves you {fmt(debtStrategies.snowball.totalInterest - debtStrategies.avalanche.totalInterest)} in interest!
                    </p>
                  )}
                </div>
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

        {/* ═══════ CASH FLOW TAB ═══════ */}
        {tab === "flow" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Cash Flow Projection</h2>
              <div className="flex items-center gap-1.5">
                {[30, 60, 90].map(d => (
                  <button key={d} onClick={() => setCashFlowRange(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${cashFlowRange === d ? dm('bg-indigo-100 text-indigo-700', 'bg-indigo-900/40 text-indigo-300') : dm('bg-gray-100 text-gray-500 hover:bg-gray-200', 'bg-slate-700 text-gray-400 hover:bg-slate-600')}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Balance */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')}`}>Starting Balance (today)</h3>
                  <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>Enter your current checking/cash balance for accurate projections</p>
                </div>
                {editingStartBal ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-sm ${dm('text-gray-400', 'text-gray-500')}`}>$</span>
                      <input type="number" autoFocus value={cashFlowStartBal || ''} onChange={(e) => setCashFlowStartBal(+e.target.value || 0)}
                        className={`w-28 pl-6 pr-2 py-1.5 border rounded-lg text-sm ${dm('border-gray-200', 'bg-slate-700 border-slate-600 text-white')} focus:outline-none focus:ring-2 focus:ring-indigo-500`} />
                    </div>
                    <button onClick={() => setEditingStartBal(false)} className="text-indigo-600 hover:text-indigo-700"><Check size={16} /></button>
                  </div>
                ) : (
                  <button onClick={() => setEditingStartBal(true)} className={`text-lg font-bold ${dm('text-gray-900', 'text-white')} hover:opacity-70 transition`}>
                    {fmt(cashFlowStartBal)}
                  </button>
                )}
              </div>
            </Card>

            {/* Projected Cash Flow Chart */}
            {(() => {
              const startDate = new Date();
              startDate.setHours(0, 0, 0, 0);
              const days = cashFlowRange;
              const events = [];

              // Generate all income events for the range
              for (let d = 0; d < days; d++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + d);
                const y = date.getFullYear();
                const m = date.getMonth();
                const dayOfMonth = date.getDate();
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;

                // Paychecks
                incomeSources.forEach(src => {
                  const payDates = generatePayDates(src, y, m);
                  payDates.forEach(pd => {
                    if (pd.getFullYear() === y && pd.getMonth() === m && pd.getDate() === dayOfMonth) {
                      events.push({ date: dateStr, day: d, amount: src.amount, type: 'income', label: src.name });
                    }
                  });
                });

                // Bills
                bills.forEach(b => {
                  const dueDay = Math.min(b.dueDay, new Date(y, m + 1, 0).getDate());
                  if (dayOfMonth === dueDay) {
                    events.push({ date: dateStr, day: d, amount: -b.amount, type: 'bill', label: b.name });
                  }
                });

                // Debt payments
                debts.forEach(dt => {
                  const dueDay = Math.min(dt.dueDay || 1, new Date(y, m + 1, 0).getDate());
                  if (dayOfMonth === dueDay) {
                    events.push({ date: dateStr, day: d, amount: -(dt.minPayment + dt.extraPayment), type: 'debt', label: dt.name });
                  }
                });

                // Savings contributions (assume 1st of month)
                if (dayOfMonth === 1) {
                  goals.forEach(g => {
                    if (g.monthlyContribution > 0) {
                      events.push({ date: dateStr, day: d, amount: -g.monthlyContribution, type: 'savings', label: g.name });
                    }
                  });
                }

                // Subscriptions
                (subscriptions || []).filter(s => s && s.active).forEach(sub => {
                  const nextDate = sub.nextBillDate ? new Date(sub.nextBillDate + 'T12:00:00') : null;
                  if (nextDate) {
                    const interval = sub.frequency === 'yearly' ? 365 : sub.frequency === 'quarterly' ? 91 : sub.frequency === 'weekly' ? 7 : 30;
                    let cursor = new Date(nextDate);
                    while (cursor < startDate) cursor.setDate(cursor.getDate() + interval);
                    if (cursor.getFullYear() === y && cursor.getMonth() === m && cursor.getDate() === dayOfMonth) {
                      events.push({ date: dateStr, day: d, amount: -sub.amount, type: 'sub', label: sub.name });
                    }
                  }
                });
              }

              // Build daily balance data
              const chartData = [];
              let runningBal = cashFlowStartBal;
              let lowestBal = cashFlowStartBal;
              let lowestDay = '';
              let totalIn = 0;
              let totalOut = 0;

              for (let d = 0; d < days; d++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + d);
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                const dayEvents = events.filter(e => e.day === d);
                let dayIn = 0, dayOut = 0;
                dayEvents.forEach(e => {
                  if (e.amount > 0) dayIn += e.amount;
                  else dayOut += Math.abs(e.amount);
                });

                runningBal += dayIn - dayOut;
                totalIn += dayIn;
                totalOut += dayOut;

                if (runningBal < lowestBal) { lowestBal = runningBal; lowestDay = dayLabel; }

                chartData.push({
                  date: dayLabel,
                  balance: Math.round(runningBal * 100) / 100,
                  income: dayIn > 0 ? dayIn : undefined,
                  expense: dayOut > 0 ? dayOut : undefined,
                });
              }

              const endBal = runningBal;
              const netChange = endBal - cashFlowStartBal;

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={TrendingUp} label="Total Income" value={fmt(totalIn)} sub={`Next ${days} days`} color="green" />
                    <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={TrendingDown} label="Total Outflow" value={fmt(totalOut)} sub={`Next ${days} days`} color="rose" />
                    <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Target} label="Projected End" value={fmt(endBal)} sub={netChange >= 0 ? `+${fmt(netChange)}` : fmt(netChange)} color={netChange >= 0 ? "green" : "rose"} />
                    <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={AlertCircle} label="Lowest Point" value={fmt(lowestBal)} sub={lowestDay || 'Today'} color={lowestBal < 0 ? "rose" : "amber"} />
                  </div>

                  {/* Balance Over Time Chart */}
                  <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                    <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Projected Balance — Next {days} Days</h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" fontSize={10} tickLine={false} interval={Math.floor(days / 6)} />
                        <YAxis tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} fontSize={10} tickLine={false} />
                        <Tooltip formatter={(v, name) => [fmt(v), name === 'balance' ? 'Balance' : name === 'income' ? 'Income' : 'Expense']} />
                        <Area type="monotone" dataKey="balance" stroke="#6366f1" fill="url(#cfGrad)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    {lowestBal < 0 && (
                      <div className={`mt-3 p-3 rounded-lg ${dm('bg-rose-50 border border-rose-200', 'bg-rose-950/30 border border-rose-800/30')}`}>
                        <p className={`text-xs font-semibold ${dm('text-rose-700', 'text-rose-400')}`}>⚠️ Warning: Balance goes negative around {lowestDay}</p>
                        <p className={`text-[10px] ${dm('text-rose-500', 'text-rose-500')}`}>You may need to adjust spending or move money before that date.</p>
                      </div>
                    )}
                  </Card>

                  {/* Upcoming Events List */}
                  <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                    <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Upcoming Events (Next 30 Days)</h3>
                    {events.filter(e => e.day < 30).length === 0 ? (
                      <p className={`text-sm text-center py-4 ${dm('text-gray-400', 'text-gray-500')}`}>No scheduled events. Add income, bills, or debts to see projections.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-72 overflow-y-auto">
                        {events.filter(e => e.day < 30).sort((a, b) => a.day - b.day).map((e, i) => (
                          <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${dm('bg-gray-50', 'bg-slate-700/30')}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${e.amount > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <div>
                                <p className={`text-sm font-medium ${dm('text-gray-700', 'text-gray-300')}`}>{e.label}</p>
                                <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>{e.date} · {e.type}</p>
                              </div>
                            </div>
                            <span className={`text-sm font-semibold ${e.amount > 0 ? 'text-emerald-500' : dm('text-gray-700', 'text-gray-300')}`}>
                              {e.amount > 0 ? '+' : '-'}{fmt(Math.abs(e.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              );
            })()}

            {/* Money Flow Sankey (existing) */}
            <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mt-2`}>Monthly Money Flow — {monthLabel(viewYear, viewMonth)}</h3>
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
        {tab === "insights" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')} flex items-center gap-2`}><Eye size={20} className="text-amber-500" /> Spending Insights</h2>
              <span className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>{monthLabel(viewYear, viewMonth)}</span>
            </div>

            {/* Monthly Report Card — 50/30/20 */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Monthly Report Card</h3>
              {(() => {
                const subs = Array.isArray(subscriptions) ? subscriptions : [];
                const subsCost = subs.filter(s => s && s.active).reduce((sum, s) => sum + (s.frequency === 'yearly' ? (s.amount || 0) / 12 : s.frequency === 'weekly' ? (s.amount || 0) * 4.33 : s.frequency === 'quarterly' ? (s.amount || 0) / 3 : (s.amount || 0)), 0);
                const fixedCosts = totalBills + debts.reduce((s, d) => s + (d.minPayment || 0) + (d.extraPayment || 0), 0) + subsCost;
                const discretionaryTotal = (manualExpenses || []).reduce((s, e) => s + (e.amount || 0), 0);
                const savTotal = goals.reduce((s, g) => s + (g.monthlyContribution || 0), 0);
                const np = monthlyIncome > 0 ? Math.round(fixedCosts / monthlyIncome * 100) : 0;
                const wp = monthlyIncome > 0 ? Math.round(discretionaryTotal / monthlyIncome * 100) : 0;
                const sp = monthlyIncome > 0 ? Math.round(savTotal / monthlyIncome * 100) : 0;
                return (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className={`text-center p-3 rounded-xl ${dm('bg-blue-50', 'bg-blue-950/30')}`}>
                        <p className={`text-[10px] font-semibold uppercase ${dm('text-blue-600', 'text-blue-400')}`}>Needs</p>
                        <p className={`text-xl font-bold ${dm('text-blue-700', 'text-blue-300')}`}>{np}%</p>
                        <p className={`text-[10px] ${np <= 50 ? 'text-green-500' : 'text-amber-500'}`}>{np <= 50 ? '✓ On target' : 'Above 50%'}</p>
                      </div>
                      <div className={`text-center p-3 rounded-xl ${dm('bg-purple-50', 'bg-purple-950/30')}`}>
                        <p className={`text-[10px] font-semibold uppercase ${dm('text-purple-600', 'text-purple-400')}`}>Wants</p>
                        <p className={`text-xl font-bold ${dm('text-purple-700', 'text-purple-300')}`}>{wp}%</p>
                        <p className={`text-[10px] ${wp <= 30 ? 'text-green-500' : 'text-amber-500'}`}>{wp <= 30 ? '✓ On target' : 'Above 30%'}</p>
                      </div>
                      <div className={`text-center p-3 rounded-xl ${dm('bg-emerald-50', 'bg-emerald-950/30')}`}>
                        <p className={`text-[10px] font-semibold uppercase ${dm('text-emerald-600', 'text-emerald-400')}`}>Savings</p>
                        <p className={`text-xl font-bold ${dm('text-emerald-700', 'text-emerald-300')}`}>{sp}%</p>
                        <p className={`text-[10px] ${sp >= 20 ? 'text-green-500' : 'text-amber-500'}`}>{sp >= 20 ? '✓ On target' : 'Below 20%'}</p>
                      </div>
                    </div>
                    <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')} text-center`}>Based on the 50/30/20 rule (Needs / Wants / Savings)</p>
                  </div>
                );
              })()}
            </Card>

            {/* Top Merchants */}
            {(() => {
              const me = manualExpenses || [];
              const merchantMap = {};
              me.forEach(e => {
                const m = (e.merchant || '').trim();
                if (m) { if (!merchantMap[m]) merchantMap[m] = { total: 0, count: 0 }; merchantMap[m].total += (e.amount || 0); merchantMap[m].count++; }
              });
              const topMerchants = Object.entries(merchantMap).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
              if (topMerchants.length === 0) return null;
              const maxVal = topMerchants[0][1].total || 1;
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

            {/* Category Trends vs Last Month */}
            {(() => {
              const prevMK = viewMonth === 0 ? monthKey(viewYear - 1, 11) : monthKey(viewYear, viewMonth - 1);
              const prev = expensesByMonth[prevMK] || [];
              if (prev.length === 0) return null;
              const curByCat = {};
              (manualExpenses || []).forEach(e => { if (e.category) curByCat[e.category] = (curByCat[e.category] || 0) + (e.amount || 0); });
              const prevByCat = {};
              prev.forEach(e => { if (e.category) prevByCat[e.category] = (prevByCat[e.category] || 0) + (e.amount || 0); });
              const cats = [...new Set([...Object.keys(curByCat), ...Object.keys(prevByCat)])];
              const insights = cats.map(cat => {
                const c = curByCat[cat] || 0;
                const p = prevByCat[cat] || 0;
                const ch = p > 0 ? ((c - p) / p * 100) : c > 0 ? 100 : 0;
                return { cat, c, p, ch };
              }).filter(x => x.ch !== 0).sort((a, b) => Math.abs(b.ch) - Math.abs(a.ch)).slice(0, 6);
              if (insights.length === 0) return null;
              return (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Category Trends vs Last Month</h3>
                  <div className="space-y-2">
                    {insights.map(x => (
                      <div key={x.cat} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${dm('bg-gray-50', 'bg-slate-800/50')}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${dm('text-gray-700', 'text-gray-300')}`}>{x.cat}</p>
                          <p className="text-[10px] text-gray-400">{fmt(x.p)} → {fmt(x.c)}</p>
                        </div>
                        <span className={`text-sm font-bold ${x.ch <= 0 ? 'text-green-500' : 'text-rose-500'}`}>
                          {x.ch > 0 ? '+' : ''}{Math.round(x.ch)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })()}

            {/* Budget Adherence */}
            {Object.keys(categoryBudgets || {}).length > 0 && (
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Budget Adherence</h3>
                <div className="space-y-3">
                  {Object.entries(categoryBudgets || {}).map(([cat, budget]) => {
                    const spent = (manualExpenses || []).filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
                    const pctU = budget > 0 ? Math.round(spent / budget * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-medium ${dm('text-gray-700', 'text-gray-300')}`}>{cat}</span>
                          <span className={`text-xs font-semibold ${pctU <= 100 ? dm('text-gray-500', 'text-gray-400') : 'text-rose-500'}`}>{fmt(spent)} / {fmt(budget)}</span>
                        </div>
                        <div className={`h-2 rounded-full ${dm('bg-gray-100', 'bg-slate-700')} overflow-hidden`}>
                          <div className={`h-full rounded-full transition-all ${pctU <= 75 ? 'bg-green-500' : pctU <= 100 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(pctU, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Achievements */}
            <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
              <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')} mb-3`}>Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl text-center ${dm('bg-amber-50', 'bg-amber-950/30')}`}>
                  <p className="text-2xl mb-1">🎯</p>
                  <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{goals.filter(g => g.saved >= g.target).length} Goals Hit</p>
                  <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>Savings targets met</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${dm('bg-purple-50', 'bg-purple-950/30')}`}>
                  <p className="text-2xl mb-1">{monthlyIncome > 0 && goals.reduce((s, g) => s + (g.monthlyContribution || 0), 0) / monthlyIncome >= 0.2 ? '💰' : '📈'}</p>
                  <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{monthlyIncome > 0 ? Math.round(goals.reduce((s, g) => s + (g.monthlyContribution || 0), 0) / monthlyIncome * 100) : 0}% Savings Rate</p>
                  <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>{monthlyIncome > 0 && goals.reduce((s, g) => s + (g.monthlyContribution || 0), 0) / monthlyIncome >= 0.2 ? 'Excellent!' : 'Goal: 20%+'}</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${dm('bg-indigo-50', 'bg-indigo-950/30')}`}>
                  <p className="text-2xl mb-1">{Array.isArray(subscriptions) && subscriptions.filter(s => s && !s.active).length > 0 ? '💪' : '📋'}</p>
                  <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{Array.isArray(subscriptions) ? subscriptions.filter(s => s && !s.active).length : 0} Subs Paused</p>
                  <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>Cancelled subscriptions</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${dm('bg-green-50', 'bg-green-950/30')}`}>
                  <p className="text-2xl mb-1">{debts.length > 0 ? '⚡' : '✅'}</p>
                  <p className={`text-xs font-bold ${dm('text-gray-700', 'text-gray-300')}`}>{debts.length} Active Debts</p>
                  <p className={`text-[10px] ${dm('text-gray-400', 'text-gray-500')}`}>{debts.length === 0 ? 'Debt free!' : 'Keep going!'}</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ═══════ WISHLIST TAB ═══════ */}
        {tab === "wishlist" && (() => {
          const totalWishValue = wishlist.reduce((s, w) => s + (w.completed ? 0 : w.cost), 0);
          const completedItems = wishlist.filter(w => w.completed);
          const activeItems = wishlist.filter(w => !w.completed).sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
          });
          const monthlyIncome = totalPaychecks > 0 ? totalPaychecks : 0;
          return (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Wishlist / Planned Purchases</h2>
                <button onClick={() => setWishDraft({ name: "", cost: "", priority: "medium", targetDate: "", notes: "", link: "" })}
                  className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {wishDraft && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="mb-4 border-indigo-200">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder="Item name" value={wishDraft.name} onChange={(e) => setWishDraft({ ...wishDraft, name: e.target.value })}
                        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dm('bg-white border-gray-200', 'bg-slate-700 border-slate-600 text-white')}`} />
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${dm('text-gray-500', 'text-gray-400')}`}>$</span>
                        <input type="number" placeholder="Estimated cost" value={wishDraft.cost} onChange={(e) => setWishDraft({ ...wishDraft, cost: e.target.value })}
                          className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dm('bg-white border-gray-200', 'bg-slate-700 border-slate-600 text-white')}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <select value={wishDraft.priority} onChange={(e) => setWishDraft({ ...wishDraft, priority: e.target.value })}
                        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dm('bg-white border-gray-200', 'bg-slate-700 border-slate-600 text-white')}`}>
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                      </select>
                      <input type="date" value={wishDraft.targetDate} onChange={(e) => setWishDraft({ ...wishDraft, targetDate: e.target.value })}
                        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dm('bg-white border-gray-200', 'bg-slate-700 border-slate-600 text-white')}`} />
                      <input type="url" placeholder="Link/URL (optional)" value={wishDraft.link || ""} onChange={(e) => setWishDraft({ ...wishDraft, link: e.target.value })}
                        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dm('bg-white border-gray-200', 'bg-slate-700 border-slate-600 text-white')}`} />
                    </div>
                    <textarea placeholder="Notes (optional)" value={wishDraft.notes || ""} onChange={(e) => setWishDraft({ ...wishDraft, notes: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${dm('bg-white border-gray-200', 'bg-slate-700 border-slate-600 text-white')}`} rows="2" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { if (wishDraft.name && wishDraft.cost) { setWishlist([...wishlist, { ...wishDraft, id: uid(), cost: +wishDraft.cost, completed: false }]); setWishDraft(null); } }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-1"><Check size={14} /> Save</button>
                      <button onClick={() => setWishDraft(null)} className="px-4 py-2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Star} label="Total Wishlist Value" value={fmt(totalWishValue)} sub={`${activeItems.length} active items`} color="purple" />
                <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Check} label="Completed Items" value={completedItems.length.toString()} sub={`${fmt(completedItems.reduce((s, w) => s + w.cost, 0))} purchased`} color="green" />
                <StatCard darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} icon={Calendar} label="Affordable In" value={monthlyIncome > 0 ? `${Math.ceil(totalWishValue / monthlyIncome)} months` : "—"} sub="at current income" color="cyan" />
              </div>

              {activeItems.length === 0 ? (
                <EmptyState icon={Star} message="No wishlist items yet. Add one to get started!" />
              ) : (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Active Wishlist</h3>
                  <div className="space-y-2">
                    {activeItems.map((item) => {
                      const priorityColors = { high: dm('bg-rose-100 text-rose-700', 'bg-rose-900/30 text-rose-300'), medium: dm('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-300'), low: dm('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-300') };
                      return (
                        <div key={item.id} className={`p-3 rounded-lg ${dm('hover:bg-gray-50', 'hover:bg-slate-700')} transition`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-100')}`}>{item.name}</h4>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[item.priority]}`}>{item.priority}</span>
                              </div>
                              <div className={`text-xs ${dm('text-gray-600', 'text-gray-400')} space-y-0.5`}>
                                <p>Cost: <span className="font-medium">{fmt(item.cost)}</span></p>
                                {item.targetDate && <p>Target: {new Date(item.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                                {item.notes && <p className={`italic ${dm('text-gray-500', 'text-gray-500')}`}>{item.notes}</p>}
                                {item.link && <p><a href={item.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">View item →</a></p>}
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => setWishlist(wishlist.map(w => w.id === item.id ? { ...w, completed: true } : w))} className="px-2 py-1 text-xs bg-emerald-500 text-white rounded hover:bg-emerald-600 transition">Purchased</button>
                              <button onClick={() => setWishlist(wishlist.filter(w => w.id !== item.id))} className="px-2 py-1 text-xs bg-rose-500 text-white rounded hover:bg-rose-600 transition"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {completedItems.length > 0 && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""} className="mt-4">
                  <h3 className={`text-sm font-semibold ${dm('text-gray-700', 'text-gray-200')} mb-3`}>Purchased Items ({completedItems.length})</h3>
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <div key={item.id} className={`p-3 rounded-lg flex items-center justify-between ${dm('bg-gray-50', 'bg-slate-700/30')}`}>
                        <div className="flex-1">
                          <p className={`text-sm font-medium line-through ${dm('text-gray-500', 'text-gray-400')}`}>{item.name}</p>
                          <p className={`text-xs ${dm('text-gray-400', 'text-gray-500')}`}>{fmt(item.cost)}</p>
                        </div>
                        <button onClick={() => setWishlist(wishlist.filter(w => w.id !== item.id))} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          );
        })()}

        {/* ═══════ FINANCIAL CALENDAR TAB ═══════ */}
        {tab === "calendar" && (() => {
          const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
          const firstDay = new Date(viewYear, viewMonth, 1).getDay();
          const days = [];
          for (let i = 0; i < firstDay; i++) days.push(null);
          for (let i = 1; i <= daysInMonth; i++) days.push(i);

          // Helper to get events for a day
          const getEventsForDay = (day) => {
            if (!day) return [];
            const events = [];
            const padDay = String(day).padStart(2, '0');
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${padDay}`;

            // Paychecks
            monthPaychecks.forEach(p => {
              if (p.date.getDate() === day) {
                events.push({ type: 'income', label: p.label, amount: p.amount, color: 'emerald' });
              }
            });

            // Bills
            bills.forEach(b => {
              if (b.dueDay === day) {
                events.push({ type: 'bill', label: b.name, amount: b.amount, color: 'rose' });
              }
            });

            // Debts
            debts.forEach(d => {
              if (d.dueDay === day) {
                events.push({ type: 'debt', label: d.name, amount: d.minPayment + d.extraPayment, color: 'orange' });
              }
            });

            // Subscriptions
            subscriptions.filter(s => s.active).forEach(s => {
              if (s.nextBillDate) {
                const subDate = new Date(s.nextBillDate);
                if (subDate.getDate() === day && subDate.getMonth() === viewMonth && subDate.getFullYear() === viewYear) {
                  events.push({ type: 'sub', label: s.name, amount: s.amount, color: 'blue' });
                }
              }
            });

            // Expenses
            manualExpenses.forEach(e => {
              if (e.date === dateStr) {
                events.push({ type: 'expense', label: e.description, amount: e.amount, color: 'purple' });
              }
            });

            return events;
          };

          const totalIncome = monthPaychecks.reduce((s, p) => s + p.amount, 0);
          const totalBills = bills.reduce((s, b) => s + b.amount, 0);
          const totalDebts = debts.reduce((s, d) => s + d.minPayment + d.extraPayment, 0);
          const netMonth = totalIncome - totalBills - totalDebts;

          return (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-bold ${dm('text-gray-900', 'text-white')}`}>Financial Calendar</h2>
                <div className={`text-sm font-semibold ${dm('text-gray-600', 'text-gray-400')}`}>{monthLabel(viewYear, viewMonth)}</div>
              </div>

              {/* Month Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Expected Income</p>
                  <p className={`text-lg font-bold text-emerald-600`}>{fmt(totalIncome)}</p>
                </Card>
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Bills Due</p>
                  <p className={`text-lg font-bold text-rose-600`}>{fmt(totalBills)}</p>
                </Card>
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Debt Payments</p>
                  <p className={`text-lg font-bold text-orange-600`}>{fmt(totalDebts)}</p>
                </Card>
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <p className={`text-xs ${dm('text-gray-500', 'text-gray-400')}`}>Net Expected</p>
                  <p className={`text-lg font-bold ${netMonth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(netMonth)}</p>
                </Card>
              </div>

              {/* Calendar Grid */}
              <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                <div className="mb-4">
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className={`text-center text-xs font-bold ${dm('text-gray-500', 'text-gray-400')} py-2`}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                      const events = day ? getEventsForDay(day) : [];
                      const isToday = day && day === today.getDate() && isCurrentMonth;
                      return (
                        <button key={idx} onClick={() => day && setCalendarSelectedDay(day)}
                          className={`aspect-square p-2 rounded-lg border-2 transition text-xs font-semibold flex flex-col items-center justify-center ${
                            !day ? '' :
                            isToday ? `${dm('bg-indigo-100 border-indigo-500 text-indigo-700', 'bg-indigo-900/40 border-indigo-600 text-indigo-300')}` :
                            calendarSelectedDay === day ? `${dm('bg-indigo-50 border-indigo-400 text-indigo-600', 'bg-slate-700 border-indigo-500 text-indigo-300')}` :
                            `${dm('bg-white border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700')}`
                          }`}>
                          {day && <span className="mb-1">{day}</span>}
                          {events.length > 0 && (
                            <div className="flex gap-0.5">
                              {events.slice(0, 3).map((e, i) => {
                                const colorMap = { emerald: 'bg-emerald-500', rose: 'bg-rose-500', orange: 'bg-orange-500', blue: 'bg-blue-500', purple: 'bg-purple-500' };
                                return <div key={i} className={`w-1 h-1 rounded-full ${colorMap[e.color]}`} />;
                              })}
                              {events.length > 3 && <span className="text-[8px]">+{events.length - 3}</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Day Detail Panel */}
              {calendarSelectedDay && (
                <Card darkMode={darkMode} themeCard={isThemed ? theme.cardClass : ""}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-sm font-bold ${dm('text-gray-800', 'text-gray-200')}`}>
                      {new Date(viewYear, viewMonth, calendarSelectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </h3>
                    <button onClick={() => setCalendarSelectedDay(null)} className={`text-gray-400 hover:text-gray-600`}><X size={16} /></button>
                  </div>
                  {(() => {
                    const dayEvents = getEventsForDay(calendarSelectedDay);
                    if (dayEvents.length === 0) {
                      return <p className={`text-sm ${dm('text-gray-500', 'text-gray-400')}`}>No financial events this day.</p>;
                    }
                    const colorMap = { emerald: 'text-emerald-600', rose: 'text-rose-600', orange: 'text-orange-600', blue: 'text-blue-600', purple: 'text-purple-600' };
                    const typeEmoji = { income: '💰', bill: '📝', debt: '💳', sub: '🔄', expense: '💸' };
                    return (
                      <div className="space-y-2">
                        {dayEvents.map((e, i) => (
                          <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${dm('bg-gray-50', 'bg-slate-700/50')}`}>
                            <div className="flex items-center gap-2">
                              <span>{typeEmoji[e.type]}</span>
                              <div>
                                <p className={`text-sm font-medium ${dm('text-gray-800', 'text-gray-200')}`}>{e.label}</p>
                                <p className={`text-xs capitalize ${dm('text-gray-500', 'text-gray-400')}`}>{e.type}</p>
                              </div>
                            </div>
                            <p className={`text-sm font-bold ${colorMap[e.color]}`}>{fmt(e.amount)}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </Card>
              )}
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