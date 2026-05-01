import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard,
  FolderKanban,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import SaarthiLogo from '../common/SaarthiLogo';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#13131f] z-40">
      {/* Logo */}
      <div className="flex items-center px-4 h-20 border-b border-slate-100 dark:border-slate-700/60">
        <SaarthiLogo size={80} glow />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 border-t border-slate-100 dark:border-slate-700/60 pt-3 space-y-1">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white uppercase">
              {user?.name?.[0] || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item w-full ${isActive ? 'active' : ''}`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>

        {/* Theme toggle */}
        <button onClick={toggle} className="nav-item w-full">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Logout */}
        <button onClick={logout} className="nav-item w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
