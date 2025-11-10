import { useMemo } from 'react';
import { Task } from '../types';
import { Filters } from '../components/FilterBar';
import { getTodayDateString, getEndOfWeekDateString } from '../lib/taskUtils';

export const useTaskFilter = (tasks: Task[], filters: Filters, timezone: string): Task[] => {
    return useMemo(() => {
        const today = getTodayDateString(timezone);
        const endOfWeek = getEndOfWeekDateString(timezone);

        return tasks.filter(task => {
            const trimmedSearch = filters.searchTerm.trim();

            let searchTermMatch = true;
            if (trimmedSearch) {
                let searchId: number | null = null;

                // Handle search by ID, including formats like '#0002' or '2'
                if (trimmedSearch.startsWith('#')) {
                    const numericPart = trimmedSearch.substring(1);
                    if (/^\d+$/.test(numericPart)) {
                        searchId = parseInt(numericPart, 10);
                    }
                } else if (/^\d+$/.test(trimmedSearch)) {
                    searchId = parseInt(trimmedSearch, 10);
                }

                if (searchId !== null) {
                    searchTermMatch = task.id === searchId;
                } else {
                    // Fallback to text search if not an ID format
                    const lowerCaseSearch = trimmedSearch.toLowerCase();
                    searchTermMatch = task.title.toLowerCase().includes(lowerCaseSearch) ||
                        (task.description && task.description.toLowerCase().includes(lowerCaseSearch)) ||
                        (task.task_comments && task.task_comments.some(c => c.content.toLowerCase().includes(lowerCaseSearch)));
                }
            }

            const creatorMatch = filters.creatorId === 'all' || task.created_by === filters.creatorId;
            const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;

            let dueDateMatch = true;
            if (filters.dueDate !== 'all') {
                if (!task.due_date) {
                    dueDateMatch = false;
                } else {
                    switch (filters.dueDate) {
                        case 'overdue':
                            dueDateMatch = task.due_date < today && !['done', 'cancelled'].includes(task.status);
                            break;
                        case 'today':
                            dueDateMatch = task.due_date === today;
                            break;
                        case 'this_week':
                            dueDateMatch = task.due_date >= today && task.due_date <= endOfWeek;
                            break;
                    }
                }
            }

            return searchTermMatch && creatorMatch && priorityMatch && dueDateMatch;
        });
    }, [tasks, filters, timezone]);
};
