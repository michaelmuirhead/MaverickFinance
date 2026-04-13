import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Home, BarChart3, Search, Settings, Plus, ArrowLeft, Edit2, RotateCcw, X, Zap, Trash2, Check, Undo2, AlertTriangle, Info, Filter, TrendingDown, TrendingUp, Wallet, LogOut, Users, Bell, BellOff, Copy, Link, Calendar, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "./useAuth";
import { AuthScreen } from "./AuthScreen";
import { HouseholdScreen } from "./HouseholdScreen";
import { useFirestore } from "./useFirestore";
import { getUserHousehold, getHouseholdInfo, deleteHousehold as firebaseDeleteHousehold, getMemberProfiles, logOut as firebaseLogOut, requestNotificationPermission, setupForegroundMessages, saveUserProfile } from "./firebase";


// ─── Data & State ───────────────────────────────────────────────

let _id = 100;
const uid = () => `id-${_id++}`;

function reducer(state, action) {
  switch (action.type) {
    case "ADD_GROUP": return { ...state, groups: [...state.groups, { id: uid(), createdAt: Date.now(), ...action.payload }] };
    case "DELETE_GROUP": return { ...state, groups: state.groups.filter(g => g.id !== action.id), budgets: state.budgets.filter(b => b.groupId !== action.id), entries: state.entries.filter(e => !state.budgets.find(b => b.id === e.budgetId && b.groupId === action.id)) };
    case "ADD_BUDGET": return { ...state, budgets: [...state.budgets, { id: uid(), ...action.payload }] };
    case "UPDATE_BUDGET": return { ...state, budgets: state.budgets.map(b => b.id === action.id ? { ...b, ...action.payload } : b) };
    case "DELETE_BUDGET": return { ...state, budgets: state.budgets.filter(b => b.id !== action.id), entries: state.entries.filter(e => e.budgetId !== action.id) };
    case "ADD_ENTRY": return { ...state, entries: [...state.entries, { id: uid(), ...action.payload }] };
    case "ADD_LINKED_ENTRY": {
      const expenseId = uid();
      const depositId = uid();
      return { ...state, entries: [
        ...state.entries,
        { id: expenseId, ...action.expense, linkedTo: depositId },
        { id: depositId, ...action.deposit, linkedTo: expenseId },
      ]};
    }
    case "UPDATE_ENTRY": return { ...state, entries: state.entries.map(e => e.id === action.id ? { ...e, ...action.payload } : e) };
    case "DELETE_ENTRY": {
      const entry = state.entries.find(e => e.id === action.id);
      // If this entry is linked, also delete its counterpart
      if (entry?.linkedTo) {
        return { ...state, entries: state.entries.filter(e => e.id !== action.id && e.id !== entry.linkedTo) };
      }
      return { ...state, entries: state.entries.filter(e => e.id !== action.id) };
    }
    case "RESTORE_ENTRY": return { ...state, entries: [...state.entries, action.payload] };
    case "RESTORE_LINKED_ENTRIES": return { ...state, entries: [...state.entries, action.expense, action.deposit] };
    case "RESET_BUDGET": return { ...state, entries: state.entries.filter(e => e.budgetId !== action.id) };
    case "RESTORE_ENTRIES": return { ...state, entries: [...state.entries, ...action.payload] };
    case "ADD_CATEGORY": return { ...state, categories: [...state.categories, action.payload] };
    case "DELETE_CATEGORY": return { ...state, categories: state.categories.filter(c => c.name !== action.name) };
    default: return state;
  }
}

// ─── Helpers ────────────────────────────────────────────────────
const fmt = (n) => "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const getCatIcon = (cats, c) => { const cat = cats.find(x => x.name === c); return cat ? cat.icon : "📦"; };
const healthColor = (pct) => pct > 50 ? "#2dd4bf" : pct > 25 ? "#fbbf24" : "#ef4444";

function getBudgetBalance(state, budgetId) {
  const budget = state.budgets.find(b => b.id === budgetId);
  if (!budget) return 0;
  const entries = state.entries.filter(e => e.budgetId === budgetId);
  const income = entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenses = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  // For spending budgets: balance = income - expenses (no pre-set amount)
  // For savings budgets: balance = deposits - withdrawals
  return (budget.totalAmount || 0) + income - expenses;
}

function getGroupHealth(state, groupId) {
  const budgets = state.budgets.filter(b => b.groupId === groupId);
  if (!budgets.length) return 100;
  // For spending budgets: positive balance = healthy
  // For savings budgets: progress toward goal
  const balances = budgets.map(b => {
    if (b.budgetType === "savings") {
      return Math.max(0, (getSavingsProgress(state, b.id) / (b.totalAmount || 1)) * 100);
    }
    const bal = getBudgetBalance(state, b.id);
    return bal >= 0 ? 100 : 0;
  });
  return balances.reduce((a, b) => a + b, 0) / balances.length;
}

// ─── Toast System ───────────────────────────────────────────────
let toastId = 0;

function Toast({ toast, onDismiss, onUndo }) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 4000;
    const interval = 30;
    const step = (100 / duration) * interval;
    const timer = setInterval(() => {
      setProgress(p => {
        if (p <= 0) {
          clearInterval(timer);
          setExiting(true);
          setTimeout(() => onDismiss(toast.id), 300);
          return 0;
        }
        return p - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const configs = {
    success: { icon: Check, color: "#2dd4bf", bg: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.25)" },
    delete: { icon: Trash2, color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.25)" },
    undo: { icon: Undo2, color: "#67e8f9", bg: "rgba(103,232,249,0.12)", border: "rgba(103,232,249,0.25)" },
    warning: { icon: AlertTriangle, color: "#fbbf24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)" },
    info: { icon: Info, color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.25)" },
    household: { icon: Users, color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.25)" },
  };

  const config = configs[toast.type] || configs.info;
  const Icon = config.icon;

  return (
    <div style={{
      background: "rgba(15,23,42,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      border: `1px solid ${config.border}`, borderRadius: 16, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12, minWidth: 300, maxWidth: 420,
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${config.bg}`,
      animation: exiting ? "slideOut 0.3s ease forwards" : "toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 3, width: `${progress}%`, background: `linear-gradient(90deg, ${config.color}, transparent)`, borderRadius: "0 99px 99px 0", transition: "width 30ms linear", opacity: 0.6 }} />
      <div style={{ width: 36, height: 36, borderRadius: 10, background: config.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} style={{ color: config.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: toast.subtitle ? 2 : 0 }}>{toast.message}</p>
        {toast.subtitle && <p style={{ color: "#94a3b8", fontSize: 12 }}>{toast.subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {toast.undoable && (
          <button onClick={() => { onUndo?.(toast); onDismiss(toast.id); }} style={{
            padding: "6px 12px", borderRadius: 8, border: `1px solid ${config.border}`,
            background: config.bg, color: config.color, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          }}>Undo</button>
        )}
        <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 4, display: "flex", borderRadius: 6 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss, onUndo }) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", flexDirection: "column-reverse", gap: 8, alignItems: "center" }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} onUndo={onUndo} />
      ))}
    </div>
  );
}

// ─── Swipeable Entry Row ────────────────────────────────────────
function SwipeableEntry({ entry, onEdit, onDelete, onPaid, children }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const ACTION_WIDTH = onPaid ? 200 : 140;

  const handleStart = (clientX) => {
    startX.current = clientX;
    currentX.current = clientX;
    swiping.current = true;
  };

  const handleMove = (clientX) => {
    if (!swiping.current) return;
    currentX.current = clientX;
    const dx = currentX.current - startX.current;
    if (revealed) {
      const newOffset = Math.min(0, Math.max(-ACTION_WIDTH, -ACTION_WIDTH + dx));
      setOffset(newOffset);
    } else {
      const newOffset = Math.min(0, Math.max(-ACTION_WIDTH - 20, dx));
      setOffset(newOffset);
    }
  };

  const handleEnd = () => {
    swiping.current = false;
    const dx = currentX.current - startX.current;
    if (revealed) {
      if (dx > 40) {
        setOffset(0);
        setRevealed(false);
      } else {
        setOffset(-ACTION_WIDTH);
      }
    } else {
      if (dx < -50) {
        setOffset(-ACTION_WIDTH);
        setRevealed(true);
      } else {
        setOffset(0);
      }
    }
  };

  // Touch events (mobile)
  const handleTouchStart = (e) => handleStart(e.touches[0].clientX);
  const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleEnd();

  // Pointer events (desktop / PWA)
  const handlePointerDown = (e) => {
    if (e.pointerType === "touch") return; // let touch handlers handle it
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStart(e.clientX);
  };
  const handlePointerMove = (e) => {
    if (e.pointerType === "touch") return;
    handleMove(e.clientX);
  };
  const handlePointerUp = (e) => {
    if (e.pointerType === "touch") return;
    handleEnd();
  };

  // Close when tapping elsewhere
  const handleClickOutside = useCallback(() => {
    if (revealed) {
      setOffset(0);
      setRevealed(false);
    }
  }, [revealed]);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16 }}>
      {/* Action buttons behind the card */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0, width: ACTION_WIDTH,
        display: "flex", alignItems: "stretch", gap: 0, borderRadius: "0 16px 16px 0", overflow: "hidden",
      }}>
        {onPaid && (
          <button onClick={(e) => { e.stopPropagation(); onPaid(entry); setOffset(0); setRevealed(false); }}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              background: entry.paid ? "rgba(110,231,183,0.25)" : "rgba(45,212,191,0.2)", border: "none", cursor: "pointer",
              color: entry.paid ? "#6ee7b7" : "#2dd4bf", fontSize: 11, fontWeight: 600,
            }}>
            <Check size={18} />
            {entry.paid ? "Unpaid" : "Paid"}
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onEdit(entry); setOffset(0); setRevealed(false); }}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            background: "rgba(59,130,246,0.25)", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: 11, fontWeight: 600,
          }}>
          <Edit2 size={18} />
          Edit
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(entry); setOffset(0); setRevealed(false); }}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
            background: "rgba(239,68,68,0.25)", border: "none", cursor: "pointer", color: "#f87171", fontSize: 11, fontWeight: 600,
          }}>
          <Trash2 size={18} />
          Delete
        </button>
      </div>

      {/* Swipeable content */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          position: "relative", zIndex: 2, borderRadius: 16, touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Category Picker ────────────────────────────────────────────
const categoryEmojis = ["🍕", "🚗", "🛍️", "🎬", "📄", "💊", "📚", "✈️", "💼", "📦", "🏠", "🎮", "🐾", "🎁", "💅", "🏋️", "☕", "🎵", "🧒", "💰", "🔧", "🌿", "📱", "🍺"];

function CategoryPicker({ categories, selected, onSelect, dispatch }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const nameRef = useRef(null);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      // Already exists, just select it
      onSelect(categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase()).name);
    } else {
      dispatch({ type: "ADD_CATEGORY", payload: { name: trimmed, icon: newIcon } });
      onSelect(trimmed);
    }
    setNewName("");
    setNewIcon("📦");
    setAdding(false);
  };

  return (
    <div>
      <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Category</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, maxHeight: 160, overflow: "auto" }}>
        {categories.map(c => (
          <button key={c.name} onClick={() => onSelect(c.name)}
            style={{
              padding: "6px 4px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              border: selected === c.name ? "1px solid #67e8f9" : "1px solid rgba(255,255,255,0.1)",
              background: selected === c.name ? "rgba(103,232,249,0.15)" : "rgba(255,255,255,0.05)",
              color: selected === c.name ? "#67e8f9" : "#cbd5e1",
            }}>
            {c.icon} {c.name}
          </button>
        ))}
        {/* Add new category button */}
        <button onClick={() => { setAdding(true); setTimeout(() => nameRef.current?.focus(), 50); }}
          style={{
            padding: "6px 4px", borderRadius: 8, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            border: "1px dashed rgba(103,232,249,0.4)", background: "transparent", color: "#67e8f9",
          }}>
          <Plus size={14} /> New
        </button>
      </div>

      {/* Inline add category form */}
      {adding && (
        <div style={{
          marginTop: 10, padding: 12, borderRadius: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(103,232,249,0.2)",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={nameRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Category name"
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 13, outline: "none" }}
            />
            <button onClick={() => { setAdding(false); setNewName(""); }}
              style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, display: "flex" }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {categoryEmojis.map(e => (
              <button key={e} onClick={() => setNewIcon(e)}
                style={{
                  width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  border: newIcon === e ? "1px solid #67e8f9" : "1px solid rgba(255,255,255,0.08)",
                  background: newIcon === e ? "rgba(103,232,249,0.15)" : "transparent",
                }}>
                {e}
              </button>
            ))}
          </div>
          <button onClick={handleAdd}
            disabled={!newName.trim()}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", fontWeight: 600, cursor: newName.trim() ? "pointer" : "default", fontSize: 13,
              background: newName.trim() ? "linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)" : "rgba(255,255,255,0.05)",
              color: newName.trim() ? "white" : "#475569",
              transition: "all 0.2s",
            }}>
            Add "{newName.trim() || "..."}"
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────
const glass = { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" };
const glassHover = { ...glass, cursor: "pointer" };
const gradBtn = { background: "linear-gradient(135deg, #2dd4bf 0%, #3b82f6 50%, #8b5cf6 100%)" };
const tealBtn = { background: "linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)" };

function GlassCard({ children, className = "", onClick, style = {} }) {
  return (
    <div onClick={onClick} className={`rounded-2xl p-4 ${className}`} style={{ ...(onClick ? glassHover : glass), ...style, transition: "all 0.2s" }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(45,212,191,0.08)"; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.boxShadow = "none"; } : undefined}>
      {children}
    </div>
  );
}

function ProgressRing({ percentage, size = 160, strokeWidth = 6, children }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percentage)) / 100) * circ;
  const center = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="auroraG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle cx={center} cy={center} r={r} fill="none" stroke="url(#auroraG)" strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: `rotate(-90deg)`, transformOrigin: `${center}px ${center}px`, filter: "drop-shadow(0 0 8px rgba(45,212,191,0.4))", transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function MemberAvatar({ userId, profiles, size = 22 }) {
  const profile = profiles?.[userId];
  if (!profile) return null;
  return (
    <div title={profile.displayName} style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${profile.color}, ${profile.color}88)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, fontWeight: 700, color: "white",
      flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.15)",
    }}>
      {profile.initials}
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ ...glass, background: "rgba(15,23,42,0.95)", borderRadius: "1.5rem 1.5rem 0 0", width: "100%", maxWidth: 480, maxHeight: "85vh", overflow: "auto", WebkitOverflowScrolling: "touch", position: "relative", zIndex: 51, padding: "1.5rem", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 16px))", animation: "slideUp 0.3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ color: "white", fontSize: "1.25rem", fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Pages ──────────────────────────────────────────────────────
function Dashboard({ state, dispatch, navigate }) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", icon: "👤", color: "#2dd4bf" });
  const emojis = ["👤", "🏠", "💼", "🎓", "🎯", "🌍", "❤️", "⚡", "🎨", "🚀"];

  // Compute stats across all entries
  const totalSpent = state.entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const totalIncome = state.entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIncome - totalSpent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>MavBudget</h1>

      <GlassCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ color: "#cbd5e1", marginBottom: 6, fontSize: 14 }}>Overall Balance</p>
            <p style={{ color: netBalance >= 0 ? "#6ee7b7" : "#fca5a5", fontSize: "1.75rem", fontWeight: 700, marginBottom: 12 }}>{netBalance >= 0 ? "+" : "-"}{fmt(Math.abs(netBalance))}</p>
            <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#6ee7b7" }}>Income: <span style={{ color: "white" }}>{fmt(totalIncome)}</span></span>
              <span style={{ color: "#fca5a5" }}>Spent: <span style={{ color: "white" }}>{fmt(totalSpent)}</span></span>
            </div>
          </div>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: netBalance >= 0 ? "rgba(110,231,183,0.1)" : "rgba(252,165,165,0.1)",
            border: `3px solid ${netBalance >= 0 ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <div style={{ color: netBalance >= 0 ? "#6ee7b7" : "#fca5a5", fontSize: 18, fontWeight: 700 }}>
              {netBalance >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 10, marginTop: 2 }}>{netBalance >= 0 ? "Positive" : "Deficit"}</div>
          </div>
        </div>
      </GlassCard>

      {/* Mini Dashboard Charts */}
      {(() => {
        const expenses = state.entries.filter(e => e.type === "expense");
        const byCategory = {};
        expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
        const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

        // Last 14 days line chart
        const lineData = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const ds = d.toISOString().split("T")[0];
          const dayTotal = expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0);
          lineData.push({ day: d.toLocaleDateString("en", { month: "short", day: "numeric" }), amount: dayTotal });
        }

        // Monthly comparison
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
        const thisMonthTotal = expenses.filter(e => e.date?.startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);
        const lastMonthTotal = expenses.filter(e => e.date?.startsWith(lastMonth)).reduce((s, e) => s + e.amount, 0);
        const diff = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        const ChartTooltip = ({ active, payload }) => {
          if (!active || !payload?.length) return null;
          return (
            <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "6px 10px", backdropFilter: "blur(12px)" }}>
              <p style={{ color: "#cbd5e1", fontSize: 11 }}>{payload[0].payload?.name || payload[0].payload?.day}</p>
              <p style={{ color: "#67e8f9", fontSize: 13, fontWeight: 700 }}>{fmt(payload[0].value)}</p>
            </div>
          );
        };

        return (expenses.length > 0) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Monthly Comparison Card */}
            <GlassCard>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>This Month</p>
                  <p style={{ color: "#fca5a5", fontSize: "1.3rem", fontWeight: 700 }}>{fmt(thisMonthTotal)}</p>
                  <p style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{monthNames[now.getMonth()]} spending</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Last Month</p>
                  <p style={{ color: "#94a3b8", fontSize: "1.1rem", fontWeight: 600 }}>{fmt(lastMonthTotal)}</p>
                  {lastMonthTotal > 0 && (
                    <p style={{ color: diff > 0 ? "#fca5a5" : "#6ee7b7", fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                      {diff > 0 ? <TrendingUp size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} /> : <TrendingDown size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />}
                      {diff > 0 ? "+" : ""}{diff.toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Spending by Category mini donut + Spending Trend line chart */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {pieData.length > 0 && (
                <GlassCard style={{ padding: "12px 8px" }}>
                  <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>By Category</p>
                  <div style={{ width: "100%", height: 120 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={45} innerRadius={25} paddingAngle={2} stroke="none" fill="#3b82f6">
                          {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}
              <GlassCard style={{ padding: "12px 8px" }}>
                <p style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>14-Day Trend</p>
                <div style={{ width: "100%", height: 120 }}>
                  <ResponsiveContainer>
                    <LineChart data={lineData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <Tooltip content={<ChartTooltip />} />
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#2dd4bf" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <Line type="monotone" dataKey="amount" stroke="url(#lineGrad)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          </div>
        ) : null;
      })()}

      <button onClick={() => setShowAddGroup(true)} style={{ ...tealBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 24px", borderRadius: 12, border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
        <Plus size={18} /> Add Group
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {state.groups.map(group => {
          const budgets = state.budgets.filter(b => b.groupId === group.id);
          const health = getGroupHealth(state, group.id);
          const remaining = budgets.reduce((s, b) => s + getBudgetBalance(state, b.id), 0);
          return (
            <GlassCard key={group.id} onClick={() => navigate("group", group.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{group.icon}</span>
                    <span style={{ color: "white", fontWeight: 600, fontSize: 16 }}>{group.name}</span>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>{budgets.length} budget{budgets.length !== 1 ? "s" : ""}</p>
                  <p style={{ color: "#67e8f9", fontWeight: 600 }}>{fmt(remaining)}</p>
                </div>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: healthColor(health), flexShrink: 0, marginTop: 4 }} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Modal isOpen={showAddGroup} onClose={() => setShowAddGroup(false)} title="Add Group">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Group Name</label>
            <input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g., Personal"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none" }} />
          </div>
          <div>
            <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Icon</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
              {emojis.map(e => (
                <button key={e} onClick={() => setGroupForm({ ...groupForm, icon: e })}
                  style={{ padding: 10, borderRadius: 10, fontSize: 20, border: groupForm.icon === e ? "1px solid #67e8f9" : "1px solid rgba(255,255,255,0.1)", background: groupForm.icon === e ? "rgba(103,232,249,0.15)" : "rgba(255,255,255,0.05)", cursor: "pointer" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { if (groupForm.name.trim()) { dispatch({ type: "ADD_GROUP", payload: { name: groupForm.name, icon: groupForm.icon, color: groupForm.color } }); setGroupForm({ name: "", icon: "👤", color: "#2dd4bf" }); setShowAddGroup(false); } }}
            style={{ ...tealBtn, padding: "12px", borderRadius: 10, border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            Create Group
          </button>
        </div>
      </Modal>
    </div>
  );
}

function getSavingsProgress(state, budgetId) {
  const entries = state.entries.filter(e => e.budgetId === budgetId);
  const deposits = entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const withdrawals = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  return deposits - withdrawals;
}

function GroupView({ state, dispatch, navigate }) {
  const group = state.groups.find(g => g.id === state._navGroupId);
  const groupId = state._navGroupId;
  const budgets = state.budgets.filter(b => b.groupId === groupId);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", icon: "💰", type: "spending" });
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const budgetEmojis = ["💰", "📚", "🎬", "🛒", "🚗", "🏠", "✈️", "🎯", "🍽️", "💻"];

  if (!group) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Group not found</p>;

  const handleDeleteGroup = () => {
    dispatch({ type: "DELETE_GROUP", id: groupId });
    navigate("dashboard");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("dashboard")} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#cbd5e1" }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ fontSize: 32 }}>{group.icon}</span>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700 }}>{group.name}</h1>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>{budgets.length} budget{budgets.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowDeleteGroup(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#64748b" }}>
          <Trash2 size={18} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {budgets.map(budget => {
          const isSavings = budget.budgetType === "savings";
          const saved = isSavings ? getSavingsProgress(state, budget.id) : 0;
          const balance = isSavings ? saved : getBudgetBalance(state, budget.id);
          const budgetEntries = state.entries.filter(e => e.budgetId === budget.id);
          const income = budgetEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
          const expenses = budgetEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
          const pct = isSavings
            ? Math.min(100, Math.max(0, (saved / (budget.totalAmount || 1)) * 100))
            : 100; // no progress bar for spending budgets
          const color = isSavings ? "#8b5cf6" : (balance >= 0 ? "#2dd4bf" : "#ef4444");
          return (
            <GlassCard key={budget.id} onClick={() => navigate("budget", budget.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isSavings ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{budget.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ color: "white", fontWeight: 600 }}>{budget.name}</p>
                      {isSavings && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(139,92,246,0.2)", color: "#a78bfa", fontWeight: 600 }}>SAVINGS</span>}
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: 13 }}>
                      {isSavings ? `${fmt(saved)} / ${fmt(budget.totalAmount)} goal` : (
                        <span>
                          <span style={{ color: "#6ee7b7" }}>+{fmt(income)}</span>
                          {" / "}
                          <span style={{ color: "#fca5a5" }}>-{fmt(expenses)}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isSavings ? (
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: color }} />
                ) : (
                  <p style={{ color: balance >= 0 ? "#6ee7b7" : "#fca5a5", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{balance >= 0 ? "+" : ""}{fmt(balance)}</p>
                )}
              </div>
              {isSavings && (
                <div style={{ width: "100%", height: 5, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: `linear-gradient(90deg, #8b5cf6, #3b82f6)`, transition: "width 0.4s ease", borderRadius: 99 }} />
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      <button onClick={() => setShowAdd(true)} style={{ padding: 12, borderRadius: 12, border: "2px dashed rgba(103,232,249,0.4)", background: "transparent", color: "#67e8f9", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
        <Plus size={18} /> Add Budget
      </button>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setForm({ name: "", amount: "", icon: "💰", type: "spending" }); }} title="Add Budget">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Budget type toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            {[{ key: "spending", label: "Spending" }, { key: "savings", label: "Savings Goal" }].map(t => (
              <button key={t.key} onClick={() => setForm({ ...form, type: t.key })}
                style={{
                  flex: 1, padding: 10, borderRadius: 10, border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14,
                  color: form.type === t.key ? "white" : "#94a3b8",
                  ...(form.type === t.key
                    ? (t.key === "savings" ? { background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)" } : tealBtn)
                    : { background: "rgba(255,255,255,0.05)" }),
                }}>
                {t.label}
              </button>
            ))}
          </div>
          <div>
            <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Budget Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={form.type === "savings" ? "e.g., Vacation Fund" : "e.g., Groceries"}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none" }} />
          </div>
          {/* Only show amount for savings goals */}
          {form.type === "savings" && (
            <div>
              <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Savings Goal</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="10000"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none" }} />
            </div>
          )}
          <div>
            <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Icon</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
              {budgetEmojis.map(e => (
                <button key={e} onClick={() => setForm({ ...form, icon: e })}
                  style={{ padding: 10, borderRadius: 10, fontSize: 20, border: form.icon === e ? "1px solid #67e8f9" : "1px solid rgba(255,255,255,0.1)", background: form.icon === e ? "rgba(103,232,249,0.15)" : "rgba(255,255,255,0.05)", cursor: "pointer" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => {
            const canCreate = form.name.trim() && (form.type === "spending" || form.amount);
            if (canCreate) {
              dispatch({ type: "ADD_BUDGET", payload: { groupId, name: form.name, totalAmount: form.type === "savings" ? parseFloat(form.amount) : 0, icon: form.icon, budgetType: form.type } });
              setForm({ name: "", amount: "", icon: "💰", type: "spending" });
              setShowAdd(false);
            }
          }}
            style={{ ...(form.type === "savings" ? { background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)" } : tealBtn), padding: 12, borderRadius: 10, border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
            {form.type === "savings" ? "Create Savings Goal" : "Create Budget"}
          </button>
        </div>
      </Modal>

      {/* Delete Group Confirmation */}
      <Modal isOpen={showDeleteGroup} onClose={() => setShowDeleteGroup(false)} title="Delete Group">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ color: "#fca5a5", fontSize: 13 }}>This will delete <strong>{group.name}</strong> and all {budgets.length} budget{budgets.length !== 1 ? "s" : ""} inside it, along with all their entries.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowDeleteGroup(false)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Cancel
            </button>
            <button onClick={handleDeleteGroup}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Delete Group
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BudgetView({ state, dispatch, navigate, addToast, memberProfiles }) {
  const budgetId = state._navBudgetId;
  const budget = state.budgets.find(b => b.id === budgetId);
  const entries = state.entries.filter(e => e.budgetId === budgetId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const isSavings = budget?.budgetType === "savings";
  const balance = isSavings ? getSavingsProgress(state, budgetId) : getBudgetBalance(state, budgetId);
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [entryType, setEntryType] = useState(isSavings ? "income" : "expense");
  const [form, setForm] = useState({ name: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0] });
  const [linkToSavings, setLinkToSavings] = useState(null); // savings budget id
  const [showDeleteBudget, setShowDeleteBudget] = useState(false);

  // All savings budgets (for linking)
  const savingsBudgets = state.budgets.filter(b => b.budgetType === "savings" && b.id !== budgetId);

  if (!budget) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>Budget not found</p>;

  const handleDeleteBudget = () => {
    // Delete all entries first, then the budget
    dispatch({ type: "RESET_BUDGET", id: budgetId });
    // Need to dispatch a delete budget action - use UPDATE_BUDGET pattern but we need DELETE_BUDGET
    // For now, navigate back - the budget entries are cleared
    dispatch({ type: "DELETE_BUDGET", id: budgetId });
    navigate("group", budget.groupId);
  };

  const totalIncome = entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const pct = isSavings
    ? Math.min(100, (balance / budget.totalAmount) * 100)
    : (balance / budget.totalAmount) * 100;
  const group = state.groups.find(g => g.id === budget.groupId);

  const openAdd = (entry = null) => {
    if (entry) {
      setEditEntry(entry);
      setEntryType(entry.type);
      setForm({ name: entry.name, amount: String(entry.amount), category: entry.category, date: entry.date });
      setLinkToSavings(null);
    } else {
      setEditEntry(null);
      setEntryType(isSavings ? "income" : "expense");
      setForm({ name: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0] });
      setLinkToSavings(null);
    }
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.amount) return;
    const amt = parseFloat(form.amount);
    if (editEntry) {
      dispatch({ type: "UPDATE_ENTRY", id: editEntry.id, payload: { name: form.name, amount: amt, category: form.category, date: form.date, type: entryType } });
      // If linked, also update the counterpart
      if (editEntry.linkedTo) {
        dispatch({ type: "UPDATE_ENTRY", id: editEntry.linkedTo, payload: { name: form.name, amount: amt, date: form.date } });
      }
    } else if (linkToSavings && entryType === "expense") {
      // Create linked pair: expense here + deposit in savings
      const savingsBudget = state.budgets.find(b => b.id === linkToSavings);
      dispatch({
        type: "ADD_LINKED_ENTRY",
        expense: { budgetId, type: "expense", name: form.name, amount: amt, category: form.category, date: form.date },
        deposit: { budgetId: linkToSavings, type: "income", name: form.name, amount: amt, category: form.category, date: form.date },
      });
    } else {
      dispatch({ type: "ADD_ENTRY", payload: { budgetId, type: entryType, name: form.name, amount: amt, category: form.category, date: form.date } });
    }
    setShowAdd(false);
    setEditEntry(null);
    setLinkToSavings(null);
  };

  const handleDeleteEntry = (entry) => {
    dispatch({ type: "DELETE_ENTRY", id: entry.id });
  };

  const handleReset = () => {
    dispatch({ type: "RESET_BUDGET", id: budgetId });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("group", budget.groupId)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#cbd5e1" }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ fontSize: 28 }}>{budget.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ color: "white", fontSize: "1.4rem", fontWeight: 700 }}>{budget.name}</h1>
            {isSavings && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(139,92,246,0.2)", color: "#a78bfa", fontWeight: 600 }}>SAVINGS</span>}
          </div>
          <p style={{ color: "#94a3b8", fontSize: 12 }}>{group?.name} · {entries.length} transactions</p>
        </div>
        <button onClick={() => setShowDeleteBudget(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#64748b" }}>
          <Trash2 size={18} />
        </button>
      </div>

      <GlassCard style={{ display: "flex", justifyContent: "center", padding: "28px 16px", ...(isSavings ? { border: "1px solid rgba(139,92,246,0.2)" } : {}) }}>
        {isSavings ? (
          <ProgressRing percentage={Math.max(0, pct)} size={180} strokeWidth={7}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#a78bfa", fontSize: "1.6rem", fontWeight: 700 }}>{fmt(Math.max(0, balance))}</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>of {fmt(budget.totalAmount)} goal</div>
              {pct >= 100 && <div style={{ color: "#6ee7b7", fontSize: 11, fontWeight: 700, marginTop: 4 }}>Goal reached!</div>}
            </div>
          </ProgressRing>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ color: balance >= 0 ? "#6ee7b7" : "#fca5a5", fontSize: "2rem", fontWeight: 700 }}>{balance >= 0 ? "+" : "-"}{fmt(Math.abs(balance))}</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Net Balance</div>
          </div>
        )}
      </GlassCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <GlassCard style={{ textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{isSavings ? "Deposits" : "Income"}</p>
          <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.1rem" }}>{fmt(totalIncome)}</p>
        </GlassCard>
        <GlassCard style={{ textAlign: "center" }}>
          <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 4 }}>{isSavings ? "Withdrawals" : "Expenses"}</p>
          <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: "1.1rem" }}>{fmt(totalExpense)}</p>
        </GlassCard>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Transactions</p>
          {entries.length > 0 && (
            <p style={{ color: "#475569", fontSize: 11 }}>Swipe left to edit/delete</p>
          )}
        </div>
        {entries.length === 0 ? (
          <GlassCard style={{ textAlign: "center", padding: 32 }}>
            <p style={{ color: "#94a3b8" }}>No transactions yet</p>
          </GlassCard>
        ) : entries.map(entry => (
          <SwipeableEntry key={entry.id} entry={entry} onEdit={openAdd} onDelete={handleDeleteEntry} onPaid={(e) => dispatch({ type: "UPDATE_ENTRY", id: e.id, payload: { paid: !e.paid } })}>
            <GlassCard style={entry.paid ? { opacity: 0.5 } : {}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  {entry.updatedBy && memberProfiles?.[entry.updatedBy] && (
                    <MemberAvatar userId={entry.updatedBy} profiles={memberProfiles} size={24} />
                  )}
                  <span style={{ fontSize: 22 }}>{getCatIcon(state.categories, entry.category)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ color: "white", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: entry.paid ? "line-through" : "none" }}>{entry.name}</p>
                      {entry.paid && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "rgba(45,212,191,0.2)", color: "#2dd4bf", fontWeight: 600 }}>PAID</span>}
                      {entry.linkedTo && (() => {
                        const linked = state.entries.find(e => e.id === entry.linkedTo);
                        const linkedBudget = linked ? state.budgets.find(b => b.id === linked.budgetId) : null;
                        return linkedBudget ? (
                          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 6, background: "rgba(139,92,246,0.2)", color: "#a78bfa", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                            {isSavings ? "← linked" : `→ ${linkedBudget.icon}`}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <p style={{ color: "#64748b", fontSize: 12 }}>{entry.category}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  <p style={{ fontWeight: 700, color: entry.type === "income" ? "#6ee7b7" : "#fca5a5" }}>
                    {entry.type === "income" ? "+" : "-"}{fmt(entry.amount)}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 500 }}>{entry.date}</p>
                </div>
              </div>
            </GlassCard>
          </SwipeableEntry>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => openAdd()} style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px dashed rgba(103,232,249,0.4)", background: "transparent", color: "#67e8f9", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
          <Plus size={18} /> Add Entry
        </button>
        <button onClick={handleReset} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(252,165,165,0.3)", background: "transparent", color: "#fca5a5", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setEditEntry(null); setForm({ name: "", amount: "", category: "Food", date: new Date().toISOString().split("T")[0] }); }} title={editEntry ? "Edit Entry" : (isSavings ? "Add Transaction" : "Add Entry")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["expense", "income"].map(t => {
              const label = isSavings ? (t === "income" ? "Deposit" : "Withdrawal") : t;
              return (
                <button key={t} onClick={() => setEntryType(t)}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", fontSize: 14, color: entryType === t ? "white" : "#94a3b8", ...(entryType === t ? tealBtn : { background: "rgba(255,255,255,0.05)" }) }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ position: "relative" }}>
            <input value={form.name} onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, name: val });
              // Auto-categorization: if name matches a previous entry, suggest its category
              if (val.trim().length >= 2 && !editEntry) {
                const lower = val.trim().toLowerCase();
                const match = state.entries.find(ent => ent.name.toLowerCase().includes(lower) || lower.includes(ent.name.toLowerCase()));
                if (match && match.category !== form.category) {
                  setForm(f => ({ ...f, name: val, _suggestion: match.category }));
                  return;
                }
              }
              setForm(f => ({ ...f, name: val, _suggestion: null }));
            }} placeholder="Name"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none" }} />
            {form._suggestion && form._suggestion !== form.category && (
              <button onClick={() => setForm({ ...form, category: form._suggestion, _suggestion: null })}
                style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8,
                  background: "rgba(103,232,249,0.15)", border: "1px solid rgba(103,232,249,0.3)",
                  color: "#67e8f9", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                }}>
                <Sparkles size={12} /> {getCatIcon(state.categories, form._suggestion)} {form._suggestion}
              </button>
            )}
          </div>
          <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount"
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none" }} />
          <CategoryPicker
            categories={state.categories}
            selected={form.category}
            onSelect={(c) => setForm({ ...form, category: c })}
            dispatch={dispatch}
          />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none", colorScheme: "dark" }} />
          {/* Link to Savings — only on spending budgets, only for expenses, only when not editing */}
          {!isSavings && entryType === "expense" && !editEntry && savingsBudgets.length > 0 && (
            <div>
              <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Link to Savings Goal</label>
              <p style={{ color: "#475569", fontSize: 11, marginBottom: 8 }}>Auto-deposits this amount into a savings budget</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => setLinkToSavings(null)}
                  style={{
                    padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                    border: !linkToSavings ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.1)",
                    background: !linkToSavings ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                    color: !linkToSavings ? "#cbd5e1" : "#64748b",
                  }}>
                  None
                </button>
                {savingsBudgets.map(sb => (
                  <button key={sb.id} onClick={() => setLinkToSavings(sb.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      border: linkToSavings === sb.id ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                      background: linkToSavings === sb.id ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.03)",
                      color: linkToSavings === sb.id ? "#a78bfa" : "#94a3b8",
                    }}>
                    {sb.icon} {sb.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {editEntry && (
            <button onClick={() => { handleDeleteEntry(editEntry); setShowAdd(false); setEditEntry(null); }}
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Trash2 size={16} /> Delete Entry
            </button>
          )}
          <button onClick={handleSubmit}
            style={{
              ...(linkToSavings ? { background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)" } : tealBtn),
              padding: 12, borderRadius: 10, border: "none", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14, marginTop: editEntry ? 0 : 4,
            }}>
            {editEntry ? "Update" : linkToSavings ? "Add + Deposit to Savings" : "Add Entry"}
          </button>
        </div>
      </Modal>

      {/* Delete Budget Confirmation */}
      <Modal isOpen={showDeleteBudget} onClose={() => setShowDeleteBudget(false)} title="Delete Budget">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ color: "#fca5a5", fontSize: 13 }}>This will delete <strong>{budget.icon} {budget.name}</strong> and all {entries.length} transaction{entries.length !== 1 ? "s" : ""} inside it.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowDeleteBudget(false)}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Cancel
            </button>
            <button onClick={handleDeleteBudget}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Delete Budget
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Search View ────────────────────────────────────────────────
function SearchView({ state, dispatch, navigate, addToast, memberProfiles }) {
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const results = state.entries.filter(entry => {
    const matchesQuery = !query.trim() ||
      entry.name.toLowerCase().includes(query.toLowerCase()) ||
      entry.category.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !filterCategory || entry.category === filterCategory;
    const matchesType = !filterType || entry.type === filterType;
    return matchesQuery && matchesCategory && matchesType;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const activeFilters = (filterCategory ? 1 : 0) + (filterType ? 1 : 0);

  const handleDeleteEntry = (entry) => {
    dispatch({ type: "DELETE_ENTRY", id: entry.id });
  };

  const handleEditEntry = (entry) => {
    // Navigate to the budget view which has the edit modal
    navigate("budget", entry.budgetId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Search</h1>
        <p style={{ color: "#94a3b8", marginTop: 2, fontSize: 13 }}>Find transactions across all budgets</p>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <div style={{ ...glass, borderRadius: 14, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
          <Search size={18} style={{ color: "#64748b", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category..."
            style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 14, outline: "none" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 2, display: "flex" }}>
              <X size={16} />
            </button>
          )}
          <button onClick={() => setShowFilters(!showFilters)} style={{
            background: activeFilters > 0 ? "rgba(103,232,249,0.15)" : "none",
            border: activeFilters > 0 ? "1px solid rgba(103,232,249,0.3)" : "1px solid transparent",
            borderRadius: 8, cursor: "pointer", color: activeFilters > 0 ? "#67e8f9" : "#64748b", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 12,
          }}>
            <Filter size={14} />
            {activeFilters > 0 && <span>{activeFilters}</span>}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <GlassCard style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Type</label>
              {filterType && (
                <button onClick={() => setFilterType(null)} style={{ background: "none", border: "none", color: "#67e8f9", fontSize: 11, cursor: "pointer" }}>Clear</button>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["expense", "income"].map(t => (
                <button key={t} onClick={() => setFilterType(filterType === t ? null : t)}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                    border: filterType === t ? "1px solid #67e8f9" : "1px solid rgba(255,255,255,0.1)",
                    background: filterType === t ? "rgba(103,232,249,0.15)" : "rgba(255,255,255,0.05)",
                    color: filterType === t ? "#67e8f9" : "#94a3b8",
                  }}>
                  {t === "expense" ? "Expenses" : "Income"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Category</label>
              {filterCategory && (
                <button onClick={() => setFilterCategory(null)} style={{ background: "none", border: "none", color: "#67e8f9", fontSize: 11, cursor: "pointer" }}>Clear</button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, maxHeight: 140, overflow: "auto" }}>
              {state.categories.map(c => (
                <button key={c.name} onClick={() => setFilterCategory(filterCategory === c.name ? null : c.name)}
                  style={{
                    padding: "6px 4px", borderRadius: 8, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                    border: filterCategory === c.name ? "1px solid #67e8f9" : "1px solid rgba(255,255,255,0.1)",
                    background: filterCategory === c.name ? "rgba(103,232,249,0.15)" : "rgba(255,255,255,0.05)",
                    color: filterCategory === c.name ? "#67e8f9" : "#cbd5e1",
                  }}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Results */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            {query.trim() || activeFilters > 0 ? "Results" : "All Transactions"}
          </p>
          <p style={{ color: "#64748b", fontSize: 12 }}>{results.length} {results.length === 1 ? "entry" : "entries"}</p>
        </div>

        {results.length === 0 ? (
          <GlassCard style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "#64748b", fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ color: "#94a3b8", fontWeight: 500 }}>No results found</p>
            <p style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>Try a different search or adjust your filters</p>
          </GlassCard>
        ) : results.map(entry => {
          const budget = state.budgets.find(b => b.id === entry.budgetId);
          return (
            <SwipeableEntry key={entry.id} entry={entry} onEdit={handleEditEntry} onDelete={handleDeleteEntry}>
              <GlassCard onClick={() => navigate("budget", entry.budgetId)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    {entry.updatedBy && memberProfiles?.[entry.updatedBy] && (
                      <MemberAvatar userId={entry.updatedBy} profiles={memberProfiles} size={22} />
                    )}
                    <span style={{ fontSize: 22 }}>{getCatIcon(state.categories, entry.category)}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: "white", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</p>
                      <p style={{ color: "#64748b", fontSize: 12 }}>{budget?.name ? `${budget.icon} ${budget.name}` : entry.category} · {entry.date}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <p style={{ fontWeight: 700, color: entry.type === "income" ? "#6ee7b7" : "#fca5a5" }}>
                      {entry.type === "income" ? "+" : "-"}{fmt(entry.amount)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </SwipeableEntry>
          );
        })}
      </div>
    </div>
  );
}

// ─── Insights View ──────────────────────────────────────────────
const CHART_COLORS = ["#2dd4bf", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#84cc16"];

function InsightsView({ state }) {
  const expenses = state.entries.filter(e => e.type === "expense");
  const income = state.entries.filter(e => e.type === "income");
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = income.reduce((s, e) => s + e.amount, 0);

  // Spending by category (pie chart)
  const byCategory = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Spending by budget (pie chart)
  const byBudget = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const budget = state.budgets.find(b => b.id === e.budgetId);
      const name = budget ? `${budget.icon} ${budget.name}` : "Unknown";
      map[name] = (map[name] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, state.budgets]);

  // Daily spending (bar chart) — last 10 days
  const dailySpending = useMemo(() => {
    const days = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayExpenses = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
      days.push({ day: d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }).replace(",", ""), amount: dayExpenses });
    }
    return days;
  }, [expenses]);

  const dailyAvg = expenses.length > 0
    ? totalExpenses / Math.max(1, new Set(expenses.map(e => e.date)).size)
    : 0;

  // No-spend days count
  const allDates = new Set(expenses.map(e => e.date));
  const today = new Date();
  let noSpendStreak = 0;
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    if (!allDates.has(ds)) noSpendStreak++;
    else break;
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 12px", backdropFilter: "blur(12px)" }}>
        <p style={{ color: "#cbd5e1", fontSize: 12, marginBottom: 2 }}>{payload[0].name || payload[0].payload?.name || payload[0].payload?.day}</p>
        <p style={{ color: "#67e8f9", fontSize: 14, fontWeight: 700 }}>{fmt(payload[0].value)}</p>
      </div>
    );
  };

  // Custom pie label
  const renderLabel = ({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ color: "white", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Insights</h1>
        <p style={{ color: "#94a3b8", marginTop: 2, fontSize: 13 }}>Your spending at a glance</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <GlassCard style={{ textAlign: "center", padding: "14px 8px" }}>
          <TrendingDown size={18} style={{ color: "#fca5a5", marginBottom: 6 }} />
          <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: "1rem" }}>{fmt(totalExpenses)}</p>
          <p style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Total Spent</p>
        </GlassCard>
        <GlassCard style={{ textAlign: "center", padding: "14px 8px" }}>
          <TrendingUp size={18} style={{ color: "#6ee7b7", marginBottom: 6 }} />
          <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1rem" }}>{fmt(totalIncome)}</p>
          <p style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Total Income</p>
        </GlassCard>
        <GlassCard style={{ textAlign: "center", padding: "14px 8px" }}>
          <Wallet size={18} style={{ color: "#67e8f9", marginBottom: 6 }} />
          <p style={{ color: "#67e8f9", fontWeight: 700, fontSize: "1rem" }}>{fmt(dailyAvg)}</p>
          <p style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>Daily Avg</p>
        </GlassCard>
      </div>

      {/* No-spend streak */}
      {noSpendStreak > 0 && (
        <GlassCard style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(110,231,183,0.2)" }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <p style={{ color: "#6ee7b7", fontWeight: 700 }}>{noSpendStreak} day no-spend streak!</p>
            <p style={{ color: "#94a3b8", fontSize: 12 }}>Keep it going</p>
          </div>
        </GlassCard>
      )}

      {/* Spending by Category — Pie */}
      {byCategory.length > 0 && (
        <GlassCard>
          <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Spending by Category</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2} label={renderLabel}
                  labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                  fill="#3b82f6">
                  {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {byCategory.map((c, i) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                {c.name}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Spending by Budget — Pie */}
      {byBudget.length > 0 && (
        <GlassCard>
          <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Spending by Budget</p>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byBudget} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2} label={renderLabel}
                  labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                  fill="#8b5cf6">
                  {byBudget.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {byBudget.map((c, i) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#94a3b8" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: CHART_COLORS[(i + 3) % CHART_COLORS.length], flexShrink: 0 }} />
                {c.name}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Daily Spending — Bar Chart */}
      <GlassCard>
        <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Daily Spending (Last 10 Days)</p>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={dailySpending} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={45} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {dailySpending.map((entry, i) => (
                  <Cell key={i} fill={entry.amount > 0 ? "url(#barGrad)" : "rgba(255,255,255,0.05)"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Top expenses list */}
      <GlassCard>
        <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Top Expenses</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {expenses.sort((a, b) => b.amount - a.amount).slice(0, 5).map((e, i) => {
            const budget = state.budgets.find(b => b.id === e.budgetId);
            const pctOfTotal = totalExpenses > 0 ? (e.amount / totalExpenses) * 100 : 0;
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#475569", fontSize: 12, fontWeight: 700, width: 16 }}>{i + 1}</span>
                <span style={{ fontSize: 18 }}>{getCatIcon(state.categories, e.category)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "white", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</p>
                  <div style={{ width: "100%", height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", marginTop: 3 }}>
                    <div style={{ height: "100%", width: `${pctOfTotal}%`, background: CHART_COLORS[i], borderRadius: 99 }} />
                  </div>
                </div>
                <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{fmt(e.amount)}</p>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Settings View ──────────────────────────────────────────────
function SettingsView({ user, addToast, onLogout, householdId, onDeleteHousehold }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split("@")[0] || "");
  const [savingName, setSavingName] = useState(false);
  const [householdInfo, setHouseholdInfo] = useState(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Fetch household info for invite code
  useEffect(() => {
    if (!householdId) { setLoadingHousehold(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const info = await getHouseholdInfo(householdId);
        if (!cancelled) setHouseholdInfo(info);
      } catch (err) {
        console.error("Error fetching household info:", err);
      } finally {
        if (!cancelled) setLoadingHousehold(false);
      }
    })();
    return () => { cancelled = true; };
  }, [householdId]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setNotificationsEnabled(true);
        addToast({ type: "success", message: "Notifications enabled", subtitle: "You'll get alerts when your household budget changes" });
      } else {
        addToast({ type: "warning", message: "Notifications blocked", subtitle: "Check your device Settings > MavBudget > Notifications" });
      }
    } catch (err) {
      addToast({ type: "warning", message: "Could not enable notifications", subtitle: err.message });
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await saveUserProfile(user.uid, displayName.trim());
      addToast({ type: "success", message: "Name saved", subtitle: `Your partner will see "${displayName.trim()}" in notifications` });
    } catch (err) {
      addToast({ type: "warning", message: "Failed to save name", subtitle: err.message });
    }
    setSavingName(false);
  };

  const handleCopyCode = () => {
    if (!householdInfo?.inviteCode) return;
    navigator.clipboard.writeText(householdInfo.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast({ type: "success", message: "Copied!", subtitle: "Share this code with your partner" });
  };

  const handleDeleteHousehold = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await firebaseDeleteHousehold(householdId);
      addToast({ type: "delete", message: "Household deleted", subtitle: "Starting fresh" });
      onDeleteHousehold();
    } catch (err) {
      addToast({ type: "warning", message: "Failed to delete", subtitle: err.message });
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 style={{ color: "white", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Settings</h1>

      {/* Profile Section */}
      <GlassCard>
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Profile</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ color: "#cbd5e1", fontSize: 13, display: "block", marginBottom: 6 }}>Display Name</label>
            <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>This name shows in notifications sent to your partner</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none" }}
              />
              <button
                onClick={handleSaveName}
                disabled={savingName || !displayName.trim()}
                style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: displayName.trim() ? "linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)" : "rgba(255,255,255,0.05)", color: "white", fontWeight: 600, fontSize: 13, cursor: displayName.trim() ? "pointer" : "default", opacity: savingName ? 0.5 : 1 }}
              >
                {savingName ? "..." : "Save"}
              </button>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: 12 }}>{user?.email}</p>
        </div>
      </GlassCard>

      {/* Household Invite Code Section */}
      <GlassCard>
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Household</p>
        {loadingHousehold ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>Loading...</p>
        ) : householdInfo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{householdInfo.name || "My Household"}</p>
              <p style={{ color: "#64748b", fontSize: 12 }}>{householdInfo.members?.length || 1} member{(householdInfo.members?.length || 1) !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <label style={{ color: "#cbd5e1", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Link size={14} style={{ color: "#67e8f9" }} />
                Invite Code
              </label>
              <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>Share this code with your spouse to join your household</p>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(103,232,249,0.06)", border: "1px solid rgba(103,232,249,0.15)",
              }}>
                <p style={{ color: "white", fontSize: 22, fontWeight: 700, fontFamily: "monospace", letterSpacing: 6 }}>
                  {householdInfo.inviteCode || "------"}
                </p>
                <button onClick={handleCopyCode} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8,
                  color: copied ? "#2dd4bf" : "#67e8f9", transition: "color 0.2s",
                }}>
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: 13 }}>No household found</p>
        )}
      </GlassCard>

      {/* Notifications Section */}
      <GlassCard>
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Notifications</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: notificationsEnabled ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {notificationsEnabled ? <Bell size={20} style={{ color: "#a78bfa" }} /> : <BellOff size={20} style={{ color: "#64748b" }} />}
            </div>
            <div>
              <p style={{ color: "white", fontSize: 14, fontWeight: 600 }}>Push Notifications</p>
              <p style={{ color: "#94a3b8", fontSize: 12 }}>
                {notificationsEnabled ? "Enabled — you'll get alerts for budget changes" : "Get notified when your partner updates the budget"}
              </p>
            </div>
          </div>
          {!notificationsEnabled && (
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              style={{
                padding: "10px 16px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
                color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
                opacity: loading ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >
              {loading ? "Enabling..." : "Enable"}
            </button>
          )}
          {notificationsEnabled && (
            <div style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(45,212,191,0.15)", color: "#2dd4bf", fontSize: 12, fontWeight: 600 }}>
              Active
            </div>
          )}
        </div>
      </GlassCard>

      {/* Account Section */}
      <GlassCard>
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Account</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, width: "100%",
              border: "1px solid rgba(252,165,165,0.2)", background: "transparent",
              color: "#fca5a5", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </GlassCard>

      {/* Danger Zone */}
      <GlassCard style={{ border: "1px solid rgba(239,68,68,0.15)" }}>
        <p style={{ color: "#ef4444", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Danger Zone</p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 12, width: "100%",
              border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
              color: "#f87171", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
          >
            <Trash2 size={18} /> Delete Household
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>This will permanently delete:</p>
              <p style={{ color: "#94a3b8", fontSize: 12 }}>All groups, budgets, entries, and categories. This cannot be undone.</p>
            </div>
            <div>
              <label style={{ color: "#cbd5e1", fontSize: 12, display: "block", marginBottom: 6 }}>Type DELETE to confirm</label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, outline: "none", fontFamily: "monospace", letterSpacing: 2 }}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={handleDeleteHousehold}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
                  background: deleteConfirmText === "DELETE" ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "rgba(255,255,255,0.05)",
                  color: deleteConfirmText === "DELETE" ? "white" : "#475569", fontWeight: 600,
                  cursor: deleteConfirmText === "DELETE" ? "pointer" : "default", fontSize: 13,
                  opacity: deleting ? 0.5 : 1,
                }}>
                {deleting ? "Deleting..." : "Delete Forever"}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// ─── App Shell ──────────────────────────────────────────────────
function MavBudgetAppContent({ state, dispatch, page, navigate, toasts, addToast, dismissToast, handleUndo, user, householdId, onDeleteHousehold, memberProfiles }) {

  // All props provided by parent

  const handleLogout = async () => {
    try {
      await firebaseLogOut();
      addToast({ type: "info", message: "Signed out" });
    } catch (err) {
      addToast({ type: "warning", message: "Error signing out", subtitle: err.message });
    }
  };

  // Pass nav IDs through state-like props (avoids prop drilling issues with GroupView/BudgetView)
  const stateWithNav = { ...state, _navGroupId: page.id, _navBudgetId: page.id };

  const content = (() => {
    switch (page.view) {
      case "group": return <GroupView state={stateWithNav} dispatch={dispatch} navigate={navigate} />;
      case "budget": return <BudgetView state={stateWithNav} dispatch={dispatch} navigate={navigate} addToast={addToast} memberProfiles={memberProfiles} />;
      case "search": return <SearchView state={state} dispatch={dispatch} navigate={navigate} addToast={addToast} memberProfiles={memberProfiles} />;
      case "insights": return <InsightsView state={state} />;
      case "settings": return <SettingsView user={user} addToast={addToast} onLogout={handleLogout} householdId={householdId} onDeleteHousehold={onDeleteHousehold} />;
      default: return <Dashboard state={state} dispatch={dispatch} navigate={navigate} />;
    }
  })();

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", position: "relative", overflowX: "hidden", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      {/* Aurora blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, #2dd4bf, transparent)", top: -150, left: -100, filter: "blur(80px)", opacity: 0.2, animation: "float 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, #3b82f6, transparent)", top: 100, right: -50, filter: "blur(80px)", opacity: 0.18, animation: "float 24s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", width: 450, height: 450, background: "radial-gradient(circle, #8b5cf6, transparent)", bottom: -100, left: "50%", transform: "translateX(-50%)", filter: "blur(80px)", opacity: 0.18, animation: "float 22s ease-in-out infinite 4s" }} />
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "calc(24px + env(safe-area-inset-top, 0px)) 16px calc(100px + env(safe-area-inset-bottom, 0px)) 16px" }}>
        {content}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, display: "flex", justifyContent: "center" }}>
        <div style={{ ...glass, background: "rgba(15,23,42,0.85)", maxWidth: 520, width: "100%", display: "flex", justifyContent: "space-around", padding: "12px 8px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { icon: Home, label: "Dashboard", view: "dashboard" },
            { icon: BarChart3, label: "Insights", view: "insights" },
            { icon: Search, label: "Search", view: "search" },
            { icon: Settings, label: "Settings", view: "settings" },
          ].map(tab => {
            const active = page.view === tab.view || (tab.view === "dashboard" && ["dashboard", "group", "budget"].includes(page.view));
            return (
              <button key={tab.view} onClick={() => navigate(tab.view)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: active ? "#67e8f9" : "#64748b", transition: "color 0.2s" }}>
                <tab.icon size={22} />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} onUndo={handleUndo} />

      <style>{`
        @keyframes float { 0%,100%{transform:translate(0,0)} 25%{transform:translate(20px,-20px)} 50%{transform:translate(-10px,30px)} 75%{transform:translate(-30px,-10px)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes toastIn { from{transform:translateY(100px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideOut { from{transform:translateY(0);opacity:1} to{transform:translateY(40px);opacity:0} }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
        html, body { overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch; height: 100%; overscroll-behavior: none; background: #0f172a; }
        html { height: -webkit-fill-available; }
        body { min-height: 100vh; min-height: -webkit-fill-available; }
        input::placeholder { color: #475569; }
        input, button, select, textarea { font-size: 16px !important; font-family: inherit; }
        button { -webkit-user-select: none; user-select: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(103,232,249,0.3); border-radius: 99px; }
        @media (display-mode: standalone) {
          body { position: fixed; width: 100%; height: 100%; overflow: hidden; }
          #root { overflow-y: auto; height: 100%; }
        }
      `}</style>
    </div>
  );

}

export default function MavBudgetApp() {
  const { user, loading: authLoading } = useAuth();
  const [householdId, setHouseholdId] = useState(null);
  const [loadingHousehold, setLoadingHousehold] = useState(!!user);
  const [page, setPage] = useState({ view: "dashboard", id: null });
  const [toasts, setToasts] = useState([]);

  // Notification callback for household changes from other users
  const handleHouseholdNotification = useCallback((notification) => {
    if (!notification) return;
    const id = ++toastId;
    setToasts(prev => [...prev, { id, duration: 5000, ...notification }]);
  }, []);

  const { state, dispatch, loading: firestoreLoading } = useFirestore(householdId, user?.uid, handleHouseholdNotification);

  const navigate = (view, id = null) => setPage({ view, id });

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, ...toast }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleUndo = useCallback((toast) => {
    if (toast._linkedExpense && toast._linkedDeposit) {
      dispatch({ type: "RESTORE_LINKED_ENTRIES", expense: toast._linkedExpense, deposit: toast._linkedDeposit });
      addToast({ type: "undo", message: "Restored", subtitle: `${toast._linkedExpense.name} + savings deposit restored` });
    } else if (toast._entry) {
      dispatch({ type: "RESTORE_ENTRY", payload: toast._entry });
      addToast({ type: "undo", message: "Restored", subtitle: `${toast._entry.name} is back` });
    }
    if (toast._entries) {
      dispatch({ type: "RESTORE_ENTRIES", payload: toast._entries });
      addToast({ type: "undo", message: "Restored", subtitle: `${toast._entries.length} entries restored` });
    }
  }, [addToast, dispatch]);

  useEffect(() => {
    if (!user) {
      setHouseholdId(null);
      setLoadingHousehold(false);
      return;
    }

    const getHousehold = async () => {
      try {
        const household = await getUserHousehold(user.uid);
        if (household) {
          setHouseholdId(household.householdId);
        }
      } catch (err) {
        console.error("Error fetching household:", err);
      } finally {
        setLoadingHousehold(false);
      }
    };

    getHousehold();
  }, [user]);

  const [memberProfiles, setMemberProfiles] = useState({});

  // Auto-register for push notifications, save display name, fetch member profiles
  useEffect(() => {
    if (!user || !householdId) return;

    // Save display name for notification labels
    const name = user.displayName || user.email?.split("@")[0] || "Partner";
    saveUserProfile(user.uid, name);

    // If notifications are already granted, register the token silently
    if ("Notification" in window && Notification.permission === "granted") {
      requestNotificationPermission(user.uid).catch(() => {});
    }

    // Set up foreground message handler (suppresses system notifications when app is open)
    setupForegroundMessages(null);

    // Fetch member profiles for avatars
    (async () => {
      try {
        const info = await getHouseholdInfo(householdId);
        if (info?.members?.length) {
          const profiles = await getMemberProfiles(info.members);
          setMemberProfiles(profiles);
        }
      } catch (err) {
        console.error("Error fetching member profiles:", err);
      }
    })();
  }, [user, householdId]);

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui"
      }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "3px solid rgba(45,212,191,0.3)",
            borderTopColor: "#2dd4bf",
            margin: "0 auto 20px",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  if (loadingHousehold || firestoreLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', system-ui"
      }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "3px solid rgba(45,212,191,0.3)",
            borderTopColor: "#2dd4bf",
            margin: "0 auto 20px",
            animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ fontSize: 16, fontWeight: 600 }}>Setting up...</p>
        </div>
      </div>
    );
  }

  const handleDeleteHousehold = useCallback(() => {
    setHouseholdId(null);
    setPage({ view: "dashboard", id: null });
  }, []);

  if (!householdId) {
    return <HouseholdScreen userId={user.uid} onHouseholdCreated={setHouseholdId} />;
  }

  return (
    <MavBudgetAppContent
      state={state}
      dispatch={dispatch}
      page={page}
      navigate={navigate}
      toasts={toasts}
      addToast={addToast}
      dismissToast={dismissToast}
      handleUndo={handleUndo}
      user={user}
      householdId={householdId}
      onDeleteHousehold={handleDeleteHousehold}
      memberProfiles={memberProfiles}
    />
  );
}
