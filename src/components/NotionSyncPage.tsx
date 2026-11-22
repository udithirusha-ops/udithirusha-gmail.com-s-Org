import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { uploadLocalWorkspaceToFirestore } from '../firebase/firestoreSync';
import {
  PastPaperSection,
  StudyTask,
  SubjectId,
  WorkspaceData,
} from '../types/study';
import { getColomboTodayStr } from '../utils/colomboTime';
import {
  generateId,
  importAssignmentsFromCsv,
  importCoursesFromCsv,
  importMarksFromCsv,
  importNotesFromCsv,
  importPastPapersFromCsv,
  importTasksFromCsv,
} from '../utils/storage';

interface NotionSyncPageProps {
  workspace: WorkspaceData;
  onReplaceWorkspace: (next: WorkspaceData) => void;
  onMergeWorkspace: (partial: Partial<WorkspaceData>) => void;
  onClearWorkspace: () => void;
}

interface DiscoveredNotionDb {
  id: string;
  title: string;
  properties: { name: string; type: string }[];
}

type CsvTarget =
  | 'all_tasks'
  | 'physics_pp'
  | 'chemistry_pp'
  | 'pure_maths_pp'
  | 'applied_maths_pp'
  | 'physics_marks'
  | 'chemistry_marks'
  | 'maths_marks'
  | 'courses'
  | 'assignments'
  | 'notes';

export const NotionSyncPage: React.FC<NotionSyncPageProps> = ({
  workspace,
  onReplaceWorkspace,
  onMergeWorkspace,
  onClearWorkspace,
}) => {
  const [notionToken, setNotionToken] = useState('');
  const [discoveredDbs, setDiscoveredDbs] = useState<DiscoveredNotionDb[]>([]);
  const [allTasksDbId, setAllTasksDbId] = useState(
    workspace.notionSync.mappings.allTasksId ?? ''
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [csvTarget, setCsvTarget] = useState<CsvTarget>('all_tasks');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleDiscoverDatabases = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notionToken.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Enter your Notion Internal Integration Token first.',
      });
      return;
    }
    setIsConnecting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/notion/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: notionToken.trim() }),
      });
      const json = (await res.json()) as {
        databases?: DiscoveredNotionDb[];
        error?: string;
      };
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to query Notion databases');
      }
      const dbs = json.databases ?? [];
      setDiscoveredDbs(dbs);
      const guessedAllTasks = dbs.find((d) =>
        d.title.toLowerCase().includes('all tasks')
      );
      if (guessedAllTasks && !allTasksDbId) {
        setAllTasksDbId(guessedAllTasks.id);
      }
      setStatusMsg({
        type: 'success',
        text: `Found ${dbs.length} shared Notion databases. Select your All Tasks database to sync.`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Notion connection failed.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const extractNotionText = (prop: Record<string, unknown> | undefined): string => {
    if (!prop) return '';
    const type = prop.type as string;
    if (type === 'title' && Array.isArray(prop.title)) {
      return prop.title
        .map((t) => (t as { plain_text?: string }).plain_text ?? '')
        .join('')
        .trim();
    }
    if (type === 'rich_text' && Array.isArray(prop.rich_text)) {
      return prop.rich_text
        .map((t) => (t as { plain_text?: string }).plain_text ?? '')
        .join('')
        .trim();
    }
    if (type === 'select' && prop.select && typeof prop.select === 'object') {
      return ((prop.select as { name?: string }).name ?? '').trim();
    }
    if (type === 'status' && prop.status && typeof prop.status === 'object') {
      return ((prop.status as { name?: string }).name ?? '').trim();
    }
    if (type === 'multi_select' && Array.isArray(prop.multi_select)) {
      return prop.multi_select
        .map((m) => (m as { name?: string }).name ?? '')
        .join(', ');
    }
    return '';
  };

  const handleSyncAllTasksFromNotion = async () => {
    if (!notionToken.trim() || !allTasksDbId.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Provide both your Notion Integration Token and All Tasks Database ID.',
      });
      return;
    }
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/notion/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: notionToken.trim(),
          databaseId: allTasksDbId.trim(),
        }),
      });
      const json = (await res.json()) as {
        results?: Array<{
          id: string;
          properties: Record<string, Record<string, unknown>>;
        }>;
        error?: string;
      };
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to pull Notion All Tasks.');
      }

      const today = getColomboTodayStr();
      const nowIso = new Date().toISOString();
      const existingByNotionId = new Map(
        workspace.tasks
          .filter((t) => t.notionPageId)
          .map((t) => [t.notionPageId!, t])
      );

      const importedTasks: StudyTask[] = (json.results ?? []).map((page) => {
        const props = page.properties ?? {};
        const entries = Object.entries(props);
        const titleEntry = entries.find(([, v]) => v?.type === 'title');
        const dateEntry = entries.find(([, v]) => v?.type === 'date');
        const checkboxEntry = entries.find(
          ([k, v]) =>
            v?.type === 'checkbox' &&
            (k.toLowerCase().includes('done') ||
              k.toLowerCase().includes('complete') ||
              k.toLowerCase() === 'status')
        );
        const subjectProp =
          props['Subject'] || props['Category'] || props['Course'] || props['Tag'];
        const priorityProp = props['Priority'];
        const statusProp = props['Status'];

        const rawTitle = extractNotionText(titleEntry?.[1]) || 'Untitled Notion Task';
        const rawSubj = extractNotionText(subjectProp).toLowerCase();
        const category = rawSubj.includes('phys')
          ? 'physics'
          : rawSubj.includes('chem')
            ? 'chemistry'
            : rawSubj.includes('math')
              ? 'combined_maths'
              : 'personal';

        const dateObj = dateEntry?.[1]?.date as { start?: string } | null | undefined;
        const dueDate = dateObj?.start ? dateObj.start.slice(0, 10) : today;

        const checkboxDone = Boolean(checkboxEntry?.[1]?.checkbox);
        const statusText = extractNotionText(statusProp).toLowerCase();
        const completed =
          checkboxDone || statusText.includes('done') || statusText.includes('complete');

        const prioText = extractNotionText(priorityProp).toLowerCase();
        const priority = prioText.includes('high')
          ? 'high'
          : prioText.includes('low')
            ? 'low'
            : 'medium';

        const existing = existingByNotionId.get(page.id);
        return {
          id: existing?.id ?? generateId('task'),
          title: rawTitle,
          category,
          dueDate,
          priority,
          completed,
          completedAt: completed ? existing?.completedAt ?? nowIso : undefined,
          progress: completed ? 100 : existing?.progress ?? 0,
          recurrence: existing?.recurrence ?? {
            frequency: 'none',
            interval: 1,
            active: false,
          },
          occurrenceHistory: existing?.occurrenceHistory ?? [],
          notes: existing?.notes ?? '',
          notionPageId: page.id,
          createdAt: existing?.createdAt ?? nowIso,
          updatedAt: nowIso,
        };
      });

      const localOnlyTasks = workspace.tasks.filter((t) => !t.notionPageId);
      onMergeWorkspace({
        tasks: [...localOnlyTasks, ...importedTasks],
        notionSync: {
          lastSyncedAt: nowIso,
          mappings: {
            ...workspace.notionSync.mappings,
            allTasksId: allTasksDbId.trim(),
          },
        },
      });
      setStatusMsg({
        type: 'success',
        text: `Synced ${importedTasks.length} records from Notion All Tasks without duplicates.`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Sync failed.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      switch (csvTarget) {
        case 'all_tasks': {
          const imported = importTasksFromCsv(text);
          onMergeWorkspace({ tasks: [...workspace.tasks, ...imported] });
          setStatusMsg({
            type: 'success',
            text: `Imported ${imported.length} tasks into All Tasks.`,
          });
          break;
        }
        case 'physics_pp':
        case 'chemistry_pp':
        case 'pure_maths_pp':
        case 'applied_maths_pp': {
          const sectionMap: Record<string, PastPaperSection> = {
            physics_pp: 'physics',
            chemistry_pp: 'chemistry',
            pure_maths_pp: 'pure_maths',
            applied_maths_pp: 'applied_maths',
          };
          const imported = importPastPapersFromCsv(text, sectionMap[csvTarget]);
          onMergeWorkspace({
            pastPaperUnits: [...workspace.pastPaperUnits, ...imported],
          });
          setStatusMsg({
            type: 'success',
            text: `Imported ${imported.length} Past Papers Analysis rows.`,
          });
          break;
        }
        case 'physics_marks':
        case 'chemistry_marks':
        case 'maths_marks': {
          const subjMap: Record<string, SubjectId> = {
            physics_marks: 'physics',
            chemistry_marks: 'chemistry',
            maths_marks: 'combined_maths',
          };
          const imported = importMarksFromCsv(text, subjMap[csvTarget]);
          onMergeWorkspace({ marks: [...workspace.marks, ...imported] });
          setStatusMsg({
            type: 'success',
            text: `Imported ${imported.length} mark entries.`,
          });
          break;
        }
        case 'courses': {
          const imported = importCoursesFromCsv(text);
          onMergeWorkspace({ courses: [...workspace.courses, ...imported] });
          setStatusMsg({
            type: 'success',
            text: `Imported ${imported.length} courses.`,
          });
          break;
        }
        case 'assignments': {
          const imported = importAssignmentsFromCsv(text, workspace.courses);
          onMergeWorkspace({
            assignments: [...workspace.assignments, ...imported],
          });
          setStatusMsg({
            type: 'success',
            text: `Imported ${imported.length} assignments/exams.`,
          });
          break;
        }
        case 'notes': {
          const imported = importNotesFromCsv(
            text,
            workspace.courses,
            workspace.notebooks
          );
          onMergeWorkspace({ notes: [...workspace.notes, ...imported] });
          setStatusMsg({
            type: 'success',
            text: `Imported ${imported.length} notes.`,
          });
          break;
        }
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to parse CSV file.',
      });
    }
    e.target.value = '';
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedapala-backup-${getColomboTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as WorkspaceData;
      onReplaceWorkspace(parsed);
      setStatusMsg({
        type: 'success',
        text: 'Restored complete workspace JSON backup.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Invalid JSON workspace backup file.',
      });
    }
    e.target.value = '';
  };

  const { user, signInWithGoogle, logout } = useAuth();
  const [cloudSyncing, setCloudSyncing] = useState(false);

  const handleUploadToCloud = async () => {
    if (!user) return;
    setCloudSyncing(true);
    try {
      await uploadLocalWorkspaceToFirestore(user.uid, workspace);
      setStatusMsg({
        type: 'success',
        text: 'Successfully synced all local workspace items to Firebase Firestore.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Cloud sync failed.',
      });
    } finally {
      setCloudSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Firebase Authentication & Real-Time Sync Section */}
      <section className="rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-slate-900 dark:to-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Cloud size={22} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Firebase Cloud &amp; Real-Time Sync
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck size={12} />
                  <span>Google Auth</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {user
                  ? `Signed in as ${user.displayName || user.email} · Real-time Firestore sync active across all devices`
                  : 'Sign in with your Google account to automatically synchronize tasks, marks, notes, and study progress across your phone and laptop in real time.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUploadToCloud}
                  disabled={cloudSyncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 text-xs font-semibold min-h-[40px] shadow-xs"
                >
                  <RefreshCw size={13} className={cloudSyncing ? 'animate-spin' : ''} />
                  <span>{cloudSyncing ? 'Uploading...' : 'Sync All to Cloud'}</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 transition-colors min-h-[42px] shadow-sm"
              >
                <LogIn size={15} />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Notion Sync &amp; Offline Data Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          All data is stored locally in IndexedDB for instant offline access. Because this workspace has no pre-authorized Notion session during build, no records or marks have been fabricated—connect your Notion Integration Token below or import your Notion CSV exports directly.
        </p>

        {statusMsg && (
          <div
            role="status"
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 size={15} aria-hidden="true" />
            ) : (
              <AlertCircle size={15} aria-hidden="true" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Direct Notion API Sync */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-slate-500" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Direct Notion API Sync (All Tasks)
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Your token is used only for live proxy requests to <code className="font-mono">/api/notion/*</code> and is not persisted in code.
        </p>

        <form onSubmit={handleDiscoverDatabases} className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={notionToken}
            onChange={(e) => setNotionToken(e.target.value)}
            placeholder="secret_... (Notion Internal Integration Token)"
            aria-label="Notion Integration Token"
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono"
          />
          <button
            type="submit"
            disabled={isConnecting}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[40px]"
          >
            <RefreshCw size={14} className={isConnecting ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{isConnecting ? 'Connecting...' : 'Discover Databases'}</span>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label htmlFor="notion-all-tasks-id" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              All Tasks Database ID
            </label>
            {discoveredDbs.length > 0 ? (
              <select
                id="notion-all-tasks-id"
                value={allTasksDbId}
                onChange={(e) => setAllTasksDbId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
              >
                <option value="">Select All Tasks database...</option>
                {discoveredDbs.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.title} ({db.id.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="notion-all-tasks-id"
                type="text"
                value={allTasksDbId}
                onChange={(e) => setAllTasksDbId(e.target.value)}
                placeholder="Paste Notion All Tasks database ID"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono"
              />
            )}
          </div>
          <button
            type="button"
            onClick={handleSyncAllTasksFromNotion}
            disabled={isSyncing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold min-h-[40px]"
          >
            {isSyncing ? 'Syncing...' : 'Pull All Tasks from Notion'}
          </button>
        </div>
        {workspace.notionSync.lastSyncedAt && (
          <p className="text-[11px] font-mono text-slate-500">
            Last synced: {workspace.notionSync.lastSyncedAt}
          </p>
        )}
      </section>

      {/* Notion CSV Export Importer */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Import Notion CSV Exports (Offline)
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Export any Notion database as CSV and import it directly into the matching Wedapala database without duplicates or extra task tables.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select
            value={csvTarget}
            onChange={(e) => setCsvTarget(e.target.value as CsvTarget)}
            aria-label="Target database for CSV import"
            className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:text-xs min-h-[42px]"
          >
            <option value="all_tasks">All Tasks (Unified Task Database)</option>
            <option value="physics_pp">Physics Past Papers Analysis</option>
            <option value="chemistry_pp">Chemistry Past Papers Analysis</option>
            <option value="pure_maths_pp">Combined Maths — Pure Mathematics Analysis</option>
            <option value="applied_maths_pp">Combined Maths — Applied Mathematics Analysis</option>
            <option value="physics_marks">Physics Mark Analysis</option>
            <option value="chemistry_marks">Chemistry Mark Analysis</option>
            <option value="maths_marks">Combined Mathematics Mark Analysis</option>
            <option value="courses">Courses</option>
            <option value="assignments">Assignments &amp; Exams</option>
            <option value="notes">Notes</option>
          </select>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer min-h-[40px]">
            <Upload size={14} aria-hidden="true" />
            <span>Choose CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="sr-only"
            />
          </label>
        </div>
      </section>

      {/* Full JSON Backup / Restore */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Workspace Backup &amp; Reset
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
          >
            <Download size={14} aria-hidden="true" />
            <span>Export JSON Backup</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[40px]">
            <Upload size={14} aria-hidden="true" />
            <span>Restore JSON Backup</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="sr-only"
            />
          </label>

          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[40px]"
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Reset All Local Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClearWorkspace();
                  setConfirmClear(false);
                  setStatusMsg({
                    type: 'success',
                    text: 'Workspace reset to clean empty state.',
                  });
                }}
                className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold min-h-[40px]"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
