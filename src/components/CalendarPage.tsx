import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import { AssignmentExam, StudyTask, TaskCategory } from '../types/study';
import { getTasksScheduledForDate } from '../utils/calculations';
import {
  addDaysToDateStr,
  formatDateParts,
  formatReadableDate,
  formatShortDate,
  formatWeekdayShort,
  getMonthGridDates,
  getWeekDatesMonToSun,
  parseDateStr,
} from '../utils/colomboTime';
import { CategoryIcon } from './SubjectBadge';

interface CalendarPageProps {
  tasks: StudyTask[];
  assignments: AssignmentExam[];
  todayStr: string;
  onToggleTask: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onOpenNewTaskModal: (defaultCategory?: TaskCategory, defaultDate?: string) => void;
}

type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarPage: React.FC<CalendarPageProps> = ({
  tasks,
  assignments,
  todayStr,
  onToggleTask,
  onEditTask,
  onOpenNewTaskModal,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const parsed = parseDateStr(selectedDate);
  const monthGrid = getMonthGridDates(parsed.year, parsed.month);
  const weekDates = getWeekDatesMonToSun(selectedDate);

  const monthTitle = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));

  const navigatePrev = () => {
    if (viewMode === 'day') {
      setSelectedDate((d) => addDaysToDateStr(d, -1));
    } else if (viewMode === 'week') {
      setSelectedDate((d) => addDaysToDateStr(d, -7));
    } else {
      const prevMonth = parsed.month === 1 ? 12 : parsed.month - 1;
      const prevYear = parsed.month === 1 ? parsed.year - 1 : parsed.year;
      setSelectedDate(formatDateParts(prevYear, prevMonth, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'day') {
      setSelectedDate((d) => addDaysToDateStr(d, 1));
    } else if (viewMode === 'week') {
      setSelectedDate((d) => addDaysToDateStr(d, 7));
    } else {
      const nextMonth = parsed.month === 12 ? 1 : parsed.month + 1;
      const nextYear = parsed.month === 12 ? parsed.year + 1 : parsed.year;
      setSelectedDate(formatDateParts(nextYear, nextMonth, 1));
    }
  };

  const selectedDayTasks = getTasksScheduledForDate(tasks, selectedDate).tasksForDate;
  const selectedDayAssignments = assignments.filter((a) => a.dueDate === selectedDate);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Study Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {viewMode === 'month'
              ? monthTitle
              : viewMode === 'week'
                ? `${formatShortDate(weekDates[0])} – ${formatShortDate(weekDates[6])}`
                : formatReadableDate(selectedDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            {(['month', 'week', 'day'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize min-h-[34px] ${
                  viewMode === m
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={navigatePrev}
              aria-label="Previous calendar period"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Today
            </button>
            <button
              type="button"
              onClick={navigateNext}
              aria-label="Next calendar period"
              className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewTaskModal('physics', selectedDate)}
            className="inline-flex items-center gap-1 px-3.5 min-h-[38px] rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
          >
            <Plus size={14} aria-hidden="true" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div className="xl:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-2.5">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthGrid.map(({ dateStr, inMonth }) => {
                const dayNum = parseDateStr(dateStr).day;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const dayTasks = getTasksScheduledForDate(tasks, dateStr).tasksForDate;
                const dayAsgs = assignments.filter((a) => a.dueDate === dateStr);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[58px] sm:min-h-[96px] p-1 sm:p-2 border-b border-r border-slate-100 dark:border-slate-800 text-left flex flex-col justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-inset ring-blue-500/40'
                        : inMonth
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          : 'bg-slate-50/50 dark:bg-slate-950/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-[11px] sm:text-xs font-mono tabular-nums font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : inMonth
                              ? 'text-slate-900 dark:text-slate-100'
                              : 'text-slate-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {(dayTasks.length + dayAsgs.length) > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {dayTasks.length + dayAsgs.length}
                        </span>
                      )}
                    </div>

                    {/* Mobile compact colored dots */}
                    <div className="flex sm:hidden flex-wrap items-center gap-1 mt-1">
                      {dayTasks.slice(0, 4).map((t) => (
                        <span
                          key={`${t.id}_${dateStr}_dot`}
                          className={`w-1.5 h-1.5 rounded-full ${t.completed ? 'opacity-40' : ''}`}
                          style={{ backgroundColor: SUBJECT_THEMES[t.category].color }}
                        />
                      ))}
                      {dayAsgs.slice(0, 2).map((a) => (
                        <span
                          key={`${a.id}_dot`}
                          className="w-1.5 h-1.5 rounded-full bg-amber-500"
                        />
                      ))}
                    </div>

                    {/* Tablet/Desktop task labels */}
                    <div className="hidden sm:block mt-1 space-y-0.5 w-full overflow-hidden">
                      {dayTasks.slice(0, 2).map((t) => (
                        <div
                          key={`${t.id}_${dateStr}`}
                          className={`text-[10px] truncate px-1 py-0.5 rounded font-medium ${
                            t.completed ? 'line-through opacity-60' : ''
                          }`}
                          style={{
                            backgroundColor: `${SUBJECT_THEMES[t.category].color}18`,
                            color: SUBJECT_THEMES[t.category].color,
                          }}
                        >
                          {t.title}
                        </div>
                      ))}
                      {dayAsgs.slice(0, 1).map((a) => (
                        <div
                          key={a.id}
                          className="text-[10px] truncate px-1 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                        >
                          {a.type}: {a.title}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="xl:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {formatReadableDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDayTasks.length} tasks · {selectedDayAssignments.length} assignments/exams
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenNewTaskModal('physics', selectedDate)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
              >
                + Task
              </button>
            </div>

            {selectedDayTasks.length === 0 && selectedDayAssignments.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                No tasks or deadlines scheduled for {selectedDate}.
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedDayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => onToggleTask(t.id)}
                      aria-label={`Toggle "${t.title}"`}
                      className="mt-0.5 rounded cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onEditTask(t)}
                        className={`text-left text-xs font-semibold ${
                          t.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {t.title}
                      </button>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <CategoryIcon category={t.category} size={12} />
                        <span style={{ color: SUBJECT_THEMES[t.category].color }}>
                          {SUBJECT_THEMES[t.category].label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedDayAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/50 dark:bg-amber-950/20"
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {a.type}: {a.title}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Status: {a.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDates.map((d) => {
            const { tasksForDate } = getTasksScheduledForDate(tasks, d);
            const dayAsgs = assignments.filter((a) => a.dueDate === d);
            const isToday = d === todayStr;
            return (
              <div
                key={d}
                className={`rounded-2xl bg-white dark:bg-slate-900 border p-3.5 space-y-2.5 min-h-[200px] ${
                  isToday ? 'border-blue-600' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatWeekdayShort(d)} {formatShortDate(d)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenNewTaskModal('physics', d)}
                    aria-label={`Add task on ${d}`}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                {tasksForDate.map((t) => (
                  <div key={t.id} className="text-xs flex items-start gap-1.5">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => onToggleTask(t.id)}
                      className="mt-0.5"
                    />
                    <span className={t.completed ? 'line-through text-slate-400' : ''}>
                      {t.title}
                    </span>
                  </div>
                ))}
                {dayAsgs.map((a) => (
                  <div key={a.id} className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    {a.type}: {a.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'day' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formatReadableDate(selectedDate)}
            </h3>
            <button
              type="button"
              onClick={() => onOpenNewTaskModal('physics', selectedDate)}
              className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
            >
              + Add Task for Day
            </button>
          </div>
          {selectedDayTasks.length === 0 && selectedDayAssignments.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nothing scheduled on {selectedDate}.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => onToggleTask(t.id)}
                      className="w-4 h-4"
                    />
                    <span className={t.completed ? 'line-through text-slate-400 text-sm' : 'text-sm font-medium'}>
                      {t.title}
                    </span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: SUBJECT_THEMES[t.category].color }}>
                    {SUBJECT_THEMES[t.category].label}
                  </span>
                </div>
              ))}
              {selectedDayAssignments.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-sm">
                  <strong>{a.type}:</strong> {a.title} · {a.status}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
