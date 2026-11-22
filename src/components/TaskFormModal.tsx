import React, { useState } from 'react';
import { Repeat, Trash2, X } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import {
  RecurrenceFrequency,
  StudyTask,
  TaskCategory,
  TaskPriority,
} from '../types/study';
import { getColomboTodayStr } from '../utils/colomboTime';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<StudyTask, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  onDelete?: (id: string) => void;
  initialTask?: StudyTask | null;
  defaultCategory?: TaskCategory;
  defaultDate?: string;
}

const WEEKDAY_NAMES = [
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
  { idx: 0, label: 'Sun' },
];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTask,
  defaultCategory = 'physics',
  defaultDate,
}) => {
  const today = getColomboTodayStr();
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [category, setCategory] = useState<TaskCategory>(
    initialTask?.category ?? defaultCategory
  );
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate ?? defaultDate ?? today
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? 'medium'
  );
  const [completed, setCompleted] = useState(initialTask?.completed ?? false);
  const [progress, setProgress] = useState(initialTask?.progress ?? 0);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initialTask?.recurrence.frequency ?? 'none'
  );
  const [interval, setInterval] = useState(initialTask?.recurrence.interval ?? 1);
  const [weekdays, setWeekdays] = useState<number[]>(
    initialTask?.recurrence.weekdays ?? [1, 3, 5]
  );
  const [recurrenceActive, setRecurrenceActive] = useState(
    initialTask?.recurrence.active ?? true
  );
  const [notes, setNotes] = useState(initialTask?.notes ?? '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleToggleWeekday = (dayIdx: number) => {
    setWeekdays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }
    if (frequency === 'weekdays' && weekdays.length === 0) {
      setError('Select at least one weekday for recurring schedule.');
      return;
    }

    onSave(
      {
        title: trimmed,
        category,
        dueDate,
        priority,
        completed,
        completedAt: completed
          ? initialTask?.completedAt ?? new Date().toISOString()
          : undefined,
        progress: completed ? 100 : Math.min(100, Math.max(0, Number(progress) || 0)),
        recurrence: {
          frequency,
          interval: Math.max(1, Number(interval) || 1),
          weekdays: frequency === 'weekdays' ? weekdays : undefined,
          active: frequency !== 'none' ? recurrenceActive : false,
        },
        occurrenceHistory: initialTask?.occurrenceHistory ?? [],
        notes: notes.trim(),
        linkedPastPaperId: initialTask?.linkedPastPaperId,
        notionPageId: initialTask?.notionPageId,
      },
      initialTask?.id
    );
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
        <div className="sm:hidden w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3" aria-hidden="true" />
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="task-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {initialTask ? 'Edit Task (All Tasks)' : 'New Task in All Tasks'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Complete 2022 Mechanics Essay Q3"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-category-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subject / Category
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="physics">{SUBJECT_THEMES.physics.label}</option>
                <option value="chemistry">{SUBJECT_THEMES.chemistry.label}</option>
                <option value="combined_maths">{SUBJECT_THEMES.combined_maths.label}</option>
                <option value="personal">{SUBJECT_THEMES.personal.label} (Additional)</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-date-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Due Date (Asia/Colombo)
              </label>
              <input
                id="task-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-priority-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-progress-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Progress ({completed ? 100 : progress}%)
              </label>
              <input
                id="task-progress-input"
                type="range"
                min={0}
                max={100}
                step={5}
                value={completed ? 100 : progress}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setProgress(val);
                  if (val === 100 && frequency === 'none') setCompleted(true);
                  else if (val < 100) setCompleted(false);
                }}
                className="w-full accent-slate-900 dark:accent-slate-100 mt-2"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="task-recurrence-select" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Repeat size={14} className="text-sky-600" aria-hidden="true" />
                <span>Recurrence</span>
              </label>
              {frequency !== 'none' && (
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurrenceActive}
                    onChange={(e) => setRecurrenceActive(e.target.checked)}
                    className="rounded"
                  />
                  <span>Active schedule</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                id="task-recurrence-select"
                value={frequency}
                onChange={(e) => {
                  const nextFreq = e.target.value as RecurrenceFrequency;
                  setFrequency(nextFreq);
                  if (nextFreq !== 'none') setRecurrenceActive(true);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="none">One-time task (no recurrence)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Selected weekdays</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom interval (days)</option>
              </select>

              {(frequency === 'custom' || frequency === 'weekly' || frequency === 'monthly') && (
                <div className="flex items-center gap-2">
                  <label htmlFor="recurrence-interval" className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    Every
                  </label>
                  <input
                    id="recurrence-interval"
                    type="number"
                    min={1}
                    max={365}
                    value={interval}
                    onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {frequency === 'custom' ? 'days' : frequency === 'weekly' ? 'weeks' : 'months'}
                  </span>
                </div>
              )}
            </div>

            {frequency === 'weekdays' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {WEEKDAY_NAMES.map((wd) => {
                  const active = weekdays.includes(wd.idx);
                  return (
                    <button
                      key={wd.idx}
                      type="button"
                      onClick={() => handleToggleWeekday(wd.idx)}
                      className={`min-h-[36px] px-2.5 rounded-lg text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {wd.label}
                    </button>
                  );
                })}
              </div>
            )}

            {initialTask && initialTask.occurrenceHistory.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Completed Occurrence History ({initialTask.occurrenceHistory.length})
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {initialTask.occurrenceHistory.slice(-5).reverse().map((occ) => (
                    <div key={occ.id} className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Scheduled {occ.scheduledDate} · Completed
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="task-notes-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="task-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Page numbers, syllabus unit, or reminders..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          {frequency === 'none' && (
            <label className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer min-h-[40px]">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => {
                  setCompleted(e.target.checked);
                  setProgress(e.target.checked ? 100 : 0);
                }}
                className="w-4 h-4 rounded"
              />
              <span>Mark as completed</span>
            </label>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            {initialTask && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialTask.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[44px]"
              >
                <Trash2 size={14} aria-hidden="true" />
                <span>Delete</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 min-h-[44px]"
              >
                {initialTask ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
