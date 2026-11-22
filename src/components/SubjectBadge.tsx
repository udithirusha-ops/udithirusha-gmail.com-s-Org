import React from 'react';
import { Atom, BookOpen, FlaskConical, Repeat, Sigma, UserCheck } from 'lucide-react';
import { SUBJECT_THEMES } from '../constants/subjects';
import { TaskCategory } from '../types/study';

interface CategoryIconProps {
  category: TaskCategory | 'general';
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 16,
  className = '',
}) => {
  if (category === 'general') {
    return <BookOpen size={size} className={`text-slate-500 ${className}`} aria-hidden="true" />;
  }
  const color = SUBJECT_THEMES[category].color;
  switch (category) {
    case 'physics':
      return <Atom size={size} style={{ color }} className={className} aria-hidden="true" />;
    case 'chemistry':
      return <FlaskConical size={size} style={{ color }} className={className} aria-hidden="true" />;
    case 'combined_maths':
      return <Sigma size={size} style={{ color }} className={className} aria-hidden="true" />;
    case 'personal':
      return <UserCheck size={size} style={{ color }} className={className} aria-hidden="true" />;
  }
};

interface TaskTypeMarkersProps {
  category: TaskCategory;
  isRecurring: boolean;
  showLabel?: boolean;
}

export const TaskTypeMarkers: React.FC<TaskTypeMarkersProps> = ({
  category,
  isRecurring,
  showLabel = true,
}) => {
  const theme = SUBJECT_THEMES[category];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
      <CategoryIcon category={category} size={14} />
      {showLabel && (
        <span style={{ color: theme.color }} className="font-semibold">
          {theme.label}
        </span>
      )}
      {isRecurring && (
        <span
          className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 font-medium"
          title="Recurring task"
        >
          <span aria-hidden="true" className="text-slate-400">·</span>
          <Repeat size={13} aria-hidden="true" />
          <span>Recurring</span>
        </span>
      )}
    </span>
  );
};
