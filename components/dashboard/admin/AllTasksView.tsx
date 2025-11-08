import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Profile, Task } from '../../../types';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon } from '../../Icons';
import PerformanceSummary, { TimeRange } from '../../PerformanceSummary';
import FilterBar, { Filters } from '../../FilterBar';
import type { DataChange, TaskCounts } from '../../../App';
import { type SortConfig, sortTasks, getTodayDateString, getEndOfWeekDateString } from '../../../lib/taskUtils';
import { useCachedSupabaseQuery } from '../../../hooks/useCachedSupabaseQuery';
import { TaskBoardSkeleton } from '../../Skeleton';
import TaskColumn from '../../TaskColumn';

interface AllTasksViewProps {
    lastDataChange: DataChange | null;
    allUsers: Profile[];
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onClearCancelledTasks: (tasks: Task[]) => void;
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const AllTasksView: React.FC<AllTasksViewProps> = ({ lastDataChange, allUsers, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, setTaskCounts }) => {
    const { t, timezone } = useSettings();
    const [filterUserId, setFilterUserId] = useState<string>('all');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorId: 'all', priority: 'all', dueDate: 'all' });
    const [sortConfigs, setSortConfigs] = useState<{ [key in Task['status']]: SortConfig }>({
        todo: { field: 'priority', direction: 'desc' },
        inprogress: { field: 'priority', direction: 'desc' },
        done: { field: 'updated_at', direction: 'desc' },
        cancelled: { field: 'updated_at', direction: 'desc' },
    });
    
    const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
    const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const allTasksQuery = useCallback(() => {
        return supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').order('priority', { ascending: false }).order('created_at', { ascending: true });
    }, []);

    const { data: allTasks, loading } = useCachedSupabaseQuery<Task[]>({
        cacheKey: 'admin_all_tasks',
        query: allTasksQuery,
        lastDataChange,
    });
    
    const allTasks_safe = allTasks || [];
    
    const { tasksForSummaryAndChart } = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        switch (timeRange) {
            case 'today':
                startDate = todayStart;
                endDate = todayEnd;
                break;
            case 'thisWeek':
                const firstDayOfWeek = new Date(todayStart);
                firstDayOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
                startDate = firstDayOfWeek;
                endDate = todayEnd;
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
                break;
            case 'last7':
                startDate = new Date();
                startDate.setDate(todayStart.getDate() - 6);
                startDate.setHours(0,0,0,0);
                endDate = todayEnd;
                break;
            case 'last30':
                startDate = new Date();
                startDate.setDate(todayStart.getDate() - 29);
                startDate.setHours(0,0,0,0);
                endDate = todayEnd;
                break;
            case 'customMonth':
                if (!customMonth) return { tasksForSummaryAndChart: allTasks_safe };
                const [year, month] = customMonth.split('-').map(Number);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                if (!customStartDate) return { tasksForSummaryAndChart: allTasks_safe };
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
        }

        const filtered = allTasks_safe.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        });
        return { tasksForSummaryAndChart: filtered };
    }, [allTasks_safe, timeRange, customMonth, customStartDate, customEndDate]);


    const filteredTasksForBoard = useMemo(() => {
        const today = getTodayDateString(timezone);
        const endOfWeek = getEndOfWeekDateString(timezone);

        return allTasks_safe.filter(task => {
            const assigneeMatch = filterUserId === 'all' || task.user_id === filterUserId;
            
            const trimmedSearch = filters.searchTerm.trim();
            const isNumericSearch = /^\d+$/.test(trimmedSearch);

            let searchTermMatch = true;
            if (trimmedSearch) {
                 if (isNumericSearch) {
                    searchTermMatch = task.id === parseInt(trimmedSearch, 10);
                } else {
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

            return assigneeMatch && searchTermMatch && creatorMatch && priorityMatch && dueDateMatch;
        });
    }, [allTasks_safe, filterUserId, filters, timezone]);

    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = allTasks_safe.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== status) {
            onUpdateStatus(taskToMove, status);
        }
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const { todo, inprogress, done, cancelled } = useMemo(() => {
        const grouped = {
            todo: filteredTasksForBoard.filter(t => t.status === 'todo'),
            inprogress: filteredTasksForBoard.filter(t => t.status === 'inprogress'),
            done: filteredTasksForBoard.filter(t => t.status === 'done'),
            cancelled: filteredTasksForBoard.filter(t => t.status === 'cancelled'),
        };
        return {
            todo: sortTasks(grouped.todo, sortConfigs.todo),
            inprogress: sortTasks(grouped.inprogress, sortConfigs.inprogress),
            done: sortTasks(grouped.done, sortConfigs.done),
            cancelled: sortTasks(grouped.cancelled, sortConfigs.cancelled),
        };
    }, [filteredTasksForBoard, sortConfigs]);
    
    useEffect(() => {
        setTaskCounts({
            todo: todo.length,
            inprogress: inprogress.length,
            done: done.length,
        });
    }, [todo, inprogress, done, setTaskCounts]);

    const statusConfig = {
        todo: { icon: <ClipboardListIcon size={16} className="text-orange-500" />, borderColor: 'border-orange-500', title: t.todo },
        inprogress: { icon: <SpinnerIcon size={16} className="text-indigo-500 animate-spin" />, borderColor: 'border-indigo-500', title: t.inprogress },
        done: { icon: <CheckCircleIcon size={16} className="text-green-500" />, borderColor: 'border-green-500', title: t.done },
        cancelled: { icon: <XCircleIcon size={16} className="text-gray-500" />, borderColor: 'border-gray-500', title: t.cancelled },
    };
    const columns: { tasks: Task[]; status: Task['status'] }[] = [
        { tasks: todo, status: 'todo' },
        { tasks: inprogress, status: 'inprogress' },
        { tasks: done, status: 'done' },
        { tasks: cancelled, status: 'cancelled' },
    ];

    return (
        <div className="w-full">
            <div className="space-y-6">
                <PerformanceSummary
                    title={t.allTasksBoard}
                    tasks={tasksForSummaryAndChart}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                    customMonth={customMonth}
                    setCustomMonth={setCustomMonth}
                    customStartDate={customStartDate}
                    setCustomStartDate={setCustomStartDate}
                    customEndDate={customEndDate}
                    setCustomEndDate={setCustomEndDate}
                >
                    <select 
                        value={filterUserId} 
                        onChange={e => setFilterUserId(e.target.value)}
                        className="block w-44 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] text-sm"
                    >
                        <option value="all">{t.allEmployees}</option>
                        {allUsers.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                    </select>
                </PerformanceSummary>
                <FilterBar filters={filters} onFilterChange={setFilters} allUsers={allUsers} />
                {loading && allTasks_safe.length === 0 ? <TaskBoardSkeleton /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
                        {columns.map(({ tasks, status }) => (
                            <TaskColumn
                                key={status}
                                status={status}
                                title={statusConfig[status].title}
                                icon={statusConfig[status].icon}
                                borderColor={statusConfig[status].borderColor}
                                tasks={tasks}
                                sortConfig={sortConfigs[status]}
                                onSortChange={(newConfig) => setSortConfigs(prev => ({ ...prev, [status]: newConfig }))}
                                dragOverStatus={dragOverStatus}
                                onDrop={handleDrop}
                                setDragOverStatus={setDragOverStatus}
                                setDraggedTaskId={setDraggedTaskId}
                                onEditTask={onEditTask}
                                onDeleteTask={onDeleteTask}
                                onUpdateStatus={onUpdateStatus}
                                onClearCancelledTasks={onClearCancelledTasks}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllTasksView;
