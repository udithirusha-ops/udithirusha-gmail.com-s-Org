import React from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import { StudyTask } from '../types/study';
import { isRecurringTask, isTaskOverdue } from '../utils/calculations';
import { formatShortDate } from '../utils/colomboTime';
import { TaskTypeMarkers } from './SubjectBadge';

interface TaskRowProps {
  task: StudyTask;
  todayStr: string;
  onToggle: (id: string) => void;
  onEdit: (task: StudyTask) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  todayStr,
  onToggle,
  onEdit,
  onDelete,
  compact = false,
}) => {
  const overdue = isTaskOverdue(task, todayStr);
  const recurring = isRecurringTask(task);
  const theme = SUBJECT_THEMES[task.category];

  return (
    <div
      className={`group flex items-start sm:items-center justify-between gap-3 py-3 ${
        compact ? 'px-3' : 'px-4'
      } border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          aria-label={
            recurring
              ? `Complete current occurrence of "${task.title}"`
              : task.completed
                ? `Mark "${task.title}" incomplete`
                : `Mark "${task.title}" complete`
          }
          className="mt-0.5 sm:mt-0 shrink-0 min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <span
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              task.completed
                ? 'text-white border-transparent'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-slate-500'
            }`}
            style={task.completed ? { backgroundColor: theme.color } : undefined}
          >
            {task.completed && <Check size={13} strokeWidth={3} aria-hidden="true" />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={`text-sm font-medium leading-snug break-words ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <TaskTypeMarkers category={task.category} isRecurring={recurring} />
            <span aria-hidden="true">·</span>
            <span
              className={`font-mono tabular-nums ${
                overdue
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {formatShortDate(task.dueDate)}
              {overdue ? ' · Overdue' : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                task.priority === 'high'
                  ? 'text-amber-700 dark:text-amber-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {task.priority === 'high'
                ? 'High priority'
                : task.priority === 'low'
                  ? 'Low priority'
                  : 'Medium priority'}
            </span>
            {task.progress > 0 && !task.completed && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{task.progress}%</span>
              </>
            )}
            {task.occurrenceHistory.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {task.occurrenceHistory.length} done
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit "${task.title}"`}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete "${task.title}"`}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
