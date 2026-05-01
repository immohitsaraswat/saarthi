import { useState, useEffect } from 'react';
import { User, Palette, Save, Loader2, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const PRIORITIES = [
  { value: 'low',    label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high',   label: '🔴 High' },
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { isDark, toggle }   = useTheme();

  const [name, setName]                 = useState(user?.name || '');
  const [defaultPriority, setDefaultPriority] = useState(
    user?.preferences?.defaultPriority || 'medium'
  );
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  // Keep form in sync if user object updates (e.g. after refreshUser)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDefaultPriority(user.preferences?.defaultPriority || 'medium');
    }
  }, [user?.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name cannot be empty.'); return; }
    setSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        preferences: { defaultPriority },
      });
      setSaved(true);
      toast.success('Settings saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Manage your profile and app preferences.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Profile ─────────────────────────────────────────────────── */}
        <Section icon={User} title="Profile">
          <div className="space-y-4">
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                id="settings-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
              />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                id="settings-email"
                className="input opacity-60 cursor-not-allowed"
                value={user?.email || ''}
                readOnly
                title="Email cannot be changed"
              />
              <p className="text-xs text-slate-400 mt-1">Email address cannot be changed.</p>
            </div>
          </div>
        </Section>

        {/* ── Preferences ─────────────────────────────────────────────── */}
        <Section icon={Palette} title="Preferences">
          <div className="space-y-5">
            {/* Dark mode toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Dark Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">Toggle between light and dark theme</p>
              </div>
              <button
                type="button"
                id="settings-dark-mode-toggle"
                onClick={toggle}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  isDark ? 'bg-primary-600' : 'bg-slate-200'
                }`}
                aria-label="Toggle dark mode"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
                  isDark ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  {isDark
                    ? <Moon className="w-3 h-3 text-primary-600" />
                    : <Sun className="w-3 h-3 text-amber-500" />}
                </span>
              </button>
            </div>

            {/* Default priority */}
            <div className="form-group">
              <label className="label" htmlFor="settings-priority">Default Task Priority</label>
              <select
                id="settings-priority"
                className="input"
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Applied when creating new tasks.</p>
            </div>
          </div>
        </Section>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            id="settings-save"
            type="submit"
            disabled={saving}
            className="btn-primary gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
