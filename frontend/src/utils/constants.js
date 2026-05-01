// ─── Priority ─────────────────────────────────────────────────────────────────
export const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export const PRIORITY_BADGE = {
  low:    'badge-low',
  medium: 'badge-medium',
  high:   'badge-high',
};

export const PRIORITY_COLORS = {
  low:    '#10b981',
  medium: '#f59e0b',
  high:   '#ef4444',
};

export const PRIORITY_BAR_COLOR = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-emerald-400',
};

// ─── Status ──────────────────────────────────────────────────────────────────
export const STATUS_COLS   = ['todo', 'inprogress', 'done'];

export const STATUS_LABELS = {
  todo:       'To Do',
  inprogress: 'In Progress',
  done:       'Done',
};

export const STATUS_BADGE = {
  todo:       'badge-todo',
  inprogress: 'badge-inprogress',
  done:       'badge-done',
};

export const STATUS_DOT = {
  todo:       'bg-slate-400',
  inprogress: 'bg-blue-500',
  done:       'bg-emerald-500',
};

export const STATUS_CHART_COLORS = {
  todo:       '#94a3b8',
  inprogress: '#3b82f6',
  done:       '#10b981',
};

// ─── Due badge logic ─────────────────────────────────────────────────────────
import { parseISO, isPast, isToday, isWithinInterval, addDays } from 'date-fns';

export const getDueBadge = (dueDate, status) => {
  if (!dueDate || status === 'done') return null;
  const d = parseISO(dueDate);
  if (isPast(d) && !isToday(d)) return 'overdue';
  if (isToday(d)) return 'today';
  if (isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 3) })) return 'soon';
  return null;
};
