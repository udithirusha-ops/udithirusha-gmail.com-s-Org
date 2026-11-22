import React, { useState } from 'react';
import { Info, Play, Plus, Trash2, X } from 'lucide-react';
import {
  PastPaperSection,
  PastPaperUnit,
  PastPprsActionType,
  SubjectId,
  TheoryStatus,
} from '../types/study';
import { getColomboTodayStr } from '../utils/colomboTime';

interface PastPapersTableProps {
  section: PastPaperSection;
  title: string;
  primaryColumnName: string; // 'Unit' | 'Pure mathematics' | 'Applied mathematics'
  showTuteColumn?: boolean;
  subjectColor: string;
  units: PastPaperUnit[];
  onAddUnit: (unit: Omit<PastPaperUnit, 'id'>) => void;
  onUpdateUnit: (unit: PastPaperUnit) => void;
  onDeleteUnit: (id: string) => void;
  onCreateLinkedTask: (title: string, subject: SubjectId, unitId: string) => void;
}

export const PastPapersTable: React.FC<PastPapersTableProps> = ({
  section,
  title,
  primaryColumnName,
  showTuteColumn = false,
  subjectColor,
  units,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onCreateLinkedTask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [activeButtonUnit, setActiveButtonUnit] = useState<PastPaperUnit | null>(null);
  const [sessionNote, setSessionNote] = useState('');

  const sectionSubject: SubjectId =
    section === 'physics'
      ? 'physics'
      : section === 'chemistry'
        ? 'chemistry'
        : 'combined_maths';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddUnit({
      section,
      title: trimmed,
      theory: 'Not started',
      extra: false,
      tute: showTuteColumn ? false : undefined,
      pastPprsAction: 'unconfigured',
      pastPprsLogs: [],
    });
    setNewTitle('');
  };

  const cycleTheory = (current: TheoryStatus): TheoryStatus => {
    if (current === 'Not started') return 'In progress';
    if (current === 'In progress') return 'Done';
    return 'Not started';
  };

  const handlePastPprsClick = (unit: PastPaperUnit) => {
    if (unit.pastPprsAction === 'cycle_theory') {
      onUpdateUnit({ ...unit, theory: cycleTheory(unit.theory) });
      return;
    }
    setActiveButtonUnit(unit);
    setSessionNote('');
  };

  const handleConfigureAction = (
    unit: PastPaperUnit,
    action: PastPprsActionType
  ) => {
    const updated = { ...unit, pastPprsAction: action };
    onUpdateUnit(updated);
    setActiveButtonUnit(updated);
  };

  const handleRunLogSession = (unit: PastPaperUnit) => {
    const today = getColomboTodayStr();
    const updated: PastPaperUnit = {
      ...unit,
      pastPprsAction: 'log_session',
      pastPprsLogs: [
        {
          id: `pplog_${Date.now()}`,
          date: today,
          note: sessionNote.trim() || `Completed past paper practice for ${unit.title}`,
        },
        ...unit.pastPprsLogs,
      ],
    };
    onUpdateUnit(updated);
    setActiveButtonUnit(updated);
    setSessionNote('');
  };

  const handleRunCreateTask = (unit: PastPaperUnit) => {
    onCreateLinkedTask(
      `${unit.title} — Past Papers Practice`,
      sectionSubject,
      unit.id
    );
    const updated: PastPaperUnit = {
      ...unit,
      pastPprsAction: 'create_task',
    };
    onUpdateUnit(updated);
    setActiveButtonUnit(null);
  };

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Preserves Notion properties: {primaryColumnName}, Theory, Extra
            {showTuteColumn ? ', Tute' : ''}, Past pprs
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`Add ${primaryColumnName}...`}
            aria-label={`New ${primaryColumnName} name`}
            className="flex-1 sm:flex-initial rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 min-w-[160px]"
          />
          <button
            type="submit"
            style={{ backgroundColor: subjectColor }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap shrink-0 min-h-[36px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>Add Unit</span>
          </button>
        </form>
      </div>

      {units.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No units in {title} yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add your units above or import your existing Notion database CSV from Notion Sync &amp; Data.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">{primaryColumnName}</th>
                <th className="py-3 px-4">Theory</th>
                <th className="py-3 px-4 text-center">Extra</th>
                {showTuteColumn && <th className="py-3 px-4 text-center">Tute</th>}
                <th className="py-3 px-4">Past pprs</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-slate-100 dark:border-slate-800/80 last:border-b-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                >
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 min-w-[180px]">
                    {unit.title}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={unit.theory}
                      aria-label={`Theory status for ${unit.title}`}
                      onChange={(e) =>
                        onUpdateUnit({
                          ...unit,
                          theory: e.target.value as TheoryStatus,
                        })
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        unit.theory === 'Done'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                          : unit.theory === 'In progress'
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <option value="Not started">Not started</option>
                      <option value="In progress">In progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={unit.extra}
                      aria-label={`Extra checkbox for ${unit.title}`}
                      onChange={(e) =>
                        onUpdateUnit({ ...unit, extra: e.target.checked })
                      }
                      className="w-4 h-4 rounded accent-slate-900 dark:accent-slate-100 cursor-pointer"
                    />
                  </td>
                  {showTuteColumn && (
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={!!unit.tute}
                        aria-label={`Tute checkbox for ${unit.title}`}
                        onChange={(e) =>
                          onUpdateUnit({ ...unit, tute: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-slate-900 dark:accent-slate-100 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => handlePastPprsClick(unit)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap min-h-[34px]"
                    >
                      <Play size={12} style={{ color: subjectColor }} aria-hidden="true" />
                      <span>Past pprs</span>
                      {unit.pastPprsLogs.length > 0 && (
                        <span className="font-mono tabular-nums text-slate-500">
                          ({unit.pastPprsLogs.length})
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteUnit(unit.id)}
                      aria-label={`Delete unit "${unit.title}"`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeButtonUnit && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveButtonUnit(null);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="past-pprs-modal-title"
        >
          <div className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 id="past-pprs-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Past pprs — {activeButtonUnit.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Interactive Notion Button Action
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveButtonUnit(null)}
                aria-label="Close Past pprs modal"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <Info size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                The original Notion button automation inside <code className="font-mono">Past pprs</code> could not be inspected without live workspace access, so it is not guessed. Choose how you want this button to work locally:
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  1. Log Past Paper Practice Session for this unit
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="e.g., 2019–2023 MCQs done"
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRunLogSession(activeButtonUnit)}
                    style={{ backgroundColor: subjectColor }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap"
                  >
                    Log Practice
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRunCreateTask(activeButtonUnit)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  2. Create &ldquo;{activeButtonUnit.title} — Past Papers Practice&rdquo; in All Tasks
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Schedules a task for today under {sectionSubject.replace('_', ' ')} in All Tasks.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleConfigureAction(activeButtonUnit, 'cycle_theory');
                  onUpdateUnit({
                    ...activeButtonUnit,
                    pastPprsAction: 'cycle_theory',
                    theory: cycleTheory(activeButtonUnit.theory),
                  });
                  setActiveButtonUnit(null);
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  3. Cycle Theory status on click
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Switches between Not started, In progress, and Done.
                </p>
              </button>
            </div>

            {activeButtonUnit.pastPprsLogs.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Unit Practice Logs ({activeButtonUnit.pastPprsLogs.length})
                </p>
                <ul className="max-h-28 overflow-y-auto space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {activeButtonUnit.pastPprsLogs.map((log) => (
                    <li key={log.id} className="font-mono text-[11px]">
                      {log.date} — {log.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
