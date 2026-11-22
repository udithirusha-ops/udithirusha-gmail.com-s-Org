import React, { useState } from 'react';
import { MarkEntry } from '../types/study';
import { DailyCompletionPoint, roundOneDecimal } from '../utils/calculations';
import { formatShortDate } from '../utils/colomboTime';

interface SubjectPieChartProps {
  completed: number;
  remaining: number;
  color: string;
  subjectLabel: string;
}

export const SubjectPieChart: React.FC<SubjectPieChartProps> = ({
  completed,
  remaining,
  color,
  subjectLabel,
}) => {
  const total = completed + remaining;
  const pct = total === 0 ? 0 : roundOneDecimal((completed / total) * 100);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const completedDash = total === 0 ? 0 : (completed / total) * circumference;

  return (
    <div
      className="flex flex-col sm:flex-row items-center gap-6"
      data-testid={`subject-pie-${subjectLabel.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90" role="img" aria-label={`${subjectLabel} task completion pie chart: ${pct}% completed`}>
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="18"
            className="text-slate-200 dark:text-slate-800"
          />
          {total > 0 && completed > 0 && (
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="18"
              strokeDasharray={`${completedDash} ${circumference}`}
              strokeLinecap="butt"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {pct}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Done</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-sm w-full sm:w-auto">
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
            Completed
          </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {completed}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-sm shrink-0 bg-slate-200 dark:bg-slate-700" />
            Remaining
          </span>
          <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {remaining}
          </span>
        </div>
        {total === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            No tasks assigned to {subjectLabel} yet.
          </p>
        )}
      </div>
    </div>
  );
};

interface DailyProgressLineChartProps {
  points: DailyCompletionPoint[];
  averagePercentage: number;
  maxPercentage: number;
}

export const DailyProgressLineChart: React.FC<DailyProgressLineChartProps> = ({
  points,
  averagePercentage,
  maxPercentage,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No daily completion data recorded yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Add tasks with dates in All Tasks to track daily completion percentages.
        </p>
      </div>
    );
  }

  const width = 760;
  const height = 248;
  const padL = 54;
  const padR = 76;
  const padT = 26;
  const padB = 46;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const getX = (idx: number) =>
    points.length === 1 ? padL + plotW / 2 : padL + (idx / (points.length - 1)) * plotW;
  const getY = (pct: number) => padT + plotH - (Math.min(100, Math.max(0, pct)) / 100) * plotH;

  const polylinePoints = points
    .map((p, idx) => `${getX(idx)},${getY(p.percentage)}`)
    .join(' ');

  const areaPath =
    points.length > 1
      ? `M ${getX(0)},${padT + plotH} L ${points
          .map((p, idx) => `${getX(idx)},${getY(p.percentage)}`)
          .join(' L ')} L ${getX(points.length - 1)},${padT + plotH} Z`
      : '';

  const avgY = getY(averagePercentage);
  const labelStep = points.length > 10 ? Math.ceil(points.length / 8) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs block">Average Daily Completion</span>
            <span className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
              {averagePercentage}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs block">Maximum Daily Completion</span>
            <span className="font-mono tabular-nums text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {maxPercentage}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 text-xs block">Days Tracked</span>
            <span className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
              {points.length}
            </span>
          </div>
        </div>
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {points[hoveredIdx].date}: {points[hoveredIdx].completed}/{points[hoveredIdx].total} tasks ({points[hoveredIdx].percentage}%)
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[300px] sm:min-w-[460px] h-auto"
          role="img"
          aria-label="Daily study progress completion percentage line chart"
          data-testid="daily-progress-chart"
        >
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-slate-200 dark:text-slate-800"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Average line */}
          <line
            x1={padL}
            y1={avgY}
            x2={width - padR}
            y2={avgY}
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={width - padR + 8}
            y={avgY + 4}
            textAnchor="start"
            className="fill-sky-600 dark:fill-sky-400 text-[10px] font-mono font-medium"
          >
            Avg {averagePercentage}%
          </text>

          {areaPath && (
            <path d={areaPath} fill="#0F172A" fillOpacity="0.06" className="dark:fill-slate-100 dark:fill-opacity-10" />
          )}

          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polylinePoints}
              className="dark:stroke-slate-100"
            />
          )}

          {points.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.percentage);
            const showXLabel = idx % labelStep === 0 || idx === points.length - 1;
            return (
              <g
                key={pt.date}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={hoveredIdx === idx ? 6 : 4.5}
                  fill="#2563EB"
                  strokeWidth="2"
                  className="stroke-white dark:stroke-slate-900"
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-slate-200 text-[10px] font-mono font-semibold"
                >
                  {pt.percentage}%
                </text>
                {showXLabel && (
                  <text
                    x={cx}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
                  >
                    {formatShortDate(pt.date)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface MarksLineChartProps {
  entries: MarkEntry[];
  color: string;
  mode: 'percentage' | 'raw';
  averageValue: number;
  highestValue: number;
  subjectLabel: string;
}

export const MarksLineChart: React.FC<MarksLineChartProps> = ({
  entries,
  color,
  mode,
  averageValue,
  highestValue,
  subjectLabel,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.createdAt.localeCompare(b.createdAt);
  });

  if (sorted.length === 0) {
    return (
      <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No {subjectLabel} paper marks recorded yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Log your first exam or past-paper mark above to generate the progress chart.
        </p>
      </div>
    );
  }

  const values = sorted.map((e) =>
    mode === 'percentage'
      ? e.maxMarks > 0
        ? roundOneDecimal((e.marksObtained / e.maxMarks) * 100)
        : 0
      : e.marksObtained
  );

  const maxAxis =
    mode === 'percentage'
      ? 100
      : Math.max(100, ...sorted.map((e) => e.maxMarks), ...values);

  const width = 760;
  const height = 256;
  const padL = 56;
  const padR = 76;
  const padT = 28;
  const padB = 52;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const getX = (idx: number) =>
    sorted.length === 1 ? padL + plotW / 2 : padL + (idx / (sorted.length - 1)) * plotW;
  const getY = (val: number) =>
    padT + plotH - (Math.min(maxAxis, Math.max(0, val)) / maxAxis) * plotH;

  const pointsAttr = values.map((v, idx) => `${getX(idx)},${getY(v)}`).join(' ');
  const avgY = getY(averageValue);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxAxis * f));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Average: <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">{averageValue}{mode === 'percentage' ? '%' : ' pts'}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Highest: <strong className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{highestValue}{mode === 'percentage' ? '%' : ' pts'}</strong>
          </span>
        </div>
        {hoveredIdx !== null && sorted[hoveredIdx] && (
          <span className="font-mono tabular-nums bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-900 dark:text-slate-100">
            {sorted[hoveredIdx].paperName} ({sorted[hoveredIdx].date}): {sorted[hoveredIdx].marksObtained}/{sorted[hoveredIdx].maxMarks} ({roundOneDecimal((sorted[hoveredIdx].marksObtained / (sorted[hoveredIdx].maxMarks || 1)) * 100)}%)
          </span>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[300px] sm:min-w-[460px] h-auto"
          role="img"
          aria-label={`${subjectLabel} marks line chart`}
          data-testid={`marks-chart-${subjectLabel.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {ticks.map((t) => {
            const y = getY(t);
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-slate-200 dark:text-slate-800"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono"
                >
                  {t}{mode === 'percentage' ? '%' : ''}
                </text>
              </g>
            );
          })}

          <line
            x1={padL}
            y1={avgY}
            x2={width - padR}
            y2={avgY}
            stroke={color}
            strokeOpacity="0.65"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={width - padR + 8}
            y={avgY + 4}
            textAnchor="start"
            style={{ fill: color }}
            className="text-[10px] font-mono font-semibold"
          >
            Avg {averageValue}{mode === 'percentage' ? '%' : ''}
          </text>

          {sorted.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pointsAttr}
            />
          )}

          {sorted.map((entry, idx) => {
            const val = values[idx];
            const cx = getX(idx);
            const cy = getY(val);
            const shortName =
              entry.paperName.length > 12
                ? `${entry.paperName.slice(0, 11)}…`
                : entry.paperName;
            return (
              <g
                key={entry.id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={hoveredIdx === idx ? 6.5 : 5}
                  fill={color}
                  strokeWidth="2"
                  className="stroke-white dark:stroke-slate-900"
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  className="fill-slate-800 dark:fill-slate-200 text-[10px] font-mono font-semibold"
                >
                  {val}{mode === 'percentage' ? '%' : ''}
                </text>
                <text
                  x={cx}
                  y={height - 22}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300 text-[10px] font-medium"
                >
                  {shortName}
                </text>
                <text
                  x={cx}
                  y={height - 9}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] font-mono"
                >
                  {formatShortDate(entry.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
