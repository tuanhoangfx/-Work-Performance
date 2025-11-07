import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Profile, Task, TimeLog } from '../../../types';
import { PlusIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon } from '../../Icons';
import CalendarView, { CalendarSortState } from '../../CalendarView';
import PerformanceSummary, { TimeRange } from '../../PerformanceSummary';
import FilterBar, { Filters } from '../../FilterBar';
import type { DataChange, TaskCounts } from '../../../App';
import { type SortConfig, sortTasks, getTodayDateString, getEndOfWeekDateString } from '../../../lib/taskUtils';
import { TaskBoardSkeleton } from '../../Skeleton';
import TaskColumn from '../../TaskColumn';
import DashboardViewToggle from '../DashboardViewToggle';

interface EmployeeTaskViewProps {
    employee: Profile;
    lastDataChange: DataChange | null;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onClearCancelledTasks: (tasks: Task[]) => void;
    allUsers: Profile[];
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const EmployeeTaskView: React.FC<EmployeeTaskViewProps> = ({ employee, lastDataChange, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, allUsers, setTaskCounts }) => {
    const { t, timezone } = useSettings();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorId: 'all', priority: 'all', dueDate: 'all' });
    const [sortConfigs, setSortConfigs] = useState<{ [key in Task['status']]: SortConfig }>({
        todo: { field: 'priority', direction: 'desc' },
        inprogress: { field: 'priority', direction: 'desc' },
        done: { field: 'updated_at', direction: 'desc' },
        cancelled: { field: 'updated_at', direction: 'desc' },
    });

    const [calendarSort, setCalendarSort] = useState<CalendarSortState>({
        id: 'default',
        config: { field: 'priority', direction: 'desc' }
    });
    
    const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
    const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchTasks = useCallback(async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').eq('user_id', userId).order('priority', { ascending: false }).order('created_at', { ascending: true });
        if (error) console.error("Error fetching tasks:", error); else setTasks((data as Task[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchTasks(employee.id); }, [employee.id, fetchTasks]);

    useEffect(() => {
        if (!lastDataChange) return;
        const isRelevant = (task: Partial<Task>) => task.user_id === employee.id;

        const { type, payload } = lastDataChange;
        switch (type) {
            case 'add':
                if (isRelevant(payload)) {
                    setTasks(prev => {
                        if (prev.some(task => task.id === payload.id)) return prev;
                        return [payload, ...prev];
                    });
                }
                break;
            case 'update':
                const isNowRelevant = isRelevant(payload);
                const taskExistsInState = tasks.some(t => t.id === payload.id);

                if (isNowRelevant && !taskExistsInState) { // Reassigned TO this employee
                    setTasks(prev => [payload, ...prev]);
                } else if (!isNowRelevant && taskExistsInState) { // Reassigned FROM this employee
                    setTasks(prev => prev.filter(t => t.id !== payload.id));
                } else if (isNowRelevant && taskExistsInState) { // Normal update
                    setTasks(prev => prev.map(t => t.id === payload.id ? payload : t));
                }
                break;
            case 'delete':
                setTasks(prev => prev.filter(t => t.id !== payload.id));
                break;
            case 'delete_many':
                setTasks(prev => prev.filter(t => !payload.ids.includes(t.id)));
                break;
            case 'batch_update':
                fetchTasks(employee.id);
                break;
        }
    }, [lastDataChange, employee.id, fetchTasks, tasks]);

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
                if (!customMonth) return { tasksForSummaryAndChart: tasks };
                const [year, month] = customMonth.split('-').map(Number);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                if (!customStartDate) return { tasksForSummaryAndChart: tasks };
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
        }

        const filtered = tasks.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        });
        return { tasksForSummaryAndChart: filtered };
    }, [tasks, timeRange, customMonth, customStartDate, customEndDate]);

    
    const filteredTasksForBoard = useMemo(() => {
        const today = getTodayDateString(timezone);
        const endOfWeek = getEndOfWeekDateString(timezone);

        return tasks.filter(task => {
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

            return searchTermMatch && creatorMatch && priorityMatch && dueDateMatch;
        });
    }, [tasks, filters, timezone]);

    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = tasks.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== status) {
             const originalTasks = tasks;
            const updatedTasks = originalTasks.map(t =>
                t.id === draggedTaskId ? { ...t, status: status } : t
            );
            setTasks(updatedTasks);

            onUpdateStatus(taskToMove, status).then(success => {
                if (!success) {
                    setTasks(originalTasks);
                }
            });
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


    const renderBoardColumns = () => {
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
        )
    }


    return (
        <div className="w-full space-y-6">
            <PerformanceSummary
                title={t.tasksFor(employee.full_name || "...")}
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
                <button onClick={() => onEditTask({ user_id: employee.id })} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md focus:outline-none">
                    <PlusIcon size={14} />
                    <span className="hidden sm:inline">{t.addNewTask}</span>
                </button>
                <DashboardViewToggle view={view} setView={setView} />
            </PerformanceSummary>
            
            <FilterBar filters={filters} onFilterChange={setFilters} allUsers={allUsers} />
            
            {loading ? (
                <TaskBoardSkeleton />
            ) : view === 'board' ? (
                renderBoardColumns()
            ) : (
                <CalendarView
                    tasks={filteredTasksForBoard}
                    onTaskClick={onEditTask}
                    calendarSort={calendarSort}
                    onCalendarSortChange={setCalendarSort}
                />
            )}
        </div>
    );
};

export default EmployeeTaskView;