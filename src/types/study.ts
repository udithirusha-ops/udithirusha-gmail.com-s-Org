export type SubjectId = 'physics' | 'chemistry' | 'combined_maths';

export type TaskCategory = SubjectId | 'personal';

export type TaskPriority = 'low' | 'medium' | 'high';

export type RecurrenceFrequency =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'weekdays'
  | 'monthly'
  | 'custom';

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  interval: number; // e.g., every N days/weeks/months
  weekdays?: number[]; // 0 = Sun ... 6 = Sat
  active: boolean;
}

export interface TaskOccurrenceRecord {
  id: string;
  scheduledDate: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
}

export interface StudyTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD (Asia/Colombo)
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  progress: number; // 0 to 100
  recurrence: TaskRecurrence;
  occurrenceHistory: TaskOccurrenceRecord[];
  notes?: string;
  linkedPastPaperId?: string;
  notionPageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarkEntry {
  id: string;
  subject: SubjectId;
  paperName: string;
  date: string; // YYYY-MM-DD
  marksObtained: number;
  maxMarks: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TheoryStatus = 'Not started' | 'In progress' | 'Done';

export type PastPaperSection =
  | 'physics'
  | 'chemistry'
  | 'pure_maths'
  | 'applied_maths';

export type PastPprsActionType =
  | 'unconfigured'
  | 'log_session'
  | 'create_task'
  | 'cycle_theory';

export interface PastPaperUnit {
  id: string;
  section: PastPaperSection;
  title: string; // Unit / Pure mathematics / Applied mathematics
  theory: TheoryStatus;
  extra: boolean;
  tute?: boolean; // Present on Pure Mathematics Analysis
  pastPprsAction: PastPprsActionType;
  pastPprsLogs: { id: string; date: string; note: string }[];
  notes?: string;
  notionPageId?: string;
}

export interface Course {
  id: string;
  name: string;
  courseCode: string;
  professor: string;
  email: string;
  location: string;
  time: string;
  semester: string;
  status: 'Active' | 'Completed' | 'Planned';
  syllabus: string;
  summary: string;
  subject: SubjectId | 'general';
  notionPageId?: string;
}

export type AssignmentType = 'Assignment' | 'Exam' | 'Quiz' | 'Lab' | 'Practical';
export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface AssignmentExam {
  id: string;
  title: string;
  type: AssignmentType;
  status: AssignmentStatus;
  dueDate: string; // YYYY-MM-DD
  courseId: string;
  subject: SubjectId | 'general';
  notes: string;
  notionPageId?: string;
}

export type NoteType = 'Lecture' | 'Cornell' | 'QEC' | 'Feynman' | 'Outline';
export type NotebookConfidence =
  | 'Not Confident'
  | 'Somewhat Confident'
  | 'Confident';

export interface Notebook {
  id: string;
  title: string;
  courseId: string;
  subject: SubjectId | 'general';
  confidence: NotebookConfidence;
  description: string;
  notionPageId?: string;
}

export interface StudyNote {
  id: string;
  title: string;
  type: NoteType;
  content: string;
  cues?: string; // Cornell cues
  summary?: string; // Cornell / general summary
  question?: string; // QEC
  evidence?: string; // QEC
  conclusion?: string; // QEC
  courseId: string;
  notebookId: string;
  subject: SubjectId | 'general';
  favourite: boolean;
  lastReviewedDate?: string; // YYYY-MM-DD
  relatedNoteIds: string[];
  createdAt: string;
  updatedAt: string;
  notionPageId?: string;
}

export interface PomodoroSession {
  id: string;
  subject: TaskCategory;
  mode: 'work' | 'short_break' | 'long_break';
  durationMinutes: number;
  completedAt: string; // ISO
  label?: string;
}

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

export interface CountdownItem {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  targetTime?: string; // HH:MM
  subject: SubjectId | 'general';
}

export interface NotionDatabaseMapping {
  allTasksId?: string;
  physicsPastPapersId?: string;
  chemistryPastPapersId?: string;
  pureMathsPastPapersId?: string;
  appliedMathsPastPapersId?: string;
  coursesId?: string;
  assignmentsId?: string;
  notesId?: string;
  notebooksId?: string;
  marksId?: string;
}

export interface NotionSyncState {
  lastSyncedAt?: string;
  mappings: NotionDatabaseMapping;
}

export interface WorkspaceData {
  tasks: StudyTask[]; // The SINGLE All Tasks database
  marks: MarkEntry[];
  pastPaperUnits: PastPaperUnit[];
  courses: Course[];
  assignments: AssignmentExam[];
  notebooks: Notebook[];
  notes: StudyNote[];
  pomodoroSessions: PomodoroSession[];
  pomodoroSettings: PomodoroSettings;
  countdowns: CountdownItem[];
  notionSync: NotionSyncState;
}

export type TaskViewFilter =
  | 'all'
  | 'today'
  | 'upcoming'
  | 'week'
  | 'completed'
  | 'remaining'
  | 'overdue'
  | 'physics'
  | 'chemistry'
  | 'combined_maths'
  | 'personal'
  | 'recurring';

export type TaskSortField =
  | 'dueDate'
  | 'priority'
  | 'category'
  | 'completed'
  | 'title';

export interface StudyMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  subject: 'physics' | 'chemistry' | 'combined_maths' | 'general';
  createdAt: string; // ISO string
}

export type ActivePage =
  | 'dashboard'
  | 'tasks'
  | 'schedule'
  | 'calendar'
  | 'physics'
  | 'chemistry'
  | 'combined_maths'
  | 'courses'
  | 'notes'
  | 'messages'
  | 'sync';
