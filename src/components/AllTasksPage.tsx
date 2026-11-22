import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  StudyTask,
  TaskCategory,
  TaskPriority,
  TaskSortField,
  TaskViewFilter,
} from '../types/study';
import {
  calculateTaskProgressStats,
  filterAndSortTasks,
} from '../utils/calculations';
import { TaskRow } from './TaskRow';

interface AllTasksPageProps {
  tasks: StudyTask[];
  todayStr: string;
  onToggleTask: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onOpenNewTaskModal: (defaultCategory?: TaskCategory) => void;
}

const VIEW_TABS: { id: TaskViewFilter; label: string }[] = [
  { id: 'all', label: 'All Tasks' },
  { id: 'today', label: "Today's Tasks" },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'week', label: 'This Week' },
  { id: 'remaining', label: 'Remaining' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'combined_maths', label: 'Combined Maths' },
  { id: 'personal', label: 'Personal' },
  { id: 'recurring', label: 'Recurring' },
];

export const AllTasksPage: React.FC<AllTasksPageProps> = ({
  tasks,
  todayStr,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
}) => {
  const [view, setView] = useState<TaskViewFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<TaskCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'remaining' | 'overdue'>('all');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'recurring' | 'one_time'>('all');
  const [sortBy, setSortBy] = useState<TaskSortField>('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = filterAndSortTasks(
    tasks,
    {
      view,
      subjectFilter,
      priorityFilter,
      statusFilter,
      recurrenceFilter,
      searchQuery,
      sortBy,
      sortDir,
    },
    todayStr
  );

  const stats = calculateTaskProgressStats(tasks, todayStr);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            All Tasks
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Single unified task database · {stats.total} total · {stats.completed} completed · {stats.remaining} remaining · {stats.overdue} overdue
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewTaskModal()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shrink-0 min-h-[42px]"
        >
          <Plus size={15} aria-hidden="true" />
          <span>New Task</span>
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 snap-x">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`snap-start px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 min-h-[42px] border transition-colors ${
              view === tab.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="sm:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search All Tasks..."
            aria-label="Search All Tasks"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm sm:text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value as TaskCategory | 'all')}
          aria-label="Filter by subject or category"
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
        >
          <option value="all">All Categories</option>
          <option value="physics">Physics</option>
          <option value="chemistry">Chemistry</option>
          <option value="combined_maths">Combined Mathematics</option>
          <option value="personal">Personal Tasks</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
          aria-label="Filter by priority"
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | 'completed' | 'remaining' | 'overdue')
          }
          aria-label="Filter by completion status"
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
        >
          <option value="all">Any Status</option>
          <option value="remaining">Remaining</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <select
            value={recurrenceFilter}
            onChange={(e) =>
              setRecurrenceFilter(e.target.value as 'all' | 'recurring' | 'one_time')
            }
            aria-label="Filter by recurrence"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
          >
            <option value="all">All Types</option>
            <option value="recurring">Recurring</option>
            <option value="one_time">One-time</option>
          </select>

          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split(':') as [TaskSortField, 'asc' | 'desc'];
              setSortBy(field);
              setSortDir(dir);
            }}
            aria-label="Sort tasks"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:text-xs text-slate-900 dark:text-slate-100 min-h-[42px]"
          >
            <option value="dueDate:asc">Date (Earliest)</option>
            <option value="dueDate:desc">Date (Latest)</option>
            <option value="priority:desc">Priority (High–Low)</option>
            <option value="category:asc">Subject (A–Z)</option>
            <option value="completed:asc">Incomplete First</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Showing {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'}
          </span>
          <span className="font-mono tabular-nums">Source: All Tasks</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No tasks match the current view and filters
            </p>
            <button
              type="button"
              onClick={() => onOpenNewTaskModal()}
              className="mt-3 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
            >
              Create Task in All Tasks
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                todayStr={todayStr}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
