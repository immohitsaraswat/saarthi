import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { dashboardAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import {
  CheckSquare, AlertTriangle, FolderKanban,
  TrendingUp, ArrowRight, CalendarClock, Target,
} from 'lucide-react';
import OnboardingChecklist from '../components/common/OnboardingChecklist';
import FeatureHighlights from '../components/common/FeatureHighlights';

const STATUS_COLORS   = { todo: '#94a3b8', inprogress: '#3b82f6', done: '#10b981' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-semibold text-slate-800 dark:text-white">{payload[0].name}</p>
        <p className="text-slate-500">{payload[0].value} tasks</p>
      </div>
    );
  }
  return null;
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(() => {
    dashboardAPI.get()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard();
    // Refresh stats when user switches back to this tab
    const onFocus = () => fetchDashboard();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="page-loader flex-col gap-3">
        <div className="spinner w-8 h-8 text-primary-500" />
        <p className="text-slate-400 text-sm">Loading dashboard…</p>
      </div>
    );
  }

  const total = data?.totalTasks ?? 0;
  const done  = data?.tasksByStatus?.done ?? 0;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const pieData = data
    ? [
        { name: 'To Do',       value: data.tasksByStatus.todo },
        { name: 'In Progress', value: data.tasksByStatus.inprogress },
        { name: 'Done',        value: data.tasksByStatus.done },
      ].filter((d) => d.value > 0)
    : [];

  const barData = (data?.tasksByUser || []).map((u) => ({
    name:  u.name?.split(' ')[0] || 'User',
    Tasks: u.count,
  }));

  const priorityData = data
    ? [
        { name: 'High',   value: data.tasksByPriority?.high   ?? 0, fill: PRIORITY_COLORS.high },
        { name: 'Medium', value: data.tasksByPriority?.medium ?? 0, fill: PRIORITY_COLORS.medium },
        { name: 'Low',    value: data.tasksByPriority?.low    ?? 0, fill: PRIORITY_COLORS.low },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Here's what's happening across your projects today.
          </p>
        </div>
        <Link to="/projects" className="btn-primary">
          <FolderKanban className="w-4 h-4" /> View Projects
        </Link>
      </div>

      {/* Onboarding checklist — hides automatically when all steps complete */}
      <OnboardingChecklist />

      {/* Feature highlights — dismissible panel */}
      <FeatureHighlights />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FolderKanban} label="Total Projects" value={data?.totalProjects ?? 0}
          color="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
        />
        <StatCard
          icon={CheckSquare} label="Total Tasks" value={total}
          color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          sub={`${done} completed`}
        />
        <StatCard
          icon={AlertTriangle} label="Overdue" value={data?.overdueTasks?.length ?? 0}
          color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
        <StatCard
          icon={CalendarClock} label="Due Soon" value={data?.dueSoonTasks?.length ?? 0}
          color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          sub="Within 3 days"
        />
      </div>

      {/* Completion Rate */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-500" /> Overall Completion Rate
          </h2>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{completionPct}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-primary-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5">
          <span>{done} done</span>
          <span>{total - done} remaining</span>
        </div>
      </div>

      {/* Charts — row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Tasks by Status
          </h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No tasks yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name}
                      fill={STATUS_COLORS[entry.name === 'To Do' ? 'todo' : entry.name === 'In Progress' ? 'inprogress' : 'done']}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks per member Bar */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Tasks per Member
          </h2>
          {barData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No assigned tasks yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={32}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Tasks" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts — row 2: Priority breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Tasks by Priority
          </h2>
          {priorityData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No tasks yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={48} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary-500" /> Recent Projects
            </h2>
            <Link to="/projects" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {(data?.recentProjects || []).length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentProjects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{p.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.memberIds?.length ?? p.members?.length ?? 0} members</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Tasks */}
      {(data?.overdueTasks || []).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Tasks
          </h2>
          <div className="space-y-3">
            {data.overdueTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Due {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <span className={`badge-${task.priority} ml-auto flex-shrink-0 capitalize`}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
