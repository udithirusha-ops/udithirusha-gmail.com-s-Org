import {
  AssignmentExam,
  Course,
  MarkEntry,
  Notebook,
  StudyNote,
  StudyTask,
  SubjectId,
  TaskCategory,
  TaskPriority,
  TaskRecurrence,
  TaskSortField,
  TaskViewFilter,
} from '../types/study';
import {
  addDaysToDateStr,
  addMonthsToDateStr,
  getDaysBetween,
  getWeekdayIndexFromDateStr,
  getWeekDatesMonToSun,
} from './colomboTime';

export interface TaskProgressStats {
  total: number;
  completed: number;
  remaining: number;
  overdue: number;
  completionPercentage: number;
}

export interface DailyCompletionPoint {
  date: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface DailyCompletionSummary {
  points: DailyCompletionPoint[];
  averagePercentage: number;
  maxPercentage: number;
}

export interface MarkStats {
  count: number;
  averageRaw: number;
  highestRaw: number;
  latestEntry: MarkEntry | null;
  averagePercentage: number;
  highestPercentage: number;
  hasVaryingMaxMarks: boolean;
}

export interface CourseComputedStats {
  totalAssignments: number;
  completedAssignments: number;
  assignmentProgress: number;
  upcomingExams: number;
  notesCount: number;
  notebooksCount: number;
}

export interface TaskFilterOptions {
  view: TaskViewFilter;
  subjectFilter?: TaskCategory | 'all';
  priorityFilter?: TaskPriority | 'all';
  statusFilter?: 'all' | 'completed' | 'remaining' | 'overdue';
  recurrenceFilter?: 'all' | 'recurring' | 'one_time';
  searchQuery?: string;
  sortBy?: TaskSortField;
  sortDir?: 'asc' | 'desc';
}

export function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function isTaskOverdue(task: StudyTask, todayStr: string): boolean {
  if (task.completed) return false;
  if (!task.dueDate) return false;
  return task.dueDate < todayStr;
}

export function isRecurringTask(task: StudyTask): boolean {
  return task.recurrence.frequency !== 'none' && task.recurrence.active;
}

/**
 * Counts task progress strictly using:
 * Completion % = Completed / Total * 100 (0 when Total = 0)
 * Remaining = Total - Completed
 * Overdue = uncompleted tasks with dueDate < todayStr
 */
export function calculateTaskProgressStats(
  tasks: StudyTask[],
  todayStr: string
): TaskProgressStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const remaining = total - completed;
  const overdue = tasks.filter((t) => isTaskOverdue(t, todayStr)).length;
  const completionPercentage =
    total === 0 ? 0 : roundOneDecimal((completed / total) * 100);

  return {
    total,
    completed,
    remaining,
    overdue,
    completionPercentage,
  };
}

/**
 * Computes tasks scheduled for a specific date, including completed recurring
 * occurrences recorded in occurrenceHistory for that date (without duplicating
 * if the task itself currently sits on dateStr).
 */
export function getTasksScheduledForDate(
  tasks: StudyTask[],
  dateStr: string
): { total: number; completed: number; tasksForDate: StudyTask[] } {
  const tasksForDate: StudyTask[] = [];
  let total = 0;
  let completed = 0;

  for (const task of tasks) {
    const matchesCurrentDue = task.dueDate === dateStr;
    const completedOnThisDateViaHistory = task.occurrenceHistory.some(
      (occ) => occ.scheduledDate === dateStr
    );

    if (matchesCurrentDue) {
      total += 1;
      if (task.completed || completedOnThisDateViaHistory) {
        completed += 1;
      }
      tasksForDate.push(task);
    } else if (completedOnThisDateViaHistory) {
      total += 1;
      completed += 1;
      tasksForDate.push({
        ...task,
        completed: true,
        progress: 100,
        dueDate: dateStr,
      });
    }
  }

  return { total, completed, tasksForDate };
}

export function calculateTodayProgress(
  tasks: StudyTask[],
  todayStr: string
): TaskProgressStats {
  const { total, completed } = getTasksScheduledForDate(tasks, todayStr);
  const remaining = total - completed;
  const completionPercentage =
    total === 0 ? 0 : roundOneDecimal((completed / total) * 100);
  return {
    total,
    completed,
    remaining,
    overdue: 0,
    completionPercentage,
  };
}

/**
 * Calculates subject-specific progress strictly from tasks belonging to `subject`.
 * Includes historical recurring completions for that subject in completed/total counts
 * only for current active tasks + logged occurrences? Wait: Subject Progress counts
 * tasks belonging to that subject in All Tasks: Total tasks, Completed, Remaining, Overdue, %.
 * If a recurring task completed an occurrence today, its current pending instance is also in All Tasks,
 * so for Subject Progress we evaluate the actual tasks in All Tasks belonging to that subject,
 * OR if a recurring task has completed occurrences, wait:
 * Let's check the prompt:
 * "Physics Progress: Total tasks: 40, Completed: 25, Remaining: 15, Overdue: 3, Completion: 62.5%"
 * Counting directly from `tasks.filter(t => t.category === subject)` guarantees exact
 * `Total = Completed + Remaining`, `Overdue <= Remaining`, and `Completion % = Completed / Total * 100`.
 */
export function calculateSubjectProgress(
  tasks: StudyTask[],
  subject: SubjectId,
  todayStr: string
): TaskProgressStats {
  const subjectTasks = tasks.filter((t) => t.category === subject);
  return calculateTaskProgressStats(subjectTasks, todayStr);
}

/**
 * Computes Daily Study Progress Line Chart strictly from real tasks and real
 * occurrenceHistory records. Never invents historical days with 0 tasks.
 */
export function calculateDailyCompletionSeries(
  tasks: StudyTask[]
): DailyCompletionSummary {
  const dateBuckets = new Map<string, { total: number; completed: number }>();

  for (const task of tasks) {
    if (task.dueDate) {
      const bucket = dateBuckets.get(task.dueDate) ?? { total: 0, completed: 0 };
      bucket.total += 1;
      if (task.completed) {
        bucket.completed += 1;
      }
      dateBuckets.set(task.dueDate, bucket);
    }

    for (const occ of task.occurrenceHistory) {
      // Avoid double-counting if task.dueDate still equals occ.scheduledDate
      if (occ.scheduledDate === task.dueDate && task.completed) {
        continue;
      }
      if (occ.scheduledDate === task.dueDate && !task.completed) {
        // Edge case: occurrence recorded for current dueDate
        const bucket = dateBuckets.get(occ.scheduledDate) ?? { total: 0, completed: 0 };
        bucket.completed += 1;
        dateBuckets.set(occ.scheduledDate, bucket);
        continue;
      }
      const bucket = dateBuckets.get(occ.scheduledDate) ?? { total: 0, completed: 0 };
      bucket.total += 1;
      bucket.completed += 1;
      dateBuckets.set(occ.scheduledDate, bucket);
    }
  }

  const sortedDates = Array.from(dateBuckets.keys()).sort();
  const points: DailyCompletionPoint[] = sortedDates.map((date) => {
    const bucket = dateBuckets.get(date)!;
    const percentage =
      bucket.total === 0 ? 0 : roundOneDecimal((bucket.completed / bucket.total) * 100);
    return {
      date,
      total: bucket.total,
      completed: bucket.completed,
      percentage,
    };
  });

  if (points.length === 0) {
    return { points: [], averagePercentage: 0, maxPercentage: 0 };
  }

  const sum = points.reduce((acc, p) => acc + p.percentage, 0);
  const averagePercentage = roundOneDecimal(sum / points.length);
  const maxPercentage = Math.max(...points.map((p) => p.percentage));

  return {
    points,
    averagePercentage,
    maxPercentage,
  };
}

export function computeNextRecurrenceDate(
  currentDateStr: string,
  recurrence: TaskRecurrence
): string | null {
  if (!recurrence.active || recurrence.frequency === 'none') return null;
  const interval = Math.max(1, Math.floor(recurrence.interval || 1));

  switch (recurrence.frequency) {
    case 'daily':
      return addDaysToDateStr(currentDateStr, 1);
    case 'custom':
      return addDaysToDateStr(currentDateStr, interval);
    case 'weekly':
      return addDaysToDateStr(currentDateStr, 7 * interval);
    case 'monthly':
      return addMonthsToDateStr(currentDateStr, interval);
    case 'weekdays': {
      const allowed = recurrence.weekdays && recurrence.weekdays.length > 0
        ? [...recurrence.weekdays].sort((a, b) => a - b)
        : [1, 2, 3, 4, 5]; // Default Mon-Fri
      for (let offset = 1; offset <= 14; offset++) {
        const candidate = addDaysToDateStr(currentDateStr, offset);
        const wd = getWeekdayIndexFromDateStr(candidate);
        if (allowed.includes(wd)) {
          return candidate;
        }
      }
      return addDaysToDateStr(currentDateStr, 7);
    }
    default:
      return null;
  }
}

/**
 * Completes or toggles a task in the single All Tasks database.
 * When completing an active recurring task:
 * 1. Records the completed occurrence in `occurrenceHistory` (deduplicated per scheduledDate)
 * 2. Advances `dueDate` to the next scheduled occurrence with `completed: false`
 *    so there are NEVER duplicate task records in All Tasks.
 */
export function toggleTaskCompletion(
  task: StudyTask,
  nowIso: string
): StudyTask {
  if (isRecurringTask(task)) {
    const alreadyLogged = task.occurrenceHistory.some(
      (occ) => occ.scheduledDate === task.dueDate
    );
    const nextHistory = alreadyLogged
      ? task.occurrenceHistory
      : [
          ...task.occurrenceHistory,
          {
            id: `occ_${task.id}_${task.dueDate}`,
            scheduledDate: task.dueDate,
            completedAt: nowIso,
          },
        ];
    const nextDate = computeNextRecurrenceDate(task.dueDate, task.recurrence);
    if (nextDate) {
      return {
        ...task,
        dueDate: nextDate,
        completed: false,
        progress: 0,
        completedAt: nowIso,
        occurrenceHistory: nextHistory,
        updatedAt: nowIso,
      };
    }
  }

  const nextCompleted = !task.completed;
  return {
    ...task,
    completed: nextCompleted,
    progress: nextCompleted ? 100 : 0,
    completedAt: nextCompleted ? nowIso : undefined,
    updatedAt: nowIso,
  };
}

export function calculateMarkStats(entries: MarkEntry[]): MarkStats {
  if (entries.length === 0) {
    return {
      count: 0,
      averageRaw: 0,
      highestRaw: 0,
      latestEntry: null,
      averagePercentage: 0,
      highestPercentage: 0,
      hasVaryingMaxMarks: false,
    };
  }

  const sortedByDate = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });

  const maxMarksSet = new Set(entries.map((e) => e.maxMarks));
  const hasVaryingMaxMarks = maxMarksSet.size > 1;

  const rawSum = entries.reduce((acc, e) => acc + e.marksObtained, 0);
  const highestRaw = Math.max(...entries.map((e) => e.marksObtained));

  const percentages = entries.map((e) =>
    e.maxMarks > 0 ? (e.marksObtained / e.maxMarks) * 100 : 0
  );
  const pctSum = percentages.reduce((acc, p) => acc + p, 0);
  const highestPercentage = roundOneDecimal(Math.max(...percentages));

  return {
    count: entries.length,
    averageRaw: roundOneDecimal(rawSum / entries.length),
    highestRaw: roundOneDecimal(highestRaw),
    latestEntry: sortedByDate[sortedByDate.length - 1],
    averagePercentage: roundOneDecimal(pctSum / entries.length),
    highestPercentage,
    hasVaryingMaxMarks,
  };
}

export function calculateCourseStats(
  course: Course,
  assignments: AssignmentExam[],
  notes: StudyNote[],
  notebooks: Notebook[],
  todayStr: string
): CourseComputedStats {
  const courseAssignments = assignments.filter((a) => a.courseId === course.id);
  const totalAssignments = courseAssignments.length;
  const completedAssignments = courseAssignments.filter(
    (a) => a.status === 'Complete'
  ).length;
  const assignmentProgress =
    totalAssignments === 0
      ? 0
      : roundOneDecimal((completedAssignments / totalAssignments) * 100);
  const upcomingExams = courseAssignments.filter(
    (a) =>
      (a.type === 'Exam' || a.type === 'Quiz') &&
      a.status !== 'Complete' &&
      a.dueDate >= todayStr
  ).length;

  const notesCount = notes.filter((n) => n.courseId === course.id).length;
  const notebooksCount = notebooks.filter((nb) => nb.courseId === course.id).length;

  return {
    totalAssignments,
    completedAssignments,
    assignmentProgress,
    upcomingExams,
    notesCount,
    notebooksCount,
  };
}

export function calculateDaysLeft(dueDateStr: string, todayStr: string): number {
  return getDaysBetween(todayStr, dueDateStr);
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function filterAndSortTasks(
  tasks: StudyTask[],
  options: TaskFilterOptions,
  todayStr: string
): StudyTask[] {
  const weekDates = new Set(getWeekDatesMonToSun(todayStr));
  const query = (options.searchQuery ?? '').trim().toLowerCase();

  const filtered = tasks.filter((task) => {
    switch (options.view) {
      case 'today':
        if (task.dueDate !== todayStr) return false;
        break;
      case 'upcoming':
        if (task.completed || task.dueDate <= todayStr) return false;
        break;
      case 'week':
        if (!weekDates.has(task.dueDate)) return false;
        break;
      case 'completed':
        if (!task.completed && task.occurrenceHistory.length === 0) return false;
        break;
      case 'remaining':
        if (task.completed) return false;
        break;
      case 'overdue':
        if (!isTaskOverdue(task, todayStr)) return false;
        break;
      case 'physics':
        if (task.category !== 'physics') return false;
        break;
      case 'chemistry':
        if (task.category !== 'chemistry') return false;
        break;
      case 'combined_maths':
        if (task.category !== 'combined_maths') return false;
        break;
      case 'personal':
        if (task.category !== 'personal') return false;
        break;
      case 'recurring':
        if (task.recurrence.frequency === 'none') return false;
        break;
      case 'all':
      default:
        break;
    }

    if (
      options.subjectFilter &&
      options.subjectFilter !== 'all' &&
      task.category !== options.subjectFilter
    ) {
      return false;
    }

    if (
      options.priorityFilter &&
      options.priorityFilter !== 'all' &&
      task.priority !== options.priorityFilter
    ) {
      return false;
    }

    if (options.statusFilter && options.statusFilter !== 'all') {
      if (options.statusFilter === 'completed' && !task.completed) return false;
      if (options.statusFilter === 'remaining' && task.completed) return false;
      if (options.statusFilter === 'overdue' && !isTaskOverdue(task, todayStr)) {
        return false;
      }
    }

    if (options.recurrenceFilter && options.recurrenceFilter !== 'all') {
      const hasRec = task.recurrence.frequency !== 'none';
      if (options.recurrenceFilter === 'recurring' && !hasRec) return false;
      if (options.recurrenceFilter === 'one_time' && hasRec) return false;
    }

    if (query) {
      const hay = `${task.title} ${task.notes ?? ''} ${task.category}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }

    return true;
  });

  const sortBy = options.sortBy ?? 'dueDate';
  const dir = options.sortDir === 'desc' ? -1 : 1;

  return [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'dueDate':
        cmp = a.dueDate.localeCompare(b.dueDate);
        break;
      case 'priority':
        cmp = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        break;
      case 'category':
        cmp = a.category.localeCompare(b.category);
        break;
      case 'completed':
        cmp = Number(a.completed) - Number(b.completed);
        break;
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
    }
    if (cmp !== 0) return cmp * dir;
    return a.dueDate.localeCompare(b.dueDate);
  });
}
