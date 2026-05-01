import { memo } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, AlertTriangle, CalendarDays } from 'lucide-react';
import { PRIORITY_BADGE, PRIORITY_BAR_COLOR, getDueBadge } from '../../utils/constants';

/**
 * TaskCard — wrapped with React.memo so it only re-renders when its own
 * task data, members list, or role changes. This prevents the entire Kanban
 * column from re-rendering when an unrelated task is updated.
 */
const TaskCard = memo(function TaskCard({
  task, members, onEdit, onDelete, userRole, currentUserId,
}) {
  const dueBadge       = getDueBadge(task.dueDate, task.status);
  const assignee       = members.find((m) => m.userId === task.assignedTo);
  const isAssignedToMe = task.assignedTo === currentUserId;

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEdit(task)}
      className={[
        'task-card relative cursor-pointer',
        isAssignedToMe && userRole !== 'admin'
          ? 'ring-2 ring-primary-300 dark:ring-primary-700'
          : '',
        dueBadge === 'overdue' ? 'border-l-4 border-red-400' : '',
        dueBadge === 'today'   ? 'border-l-4 border-amber-400' : '',
      ].join(' ')}
      onClick={() => onEdit(task)}
    >
      {/* Priority bar */}
      <div className={`h-1 rounded-full mb-3 ${PRIORITY_BAR_COLOR[task.priority]}`} />

      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 leading-snug flex-1">
          {task.title}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAssignedToMe && userRole !== 'admin' && (
            <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 text-[10px]">
              Mine
            </span>
          )}
          {userRole === 'admin' && (
            <button
              aria-label="Delete task"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{task.description}</p>
      )}

      {/* Badges row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`${PRIORITY_BADGE[task.priority]} capitalize`}>{task.priority}</span>

        {task.dueDate && (
          <span className={[
            'flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded',
            dueBadge === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' :
            dueBadge === 'today'   ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
            dueBadge === 'soon'    ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400' :
            'text-slate-400',
          ].join(' ')}>
            {dueBadge === 'overdue'
              ? <AlertTriangle className="w-3 h-3" />
              : <CalendarDays className="w-3 h-3" />}
            {dueBadge === 'overdue' ? 'Overdue'
              : dueBadge === 'today' ? 'Due Today'
              : dueBadge === 'soon'  ? 'Due Soon'
              : format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Assignee */}
      {assignee && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] text-white font-bold uppercase">{assignee.name?.[0]}</span>
          </div>
          <span className="text-xs text-slate-400 truncate">{assignee.name}</span>
        </div>
      )}
    </div>
  );
});

export default TaskCard;
