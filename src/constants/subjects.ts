import { SubjectId, TaskCategory } from '../types/study';

export interface SubjectTheme {
  id: TaskCategory;
  label: string;
  shortLabel: string;
  color: string;
  hoverColor: string;
  lightBg: string;
  darkBg: string;
  textColor: string;
  darkTextColor: string;
  borderColor: string;
  darkBorderColor: string;
  ringColor: string;
}

export const SUBJECT_THEMES: Record<TaskCategory, SubjectTheme> = {
  physics: {
    id: 'physics',
    label: 'Physics',
    shortLabel: 'PHY',
    color: '#2563EB',
    hoverColor: '#1D4ED8',
    lightBg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-950/50',
    textColor: 'text-blue-700',
    darkTextColor: 'dark:text-blue-300',
    borderColor: 'border-blue-200',
    darkBorderColor: 'dark:border-blue-800',
    ringColor: 'focus:ring-blue-500',
  },
  chemistry: {
    id: 'chemistry',
    label: 'Chemistry',
    shortLabel: 'CHEM',
    color: '#0D9488',
    hoverColor: '#0F766E',
    lightBg: 'bg-teal-50',
    darkBg: 'dark:bg-teal-950/50',
    textColor: 'text-teal-700',
    darkTextColor: 'dark:text-teal-300',
    borderColor: 'border-teal-200',
    darkBorderColor: 'dark:border-teal-800',
    ringColor: 'focus:ring-teal-500',
  },
  combined_maths: {
    id: 'combined_maths',
    label: 'Combined Mathematics',
    shortLabel: 'MATHS',
    color: '#7C3AED',
    hoverColor: '#6D28D9',
    lightBg: 'bg-violet-50',
    darkBg: 'dark:bg-violet-950/50',
    textColor: 'text-violet-700',
    darkTextColor: 'dark:text-violet-300',
    borderColor: 'border-violet-200',
    darkBorderColor: 'dark:border-violet-800',
    ringColor: 'focus:ring-violet-500',
  },
  personal: {
    id: 'personal',
    label: 'Personal Tasks',
    shortLabel: 'PERSONAL',
    color: '#475569',
    hoverColor: '#334155',
    lightBg: 'bg-slate-100',
    darkBg: 'dark:bg-slate-800/70',
    textColor: 'text-slate-700',
    darkTextColor: 'dark:text-slate-300',
    borderColor: 'border-slate-200',
    darkBorderColor: 'dark:border-slate-700',
    ringColor: 'focus:ring-slate-500',
  },
};

export const SUBJECT_LIST: SubjectId[] = [
  'physics',
  'chemistry',
  'combined_maths',
];

export function getCategoryLabel(cat: TaskCategory | 'general'): string {
  if (cat === 'general') return 'General';
  return SUBJECT_THEMES[cat].label;
}
