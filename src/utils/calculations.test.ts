import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCourseStats,
  calculateDailyCompletionSeries,
  calculateMarkStats,
  calculateSubjectProgress,
  calculateTaskProgressStats,
  calculateTodayProgress,
  computeNextRecurrenceDate,
  filterAndSortTasks,
  toggleTaskCompletion,
} from './calculations';
import {
  calculateCountdownColombo,
  getColomboClockParts,
  getWeekDatesMonToSun,
} from './colomboTime';
import { AssignmentExam, Course, MarkEntry, StudyTask } from '../types/study';

const makeTask = (overrides: Partial<StudyTask> = {}): StudyTask => ({
  id: 't1',
  title: 'Sample Task',
  category: 'physics',
  dueDate: '2026-11-21',
  priority: 'medium',
  completed: false,
  progress: 0,
  recurrence: { frequency: 'none', interval: 1, active: false },
  occurrenceHistory: [],
  createdAt: '2026-11-21T00:00:00.000Z',
  updatedAt: '2026-11-21T00:00:00.000Z',
  ...overrides,
});

test('calculateTaskProgressStats handles empty tasks without NaN or division by zero', () => {
  const stats = calculateTaskProgressStats([], '2026-11-21');
  assert.deepEqual(stats, {
    total: 0,
    completed: 0,
    remaining: 0,
    overdue: 0,
    completionPercentage: 0,
  });
});

test('calculateTaskProgressStats computes exact completed, remaining, overdue, and percentage', () => {
  const tasks: StudyTask[] = [
    makeTask({ id: '1', dueDate: '2026-11-20', completed: false }), // overdue
    makeTask({ id: '2', dueDate: '2026-11-19', completed: true }), // completed, NOT overdue
    makeTask({ id: '3', dueDate: '2026-11-21', completed: true }),
    makeTask({ id: '4', dueDate: '2026-11-22', completed: false }),
  ];
  const stats = calculateTaskProgressStats(tasks, '2026-11-21');
  assert.equal(stats.total, 4);
  assert.equal(stats.completed, 2);
  assert.equal(stats.remaining, 2);
  assert.equal(stats.overdue, 1);
  assert.equal(stats.completionPercentage, 50);
});

test('calculateSubjectProgress isolates tasks strictly by subject', () => {
  const tasks: StudyTask[] = [
    makeTask({ id: 'p1', category: 'physics', completed: true }),
    makeTask({ id: 'p2', category: 'physics', completed: false, dueDate: '2026-11-18' }),
    makeTask({ id: 'c1', category: 'chemistry', completed: true }),
    makeTask({ id: 'per1', category: 'personal', completed: false }),
  ];

  const physics = calculateSubjectProgress(tasks, 'physics', '2026-11-21');
  assert.equal(physics.total, 2);
  assert.equal(physics.completed, 1);
  assert.equal(physics.remaining, 1);
  assert.equal(physics.overdue, 1);
  assert.equal(physics.completionPercentage, 50);

  const maths = calculateSubjectProgress(tasks, 'combined_maths', '2026-11-21');
  assert.equal(maths.total, 0);
  assert.equal(maths.completionPercentage, 0);
});

test('recurring task completion logs history, avoids duplicates, and schedules next occurrence', () => {
  const recurring = makeTask({
    id: 'r1',
    category: 'combined_maths',
    dueDate: '2026-11-21',
    recurrence: { frequency: 'daily', interval: 1, active: true },
  });

  const updated = toggleTaskCompletion(recurring, '2026-11-21T10:00:00.000Z');
  assert.equal(updated.dueDate, '2026-11-22');
  assert.equal(updated.completed, false);
  assert.equal(updated.occurrenceHistory.length, 1);
  assert.equal(updated.occurrenceHistory[0].scheduledDate, '2026-11-21');

  // Today progress still counts 2026-11-21 occurrence as completed
  const todayStats = calculateTodayProgress([updated], '2026-11-21');
  assert.equal(todayStats.total, 1);
  assert.equal(todayStats.completed, 1);
  assert.equal(todayStats.completionPercentage, 100);

  // Daily series includes 2026-11-21 at 100% and 2026-11-22 at 0%
  const series = calculateDailyCompletionSeries([updated]);
  assert.equal(series.points.length, 2);
  assert.equal(series.points[0].date, '2026-11-21');
  assert.equal(series.points[0].percentage, 100);
  assert.equal(series.points[1].date, '2026-11-22');
  assert.equal(series.points[1].percentage, 0);
  assert.equal(series.averagePercentage, 50);
  assert.equal(series.maxPercentage, 100);
});

test('computeNextRecurrenceDate supports weekdays, weekly, monthly, and custom intervals', () => {
  // 2026-11-21 is a Saturday (weekdayIndex = 6)
  const nextMonOrWed = computeNextRecurrenceDate('2026-11-21', {
    frequency: 'weekdays',
    interval: 1,
    weekdays: [1, 3], // Mon, Wed
    active: true,
  });
  assert.equal(nextMonOrWed, '2026-11-23'); // Monday

  const nextWeekly = computeNextRecurrenceDate('2026-11-21', {
    frequency: 'weekly',
    interval: 1,
    active: true,
  });
  assert.equal(nextWeekly, '2026-11-28');

  const nextMonthly = computeNextRecurrenceDate('2026-01-31', {
    frequency: 'monthly',
    interval: 1,
    active: true,
  });
  assert.equal(nextMonthly, '2026-02-28');

  const nextCustom = computeNextRecurrenceDate('2026-11-21', {
    frequency: 'custom',
    interval: 3,
    active: true,
  });
  assert.equal(nextCustom, '2026-11-24');
});

test('calculateMarkStats distinguishes raw marks and percentages across varying max marks', () => {
  const entries: MarkEntry[] = [
    {
      id: 'm1',
      subject: 'physics',
      paperName: '2020 Structured',
      date: '2026-11-10',
      marksObtained: 40,
      maxMarks: 50,
      createdAt: '2026-11-10T10:00:00Z',
      updatedAt: '2026-11-10T10:00:00Z',
    },
    {
      id: 'm2',
      subject: 'physics',
      paperName: '2021 Full Paper',
      date: '2026-11-15',
      marksObtained: 90,
      maxMarks: 100,
      createdAt: '2026-11-15T10:00:00Z',
      updatedAt: '2026-11-15T10:00:00Z',
    },
  ];
  const stats = calculateMarkStats(entries);
  assert.equal(stats.count, 2);
  assert.equal(stats.hasVaryingMaxMarks, true);
  assert.equal(stats.averageRaw, 65);
  assert.equal(stats.highestRaw, 90);
  assert.equal(stats.averagePercentage, 85); // (80% + 90%) / 2
  assert.equal(stats.highestPercentage, 90);
  assert.equal(stats.latestEntry?.paperName, '2021 Full Paper');
});

test('calculateCourseStats computes assignment progress and upcoming exams accurately', () => {
  const course: Course = {
    id: 'c1',
    name: 'Mechanics & Properties of Matter',
    courseCode: 'PHY-101',
    professor: 'Dr. Silva',
    email: 'silva@example.edu',
    location: 'Hall A',
    time: 'Mon 08:30',
    semester: 'Term 1',
    status: 'Active',
    syllabus: 'Kinematics, Dynamics',
    summary: 'Core mechanics',
    subject: 'physics',
  };
  const assignments: AssignmentExam[] = [
    {
      id: 'a1',
      title: 'Problem Set 1',
      type: 'Assignment',
      status: 'Complete',
      dueDate: '2026-11-18',
      courseId: 'c1',
      subject: 'physics',
      notes: '',
    },
    {
      id: 'a2',
      title: 'Midterm Exam',
      type: 'Exam',
      status: 'In Progress',
      dueDate: '2026-11-28',
      courseId: 'c1',
      subject: 'physics',
      notes: '',
    },
  ];
  const stats = calculateCourseStats(course, assignments, [], [], '2026-11-21');
  assert.equal(stats.totalAssignments, 2);
  assert.equal(stats.completedAssignments, 1);
  assert.equal(stats.assignmentProgress, 50);
  assert.equal(stats.upcomingExams, 1);
});

test('filterAndSortTasks filters personal, overdue, and weekly tasks accurately', () => {
  const tasks: StudyTask[] = [
    makeTask({ id: '1', category: 'personal', dueDate: '2026-11-21' }),
    makeTask({ id: '2', category: 'physics', dueDate: '2026-11-18', completed: false }),
    makeTask({ id: '3', category: 'chemistry', dueDate: '2026-11-22', completed: true }),
  ];

  assert.equal(filterAndSortTasks(tasks, { view: 'personal' }, '2026-11-21').length, 1);
  assert.equal(filterAndSortTasks(tasks, { view: 'overdue' }, '2026-11-21').length, 1);
  assert.equal(filterAndSortTasks(tasks, { view: 'week' }, '2026-11-21').length, 3);
});

test('colomboTime computes Asia/Colombo date, Mon-Sun week, and countdown', () => {
  const sampleUtc = new Date('2026-11-21T20:00:00.000Z'); // 2026-11-22 01:30 in Colombo!
  const parts = getColomboClockParts(sampleUtc);
  assert.equal(parts.dateStr, '2026-11-22');
  assert.equal(parts.shortTimeStr, '01:30');

  const week = getWeekDatesMonToSun('2026-11-21');
  assert.equal(week[0], '2026-11-16'); // Monday
  assert.equal(week[6], '2026-11-22'); // Sunday

  const cd = calculateCountdownColombo('2026-11-23', '01:30', sampleUtc);
  assert.equal(cd.isPast, false);
  assert.equal(cd.days, 1);
});
