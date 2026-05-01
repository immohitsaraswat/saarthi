import { useState, useCallback } from 'react';
import { Sparkles, X, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { aiAPI, tasksAPI } from '../../api';
import { PRIORITY_BADGE } from '../../utils/constants';
import toast from 'react-hot-toast';

/**
 * AISuggestions — "Generate with AI" panel inside TaskModal.
 * Only shown to admins. Calls POST /api/ai/generate-tasks.
 */
export default function AISuggestions({ projectId, taskTitle, members, currentUserId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  // Track which suggestion indices have been added to DB
  const [addedSet, setAddedSet]       = useState(new Set());
  const [addingIdx, setAddingIdx]     = useState(null);
  const [open, setOpen]               = useState(false);

  const handleGenerate = useCallback(async () => {
    const goal = taskTitle?.trim();
    if (!goal || goal.length < 3) {
      toast.error('Add a task title first so AI has context.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setAddedSet(new Set());
    setOpen(true);
    try {
      const res = await aiAPI.generateTasks(goal);
      setSuggestions(res.data.tasks || []);
    } catch (err) {
      setError(err.userMessage || 'AI generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [taskTitle]);

  const handleAdd = useCallback(async (suggestion, idx) => {
    if (addedSet.has(idx)) return;
    setAddingIdx(idx);
    try {
      await tasksAPI.create(projectId, {
        title:      suggestion.title,
        priority:   suggestion.priority,
        status:     'todo',
        assignedTo: currentUserId,
      });
      setAddedSet((prev) => new Set([...prev, idx]));
      toast.success(`"${suggestion.title}" added to board!`);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to add task.');
    } finally {
      setAddingIdx(null);
    }
  }, [projectId, currentUserId, addedSet]);

  const handleDismiss = useCallback((idx) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== idx));
    setAddedSet((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
  }, []);

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
          bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
          text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Sparkles className="w-4 h-4" />}
        {loading ? 'Generating subtasks…' : '✨ Generate Subtasks with AI'}
      </button>

      {/* Results panel */}
      {open && (
        <div className="mt-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              AI Suggestions
            </p>
            <button
              type="button"
              onClick={() => { setOpen(false); setSuggestions([]); setError(null); }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Clear
            </button>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Suggestion cards */}
          {!loading && suggestions.map((s, idx) => {
            const isAdded   = addedSet.has(idx);
            const isAdding  = addingIdx === idx;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  isAdded
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${isAdded ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-70' : 'text-slate-800 dark:text-slate-200'}`}>
                    {s.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`${PRIORITY_BADGE[s.priority]} capitalize`}>{s.priority}</span>
                    <span className="text-xs text-slate-400">⏱ {s.estimate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAdded ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(s, idx)}
                      disabled={isAdding}
                      aria-label="Add to board"
                      className="p-1.5 rounded-md bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
                    >
                      {isAdding
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {!isAdded && (
                    <button
                      type="button"
                      onClick={() => handleDismiss(idx)}
                      aria-label="Dismiss suggestion"
                      className="p-1.5 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty after all dismissed */}
          {!loading && !error && open && suggestions.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-3">
              No suggestions — click Generate to try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
