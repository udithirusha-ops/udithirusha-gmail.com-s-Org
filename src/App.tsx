import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CheckSquare,
  Database,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import { AllTasksPage } from './components/AllTasksPage';
import { AuthButton } from './components/AuthButton';
import { CalendarPage } from './components/CalendarPage';
import { CoursesExamsPage } from './components/CoursesExamsPage';
import { DashboardPage } from './components/DashboardPage';
import { MessagesFeed } from './components/MessagesFeed';
import { NotesNotebooksPage } from './components/NotesNotebooksPage';
import { NotionSyncPage } from './components/NotionSyncPage';
import {
  OfflineIndicator,
  PWAInstallButton,
} from './components/PWAInstallButton';
import { CategoryIcon } from './components/SubjectBadge';
import { SubjectPage } from './components/SubjectPage';
import { TaskFormModal } from './components/TaskFormModal';
import { WeeklySchedulePage } from './components/WeeklySchedulePage';
import { SUBJECT_LIST, SUBJECT_THEMES } from './constants/subjects';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  deleteAssignmentFirestore,
  deleteCountdownFirestore,
  deleteCourseFirestore,
  deleteMarkFirestore,
  deleteNotebookFirestore,
  deleteNoteFirestore,
  deletePastPaperUnitFirestore,
  deleteTaskFirestore,
  saveAssignmentFirestore,
  saveCountdownFirestore,
  saveCourseFirestore,
  saveMarkFirestore,
  saveNotebookFirestore,
  saveNoteFirestore,
  savePastPaperUnitFirestore,
  savePomodoroSessionFirestore,
  saveSettingsFirestore,
  saveTaskFirestore,
} from './firebase/firestoreSync';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import {
  ActivePage,
  AssignmentExam,
  CountdownItem,
  Course,
  MarkEntry,
  Notebook,
  PastPaperUnit,
  PomodoroSession,
  PomodoroSettings,
  StudyNote,
  StudyTask,
  SubjectId,
  TaskCategory,
  WorkspaceData,
} from './types/study';
import { toggleTaskCompletion } from './utils/calculations';
import { getColomboClockParts, getColomboTodayStr } from './utils/colomboTime';
import {
  createEmptyWorkspace,
  generateId,
  loadWorkspaceAsync,
  loadWorkspaceSync,
  saveWorkspace,
} from './utils/storage';

const PAGE_LABELS: Record<ActivePage, string> = {
  dashboard: 'Wedapala',
  tasks: 'All Tasks',
  schedule: 'Weekly Schedule',
  calendar: 'Calendar',
  physics: 'Physics',
  chemistry: 'Chemistry',
  combined_maths: 'Combined Mathematics',
  courses: 'Courses & Exams',
  notes: 'Notes & Notebooks',
  messages: 'Live Study Messages',
  sync: 'Notion Sync & Data',
};

export default function App() {
  return (
    <AuthProvider>
      <WedapalaApp />
    </AuthProvider>
  );
}

function WedapalaApp() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceData>(() =>
    loadWorkspaceSync()
  );
  const { syncState } = useFirestoreSync(user, setWorkspace, workspace);

  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('studiess_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });
  const [todayStr, setTodayStr] = useState(() => getColomboTodayStr());
  const [clockShort, setClockShort] = useState(
    () => getColomboClockParts().shortTimeStr
  );

  // Task Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [modalDefaultCategory, setModalDefaultCategory] =
    useState<TaskCategory>('physics');
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(todayStr);

  // Mobile sheets
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubjectsOpen, setMobileSubjectsOpen] = useState(false);

  // Load IndexedDB copy on mount
  useEffect(() => {
    let active = true;
    loadWorkspaceAsync().then((loaded) => {
      if (!active) return;
      setWorkspace((prev) => {
        const prevCount =
          prev.tasks.length +
          prev.marks.length +
          prev.pastPaperUnits.length +
          prev.courses.length +
          prev.notes.length;
        const loadedCount =
          loaded.tasks.length +
          loaded.marks.length +
          loaded.pastPaperUnits.length +
          loaded.courses.length +
          loaded.notes.length;
        return loadedCount >= prevCount ? loaded : prev;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist workspace changes locally to IndexedDB/localStorage
  useEffect(() => {
    void saveWorkspace(workspace);
  }, [workspace]);

  // Sync dark mode class on <html> and PWA theme-color meta tag
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', darkMode ? '#0b1120' : '#f8fafc');
    }
    try {
      window.localStorage.setItem('studiess_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Keep Colombo todayStr & topbar time fresh
  useEffect(() => {
    const id = window.setInterval(() => {
      const parts = getColomboClockParts();
      setTodayStr(parts.dateStr);
      setClockShort(parts.shortTimeStr);
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  const openNewTaskModal = (
    defaultCategory: TaskCategory = 'physics',
    defaultDate: string = todayStr
  ) => {
    setEditingTask(null);
    setModalDefaultCategory(defaultCategory);
    setModalDefaultDate(defaultDate);
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (task: StudyTask) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (
    taskData: Omit<StudyTask, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const nowIso = new Date().toISOString();
    if (existingId) {
      const existing = workspace.tasks.find((t) => t.id === existingId);
      const updated: StudyTask = {
        ...taskData,
        id: existingId,
        createdAt: existing?.createdAt ?? nowIso,
        updatedAt: nowIso,
      };
      setWorkspace((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === existingId ? updated : t)),
      }));
      if (user) void saveTaskFirestore(user.uid, updated);
    } else {
      const created: StudyTask = {
        ...taskData,
        id: generateId('task'),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setWorkspace((prev) => ({ ...prev, tasks: [created, ...prev.tasks] }));
      if (user) void saveTaskFirestore(user.uid, created);
    }
  };

  const handleQuickCreateTask = (
    title: string,
    category: TaskCategory,
    dueDate: string
  ) => {
    const nowIso = new Date().toISOString();
    const created: StudyTask = {
      id: generateId('task'),
      title,
      category,
      dueDate,
      priority: 'medium',
      completed: false,
      progress: 0,
      recurrence: { frequency: 'none', interval: 1, active: false },
      occurrenceHistory: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setWorkspace((prev) => ({ ...prev, tasks: [created, ...prev.tasks] }));
    if (user) void saveTaskFirestore(user.uid, created);
  };

  const handleToggleTask = (id: string) => {
    const nowIso = new Date().toISOString();
    let updatedTask: StudyTask | undefined;
    setWorkspace((prev) => {
      const nextTasks = prev.tasks.map((t) => {
        if (t.id === id) {
          const res = toggleTaskCompletion(t, nowIso);
          updatedTask = res;
          return res;
        }
        return t;
      });
      return { ...prev, tasks: nextTasks };
    });
    if (user && updatedTask) void saveTaskFirestore(user.uid, updatedTask);
  };

  const handleDeleteTask = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
    if (user) void deleteTaskFirestore(user.uid, id);
  };

  // Mark Analysis handlers
  const handleAddMark = (
    entry: Omit<MarkEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const nowIso = new Date().toISOString();
    const newMark: MarkEntry = {
      ...entry,
      id: generateId('mark'),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setWorkspace((prev) => ({
      ...prev,
      marks: [...prev.marks, newMark],
    }));
    if (user) void saveMarkFirestore(user.uid, newMark);
  };

  const handleUpdateMark = (entry: MarkEntry) => {
    setWorkspace((prev) => ({
      ...prev,
      marks: prev.marks.map((m) => (m.id === entry.id ? entry : m)),
    }));
    if (user) void saveMarkFirestore(user.uid, entry);
  };

  const handleDeleteMark = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      marks: prev.marks.filter((m) => m.id !== id),
    }));
    if (user) void deleteMarkFirestore(user.uid, id);
  };

  // Past Papers Analysis handlers
  const handleAddPastPaperUnit = (unit: Omit<PastPaperUnit, 'id'>) => {
    const newUnit: PastPaperUnit = { ...unit, id: generateId('pp') };
    setWorkspace((prev) => ({
      ...prev,
      pastPaperUnits: [...prev.pastPaperUnits, newUnit],
    }));
    if (user) void savePastPaperUnitFirestore(user.uid, newUnit);
  };

  const handleUpdatePastPaperUnit = (unit: PastPaperUnit) => {
    setWorkspace((prev) => ({
      ...prev,
      pastPaperUnits: prev.pastPaperUnits.map((u) => (u.id === unit.id ? unit : u)),
    }));
    if (user) void savePastPaperUnitFirestore(user.uid, unit);
  };

  const handleDeletePastPaperUnit = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      pastPaperUnits: prev.pastPaperUnits.filter((u) => u.id !== id),
    }));
    if (user) void deletePastPaperUnitFirestore(user.uid, id);
  };

  const handleCreateLinkedTask = (
    title: string,
    subject: SubjectId,
    unitId: string
  ) => {
    const nowIso = new Date().toISOString();
    const newTask: StudyTask = {
      id: generateId('task'),
      title,
      category: subject,
      dueDate: todayStr,
      priority: 'medium',
      completed: false,
      progress: 0,
      recurrence: { frequency: 'none', interval: 1, active: false },
      occurrenceHistory: [],
      linkedPastPaperId: unitId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setWorkspace((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    if (user) void saveTaskFirestore(user.uid, newTask);
  };

  // Courses & Assignments handlers
  const handleAddCourse = (course: Omit<Course, 'id'>) => {
    const newCourse: Course = { ...course, id: generateId('course') };
    setWorkspace((prev) => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }));
    if (user) void saveCourseFirestore(user.uid, newCourse);
  };

  const handleDeleteCourse = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
    }));
    if (user) void deleteCourseFirestore(user.uid, id);
  };

  const handleAddAssignment = (asg: Omit<AssignmentExam, 'id'>) => {
    const newAsg: AssignmentExam = { ...asg, id: generateId('asg') };
    setWorkspace((prev) => ({
      ...prev,
      assignments: [...prev.assignments, newAsg],
    }));
    if (user) void saveAssignmentFirestore(user.uid, newAsg);
  };

  const handleUpdateAssignment = (asg: AssignmentExam) => {
    setWorkspace((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === asg.id ? asg : a)),
    }));
    if (user) void saveAssignmentFirestore(user.uid, asg);
  };

  const handleDeleteAssignment = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== id),
    }));
    if (user) void deleteAssignmentFirestore(user.uid, id);
  };

  // Notes & Notebooks handlers
  const handleAddNotebook = (nb: Omit<Notebook, 'id'>) => {
    const newNb: Notebook = { ...nb, id: generateId('nb') };
    setWorkspace((prev) => ({
      ...prev,
      notebooks: [...prev.notebooks, newNb],
    }));
    if (user) void saveNotebookFirestore(user.uid, newNb);
  };

  const handleUpdateNotebook = (nb: Notebook) => {
    setWorkspace((prev) => ({
      ...prev,
      notebooks: prev.notebooks.map((b) => (b.id === nb.id ? nb : b)),
    }));
    if (user) void saveNotebookFirestore(user.uid, nb);
  };

  const handleDeleteNotebook = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      notebooks: prev.notebooks.filter((b) => b.id !== id),
    }));
    if (user) void deleteNotebookFirestore(user.uid, id);
  };

  const handleAddNote = (
    note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const nowIso = new Date().toISOString();
    const newNote: StudyNote = {
      ...note,
      id: generateId('note'),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setWorkspace((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
    if (user) void saveNoteFirestore(user.uid, newNote);
  };

  const handleUpdateNote = (note: StudyNote) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === note.id ? note : n)),
    }));
    if (user) void saveNoteFirestore(user.uid, note);
  };

  const handleDeleteNote = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
    if (user) void deleteNoteFirestore(user.uid, id);
  };

  // Pomodoro & Countdowns
  const handleUpdatePomodoroSettings = (next: PomodoroSettings) => {
    setWorkspace((prev) => ({ ...prev, pomodoroSettings: next }));
    if (user) void saveSettingsFirestore(user.uid, next, workspace.notionSync);
  };

  const handleLogPomodoroSession = (session: Omit<PomodoroSession, 'id'>) => {
    const newSession: PomodoroSession = { ...session, id: generateId('pomo') };
    setWorkspace((prev) => ({
      ...prev,
      pomodoroSessions: [newSession, ...prev.pomodoroSessions],
    }));
    if (user) void savePomodoroSessionFirestore(user.uid, newSession);
  };

  const handleAddCountdown = (item: Omit<CountdownItem, 'id'>) => {
    const newCd: CountdownItem = { ...item, id: generateId('cd') };
    setWorkspace((prev) => ({
      ...prev,
      countdowns: [...prev.countdowns, newCd],
    }));
    if (user) void saveCountdownFirestore(user.uid, newCd);
  };

  const handleDeleteCountdown = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      countdowns: prev.countdowns.filter((c) => c.id !== id),
    }));
    if (user) void deleteCountdownFirestore(user.uid, id);
  };

  const navigateTo = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setMobileSubjectsOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const navBtnClass = (active: boolean) =>
    `w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
      active
        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 justify-between z-30">
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="px-2 pt-1 flex items-center gap-2.5">
            <img
              src="/pwa-192x192.png"
              alt="Wedapala"
              className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
            />
            <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              Wedapala
            </span>
          </div>

          <nav aria-label="Primary Workspace Navigation" className="space-y-1">
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className={navBtnClass(activePage === 'dashboard')}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('tasks')}
              className={navBtnClass(activePage === 'tasks')}
            >
              <CheckSquare size={16} aria-hidden="true" />
              <span>All Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('schedule')}
              className={navBtnClass(activePage === 'schedule')}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span>Weekly Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('calendar')}
              className={navBtnClass(activePage === 'calendar')}
            >
              <Calendar size={16} aria-hidden="true" />
              <span>Calendar</span>
            </button>
          </nav>

          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Subjects
            </div>
            {SUBJECT_LIST.map((subjId) => {
              const theme = SUBJECT_THEMES[subjId];
              const isActive = activePage === subjId;
              return (
                <button
                  key={subjId}
                  type="button"
                  onClick={() => navigateTo(subjId)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                  style={isActive ? { backgroundColor: theme.color } : undefined}
                >
                  <CategoryIcon
                    category={subjId}
                    size={16}
                    className={isActive ? '!text-white' : ''}
                  />
                  <span className="truncate">{theme.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              Academics &amp; Data
            </div>
            <button
              type="button"
              onClick={() => navigateTo('courses')}
              className={navBtnClass(activePage === 'courses')}
            >
              <GraduationCap size={16} aria-hidden="true" />
              <span>Courses &amp; Exams</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('notes')}
              className={navBtnClass(activePage === 'notes')}
            >
              <BookOpen size={16} aria-hidden="true" />
              <span>Notes &amp; Notebooks</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('messages')}
              className={navBtnClass(activePage === 'messages')}
            >
              <MessageSquare size={16} aria-hidden="true" />
              <span className="flex-1 text-left">Live Messages</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Cloud Firestore Live" />
            </button>
            <button
              type="button"
              onClick={() => navigateTo('sync')}
              className={navBtnClass(activePage === 'sync')}
            >
              <Database size={16} aria-hidden="true" />
              <span>Notion Sync &amp; Data</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <AuthButton syncState={syncState} variant="sidebar" />
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
          >
            {darkMode ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar (3 zones: Page Title / Brand — Nav or Colombo Time — Primary CTA) */}
        <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="h-14 px-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                aria-label="Go to Wedapala Home"
                className="lg:hidden shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <img
                  src="/pwa-192x192.png"
                  alt="Wedapala"
                  className="w-8 h-8 object-cover block"
                />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {PAGE_LABELS[activePage]}
                </h1>
                <p className="md:hidden text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                  {clockShort} · {todayStr}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
              <span>Asia/Colombo</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {todayStr} {clockShort}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <AuthButton syncState={syncState} variant="header" />
              <PWAInstallButton variant="compact" />
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {darkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() =>
                  openNewTaskModal(
                    activePage === 'physics' ||
                      activePage === 'chemistry' ||
                      activePage === 'combined_maths'
                      ? activePage
                      : 'physics',
                    todayStr
                  )
                }
                aria-label="New Task"
                className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <Plus size={15} aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">New Task</span>
                <span className="xs:hidden sm:hidden">Task</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 px-3.5 sm:px-6 py-4 sm:py-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              todayStr={todayStr}
              tasks={workspace.tasks}
              pastPaperUnits={workspace.pastPaperUnits}
              assignments={workspace.assignments}
              notes={workspace.notes}
              notebooks={workspace.notebooks}
              pomodoroSettings={workspace.pomodoroSettings}
              pomodoroSessions={workspace.pomodoroSessions}
              countdowns={workspace.countdowns}
              onQuickCreateTask={handleQuickCreateTask}
              onOpenNewTaskModal={openNewTaskModal}
              onToggleTask={handleToggleTask}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onUpdatePomodoroSettings={handleUpdatePomodoroSettings}
              onLogPomodoroSession={handleLogPomodoroSession}
              onAddCountdown={handleAddCountdown}
              onDeleteCountdown={handleDeleteCountdown}
              onNavigate={navigateTo}
            />
          )}

          {activePage === 'tasks' && (
            <AllTasksPage
              tasks={workspace.tasks}
              todayStr={todayStr}
              onToggleTask={handleToggleTask}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onOpenNewTaskModal={openNewTaskModal}
            />
          )}

          {activePage === 'schedule' && (
            <WeeklySchedulePage
              tasks={workspace.tasks}
              todayStr={todayStr}
              onToggleTask={handleToggleTask}
              onEditTask={openEditTaskModal}
              onOpenNewTaskModal={openNewTaskModal}
            />
          )}

          {activePage === 'calendar' && (
            <CalendarPage
              tasks={workspace.tasks}
              assignments={workspace.assignments}
              todayStr={todayStr}
              onToggleTask={handleToggleTask}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onOpenNewTaskModal={openNewTaskModal}
            />
          )}

          {(activePage === 'physics' ||
            activePage === 'chemistry' ||
            activePage === 'combined_maths') && (
            <SubjectPage
              subject={activePage}
              todayStr={todayStr}
              tasks={workspace.tasks}
              marks={workspace.marks}
              pastPaperUnits={workspace.pastPaperUnits}
              notes={workspace.notes}
              notebooks={workspace.notebooks}
              onToggleTask={handleToggleTask}
              onEditTask={openEditTaskModal}
              onDeleteTask={handleDeleteTask}
              onOpenNewTaskModal={(subj) => openNewTaskModal(subj, todayStr)}
              onAddMark={handleAddMark}
              onUpdateMark={handleUpdateMark}
              onDeleteMark={handleDeleteMark}
              onAddPastPaperUnit={handleAddPastPaperUnit}
              onUpdatePastPaperUnit={handleUpdatePastPaperUnit}
              onDeletePastPaperUnit={handleDeletePastPaperUnit}
              onCreateLinkedTask={handleCreateLinkedTask}
              onNavigate={navigateTo}
            />
          )}

          {activePage === 'courses' && (
            <CoursesExamsPage
              courses={workspace.courses}
              assignments={workspace.assignments}
              notes={workspace.notes}
              notebooks={workspace.notebooks}
              todayStr={todayStr}
              onAddCourse={handleAddCourse}
              onDeleteCourse={handleDeleteCourse}
              onAddAssignment={handleAddAssignment}
              onUpdateAssignment={handleUpdateAssignment}
              onDeleteAssignment={handleDeleteAssignment}
              onNavigate={navigateTo}
            />
          )}

          {activePage === 'notes' && (
            <NotesNotebooksPage
              notes={workspace.notes}
              notebooks={workspace.notebooks}
              courses={workspace.courses}
              todayStr={todayStr}
              onAddNotebook={handleAddNotebook}
              onUpdateNotebook={handleUpdateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activePage === 'messages' && (
            <MessagesFeed variant="full" />
          )}

          {activePage === 'sync' && (
            <NotionSyncPage
              workspace={workspace}
              onReplaceWorkspace={(next) => setWorkspace(next)}
              onMergeWorkspace={(partial) =>
                setWorkspace((prev) => ({ ...prev, ...partial }))
              }
              onClearWorkspace={() => setWorkspace(createEmptyWorkspace())}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (< 1024px) with iPhone & Android Safe Area */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        <button
          type="button"
          onClick={() => navigateTo('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 text-[11px] font-medium transition-colors ${
            activePage === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard size={20} aria-hidden="true" />
          <span className="mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('tasks')}
          className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 text-[11px] font-medium transition-colors ${
            activePage === 'tasks'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare size={20} aria-hidden="true" />
          <span className="mt-0.5">All Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            setMobileSubjectsOpen((v) => !v);
          }}
          className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 text-[11px] font-medium transition-colors ${
            activePage === 'physics' ||
            activePage === 'chemistry' ||
            activePage === 'combined_maths'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <GraduationCap size={20} aria-hidden="true" />
          <span className="mt-0.5">Subjects</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('calendar')}
          className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 text-[11px] font-medium transition-colors ${
            activePage === 'calendar'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar size={20} aria-hidden="true" />
          <span className="mt-0.5">Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileSubjectsOpen(false);
            setMobileMenuOpen((v) => !v);
          }}
          className={`flex flex-col items-center justify-center min-h-[56px] py-1.5 text-[11px] font-medium transition-colors ${
            activePage === 'schedule' ||
            activePage === 'courses' ||
            activePage === 'notes' ||
            activePage === 'sync'
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Menu size={20} aria-hidden="true" />
          <span className="mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile Subjects Bottom Sheet */}
      {mobileSubjectsOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileSubjectsOpen(false);
          }}
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Select Subject"
        >
          <div className="w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-3 border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Subjects</h2>
              <button
                type="button"
                onClick={() => setMobileSubjectsOpen(false)}
                aria-label="Close subjects sheet"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {SUBJECT_LIST.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => navigateTo(s)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left min-h-[52px] active:scale-[0.99] transition-transform"
                >
                  <CategoryIcon category={s} size={20} />
                  <span className="text-sm font-semibold">{SUBJECT_THEMES[s].label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile More Bottom Sheet */}
      {mobileMenuOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="More Workspace Pages"
        >
          <div className="w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white dark:bg-slate-900 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-3.5 border-t border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Wedapala"
                  className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h2 className="text-base font-bold leading-tight">Wedapala Workspace</h2>
                  <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    Asia/Colombo · {todayStr} {clockShort}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close workspace menu"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pt-1 pb-1">
              <AuthButton syncState={syncState} variant="sidebar" />
            </div>

            <button
              type="button"
              onClick={() => navigateTo('messages')}
              className="w-full p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-left text-xs font-semibold min-h-[52px] active:scale-[0.99] transition-transform flex items-center justify-between"
            >
              <span className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
                <MessageSquare size={17} className="text-indigo-600 dark:text-indigo-400" />
                <span>Live Study Messages</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigateTo('schedule')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs font-semibold min-h-[52px] active:scale-[0.99] transition-transform"
              >
                Weekly Schedule
              </button>
              <button
                type="button"
                onClick={() => navigateTo('courses')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs font-semibold min-h-[52px] active:scale-[0.99] transition-transform"
              >
                Courses &amp; Exams
              </button>
              <button
                type="button"
                onClick={() => navigateTo('notes')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs font-semibold min-h-[52px] active:scale-[0.99] transition-transform"
              >
                Notes &amp; Notebooks
              </button>
              <button
                type="button"
                onClick={() => navigateTo('sync')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left text-xs font-semibold min-h-[52px] active:scale-[0.99] transition-transform"
              >
                Notion Sync &amp; Data
              </button>
            </div>
            <div className="pt-2 space-y-2">
              <PWAInstallButton />
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold min-h-[44px]"
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                <span>{darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Task Modal */}
      {taskModalOpen && (
        <TaskFormModal
          isOpen={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          initialTask={editingTask}
          defaultCategory={modalDefaultCategory}
          defaultDate={modalDefaultDate}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
