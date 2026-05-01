import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useRealtimeTasks } from '../hooks/useRealtimeTasks';
import toast from 'react-hot-toast';
import TaskModal from '../components/TaskModal';
import TaskCard from '../components/common/TaskCard';
import EmptyState from '../components/common/EmptyState';
import { KanbanSkeleton } from '../components/common/SkeletonCard';
import {
  STATUS_COLS, STATUS_LABELS, STATUS_DOT, PRIORITY_ORDER, getDueBadge,
} from '../utils/constants';
import {
  Plus, X, Search, Trash2, UserPlus, ChevronLeft,
  AlertTriangle, CalendarDays, ArrowUpDown, SlidersHorizontal, Wifi,
} from 'lucide-react';

// ── Add Member Modal ───────────────────────────────────────────────────────────
const AddMemberModal = ({ projectId, onClose, onAdded }) => {
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsAPI.addMember(projectId, { email, role });
      toast.success('Member added!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">Add Member</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input type="email" className="input" placeholder="member@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Role</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="spinner" /> : <UserPlus className="w-4 h-4" />}
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Project Detail Page ────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id }   = useParams();
  const { user, updateOnboarding } = useAuth();

  const [project, setProject]         = useState(null);
  const [projLoading, setProjLoading] = useState(true);
  const [activeTab, setActiveTab]     = useState('board');

  // Filter / sort state
  const [search, setSearch]                   = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterPriority, setFilterPriority]   = useState('');
  const [filterAssignee, setFilterAssignee]   = useState('');
  const [sortBy, setSortBy]                   = useState('createdAt');
  const [sortDir, setSortDir]                 = useState('desc');
  const [showFilters, setShowFilters]         = useState(false);

  // Modal state
  const [showTaskModal, setShowTaskModal]       = useState(false);
  const [editingTask, setEditingTask]           = useState(null);
  const [showMemberModal, setShowMemberModal]   = useState(false);

  // ── Real-time tasks ──────────────────────────────────────────────────────────
  const { tasks, setTasks, loading: tasksLoading, isLive, refresh } = useRealtimeTasks(id);

  const userRole = useMemo(
    () => project?.members?.find((m) => m.userId === user?.id)?.role,
    [project, user?.id]
  );

  const loadProject = useCallback(async () => {
    setProjLoading(true);
    try {
      const res = await projectsAPI.get(id);
      setProject(res.data.project);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load project.');
    } finally {
      setProjLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProject(); }, [loadProject]);

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const sortTasks = useCallback((list) => {
    return [...list].sort((a, b) => {
      let va, vb;
      if (sortBy === 'priority') {
        va = PRIORITY_ORDER[a.priority] ?? 99;
        vb = PRIORITY_ORDER[b.priority] ?? 99;
      } else if (sortBy === 'dueDate') {
        va = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        vb = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      } else {
        va = a.createdAt || '';
        vb = b.createdAt || '';
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [sortBy, sortDir]);

  // ── Memoized derived data ────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => sortTasks(
    tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !(t.description || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && t.status !== filterStatus)     return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterAssignee && t.assignedTo !== filterAssignee) return false;
      return true;
    })
  ), [tasks, search, filterStatus, filterPriority, filterAssignee, sortTasks]);

  const tasksByStatus = useMemo(() =>
    STATUS_COLS.reduce((acc, s) => {
      acc[s] = filteredTasks.filter((t) => t.status === s);
      return acc;
    }, {}),
  [filteredTasks]);

  const overdueTasks = useMemo(
    () => tasks.filter((t) => getDueBadge(t.dueDate, t.status) === 'overdue'),
    [tasks]
  );
  const todayTasks = useMemo(
    () => tasks.filter((t) => getDueBadge(t.dueDate, t.status) === 'today'),
    [tasks]
  );

  const hasActiveFilters = search || filterStatus || filterPriority || filterAssignee || sortBy !== 'createdAt';

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterStatus(''); setFilterPriority('');
    setFilterAssignee(''); setSortBy('createdAt'); setSortDir('desc');
  }, []);

  // ── Task mutations ───────────────────────────────────────────────────────────
  // Called immediately (optimistically) AND again when server confirms or fails
  const handleTaskSave = useCallback((task, action, targetId) => {
    setTasks((prev) => {
      if (action === 'create')  return task ? [task, ...prev] : prev;
      if (action === 'update')  return prev.map((t) => t.id === task?.id ? task : t);
      if (action === 'replace') return prev.map((t) => t.id === targetId ? task : t);
      if (action === 'remove')  return prev.filter((t) => t.id !== targetId);
      return prev;
    });
    // Mark onboarding step as done immediately (no extra API call)
    if (action === 'create' || action === 'replace') updateOnboarding('createdTask');
  }, [setTasks, updateOnboarding]);


  const handleDeleteTask = useCallback(async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted.');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to delete task.');
    }
  }, [setTasks]);

  const handleOpenEdit = useCallback((task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  }, []);

  const handleRemoveMember = useCallback(async (memberId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await projectsAPI.removeMember(id, memberId);
      toast.success('Member removed.');
      loadProject();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to remove member.');
    }
  }, [id, loadProject]);

  // Called by AddMemberModal after successful add
  const handleMemberAdded = useCallback(() => {
    updateOnboarding('invitedMember');
    loadProject();
  }, [updateOnboarding, loadProject]);

  // ── Render ───────────────────────────────────────────────────────────────────
  if (projLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <KanbanSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-8 h-8" />}
        title="Project not found"
        description="This project may have been deleted or you don't have access."
        action={{ label: '← Back to Projects', onClick: () => window.history.back() }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <Link to="/projects" className="text-sm text-slate-400 hover:text-primary-500 flex items-center gap-1 mb-3">
          <ChevronLeft className="w-4 h-4" /> All Projects
        </Link>
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{project.name}</h1>
              {/* Live indicator */}
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                isLive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}>
                <Wifi className="w-3 h-3" />
                {isLive ? 'Live' : 'Connecting…'}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{project.description}</p>
            )}
          </div>
          {userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-sm">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
              <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> New Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deadline banners */}
      {overdueTasks.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{overdueTasks.length}</strong> overdue task{overdueTasks.length !== 1 ? 's' : ''} — action required!</span>
        </div>
      )}
      {todayTasks.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm">
          <CalendarDays className="w-4 h-4 flex-shrink-0" />
          <span><strong>{todayTasks.length}</strong> task{todayTasks.length !== 1 ? 's' : ''} due today!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
        {[
          { key: 'board',   label: `Board (${tasks.length})` },
          { key: 'members', label: `Members (${project.members?.length ?? 0})` },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Board Tab ── */}
      {activeTab === 'board' && (
        <>
          {/* Filter / Sort Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className="input pl-9 py-2 text-sm" placeholder="Search tasks…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`btn-secondary text-sm py-2 ${showFilters ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 text-primary-600' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-primary-500 inline-block" />}
              </button>
              <div className="flex items-center gap-1">
                <select className="input py-2 text-sm w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="createdAt">Sort: Newest</option>
                  <option value="dueDate">Sort: Due Date</option>
                  <option value="priority">Sort: Priority</option>
                </select>
                <button
                  onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                  className="btn-icon text-slate-500"
                  title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
              {hasActiveFilters && (
                <button className="btn-ghost text-sm py-2" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <select className="input py-1.5 text-sm w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <select className="input py-1.5 text-sm w-auto" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
                <select className="input py-1.5 text-sm w-auto" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                  <option value="">All Members</option>
                  {project.members?.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <p className="text-xs text-slate-400">
              Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
            </p>
          )}

          {/* Kanban columns */}
          {tasksLoading ? (
            <KanbanSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {STATUS_COLS.map((status) => (
                <div key={status} className="kanban-col">
                  <div className="kanban-col-header mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="ml-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {tasksByStatus[status]?.length ?? 0}
                      </span>
                    </div>
                    {userRole === 'admin' && (
                      <button
                        onClick={() => { setEditingTask({ status }); setShowTaskModal(true); }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={`Add task to ${STATUS_LABELS[status]}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {tasksByStatus[status]?.length === 0 ? (
                    <div className="text-center py-8 text-slate-300 dark:text-slate-600 text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    tasksByStatus[status].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        members={project.members || []}
                        onEdit={handleOpenEdit}
                        onDelete={handleDeleteTask}
                        userRole={userRole}
                        currentUserId={user?.id}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Members Tab ── */}
      {activeTab === 'members' && (
        <div className="card max-w-2xl">
          {(project.members?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<UserPlus className="w-8 h-8" />}
              title="No members yet"
              description="Add your first team member to start collaborating."
              action={userRole === 'admin' ? { label: 'Add Member', onClick: () => setShowMemberModal(true) } : undefined}
            />
          ) : (
            <>
              <div className="space-y-3">
                {project.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white uppercase">{m.name?.[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                    <span className={`badge capitalize ${m.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'badge-todo'}`}>
                      {m.role}
                    </span>
                    {userRole === 'admin' && m.userId !== user?.id && (
                      <button
                        aria-label="Remove member"
                        onClick={() => handleRemoveMember(m.userId)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {userRole === 'admin' && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={() => setShowMemberModal(true)} className="btn-secondary w-full justify-center">
                    <UserPlus className="w-4 h-4" /> Add Member
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={editingTask?.id ? editingTask : editingTask?.status ? { status: editingTask.status } : null}
          projectId={id}
          members={project.members || []}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleTaskSave}
          userRole={userRole}
          currentUserId={user?.id}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}
