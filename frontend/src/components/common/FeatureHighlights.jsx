import { useState } from 'react';
import { Bot, Keyboard, Zap, BarChart2, X } from 'lucide-react';

const FEATURES = [
  {
    icon:  Bot,
    color: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    title: 'AI Task Assistant',
    desc:  'Generate smart subtasks instantly with Groq AI.',
  },
  {
    icon:  Keyboard,
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    title: 'Command Palette',
    desc:  'Navigate anywhere. Press ⌘K (or Ctrl+K) to open.',
    action: () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    },
    actionLabel: 'Try it',
  },
  {
    icon:  Zap,
    color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    title: 'Optimized Updates',
    desc:  'Tasks update instantly. Server syncs in background.',
  },
  {
    icon:  BarChart2,
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    title: 'Analytics Dashboard',
    desc:  'Visual charts for task status and priority breakdown.',
  },
];

const LS_KEY = 'saarthi_features_dismissed';

export default function FeatureHighlights() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(LS_KEY) === '1'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(LS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="card relative animate-fade-in">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss feature highlights"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400
          hover:text-slate-600 dark:hover:text-slate-300
          hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <p className="text-[11px] font-semibold uppercase tracking-widest
        text-slate-400 dark:text-slate-500 mb-3">
        ✨ What Saarthi can do
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {FEATURES.map(({ icon: Icon, color, title, desc, action, actionLabel }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-3 rounded-xl
              bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60
              hover:border-slate-200 dark:hover:border-slate-600 transition-colors group"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                {title}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              {action && (
                <button
                  onClick={action}
                  className="mt-1.5 text-[10px] font-semibold text-primary-600 dark:text-primary-400
                    hover:underline transition-all"
                >
                  {actionLabel} →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
