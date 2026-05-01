/**
 * SkeletonCard — animated placeholder for task cards while loading.
 * Uses the same dimensions as a real TaskCard.
 */
export default function SkeletonCard() {
  return (
    <div className="task-card animate-pulse">
      <div className="h-1 rounded-full mb-3 bg-slate-200 dark:bg-slate-700 w-1/4" />
      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 w-3/4 mb-2" />
      <div className="h-3 rounded bg-slate-100 dark:bg-slate-700/60 w-1/2 mb-3" />
      <div className="flex gap-2 mt-3">
        <div className="h-5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-slate-700/60" />
      </div>
    </div>
  );
}

/**
 * KanbanSkeleton — renders 3 columns each with 2 skeleton cards.
 */
export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[0, 1, 2].map((col) => (
        <div key={col} className="kanban-col">
          {/* Column header skeleton */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-6 rounded-full bg-slate-100 dark:bg-slate-700/60" />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

/**
 * DashboardSkeleton — stat cards + chart placeholders.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2">
              <div className="h-7 w-12 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-700/60" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card h-64 bg-slate-50 dark:bg-slate-800" />
        <div className="card h-64 bg-slate-50 dark:bg-slate-800" />
      </div>
    </div>
  );
}
