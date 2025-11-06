import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import type { Task, TimeLog, Profile } from '../types';
import type { Session } from '@supabase/supabase-js';
import { SpinnerIcon, ViewGridIcon, CalendarDaysIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './Icons';
import TaskCard from './TaskCard';
import CalendarView from './CalendarView';
import PerformanceSummary, { TimeRange } from './PerformanceSummary';
import FilterBar, { Filters } from './FilterBar';
import type { DataChange, TaskCounts } from '../App';
import SortDropdown from './SortDropdown';
import { type SortConfig, sortTasks } from '../lib/taskUtils';


interface TaskDashboardProps {
    session: Session;
    lastDataChange: DataChange | null;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onStartTimer: (task: Task) => void;
    onStopTimer: (timeLog: TimeLog) => void;
    activeTimer: TimeLog | null;
    allUsers: Profile[];
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const DashboardViewToggle: React.FC<{ view: 'board' | 'calendar'; setView: (view: 'board' | 'calendar') => void; }> = ({ view, setView }) => {
    const { t } = useSettings();
    return (
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
            <button onClick={() => setView('board')} aria-label={t.boardView} title={t.boardView} className={`p-1.5 rounded-full transition-colors ${view === 'board' ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}><ViewGridIcon size={18} /></button>
            <button onClick={() => setView('calendar')} aria-label={t.calendarView} title={t.calendarView} className={`p-1.5 rounded-full transition-colors ${view === 'calendar' ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'}`}><CalendarDaysIcon size={18} /></button>
        </div>
    );
};

const EmployeeDashboard: React.FC<TaskDashboardProps> = ({ session, lastDataChange, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, allUsers, setTaskCounts }) => {
    const { t } = useSettings();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorId: 'all', priority: 'all' });
    const [sortConfigs, setSortConfigs] = useState<{ [key in Task['status']]: SortConfig }>({
        todo: { field: 'priority', direction: 'desc' },
        inprogress: { field: 'priority', direction: 'desc' },
        done: { field: 'updated_at', direction: 'desc' },
        cancelled: { field: 'updated_at', direction: 'desc' },
    });
    
    // State for time range filtering
    const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
    const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);


    const fetchTasks = useCallback(async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
            .or(`user_id.eq.${userId},created_by.eq.${userId}`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching tasks:", error);
            setTasks([]);
        } else {
            setTasks(data as Task[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (session?.user) {
            fetchTasks(session.user.id);
        }
    }, [session, fetchTasks]);

    useEffect(() => {
        if (!lastDataChange) return;

        const { type, payload } = lastDataChange;

        switch (type) {
            case 'add':
                setTasks(prev => [payload, ...prev]);
                break;
            case 'update':
                setTasks(prev => prev.map(t => t.id === payload.id ? payload : t));
                break;
            case 'delete':
                setTasks(prev => prev.filter(t => t.id !== payload.id));
                break;
            case 'delete_many':
                setTasks(prev => prev.filter(t => !payload.ids.includes(t.id)));
                break;
            case 'batch_update': // A generic trigger to re-fetch, e.g., for timers
                if(session?.user) fetchTasks(session.user.id);
                break;
        }
    }, [lastDataChange, session, fetchTasks]);

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
                                      (task.description && task.description.toLowerCase().includes(lowerCaseSearch));
                }
            }
            
            const creatorMatch = filters.creatorId === 'all' || task.created_by === filters.creatorId;

            const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;

            return searchTermMatch && creatorMatch && priorityMatch;
        });
    }, [tasks, filters]);
    
    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = tasks.find(t => t.id === draggedTaskId);
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
                {columns.map(({ tasks, status }) => {
                    const { icon, borderColor, title } = statusConfig[status];
                    return (
                    <div
                        key={status}
                        onDrop={() => handleDrop(status)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
                        onDragLeave={() => setDragOverStatus(null)}
                        className={`bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col transition-colors duration-200 ${dragOverStatus === status ? 'bg-sky-100 dark:bg-sky-900/30' : ''}`}
                    >
                        <h3 className={`font-bold text-gray-700 dark:text-gray-300 px-2 pb-2 border-b-2 ${borderColor} flex-shrink-0 flex items-center justify-between gap-2`}>
                            <div className="flex items-center gap-2">
                                {icon}
                                <span>{title} ({tasks.length})</span>
                            </div>
                            <div className="flex items-center">
                                {status === 'cancelled' && tasks.length > 0 && (
                                    <button 
                                        onClick={() => onClearCancelledTasks(tasks)}
                                        className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                        title={t.clearCancelledTasksTitle}
                                    >
                                        <TrashIcon size={14} />
                                    </button>
                                )}
                                 <SortDropdown 
                                    status={status}
                                    config={sortConfigs[status]}
                                    onChange={(newConfig) => setSortConfigs(prev => ({ ...prev, [status]: newConfig }))}
                                />
                            </div>
                        </h3>
                        <div className="mt-4 space-y-3 flex-grow overflow-y-auto">
                            {tasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onEdit={onEditTask} 
                                    onDelete={onDeleteTask} 
                                    onUpdateStatus={onUpdateStatus} 
                                    onDragStart={setDraggedTaskId} 
                                    assignee={task.assignee}
                                    creator={task.creator}
                                />
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">{t.noTasksFound}</p>
                            )}
                        </div>
                    </div>
                )})}
            </div>
        );
    };

    if (!session) {
         return <div className="text-center p-8">{t.signInToManageTasks}</div>;
    }
    
    return (
        <div className="w-full animate-fadeInUp space-y-6">
            <PerformanceSummary
                title={t.performanceSummary}
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
                <DashboardViewToggle view={view} setView={setView} />
            </PerformanceSummary>
            
            <FilterBar filters={filters} onFilterChange={setFilters} allUsers={allUsers} />

            {loading ? (
                <div className="flex justify-center items-center p-10">
                    <SpinnerIcon size={40} className="animate-spin text-[var(--accent-color)]" />
                </div>
            ) : view === 'board' ? (
                renderBoardColumns()
            ) : (
                <CalendarView tasks={filteredTasksForBoard} onTaskClick={onEditTask} />
            )}
        </div>
    );
};

export default EmployeeDashboard;