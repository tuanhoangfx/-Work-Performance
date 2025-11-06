import { Task } from '../types';

export type SortField = 'priority' | 'created_at' | 'due_date' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const priorityOrder: { [key in Task['priority']]: number } = { high: 3, medium: 2, low: 1 };

export const sortTasks = (tasks: Task[], config: SortConfig): Task[] => {
  const sorted = [...tasks];
  sorted.sort((a, b) => {
    const { field, direction } = config;
    const dir = direction === 'asc' ? 1 : -1;

    if (field === 'priority') {
      return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
    }

    if (field === 'created_at' || field === 'due_date' || field === 'updated_at') {
      // Handle null dates: sort them to the end when ascending, beginning when descending
      const dateA = a[field] ? new Date(a[field]!).getTime() : (direction === 'asc' ? Infinity : -Infinity);
      const dateB = b[field] ? new Date(b[field]!).getTime() : (direction === 'asc' ? Infinity : -Infinity);
      return (dateA - dateB) * dir;
    }
    return 0;
  });
  return sorted;
};

export const formatAbsoluteDateTime = (dateString: string, lang: string, timezone: string | undefined) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: timezone,
            hour12: false,
        };
        // Replace slashes with a character, then replace back to format DD/MM/YYYY HH:mm
        return new Intl.DateTimeFormat(lang, options).format(date).replace(/\//g, '/').replace(',', '');
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString;
    }
};