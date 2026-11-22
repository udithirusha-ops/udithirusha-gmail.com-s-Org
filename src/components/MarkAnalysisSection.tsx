import React, { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import { MarkEntry, SubjectId } from '../types/study';
import { calculateMarkStats, roundOneDecimal } from '../utils/calculations';
import { getColomboTodayStr } from '../utils/colomboTime';
import { MarksLineChart } from './Charts';

interface MarkAnalysisSectionProps {
  subject: SubjectId;
  entries: MarkEntry[];
  onAddMark: (entry: Omit<MarkEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateMark: (entry: MarkEntry) => void;
  onDeleteMark: (id: string) => void;
}

export const MarkAnalysisSection: React.FC<MarkAnalysisSectionProps> = ({
  subject,
  entries,
  onAddMark,
  onUpdateMark,
  onDeleteMark,
}) => {
  const theme = SUBJECT_THEMES[subject];
  const stats = calculateMarkStats(entries);
  const [chartMode, setChartMode] = useState<'percentage' | 'raw'>('percentage');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MarkEntry | null>(null);

  const [paperName, setPaperName] = useState('');
  const [date, setDate] = useState(getColomboTodayStr());
  const [marksObtained, setMarksObtained] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const openCreateForm = () => {
    setEditingEntry(null);
    setPaperName('');
    setDate(getColomboTodayStr());
    setMarksObtained('');
    setMaxMarks('100');
    setNotes('');
    setError('');
    setShowForm(true);
  };

  const openEditForm = (entry: MarkEntry) => {
    setEditingEntry(entry);
    setPaperName(entry.paperName);
    setDate(entry.date);
    setMarksObtained(String(entry.marksObtained));
    setMaxMarks(String(entry.maxMarks));
    setNotes(entry.notes ?? '');
    setError('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = paperName.trim();
    const obtained = Number(marksObtained);
    const max = Number(maxMarks);

    if (!trimmed) {
      setError('Paper name is required.');
      return;
    }
    if (!date) {
      setError('Examination or paper date is required.');
      return;
    }
    if (!Number.isFinite(obtained) || obtained < 0) {
      setError('Marks obtained must be 0 or greater.');
      return;
    }
    if (!Number.isFinite(max) || max <= 0) {
      setError('Maximum possible marks must be greater than 0.');
      return;
    }
    if (obtained > max) {
      setError('Marks obtained cannot exceed maximum possible marks.');
      return;
    }

    if (editingEntry) {
      onUpdateMark({
        ...editingEntry,
        paperName: trimmed,
        date,
        marksObtained: obtained,
        maxMarks: max,
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddMark({
        subject,
        paperName: trimmed,
        date,
        marksObtained: obtained,
        maxMarks: max,
        notes: notes.trim(),
      });
    }

    setShowForm(false);
    setEditingEntry(null);
  };

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section
      aria-label={`${theme.label} Mark Analysis`}
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {theme.label} Mark Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track examination &amp; paper scores with percentage-normalized comparisons
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('percentage')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                chartMode === 'percentage'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('raw')}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                chartMode === 'raw'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Raw Marks
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            style={{ backgroundColor: theme.color }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <Plus size={14} aria-hidden="true" />
            <span>Add Result</span>
          </button>
        </div>
      </div>

      {/* Mark Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="py-2 lg:pr-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Average Marks
          </span>
          <span className="mt-1 block font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
            {stats.count === 0 ? '—' : `${stats.averagePercentage}%`}
          </span>
          {stats.count > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Raw avg: {stats.averageRaw} pts
            </span>
          )}
        </div>

        <div className="py-2 pl-4 lg:px-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Highest Marks
          </span>
          <span className="mt-1 block font-mono tabular-nums text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.count === 0 ? '—' : `${stats.highestPercentage}%`}
          </span>
          {stats.count > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Raw high: {stats.highestRaw} pts
            </span>
          )}
        </div>

        <div className="py-2 lg:px-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Papers Completed
          </span>
          <span className="mt-1 block font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
            {stats.count}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Recorded results
          </span>
        </div>

        <div className="py-2 pl-4">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            Latest Recorded Mark
          </span>
          <span className="mt-1 block font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
            {stats.latestEntry
              ? `${roundOneDecimal((stats.latestEntry.marksObtained / stats.latestEntry.maxMarks) * 100)}%`
              : '—'}
          </span>
          {stats.latestEntry && (
            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate block">
              {stats.latestEntry.marksObtained}/{stats.latestEntry.maxMarks} · {stats.latestEntry.paperName}
            </span>
          )}
        </div>
      </div>

      {stats.hasVaryingMaxMarks && (
        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
          Papers have different maximum marks, so Percentage (%) comparison is recommended alongside raw marks.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {editingEntry ? 'Edit Paper Result' : 'Add Paper Result'}
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Close mark entry form"
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor={`mark-paper-${subject}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paper Name
              </label>
              <input
                id={`mark-paper-${subject}`}
                type="text"
                value={paperName}
                onChange={(e) => setPaperName(e.target.value)}
                placeholder="e.g., 2022 Term Test 2"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor={`mark-date-${subject}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                id={`mark-date-${subject}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={`mark-obtained-${subject}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marks
                </label>
                <input
                  id={`mark-obtained-${subject}`}
                  type="number"
                  step="0.5"
                  min="0"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(e.target.value)}
                  placeholder="78"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor={`mark-max-${subject}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max Marks
                </label>
                <input
                  id={`mark-max-${subject}`}
                  type="number"
                  step="1"
                  min="1"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="100"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex-1">
              <label htmlFor={`mark-notes-${subject}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Optional Notes
              </label>
              <input
                id={`mark-notes-${subject}`}
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Weak areas, timing feedback..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              style={{ backgroundColor: theme.color }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white min-h-[40px] shrink-0"
            >
              {editingEntry ? 'Update Result' : 'Save Result'}
            </button>
          </div>
        </form>
      )}

      <MarksLineChart
        entries={entries}
        color={theme.color}
        mode={chartMode}
        averageValue={
          chartMode === 'percentage' ? stats.averagePercentage : stats.averageRaw
        }
        highestValue={
          chartMode === 'percentage' ? stats.highestPercentage : stats.highestRaw
        }
        subjectLabel={theme.label}
      />

      {sortedEntries.length > 0 && (
        <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800 pt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-2 pr-4 font-semibold">Paper</th>
                <th className="py-2 pr-4 font-semibold">Date</th>
                <th className="py-2 pr-4 font-semibold text-right">Raw Mark</th>
                <th className="py-2 pr-4 font-semibold text-right">Percentage</th>
                <th className="py-2 pr-4 font-semibold">Notes</th>
                <th className="py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map((entry) => {
                const pct = roundOneDecimal(
                  (entry.marksObtained / (entry.maxMarks || 1)) * 100
                );
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 dark:border-slate-800/70 last:border-b-0"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">
                      {entry.paperName}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {entry.date}
                    </td>
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-right text-slate-900 dark:text-slate-100">
                      {entry.marksObtained} / {entry.maxMarks}
                    </td>
                    <td
                      className="py-2.5 pr-4 font-mono tabular-nums text-right font-semibold"
                      style={{ color: theme.color }}
                    >
                      {pct}%
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {entry.notes || '—'}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditForm(entry)}
                        aria-label={`Edit mark for "${entry.paperName}"`}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      >
                        <Pencil size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMark(entry.id)}
                        aria-label={`Delete mark for "${entry.paperName}"`}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
