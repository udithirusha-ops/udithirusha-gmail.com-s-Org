import React, { useEffect, useState } from 'react';
import {
  Clock,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Timer,
  Trash2,
} from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import {
  CountdownItem,
  PomodoroSession,
  PomodoroSettings,
  SubjectId,
  TaskCategory,
} from '../types/study';
import {
  calculateCountdownColombo,
  getColomboClockParts,
  getColomboTodayStr,
} from '../utils/colomboTime';
import { CategoryIcon } from './SubjectBadge';

interface ColomboClockWidgetProps {
  summary?: string;
  className?: string;
}

export const ColomboClockWidget: React.FC<ColomboClockWidgetProps> = ({
  summary,
  className = '',
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = getColomboClockParts(now);

  return (
    <section
      aria-label="Asia/Colombo Digital Clock"
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Asia/Colombo Time
          </span>
          <Clock size={15} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
        </div>
        <div
          className="mt-2 font-mono tabular-nums text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          data-testid="colombo-clock-time"
        >
          {parts.timeStr}
        </div>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {parts.weekdayName} · {parts.readableDate}
        </p>
      </div>
      {summary && (
        <p className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          {summary}
        </p>
      )}
    </section>
  );
};

interface CountdownWidgetProps {
  countdowns: CountdownItem[];
  onAddCountdown: (item: Omit<CountdownItem, 'id'>) => void;
  onDeleteCountdown: (id: string) => void;
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  countdowns,
  onAddCountdown,
  onDeleteCountdown,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(getColomboTodayStr());
  const [targetTime, setTargetTime] = useState('08:30');
  const [subject, setSubject] = useState<SubjectId | 'general'>('general');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Countdown title is required.');
      return;
    }
    if (!targetDate) {
      setError('Target date is required.');
      return;
    }
    onAddCountdown({
      title: title.trim(),
      targetDate,
      targetTime,
      subject,
    });
    setTitle('');
    setError('');
    setShowForm(false);
  };

  return (
    <section
      aria-label="Exam & Milestone Countdowns"
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Countdown
        </h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline min-h-[36px] px-2"
        >
          <Plus size={14} aria-hidden="true" />
          <span>{showForm ? 'Close' : 'Add'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., A/L Physics Paper I"
            aria-label="Countdown title"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              aria-label="Countdown target date"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
            <input
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              aria-label="Countdown target time"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectId | 'general')}
              aria-label="Countdown subject"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="general">General</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="combined_maths">Combined Mathematics</option>
            </select>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold min-h-[34px]"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {countdowns.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          No countdowns set yet. Add an exam date in Asia/Colombo time.
        </p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {countdowns.map((item) => {
            const cd = calculateCountdownColombo(item.targetDate, item.targetTime, now);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon category={item.subject} size={13} />
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.targetDate} {item.targetTime ? `· ${item.targetTime}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {cd.isPast ? 'Passed' : `${cd.days}d ${String(cd.hours).padStart(2, '0')}h ${String(cd.minutes).padStart(2, '0')}m`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteCountdown(item.id)}
                    aria-label={`Delete countdown "${item.title}"`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

interface PomodoroWidgetProps {
  settings: PomodoroSettings;
  sessions: PomodoroSession[];
  onUpdateSettings: (next: PomodoroSettings) => void;
  onLogSession: (session: Omit<PomodoroSession, 'id'>) => void;
}

type TimerMode = 'work' | 'short_break' | 'long_break';

export const PomodoroWidget: React.FC<PomodoroWidgetProps> = ({
  settings,
  sessions,
  onUpdateSettings,
  onLogSession,
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [subject, setSubject] = useState<TaskCategory>('physics');
  const [label, setLabel] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draftSettings, setDraftSettings] = useState<PomodoroSettings>(settings);

  const getModeMinutes = (m: TimerMode, s: PomodoroSettings): number => {
    if (m === 'short_break') return s.shortBreakMinutes;
    if (m === 'long_break') return s.longBreakMinutes;
    return s.workMinutes;
  };

  const [secondsLeft, setSecondsLeft] = useState(
    () => getModeMinutes('work', settings) * 60
  );

  useEffect(() => {
    if (!hasStarted && !isRunning) {
      setSecondsLeft(getModeMinutes(mode, settings) * 60);
    }
  }, [settings, mode, hasStarted, isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setHasStarted(false);
          onLogSession({
            subject,
            mode,
            durationMinutes: getModeMinutes(mode, settings),
            completedAt: new Date().toISOString(),
            label: label.trim() || undefined,
          });
          return getModeMinutes(mode, settings) * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning, mode, settings, subject, label, onLogSession]);

  const switchMode = (nextMode: TimerMode) => {
    setIsRunning(false);
    setHasStarted(false);
    setMode(nextMode);
    setSecondsLeft(getModeMinutes(nextMode, settings) * 60);
  };

  const handleStartOrResume = () => {
    setHasStarted(true);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setSecondsLeft(getModeMinutes(mode, settings) * 60);
  };

  const handleCompleteNow = () => {
    setIsRunning(false);
    setHasStarted(false);
    const totalSec = getModeMinutes(mode, settings) * 60;
    const elapsedMin = Math.max(1, Math.round((totalSec - secondsLeft) / 60) || getModeMinutes(mode, settings));
    onLogSession({
      subject,
      mode,
      durationMinutes: elapsedMin,
      completedAt: new Date().toISOString(),
      label: label.trim() || undefined,
    });
    setSecondsLeft(totalSec);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      workMinutes: Math.max(1, Math.min(180, Number(draftSettings.workMinutes) || 25)),
      shortBreakMinutes: Math.max(1, Math.min(60, Number(draftSettings.shortBreakMinutes) || 5)),
      longBreakMinutes: Math.max(1, Math.min(90, Number(draftSettings.longBreakMinutes) || 15)),
    });
    setShowSettings(false);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const subjectTheme = SUBJECT_THEMES[subject];

  return (
    <section
      aria-label="Pomodoro Timer"
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-slate-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Pomodoro Timer
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraftSettings(settings);
            setShowSettings((v) => !v);
          }}
          aria-label="Configure Pomodoro durations"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Settings2 size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
        {(
          [
            { id: 'work', label: 'Focus' },
            { id: 'short_break', label: 'Short Break' },
            { id: 'long_break', label: 'Long Break' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchMode(tab.id)}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] ${
              mode === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showSettings && (
        <form onSubmit={handleSaveSettings} className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="pomo-work-min" className="block text-[11px] text-slate-500 mb-1">
                Work (m)
              </label>
              <input
                id="pomo-work-min"
                type="number"
                min={1}
                max={180}
                value={draftSettings.workMinutes}
                onChange={(e) =>
                  setDraftSettings((d) => ({ ...d, workMinutes: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label htmlFor="pomo-short-min" className="block text-[11px] text-slate-500 mb-1">
                Short (m)
              </label>
              <input
                id="pomo-short-min"
                type="number"
                min={1}
                max={60}
                value={draftSettings.shortBreakMinutes}
                onChange={(e) =>
                  setDraftSettings((d) => ({ ...d, shortBreakMinutes: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label htmlFor="pomo-long-min" className="block text-[11px] text-slate-500 mb-1">
                Long (m)
              </label>
              <input
                id="pomo-long-min"
                type="number"
                min={1}
                max={90}
                value={draftSettings.longBreakMinutes}
                onChange={(e) =>
                  setDraftSettings((d) => ({ ...d, longBreakMinutes: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
          >
            Apply Durations
          </button>
        </form>
      )}

      <div className="mt-4 text-center">
        <div
          className="font-mono tabular-nums text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          data-testid="pomodoro-display"
        >
          {formatted}
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as TaskCategory)}
            aria-label="Pomodoro study subject"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="combined_maths">Combined Mathematics</option>
            <option value="personal">Personal Study</option>
          </select>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Session topic (optional)"
            aria-label="Pomodoro session topic"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStartOrResume}
            style={{ backgroundColor: subjectTheme.color }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white hover:opacity-95 transition-opacity min-h-[42px]"
          >
            <Play size={14} aria-hidden="true" />
            <span>{hasStarted ? 'Resume' : 'Start'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors min-h-[42px]"
          >
            <Pause size={14} aria-hidden="true" />
            <span>Pause</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset Pomodoro timer"
          className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCcw size={15} aria-hidden="true" />
        </button>

        {hasStarted && (
          <button
            type="button"
            onClick={handleCompleteNow}
            className="px-3 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Log Session
          </button>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Recorded Sessions
          </span>
          <span className="font-mono tabular-nums">{sessions.length}</span>
        </div>
        {sessions.length === 0 ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            No study sessions logged yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
            {sessions.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <CategoryIcon category={s.subject} size={12} />
                  <span className="truncate">
                    {SUBJECT_THEMES[s.subject].shortLabel}
                    {s.label ? ` · ${s.label}` : ''}
                  </span>
                </span>
                <span className="font-mono tabular-nums text-slate-500 shrink-0">
                  {s.durationMinutes}m · {s.mode === 'work' ? 'Focus' : 'Break'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
