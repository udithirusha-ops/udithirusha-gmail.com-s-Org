import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar as CalendarIcon,
  FileCheck2,
  Plus,
  UserCheck,
} from 'lucide-react';
import { SUBJECT_LIST, SUBJECT_THEMES } from '../constants/subjects';
import {
  ActivePage,
  AssignmentExam,
  CountdownItem,
  Notebook,
  PastPaperUnit,
  PomodoroSession,
  PomodoroSettings,
  StudyNote,
  StudyTask,
  SubjectId,
  TaskCategory,
} from '../types/study';
import {
  calculateDailyCompletionSeries,
  calculateDaysLeft,
  calculateSubjectProgress,
  calculateTodayProgress,
  getTasksScheduledForDate,
} from '../utils/calculations';
import { formatReadableDate, formatShortDate } from '../utils/colomboTime';
import { DailyProgressLineChart } from './Charts';
import { CategoryIcon } from './SubjectBadge';
import { TaskRow } from './TaskRow';
import { MessagesFeed } from './MessagesFeed';
import {
  ColomboClockWidget,
  CountdownWidget,
  PomodoroWidget,
} from './Widgets';

interface DashboardPageProps {
  todayStr: string;
  tasks: StudyTask[];
  pastPaperUnits: PastPaperUnit[];
  assignments: AssignmentExam[];
  notes: StudyNote[];
  notebooks: Notebook[];
  pomodoroSettings: PomodoroSettings;
  pomodoroSessions: PomodoroSession[];
  countdowns: CountdownItem[];
  onQuickCreateTask: (title: string, category: TaskCategory, dueDate: string) => void;
  onOpenNewTaskModal: (defaultCategory?: TaskCategory, defaultDate?: string) => void;
  onToggleTask: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onUpdatePomodoroSettings: (next: PomodoroSettings) => void;
  onLogPomodoroSession: (session: Omit<PomodoroSession, 'id'>) => void;
  onAddCountdown: (item: Omit<CountdownItem, 'id'>) => void;
  onDeleteCountdown: (id: string) => void;
  onNavigate: (page: ActivePage) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  todayStr,
  tasks,
  pastPaperUnits,
  assignments,
  notes,
  notebooks,
  pomodoroSettings,
  pomodoroSessions,
  countdowns,
  onQuickCreateTask,
  onOpenNewTaskModal,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onUpdatePomodoroSettings,
  onLogPomodoroSession,
  onAddCountdown,
  onDeleteCountdown,
  onNavigate,
}) => {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('physics');
  const [quickDate, setQuickDate] = useState(todayStr);

  const todaySummary = getTasksScheduledForDate(tasks, todayStr);
  const todayTasks = todaySummary.tasksForDate;
  const personalTasks = tasks.filter((t) => t.category === 'personal');
  const todayProgress = calculateTodayProgress(tasks, todayStr);
  const dailySeries = calculateDailyCompletionSeries(tasks);

  const upcomingDeadlines = assignments
    .filter((a) => a.status !== 'Complete' && a.dueDate >= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onQuickCreateTask(trimmed, quickCategory, quickDate || todayStr);
    setQuickTitle('');
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Priority Top Row: Live Time + Today's Progress First */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-4">
          <ColomboClockWidget
            className="h-full"
            summary={`${todayProgress.total} ${todayProgress.total === 1 ? 'task' : 'tasks'} scheduled today · ${upcomingDeadlines.length} upcoming ${upcomingDeadlines.length === 1 ? 'deadline' : 'deadlines'}`}
          />
        </div>

        {/* Today's Progress Section */}
        <section
          aria-label="Today's Progress"
          className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-4"
          data-testid="todays-progress-section"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Today&apos;s Progress
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatReadableDate(todayStr)} · Calculated dynamically from All Tasks
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {todayProgress.completionPercentage}%
              </span>
              <button
                type="button"
                onClick={() => onOpenNewTaskModal()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <Plus size={14} aria-hidden="true" />
                <span>New Task</span>
              </button>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
              style={{ width: `${todayProgress.completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="sm:pr-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total</span>
              <span className="mt-0.5 block font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {todayProgress.total} {todayProgress.total === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="sm:px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Completed</span>
              <span className="mt-0.5 block font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {todayProgress.completed} {todayProgress.completed === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="sm:px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Remaining</span>
              <span className="mt-0.5 block font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {todayProgress.remaining} {todayProgress.remaining === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="sm:pl-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Completion</span>
              <span className="mt-0.5 block font-mono tabular-nums text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                {todayProgress.completionPercentage}%
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Daily Study Progress Line Chart (Near Top for Immediate Visibility) */}
      <section
        aria-label="Daily Study Progress Line Chart"
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4"
      >
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Daily Study Progress
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily task completion percentage calculated strictly from saved task records
          </p>
        </div>

        <DailyProgressLineChart
          points={dailySeries.points}
          averagePercentage={dailySeries.averagePercentage}
          maxPercentage={dailySeries.maxPercentage}
        />
      </section>

      {/* Quick Task Creation Bar */}
      <section
        aria-label="Quick Task Creation"
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Quick Add to All Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Schedule subject or personal work right away
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenNewTaskModal()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>New Task (with Recurrence)</span>
          </button>
        </div>

        <form
          onSubmit={handleQuickSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800"
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add a task to All Tasks..."
            aria-label="Quick task title"
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px]"
          />
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
              aria-label="Quick task category"
              className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm sm:text-xs font-medium text-slate-800 dark:text-slate-200 min-h-[44px]"
            >
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="combined_maths">Combined Maths</option>
              <option value="personal">Personal Task</option>
            </select>
            <input
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              aria-label="Quick task due date"
              className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm sm:text-xs font-mono text-slate-800 dark:text-slate-200 min-h-[44px]"
            />
            <button
              type="submit"
              className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap min-h-[44px]"
            >
              Quick Add
            </button>
          </div>
        </form>
      </section>

      {/* Subject Navigation Cards */}
      <section aria-label="Subject Navigation" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUBJECT_LIST.map((subjId) => {
          const theme = SUBJECT_THEMES[subjId];
          const stats = calculateSubjectProgress(tasks, subjId, todayStr);
          return (
            <button
              key={subjId}
              type="button"
              onClick={() => onNavigate(subjId)}
              className="text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between gap-4 min-h-[44px]"
            >
              <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${theme.color}18` }}
                  >
                    <CategoryIcon category={subjId} size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {theme.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {stats.completed}/{stats.total} tasks · {stats.overdue} overdue
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Progress</span>
                  <span className="font-mono tabular-nums font-bold" style={{ color: theme.color }}>
                    {stats.completionPercentage}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stats.completionPercentage}%`,
                      backgroundColor: theme.color,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {/* Main Content Split: Tasks + Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Tasks */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Today&apos;s Tasks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scheduled for {todayStr} (Asia/Colombo) in All Tasks
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px]"
              >
                <span>All Tasks</span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  No tasks scheduled for today
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use Quick Add above to schedule tasks for {todayStr}.
                </p>
              </div>
            ) : (
              <div>
                {todayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    onToggle={onToggleTask}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    compact
                  />
                ))}
              </div>
            )}
          </section>

          {/* Additional Personal Task List (Separate Section from Subjects, Stored in All Tasks) */}
          <section
            aria-label="Additional Personal Tasks"
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <UserCheck size={16} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Additional Personal Tasks
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personal work &amp; general responsibilities (stored in All Tasks)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenNewTaskModal('personal', todayStr)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[38px] shrink-0"
              >
                <Plus size={13} aria-hidden="true" />
                <span>Add Personal</span>
              </button>
            </div>

            {personalTasks.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No additional personal tasks yet.
                </p>
              </div>
            ) : (
              <div>
                {personalTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    todayStr={todayStr}
                    onToggle={onToggleTask}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    compact
                  />
                ))}
              </div>
            )}
          </section>

          {/* Quick Access: Past Papers Analysis, Upcoming Assignments & Exams, Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck2 size={16} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Past Papers Analysis
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {pastPaperUnits.length} {pastPaperUnits.length === 1 ? 'unit' : 'units'} tracked
              </p>
              <div className="space-y-1.5">
                {(['physics', 'chemistry', 'combined_maths'] as SubjectId[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onNavigate(s)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 min-h-[38px]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CategoryIcon category={s} size={13} />
                      <span>{SUBJECT_THEMES[s].label}</span>
                    </span>
                    <ArrowRight size={12} className="text-slate-400" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upcoming Deadlines
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('courses')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all
                </button>
              </div>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No upcoming assignments or exams.
                </p>
              ) : (
                <ul className="space-y-2">
                  {upcomingDeadlines.map((item) => {
                    const days = calculateDaysLeft(item.dueDate, todayStr);
                    return (
                      <li key={item.id} className="text-xs flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                        <span className="font-mono tabular-nums text-[11px] text-amber-700 dark:text-amber-400 shrink-0">
                          {days === 0 ? 'Today' : `${days}d`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Notes &amp; Notebooks
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('notes')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Open
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} · {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'}
              </p>
              {notes.slice(0, 3).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onNavigate('notes')}
                  className="w-full text-left text-xs truncate text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 block py-1"
                >
                  {n.title} · <span className="text-slate-400 dark:text-slate-500">{n.type}</span>
                </button>
              ))}
            </section>
          </div>

          {/* Real-Time Study Feed (Cloud Firestore) */}
          <MessagesFeed
            variant="compact"
            onNavigateToFull={() => onNavigate('messages')}
          />
        </div>

        {/* Right Column: Mini Calendar Link, Countdown, Pomodoro */}
        <div className="lg:col-span-4 space-y-5">
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Calendar &amp; Week
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Full Calendar
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Today is <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatShortDate(todayStr)}</span> ({todayProgress.total} {todayProgress.total === 1 ? 'task' : 'tasks'} scheduled).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
              >
                Open Calendar
              </button>
              <button
                type="button"
                onClick={() => onNavigate('schedule')}
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
              >
                Weekly Schedule
              </button>
            </div>
          </section>

          <CountdownWidget
            countdowns={countdowns}
            onAddCountdown={onAddCountdown}
            onDeleteCountdown={onDeleteCountdown}
          />

          <PomodoroWidget
            settings={pomodoroSettings}
            sessions={pomodoroSessions}
            onUpdateSettings={onUpdatePomodoroSettings}
            onLogSession={onLogPomodoroSession}
          />
        </div>
      </div>
    </div>
  );
};
