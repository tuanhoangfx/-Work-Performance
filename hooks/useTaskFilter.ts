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

            const creatorMatch = filters.creatorIds.length === 0 || (task.created_by && filters.creatorIds.includes(task.created_by));
            const priorityMatch = filters.priorities.length === 0 || filters.priorities.includes(task.priority);

            let dueDateMatch = true;
            if (filters.dueDates.length > 0) {
                if (!task.due_date) {
                    dueDateMatch = false;
                } else {
                    dueDateMatch = filters.dueDates.some(dueDateFilter => {
                        switch (dueDateFilter) {
                            case 'overdue':
                                return task.due_date! < today && !['done', 'cancelled'].includes(task.status);
                            case 'today':
                                return task.due_date === today;
                            case 'this_week':
                                return task.due_date >= today && task.due_date <= endOfWeek;
                            default:
                                return false;
                        }
                    });
                }
            }


            return searchTermMatch && creatorMatch && priorityMatch && dueDateMatch;
        });
    }, [tasks, filters, timezone]);
};