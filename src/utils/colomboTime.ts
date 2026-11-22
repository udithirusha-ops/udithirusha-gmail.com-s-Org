export const COLOMBO_TIMEZONE = 'Asia/Colombo';

const pad2 = (n: number): string => String(n).padStart(2, '0');

export interface ColomboClockParts {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:MM:SS
  shortTimeStr: string; // HH:MM
  weekdayName: string;
  readableDate: string;
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  weekdayIndex: number; // 0 = Sun ... 6 = Sat
}

export function getColomboClockParts(now: Date = new Date()): ColomboClockParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';

  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  let hour = get('hour');
  if (hour === '24') hour = '00';
  const minute = get('minute');
  const second = get('second');

  const dateStr = `${year}-${pad2(month)}-${pad2(day)}`;
  const timeStr = `${hour}:${minute}:${second}`;
  const shortTimeStr = `${hour}:${minute}`;

  const weekdayLong = new Intl.DateTimeFormat('en-US', {
    timeZone: COLOMBO_TIMEZONE,
    weekday: 'long',
  }).format(now);

  const readableDate = new Intl.DateTimeFormat('en-US', {
    timeZone: COLOMBO_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(now);

  const weekdayIndex = getWeekdayIndexFromDateStr(dateStr);

  return {
    dateStr,
    timeStr,
    shortTimeStr,
    weekdayName: weekdayLong,
    readableDate,
    year,
    month,
    day,
    weekdayIndex,
  };
}

export function getColomboTodayStr(now: Date = new Date()): string {
  return getColomboClockParts(now).dateStr;
}

export function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getWeekdayIndexFromDateStr(dateStr: string): number {
  const { year, month, day } = parseDateStr(dateStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const { year, month, day } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addMonthsToDateStr(dateStr: string, months: number): string {
  const { year, month, day } = parseDateStr(dateStr);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const maxDayInMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, maxDayInMonth);
  return formatDateParts(targetYear, normalizedMonth + 1, clampedDay);
}

export function getDaysBetween(fromDateStr: string, toDateStr: string): number {
  const a = parseDateStr(fromDateStr);
  const b = parseDateStr(toDateStr);
  const utcA = Date.UTC(a.year, a.month - 1, a.day);
  const utcB = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((utcB - utcA) / (24 * 60 * 60 * 1000));
}

export function getMondayOfWeek(dateStr: string): string {
  const weekday = getWeekdayIndexFromDateStr(dateStr); // 0=Sun..6=Sat
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysToDateStr(dateStr, offset);
}

export function getWeekDatesMonToSun(anchorDateStr: string): string[] {
  const monday = getMondayOfWeek(anchorDateStr);
  return Array.from({ length: 7 }, (_, idx) => addDaysToDateStr(monday, idx));
}

export function getMonthGridDates(year: number, month: number): { dateStr: string; inMonth: boolean }[] {
  const firstDayStr = formatDateParts(year, month, 1);
  const firstWeekday = getWeekdayIndexFromDateStr(firstDayStr); // 0=Sun..6=Sat
  // Monday-first grid (0=Mon..6=Sun)
  const leadingOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const gridStart = addDaysToDateStr(firstDayStr, -leadingOffset);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const totalCells = leadingOffset + daysInMonth > 35 ? 42 : 35;

  return Array.from({ length: totalCells }, (_, idx) => {
    const dateStr = addDaysToDateStr(gridStart, idx);
    const parsed = parseDateStr(dateStr);
    return {
      dateStr,
      inMonth: parsed.year === year && parsed.month === month,
    };
  });
}

export function formatReadableDate(dateStr: string): string {
  const { year, month, day } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dt);
}

export function formatShortDate(dateStr: string): string {
  const { year, month, day } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

export function formatWeekdayShort(dateStr: string): string {
  const { year, month, day } = parseDateStr(dateStr);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(dt);
}

export interface CountdownBreakdown {
  isPast: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function calculateCountdownColombo(
  targetDateStr: string,
  targetTimeStr: string = '08:30',
  now: Date = new Date()
): CountdownBreakdown {
  const { year, month, day } = parseDateStr(targetDateStr);
  const [hh, mm] = (targetTimeStr || '08:30').split(':').map(Number);
  // Asia/Colombo is UTC+05:30 (330 minutes ahead of UTC)
  const targetUtcMs = Date.UTC(year, month - 1, day, hh || 0, mm || 0, 0) - 330 * 60 * 1000;
  const diffMs = targetUtcMs - now.getTime();
  const isPast = diffMs <= 0;
  const absSec = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));
  const days = Math.floor(absSec / 86400);
  const hours = Math.floor((absSec % 86400) / 3600);
  const minutes = Math.floor((absSec % 3600) / 60);
  const seconds = absSec % 60;
  return {
    isPast,
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: isPast ? -absSec : absSec,
  };
}
