import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FolderKanban, Plus, Trash2, ArrowRight, Users, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ── Create Project Modal ────────────────────────────────────────────────────
const CreateModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      onCreate(res.data.project);
      toast.success('Project created! 🎉');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">New Project</h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="label" htmlFor="proj-name">Project Name *</label>
              <input id="proj-name" className="input" placeholder="e.g. Website Redesign"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="proj-desc">Description</label>
              <textarea id="proj-desc" className="input resize-none" rows={3}
                placeholder="What is this project about?"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <span className="spinner" /> : <Plus className="w-4 h-4" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Projects Page ─────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { updateOnboarding } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadProjects = () => {
    projectsAPI.list()
      .then((res) => setProjects(res.data.projects))
      .catch(() => toast.error('Failed to load projects.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
    updateOnboarding('createdProject'); // ← mark step 1 done instantly
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success('Project deleted.');
    } catch {
      toast.error('Failed to delete project.');
    }
  };

  const PALETTE = [
    'from-primary-400 to-primary-600',
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
    'from-rose-400 to-rose-600',
    'from-amber-400 to-amber-600',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner w-8 h-8 text-primary-500" /></div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No projects yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Create your first project to get started.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <div key={p.id} className="card-hover group relative">
              {/* Color accent top */}
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${PALETTE[i % PALETTE.length]} mb-4`} />

              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${PALETTE[i % PALETTE.length]} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-base font-bold">{p.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Created {p.createdAt ? format(parseISO(p.createdAt), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
              </div>

              {p.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{p.description}</p>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  {p.memberIds?.length ?? 0} member{p.memberIds?.length !== 1 ? 's' : ''}
                </div>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(p.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Link to={`/projects/${p.id}`} className="btn-secondary text-xs py-1.5">
                  Open <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
