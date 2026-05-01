import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, FolderKanban,
  Plus, X, ArrowRight, Command, Settings,
} from 'lucide-react';

// ── Static command definitions ────────────────────────────────────────────────
const STATIC_COMMANDS = [
  {
    group:   'Navigate',
    id:      'go-dashboard',
    label:   'Go to Dashboard',
    icon:    LayoutDashboard,
    keywords: 'dashboard home overview',
    action:  (nav) => nav('/dashboard'),
  },
  {
    group:   'Navigate',
    id:      'go-projects',
    label:   'Go to Projects',
    icon:    FolderKanban,
    keywords: 'projects list kanban board',
    action:  (nav) => nav('/projects'),
  },
  {
    group:   'Actions',
    id:      'new-task',
    label:   'Create New Task',
    icon:    Plus,
    keywords: 'new task create add todo',
    action:  (nav, opts) => opts?.onNewTask?.(),
  },
  {
    group:   'Navigate',
    id:      'go-settings',
    label:   'Open Settings',
    icon:    Settings,
    keywords: 'settings profile preferences dark mode',
    action:  (nav) => nav('/settings'),
  },
];

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary-200 dark:bg-primary-800/70 text-primary-800 dark:text-primary-200 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * CommandPalette — global Ctrl+K / Cmd+K command palette.
 * Mount once at App root level. Zero API calls — fully client-side.
 *
 * Props:
 *   onNewTask — callback to open TaskModal from outside (optional)
 */
export default function CommandPalette({ onNewTask }) {
  const navigate    = useNavigate();
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef   = useRef(null);
  const listRef    = useRef(null);

  // ── Filter commands ────────────────────────────────────────────────────────
  const filtered = STATIC_COMMANDS.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.includes(q) ||
      cmd.group.toLowerCase().includes(q)
    );
  });

  // Group results
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  // ── Keyboard global listener ───────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  // Focus input when opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ── In-palette keyboard navigation ────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[selected];
      if (cmd) execute(cmd);
    }
  }, [filtered, selected]); // eslint-disable-line

  const execute = useCallback((cmd) => {
    setOpen(false);
    setTimeout(() => cmd.action(navigate, { onNewTask }), 80);
  }, [navigate, onNewTask]);

  if (!open) return null;

  let flatIdx = 0; // for tracking selected index across groups

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(15,15,26,0.97)',
          border: '1px solid rgba(99,102,241,0.25)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/60">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, pages…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white placeholder:text-slate-500 text-sm outline-none"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-600 font-mono">esc</kbd>
            <button onClick={() => setOpen(false)} className="ml-1 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-[340px] py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm">
              <Command className="w-8 h-8 mb-2 opacity-30" />
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group}>
                {/* Group label */}
                <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {group}
                </p>
                {cmds.map((cmd) => {
                  const isSelected = flatIdx === selected;
                  const currentIdx = flatIdx++;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => execute(cmd)}
                      onMouseEnter={() => setSelected(currentIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-primary-600/30 text-white'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-600/50' : 'bg-slate-800'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium flex-1">
                        {highlight(cmd.label, query)}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-700/60 flex items-center gap-3 text-[11px] text-slate-500">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">esc</kbd> close</span>
          <span className="ml-auto flex items-center gap-1">
            <Command className="w-3 h-3" /> K
          </span>
        </div>
      </div>
    </div>
  );
}
