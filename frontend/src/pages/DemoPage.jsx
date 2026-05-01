import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEMO_PROJECTS, DEMO_TASKS_BY_PROJECT, DEMO_MEMBERS } from '../data/demoData';
import TaskCard from '../components/common/TaskCard';
import SaarthiLogo from '../components/common/SaarthiLogo';
import {
  FolderKanban, CheckSquare, Users, TrendingUp,
  ArrowRight, Zap, X,
} from 'lucide-react';

const STATUS_COLS   = ['todo', 'inprogress', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const STATUS_DOT    = {
  todo:       'bg-slate-400',
  inprogress: 'bg-blue-500',
  done:       'bg-emerald-500',
};

// ── Demo Banner ───────────────────────────────────────────────────────────────
function DemoBanner() {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3
      bg-gradient-to-r from-amber-500/90 to-orange-500/90
      text-white text-sm font-medium rounded-xl shadow-lg mb-6">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span>
          You're in <strong>Demo Mode</strong> — data is local only and resets on refresh.
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          to="/register"
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30
            rounded-lg text-xs font-semibold transition-all"
        >
          Sign Up Free →
        </Link>
        <Link to="/login" className="text-white/70 hover:text-white text-xs underline">
          Login
        </Link>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}><Icon className="w-6 h-6" /></div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mini Task Detail Drawer ───────────────────────────────────────────────────
function TaskDrawer({ task, members, onClose, onStatusChange }) {
  if (!task) return null;
  const assignee = members.find((m) => m.userId === task.assignedTo);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">{task.title}</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <div className="modal-body space-y-4">
          {task.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="label mb-0">Priority:</span>
            <span className={`badge capitalize badge-${task.priority}`}>{task.priority}</span>
          </div>
          {assignee && (
            <div className="flex items-center gap-2">
              <span className="label mb-0">Assigned:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="text-[9px] text-white font-bold uppercase">{assignee.name[0]}</span>
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{assignee.name}</span>
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="label">Move to column</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_COLS.map((s) => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(task.id, s); onClose(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${task.status === s
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400'
                    }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <p className="text-xs text-slate-400 italic">Demo mode — changes reset on refresh</p>
          <button onClick={onClose} className="btn-primary">Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Demo Page ─────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [activeProject, setActiveProject] = useState(DEMO_PROJECTS[0].id);
  const [tasks, setTasks] = useState({ ...DEMO_TASKS_BY_PROJECT });
  const [selectedTask, setSelectedTask] = useState(null);

  const project      = DEMO_PROJECTS.find((p) => p.id === activeProject);
  const currentTasks = tasks[activeProject] || [];
  const members      = project?.members || DEMO_MEMBERS;

  const totalTasks = Object.values(tasks).flat().length;
  const doneTasks  = Object.values(tasks).flat().filter((t) => t.status === 'done').length;
  const inProgress = Object.values(tasks).flat().filter((t) => t.status === 'inprogress').length;

  const tasksByStatus = STATUS_COLS.reduce((acc, s) => {
    acc[s] = currentTasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const handleStatusChange = (taskId, newStatus) => {
    setTasks((prev) => ({
      ...prev,
      [activeProject]: prev[activeProject].map((t) =>
        t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f1a]">
      {/* ── Top nav ── */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 h-14
        bg-white/80 dark:bg-[#13131f]/80 backdrop-blur border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <SaarthiLogo size={60} />
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
            bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full ml-2">
            Demo
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary text-sm py-1.5">
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <DemoBanner />

        {/* Greeting */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Good morning, Explorer 👋</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              This is a fully interactive demo. Move tasks, switch projects — no login needed.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={DEMO_PROJECTS.length}
            color="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" />
          <StatCard icon={CheckSquare} label="Total Tasks" value={totalTasks}
            color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            sub={`${doneTasks} completed`} />
          <StatCard icon={TrendingUp} label="In Progress" value={inProgress}
            color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" />
          <StatCard icon={Users} label="Team Members" value={DEMO_MEMBERS.length}
            color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Project Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {DEMO_PROJECTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeProject === p.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STATUS_COLS.map((status) => (
            <div key={status} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {STATUS_LABELS[status]}
                </span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full
                  bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {tasksByStatus[status].length}
                </span>
              </div>

              {/* Task cards */}
              <div className="space-y-3 min-h-[120px]">
                {tasksByStatus[status].length === 0 ? (
                  <div className="flex items-center justify-center h-20
                    border-2 border-dashed border-slate-200 dark:border-slate-700/60
                    rounded-xl text-xs text-slate-400 italic">
                    No tasks here
                  </div>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onEdit={setSelectedTask}
                      onDelete={() => {}}
                      userRole="admin"
                      currentUserId="demo-u1"
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA footer */}
        <div className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #6366f1 0%, transparent 60%)' }} />
          <div className="relative z-10 p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Ready to use the real thing?</h2>
            <p className="text-indigo-300 text-sm max-w-md mx-auto">
              Sign up free and get access to AI task generation, real-time collaboration, and more.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/register"
                className="px-6 py-2.5 bg-white text-indigo-700 font-semibold rounded-xl
                  hover:bg-indigo-50 transition-all shadow-lg text-sm">
                Create Free Account
              </Link>
              <Link to="/login"
                className="px-6 py-2.5 bg-white/10 text-white border border-white/20 font-medium
                  rounded-xl hover:bg-white/20 transition-all text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
