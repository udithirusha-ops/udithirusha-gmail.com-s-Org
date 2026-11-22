import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import { StudyTask, TaskCategory } from '../types/study';
import { getTasksScheduledForDate, isRecurringTask } from '../utils/calculations';
import {
  addDaysToDateStr,
  formatShortDate,
  formatWeekdayShort,
  getWeekDatesMonToSun,
} from '../utils/colomboTime';
import { CategoryIcon } from './SubjectBadge';

interface WeeklySchedulePageProps {
  tasks: StudyTask[];
  todayStr: string;
  onToggleTask: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onOpenNewTaskModal: (defaultCategory?: TaskCategory, defaultDate?: string) => void;
}

export const WeeklySchedulePage: React.FC<WeeklySchedulePageProps> = ({
  tasks,
  todayStr,
  onToggleTask,
  onEditTask,
  onOpenNewTaskModal,
}) => {
  const [anchorDate, setAnchorDate] = useState(todayStr);
  const weekDates = getWeekDatesMonToSun(anchorDate);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Weekly Schedule (Monday – Sunday)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
            {formatShortDate(weekDates[0])} – {formatShortDate(weekDates[6])} · Powered by All Tasks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAnchorDate((d) => addDaysToDateStr(d, -7))}
            aria-label="Previous week"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate(todayStr)}
            className="px-3 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate((d) => addDaysToDateStr(d, 7))}
            aria-label="Next week"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {weekDates.map((dateStr) => {
          const isToday = dateStr === todayStr;
          const { tasksForDate, total, completed } = getTasksScheduledForDate(
            tasks,
            dateStr
          );

          return (
            <section
              key={dateStr}
              aria-label={`Schedule for ${dateStr}`}
              className={`rounded-2xl bg-white dark:bg-slate-900 border flex flex-col min-h-[220px] ${
                isToday
                  ? 'border-blue-600 dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatWeekdayShort(dateStr)}{' '}
                    {isToday && (
                      <span className="text-blue-600 dark:text-blue-400">· Today</span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {formatShortDate(dateStr)} · {completed}/{total}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenNewTaskModal('physics', dateStr)}
                  aria-label={`Add task for ${dateStr}`}
                  className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="p-2.5 flex-1 space-y-2">
                {tasksForDate.length === 0 ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 py-4 text-center">
                    No tasks scheduled
                  </p>
                ) : (
                  tasksForDate.map((task) => {
                    const theme = SUBJECT_THEMES[task.category];
                    const recurring = isRecurringTask(task);
                    return (
                      <div
                        key={`${task.id}_${dateStr}`}
                        className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-1.5"
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => onToggleTask(task.id)}
                            aria-label={`Toggle "${task.title}"`}
                            className="mt-0.5 rounded cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className={`text-left text-xs font-medium leading-snug break-words flex-1 ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium">
                          <CategoryIcon category={task.category} size={11} />
                          <span style={{ color: theme.color }}>{theme.shortLabel}</span>
                          {recurring && (
                            <span className="text-sky-600 dark:text-sky-400">· Recurring</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
