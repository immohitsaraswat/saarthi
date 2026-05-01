import { CheckCircle2, Circle, FolderPlus, ListPlus, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const STEPS = [
  {
    key:   'createdProject',
    icon:  FolderPlus,
    label: 'Create your first project',
    hint:  'Go to Projects → New Project',
  },
  {
    key:   'createdTask',
    icon:  ListPlus,
    label: 'Add a task to a project',
    hint:  'Open a project → Create Task',
  },
  {
    key:   'invitedMember',
    icon:  UserPlus,
    label: 'Invite a team member',
    hint:  'Open a project → Members → Add',
  },
];

/**
 * OnboardingChecklist — shown on the Dashboard until all 3 steps complete.
 * Reads onboarding state from AuthContext (set at login/register, updated live).
 */
export default function OnboardingChecklist() {
  const { user } = useAuth();

  // null = existing user who registered before this feature → hide checklist
  if (!user?.onboarding) return null;

  const onboarding     = user.onboarding;
  const completedCount = STEPS.filter((s) => onboarding[s.key]).length;
  const allDone        = completedCount === STEPS.length;

  if (allDone) return null;

  return (
    <div className="card mb-2 border border-primary-200 dark:border-primary-900/50 bg-gradient-to-br from-white to-primary-50/30 dark:from-slate-800 dark:to-primary-950/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            🚀 Get started with Saarthi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {completedCount} of {STEPS.length} steps completed
          </p>
        </div>
        {/* Progress pill */}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
          {Math.round((completedCount / STEPS.length) * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-700"
          style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const done = !!onboarding[step.key];
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                done
                  ? 'bg-emerald-50 dark:bg-emerald-950/20'
                  : 'bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              {/* Status icon */}
              {done
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />}

              {/* Step icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                <Icon className={`w-4 h-4 ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  done
                    ? 'text-emerald-700 dark:text-emerald-400 line-through opacity-70'
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {step.label}
                </p>
                {!done && (
                  <p className="text-xs text-slate-400 mt-0.5">{step.hint}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
