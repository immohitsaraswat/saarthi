import { useState, useEffect } from 'react';
import { tasksAPI, commentsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { X, Send, Trash2, MessageSquare, Activity, Settings } from 'lucide-react';
import AISuggestions from './tasks/AISuggestions';

const PRIORITY_BADGE = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
const STATUS_COLORS = { todo: 'bg-slate-400', inprogress: 'bg-blue-500', done: 'bg-emerald-500' };

export default function TaskModal({ task, projectId, members, onClose, onSave, userRole, currentUserId }) {
  const { user } = useAuth();
  const isNew = !task?.id && !task?.title;
  const isAssignedToMe = task?.assignedTo === currentUserId;
  const canEditAll = isNew || userRole === 'admin';
  const canEditStatus = canEditAll || isAssignedToMe;
  const isReadOnly = !canEditAll && !isAssignedToMe;

  const [activeTab, setActiveTab] = useState('details');
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assignedTo: task?.assignedTo || '',
  });
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);

  const assignee = members.find((m) => m.userId === task?.assignedTo);

  useEffect(() => {
    if (!isNew && task?.id) {
      setFeedLoading(true);
      commentsAPI.list(task.id)
        .then((res) => {
          setComments(res.data.comments || []);
          setActivity(res.data.activity || []);
        })
        .catch(() => {})
        .finally(() => setFeedLoading(false));
    }
  }, [task?.id, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      dueDate:    form.dueDate || null,
      assignedTo: form.assignedTo || null,
    };

    if (isNew) {
      // ── Optimistic create ──────────────────────────────────────────────────────
      // Generate temp ID so the task appears instantly in the list
      const tempId = `optimistic_${Date.now()}`;
      const optimistic = {
        id: tempId, projectId, ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: true,
      };
      onSave(optimistic, 'create');
      onClose(); // close modal immediately — user sees the task now

      // Confirm with server in background; replace temp once we have the real ID
      try {
        const res = await tasksAPI.create(projectId, payload);
        onSave(res.data.task, 'replace', tempId);
        toast.success('Task created!');
      } catch (err) {
        onSave(null, 'remove', tempId);
        toast.error(err.response?.data?.message || 'Failed to create task.');
      }

    } else {
      // ── Optimistic update ──────────────────────────────────────────────────────
      const updatePayload = canEditAll ? payload : { status: form.status };
      const previous  = { ...task };
      const optimistic = { ...task, ...updatePayload, updatedAt: new Date().toISOString() };
      onSave(optimistic, 'update');
      onClose(); // close modal immediately — user sees the change now

      try {
        await tasksAPI.update(task.id, updatePayload);
        toast.success('Task updated!');
      } catch (err) {
        onSave(previous, 'update'); // revert on error
        toast.error(err.response?.data?.message || 'Failed to save task.');
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await commentsAPI.add(task.id, commentText.trim());
      setComments((prev) => [...prev, res.data.comment]);
      setCommentText('');
      toast.success('Comment added!');
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentsAPI.delete(task.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted.');
    } catch {
      toast.error('Failed to delete comment.');
    }
  };

  // Merge comments + activity into one timeline sorted by date
  const timeline = [
    ...comments.map((c) => ({ ...c, _type: 'comment' })),
    ...activity.map((a) => ({ ...a, _type: 'activity' })),
  ].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  const tabs = isNew ? [] : [
    { key: 'details', label: 'Details', icon: Settings },
    { key: 'activity', label: `Activity${timeline.length ? ` (${timeline.length})` : ''}`, icon: Activity },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">
              {isNew ? 'Create Task' : isReadOnly ? 'Task Details' : 'Edit Task'}
            </h2>
            {isReadOnly && <p className="text-xs text-slate-400 mt-0.5">Read-only — not assigned to you</p>}
            {!isNew && isAssignedToMe && userRole !== 'admin' && (
              <p className="text-xs text-primary-500 mt-0.5">✓ Assigned to you — you can update status &amp; comment</p>
            )}
          </div>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs (not shown for new task) */}
        {!isNew && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 flex-shrink-0 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* ── DETAILS TAB ── */}
          {(isNew || activeTab === 'details') && (
            isReadOnly ? (
              <div className="modal-body space-y-4">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{task?.title}</p>
                {task?.description && <p className="text-sm text-slate-500">{task.description}</p>}
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="label">Priority</p><span className={`${PRIORITY_BADGE[task?.priority]} capitalize`}>{task?.priority}</span></div>
                  <div><p className="label">Status</p><span className="badge badge-todo">{STATUS_LABELS[task?.status]}</span></div>
                  <div><p className="label">Due Date</p><p className="text-sm text-slate-500">{task?.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—'}</p></div>
                </div>
                <div><p className="label">Assigned To</p><p className="text-sm text-slate-500">{assignee?.name || 'Unassigned'}</p></div>
                <div className="modal-footer px-0 pb-0">
                  <button onClick={onClose} className="btn-secondary">Close</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {canEditAll && (
                    <>
                      <div className="form-group">
                        <label className="label">Title *</label>
                        <input className="input" placeholder="Task title"
                          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="label">Description</label>
                        <textarea className="input resize-none" rows={3}
                          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="label">Priority</label>
                          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                            <option value="low">🟢 Low</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="high">🔴 High</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="label">Due Date</label>
                          <input type="date" className="input"
                            value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">Assign To</label>
                        <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>{m.name} ({m.role})</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Member view: show task info + only status editable */}
                  {!canEditAll && (
                    <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{task?.title}</p>
                      {task?.description && <p className="text-xs text-slate-500">{task.description}</p>}
                      <div className="flex gap-3">
                        <span className={`${PRIORITY_BADGE[task?.priority]} capitalize`}>{task?.priority}</span>
                        {task?.dueDate && <span className="text-xs text-slate-400">Due {format(parseISO(task.dueDate), 'MMM d, yyyy')}</span>}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="todo">To Do</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                {/* AI Subtask Generator — admin only */}
                {canEditAll && (
                  <div className="px-6 pb-2">
                    <AISuggestions
                      projectId={projectId}
                      taskTitle={form.title}
                      members={members}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}

                <div className="modal-footer">
                  <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">
                    {isNew ? 'Create Task' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )
          )}

          {/* ── ACTIVITY & COMMENTS TAB ── */}
          {!isNew && activeTab === 'activity' && (
            <div className="modal-body space-y-4">
              {/* Comment input — visible to all members */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-white font-bold uppercase">{user?.name?.[0]}</span>
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    className="input text-sm flex-1"
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={commentLoading || !commentText.trim()}
                    className="btn-primary px-3 py-2"
                  >
                    {commentLoading ? <span className="spinner w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              {/* Timeline */}
              {feedLoading ? (
                <div className="flex justify-center py-8"><span className="spinner w-6 h-6 text-primary-500" /></div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No activity yet. Be the first to comment!
                </div>
              ) : (
                <div className="space-y-3">
                  {timeline.map((item) => (
                    <div key={item.id} className="flex gap-3 group">
                      {item._type === 'comment' ? (
                        <>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] text-white font-bold uppercase">{item.userName?.[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.userName}</span>
                              <span className="text-xs text-slate-400">{format(parseISO(item.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700">{item.text}</p>
                          </div>
                          {(item.userId === currentUserId || userRole === 'admin') && (
                            <button
                              onClick={() => handleDeleteComment(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all mt-1 flex-shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{item.userName}</span>
                              {' moved task from '}
                              <span className="inline-flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full inline-block ${STATUS_COLORS[item.from]}`} />
                                <span className="font-medium">{item.fromLabel}</span>
                              </span>
                              {' → '}
                              <span className="inline-flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full inline-block ${STATUS_COLORS[item.to]}`} />
                                <span className="font-medium">{item.toLabel}</span>
                              </span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(item.createdAt), 'MMM d, h:mm a')}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
