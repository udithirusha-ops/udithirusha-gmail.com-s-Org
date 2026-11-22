import {
  AssignmentExam,
  Course,
  MarkEntry,
  Notebook,
  PastPaperSection,
  PastPaperUnit,
  StudyNote,
  StudyTask,
  SubjectId,
  TaskCategory,
  TaskPriority,
  TheoryStatus,
  WorkspaceData,
} from '../types/study';
import { getColomboTodayStr } from './colomboTime';

const STORAGE_KEY = 'studiess_workspace_v1';
const IDB_NAME = 'studiess_workspace_db';
const IDB_STORE = 'workspace';
const IDB_KEY = 'primary';

export function createEmptyWorkspace(): WorkspaceData {
  return {
    tasks: [],
    marks: [],
    pastPaperUnits: [],
    courses: [],
    assignments: [],
    notebooks: [],
    notes: [],
    pomodoroSessions: [],
    pomodoroSettings: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    },
    countdowns: [],
    notionSync: {
      mappings: {},
    },
  };
}

function normalizeWorkspace(raw: Partial<WorkspaceData> | null | undefined): WorkspaceData {
  const base = createEmptyWorkspace();
  if (!raw || typeof raw !== 'object') return base;
  return {
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    marks: Array.isArray(raw.marks) ? raw.marks : [],
    pastPaperUnits: Array.isArray(raw.pastPaperUnits) ? raw.pastPaperUnits : [],
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    assignments: Array.isArray(raw.assignments) ? raw.assignments : [],
    notebooks: Array.isArray(raw.notebooks) ? raw.notebooks : [],
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    pomodoroSessions: Array.isArray(raw.pomodoroSessions) ? raw.pomodoroSessions : [],
    pomodoroSettings: {
      workMinutes: raw.pomodoroSettings?.workMinutes ?? 25,
      shortBreakMinutes: raw.pomodoroSettings?.shortBreakMinutes ?? 5,
      longBreakMinutes: raw.pomodoroSettings?.longBreakMinutes ?? 15,
    },
    countdowns: Array.isArray(raw.countdowns) ? raw.countdowns : [],
    notionSync: {
      lastSyncedAt: raw.notionSync?.lastSyncedAt,
      mappings: raw.notionSync?.mappings ?? {},
    },
  };
}

export function loadWorkspaceSync(): WorkspaceData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyWorkspace();
    return normalizeWorkspace(JSON.parse(raw) as Partial<WorkspaceData>);
  } catch {
    return createEmptyWorkspace();
  }
}

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadWorkspaceAsync(): Promise<WorkspaceData> {
  const local = loadWorkspaceSync();
  const db = await openIdb();
  if (!db) return local;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => {
        if (req.result) {
          resolve(normalizeWorkspace(req.result as Partial<WorkspaceData>));
        } else {
          resolve(local);
        }
      };
      req.onerror = () => resolve(local);
    } catch {
      resolve(local);
    }
  });
}

export async function saveWorkspace(data: WorkspaceData): Promise<void> {
  const normalized = normalizeWorkspace(data);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // localStorage quota exceeded — IndexedDB still stores full copy
  }

  const db = await openIdb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(normalized, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * RFC-4180 compliant CSV parser for Notion database CSV exports
 */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.some((cell) => cell.length > 0))
    .map((r) => {
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = r[idx] ?? '';
      });
      return record;
    });
}

function inferCategory(raw: string): TaskCategory {
  const s = (raw || '').toLowerCase();
  if (s.includes('phys')) return 'physics';
  if (s.includes('chem')) return 'chemistry';
  if (s.includes('math') || s.includes('pure') || s.includes('applied')) {
    return 'combined_maths';
  }
  return 'personal';
}

function inferSubject(raw: string): SubjectId | 'general' {
  const s = (raw || '').toLowerCase();
  if (s.includes('phys')) return 'physics';
  if (s.includes('chem')) return 'chemistry';
  if (s.includes('math') || s.includes('pure') || s.includes('applied')) {
    return 'combined_maths';
  }
  return 'general';
}

function normalizeNotionDate(raw: string, fallback: string): string {
  if (!raw) return fallback;
  const isoMatch = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return fallback;
}

function parseBool(raw: string): boolean {
  const v = (raw || '').trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1' || v === 'checked' || v === 'done';
}

function parsePriority(raw: string): TaskPriority {
  const v = (raw || '').trim().toLowerCase();
  if (v.includes('high') || v.includes('urgent')) return 'high';
  if (v.includes('low')) return 'low';
  return 'medium';
}

function parseTheoryStatus(raw: string): TheoryStatus {
  const v = (raw || '').trim().toLowerCase();
  if (v.includes('done') || v.includes('complete')) return 'Done';
  if (v.includes('progress')) return 'In progress';
  return 'Not started';
}

export function importTasksFromCsv(csvText: string): StudyTask[] {
  const rows = parseCsv(csvText);
  const today = getColomboTodayStr();
  const nowIso = new Date().toISOString();

  return rows.map((row) => {
    const title =
      row['Name'] ||
      row['Task'] ||
      row['Title'] ||
      Object.values(row)[0] ||
      'Imported Task';
    const category = inferCategory(
      row['Subject'] || row['Category'] || row['Course'] || row['Tag'] || ''
    );
    const dueDate = normalizeNotionDate(
      row['Due Date'] || row['Date'] || row['Due'] || '',
      today
    );
    const completed = parseBool(
      row['Done'] || row['Completed'] || row['Status'] || ''
    );
    const priority = parsePriority(row['Priority'] || '');
    const progressRaw = Number(row['Progress'] || (completed ? 100 : 0));

    return {
      id: generateId('task'),
      title,
      category,
      dueDate,
      priority,
      completed,
      completedAt: completed ? nowIso : undefined,
      progress: Number.isFinite(progressRaw) ? Math.min(100, Math.max(0, progressRaw)) : 0,
      recurrence: { frequency: 'none', interval: 1, active: false },
      occurrenceHistory: [],
      notes: row['Notes'] || row['Description'] || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });
}

export function importPastPapersFromCsv(
  csvText: string,
  section: PastPaperSection
): PastPaperUnit[] {
  const rows = parseCsv(csvText);
  return rows.map((row) => {
    const title =
      row['Unit'] ||
      row['Pure mathematics'] ||
      row['Applied mathematics'] ||
      row['Name'] ||
      Object.values(row)[0] ||
      'Unit';
    return {
      id: generateId('pp'),
      section,
      title,
      theory: parseTheoryStatus(row['Theory'] || ''),
      extra: parseBool(row['Extra'] || ''),
      tute: section === 'pure_maths' ? parseBool(row['Tute'] || '') : undefined,
      pastPprsAction: 'unconfigured',
      pastPprsLogs: [],
      notes: row['Notes'] || '',
    };
  });
}

export function importMarksFromCsv(
  csvText: string,
  subject: SubjectId
): MarkEntry[] {
  const rows = parseCsv(csvText);
  const today = getColomboTodayStr();
  const nowIso = new Date().toISOString();

  return rows.reduce<MarkEntry[]>((acc, row) => {
    const paperName =
      row['Paper'] ||
      row['Paper Name'] ||
      row['Name'] ||
      Object.values(row)[0] ||
      'Paper';
    const marksObtained = Number(row['Marks'] || row['Score'] || row['Marks Obtained'] || 0);
    const maxMarks = Number(row['Max Marks'] || row['Total'] || row['Out Of'] || 100);
    if (!Number.isFinite(marksObtained)) return acc;
    acc.push({
      id: generateId('mark'),
      subject,
      paperName,
      date: normalizeNotionDate(row['Date'] || '', today),
      marksObtained,
      maxMarks: Number.isFinite(maxMarks) && maxMarks > 0 ? maxMarks : 100,
      notes: row['Notes'] || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    return acc;
  }, []);
}

export function importCoursesFromCsv(csvText: string): Course[] {
  const rows = parseCsv(csvText);
  return rows.map((row) => ({
    id: generateId('course'),
    name: row['Name'] || Object.values(row)[0] || 'Course',
    courseCode: row['Course Code'] || row['Code'] || '',
    professor: row['Professor'] || '',
    email: row['Email'] || '',
    location: row['Location'] || '',
    time: row['Time'] || '',
    semester: row['Semester'] || '',
    status: (row['Status'] === 'Completed' || row['Status'] === 'Planned'
      ? row['Status']
      : 'Active') as Course['status'],
    syllabus: row['Syllabus'] || '',
    summary: row['Summary'] || '',
    subject: inferSubject(row['Subject'] || row['Name'] || ''),
  }));
}

export function importAssignmentsFromCsv(
  csvText: string,
  courses: Course[]
): AssignmentExam[] {
  const rows = parseCsv(csvText);
  const today = getColomboTodayStr();

  return rows.map((row) => {
    const courseName = (row['Course'] || '').toLowerCase();
    const matchedCourse = courses.find(
      (c) =>
        c.name.toLowerCase() === courseName ||
        c.courseCode.toLowerCase() === courseName
    );
    const rawStatus = (row['Status'] || '').toLowerCase();
    const status: AssignmentExam['status'] = rawStatus.includes('complete') || rawStatus.includes('done')
      ? 'Complete'
      : rawStatus.includes('progress')
        ? 'In Progress'
        : 'Not Started';

    const rawType = (row['Type'] || '').toLowerCase();
    const type: AssignmentExam['type'] = rawType.includes('exam')
      ? 'Exam'
      : rawType.includes('quiz')
        ? 'Quiz'
        : rawType.includes('lab')
          ? 'Lab'
          : rawType.includes('practical')
            ? 'Practical'
            : 'Assignment';

    return {
      id: generateId('asg'),
      title: row['Title'] || row['Name'] || Object.values(row)[0] || 'Assignment',
      type,
      status,
      dueDate: normalizeNotionDate(row['Due Date'] || row['Date'] || '', today),
      courseId: matchedCourse?.id ?? '',
      subject: matchedCourse?.subject ?? inferSubject(row['Subject'] || row['Course'] || ''),
      notes: row['Notes'] || '',
    };
  });
}

export function importNotesFromCsv(
  csvText: string,
  courses: Course[],
  notebooks: Notebook[]
): StudyNote[] {
  const rows = parseCsv(csvText);
  const nowIso = new Date().toISOString();

  return rows.map((row) => {
    const rawType = (row['Type'] || '').toLowerCase();
    const type: StudyNote['type'] = rawType.includes('cornell')
      ? 'Cornell'
      : rawType.includes('qec')
        ? 'QEC'
        : rawType.includes('feynman')
          ? 'Feynman'
          : rawType.includes('outline')
            ? 'Outline'
            : 'Lecture';

    const courseName = (row['Course'] || '').toLowerCase();
    const matchedCourse = courses.find((c) => c.name.toLowerCase() === courseName);
    const nbName = (row['Notebook'] || '').toLowerCase();
    const matchedNb = notebooks.find((n) => n.title.toLowerCase() === nbName);

    return {
      id: generateId('note'),
      title: row['Name'] || row['Title'] || Object.values(row)[0] || 'Note',
      type,
      content: row['Content'] || row['Notes'] || '',
      cues: row['Cues'] || '',
      summary: row['Summary'] || '',
      question: row['Question'] || '',
      evidence: row['Evidence'] || '',
      conclusion: row['Conclusion'] || '',
      courseId: matchedCourse?.id ?? '',
      notebookId: matchedNb?.id ?? '',
      subject: matchedCourse?.subject ?? inferSubject(row['Subject'] || row['Course'] || ''),
      favourite: parseBool(row['Favourite'] || row['Favorite'] || ''),
      lastReviewedDate: row['Last Reviewed']
        ? normalizeNotionDate(row['Last Reviewed'], '')
        : undefined,
      relatedNoteIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });
}
