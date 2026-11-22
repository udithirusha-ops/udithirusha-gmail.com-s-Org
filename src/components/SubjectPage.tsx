import React from 'react';
import { ArrowRight, BookOpen, Plus } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import {
  ActivePage,
  MarkEntry,
  Notebook,
  PastPaperUnit,
  StudyNote,
  StudyTask,
  SubjectId,
} from '../types/study';
import { calculateSubjectProgress } from '../utils/calculations';
import { SubjectPieChart } from './Charts';
import { MarkAnalysisSection } from './MarkAnalysisSection';
import { PastPapersTable } from './PastPapersTable';
import { CategoryIcon } from './SubjectBadge';
import { TaskRow } from './TaskRow';

interface SubjectPageProps {
  subject: SubjectId;
  todayStr: string;
  tasks: StudyTask[];
  marks: MarkEntry[];
  pastPaperUnits: PastPaperUnit[];
  notes: StudyNote[];
  notebooks: Notebook[];
  onToggleTask: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onOpenNewTaskModal: (subject: SubjectId) => void;
  onAddMark: (entry: Omit<MarkEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMark: (entry: MarkEntry) => void;
  onDeleteMark: (id: string) => void;
  onAddPastPaperUnit: (unit: Omit<PastPaperUnit, 'id'>) => void;
  onUpdatePastPaperUnit: (unit: PastPaperUnit) => void;
  onDeletePastPaperUnit: (id: string) => void;
  onCreateLinkedTask: (title: string, subject: SubjectId, unitId: string) => void;
  onNavigate: (page: ActivePage) => void;
}

export const SubjectPage: React.FC<SubjectPageProps> = ({
  subject,
  todayStr,
  tasks,
  marks,
  pastPaperUnits,
  notes,
  notebooks,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
  onAddMark,
  onUpdateMark,
  onDeleteMark,
  onAddPastPaperUnit,
  onUpdatePastPaperUnit,
  onDeletePastPaperUnit,
  onCreateLinkedTask,
  onNavigate,
}) => {
  const theme = SUBJECT_THEMES[subject];
  const subjectTasks = tasks.filter((t) => t.category === subject);
  const progress = calculateSubjectProgress(tasks, subject, todayStr);
  const subjectMarks = marks.filter((m) => m.subject === subject);
  const subjectNotes = notes.filter((n) => n.subject === subject);
  const subjectNotebooks = notebooks.filter((nb) => nb.subject === subject);

  return (
    <div className="space-y-6">
      {/* Subject Overview Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${theme.color}18` }}
          >
            <CategoryIcon category={subject} size={24} />
          </div>
          <div>
            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ color: theme.color }}
            >
              {theme.label}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Subject tasks from All Tasks · Mark Analysis · Past Papers Analysis · Study Resources
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewTaskModal(subject)}
          style={{ backgroundColor: theme.color }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white whitespace-nowrap shrink-0 min-h-[42px]"
        >
          <Plus size={15} aria-hidden="true" />
          <span>Add {theme.shortLabel} Task</span>
        </button>
      </div>

      {/* Subject Task Progress + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {theme.label} Progress
              </h3>
              <span
                className="font-mono tabular-nums text-lg font-bold"
                style={{ color: theme.color }}
              >
                {progress.completionPercentage}%
              </span>
            </div>

            <div className="mt-3 w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress.completionPercentage}%`,
                  backgroundColor: theme.color,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="py-2 sm:pr-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Total tasks
              </span>
              <span className="mt-1 block font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
                {progress.total}
              </span>
            </div>
            <div className="py-2 pl-4 sm:px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Completed
              </span>
              <span className="mt-1 block font-mono tabular-nums text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {progress.completed}
              </span>
            </div>
            <div className="py-2 sm:px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Remaining
              </span>
              <span className="mt-1 block font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
                {progress.remaining}
              </span>
            </div>
            <div className="py-2 pl-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">
                Overdue
              </span>
              <span className="mt-1 block font-mono tabular-nums text-lg font-bold text-red-600 dark:text-red-400">
                {progress.overdue}
              </span>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
            Completed vs Remaining
          </h3>
          <SubjectPieChart
            completed={progress.completed}
            remaining={progress.remaining}
            color={theme.color}
            subjectLabel={theme.label}
          />
        </section>
      </div>

      {/* Subject-Specific Tasks */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {theme.label} Tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filtered view from All Tasks ({subjectTasks.length})
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <span>Open All Tasks</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>

        {subjectTasks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No {theme.label} tasks yet
            </p>
            <button
              type="button"
              onClick={() => onOpenNewTaskModal(subject)}
              style={{ backgroundColor: theme.color }}
              className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white"
            >
              Add First {theme.label} Task
            </button>
          </div>
        ) : (
          <div>
            {subjectTasks.map((task) => (
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

      {/* Mark Analysis */}
      <MarkAnalysisSection
        subject={subject}
        entries={subjectMarks}
        onAddMark={onAddMark}
        onUpdateMark={onUpdateMark}
        onDeleteMark={onDeleteMark}
      />

      {/* Past Papers Analysis (Separate Pure & Applied for Combined Mathematics) */}
      {subject === 'physics' && (
        <PastPapersTable
          section="physics"
          title="Physics Past Papers Analysis"
          primaryColumnName="Unit"
          subjectColor={theme.color}
          units={pastPaperUnits.filter((u) => u.section === 'physics')}
          onAddUnit={onAddPastPaperUnit}
          onUpdateUnit={onUpdatePastPaperUnit}
          onDeleteUnit={onDeletePastPaperUnit}
          onCreateLinkedTask={onCreateLinkedTask}
        />
      )}

      {subject === 'chemistry' && (
        <PastPapersTable
          section="chemistry"
          title="Chemistry Past Papers Analysis"
          primaryColumnName="Unit"
          subjectColor={theme.color}
          units={pastPaperUnits.filter((u) => u.section === 'chemistry')}
          onAddUnit={onAddPastPaperUnit}
          onUpdateUnit={onUpdatePastPaperUnit}
          onDeleteUnit={onDeletePastPaperUnit}
          onCreateLinkedTask={onCreateLinkedTask}
        />
      )}

      {subject === 'combined_maths' && (
        <div className="space-y-6">
          <PastPapersTable
            section="pure_maths"
            title="Combined Mathematics — Pure Mathematics Analysis"
            primaryColumnName="Pure mathematics"
            showTuteColumn={true}
            subjectColor={theme.color}
            units={pastPaperUnits.filter((u) => u.section === 'pure_maths')}
            onAddUnit={onAddPastPaperUnit}
            onUpdateUnit={onUpdatePastPaperUnit}
            onDeleteUnit={onDeletePastPaperUnit}
            onCreateLinkedTask={onCreateLinkedTask}
          />
          <PastPapersTable
            section="applied_maths"
            title="Combined Mathematics — Applied Mathematics Analysis"
            primaryColumnName="Applied mathematics"
            showTuteColumn={false}
            subjectColor={theme.color}
            units={pastPaperUnits.filter((u) => u.section === 'applied_maths')}
            onAddUnit={onAddPastPaperUnit}
            onUpdateUnit={onUpdatePastPaperUnit}
            onDeleteUnit={onDeletePastPaperUnit}
            onCreateLinkedTask={onCreateLinkedTask}
          />
        </div>
      )}

      {/* Relevant Notes & Resources */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: theme.color }} aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {theme.label} Notes &amp; Notebooks
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('notes')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <span>Open Notes</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>

        {subjectNotes.length === 0 && subjectNotebooks.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No notes or notebooks linked to {theme.label} yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subjectNotebooks.map((nb) => (
              <div
                key={nb.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {nb.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Notebook · Confidence: {nb.confidence}
                </div>
              </div>
            ))}
            {subjectNotes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {note.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {note.type} Note
                  {note.lastReviewedDate ? ` · Reviewed ${note.lastReviewedDate}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
