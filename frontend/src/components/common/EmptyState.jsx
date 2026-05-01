/**
 * EmptyState — reusable empty state component.
 *
 * Usage:
 *   <EmptyState
 *     icon={<FolderKanban className="w-10 h-10" />}
 *     title="No projects yet"
 *     description="Create your first project to get started."
 *     action={{ label: 'New Project', onClick: () => setShowModal(true) }}
 *   />
 */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-5"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
