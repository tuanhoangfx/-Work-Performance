import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import type { Task, TimeLog, Profile } from '../types';
import type { Session } from '@supabase/supabase-js';
import { SpinnerIcon, ViewGridIcon, CalendarDaysIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './Icons';
import TaskCard from './TaskCard';
import CalendarView from './CalendarView';
import PerformanceSummary from './PerformanceSummary';
import FilterBar, { Filters } from './FilterBar';

interface TaskDashboardProps {
    session: Session;
    dataVersion: number;
    refreshData: () => void;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onStartTimer: (task: Task) => void;
    onStopTimer: (timeLog: TimeLog) => void;
    activeTimer: TimeLog | null;
    allUsers: Profile[];
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

const EmployeeDashboard: React.FC<TaskDashboardProps> = ({ session, dataVersion, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, allUsers }) => {
    const { t } = useSettings();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorId: 'all', priority: 'all' });

    const fetchTasks = useCallback(async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*, profiles!user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
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
    }, [session, dataVersion, fetchTasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const searchTermMatch = filters.searchTerm.toLowerCase() === '' ||
                task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                task.description?.toLowerCase().includes(filters.searchTerm.toLowerCase());

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
        return {
            todo: filteredTasks.filter(t => t.status === 'todo'),
            inprogress: filteredTasks.filter(t => t.status === 'inprogress'),
            done: filteredTasks.filter(t => t.status === 'done'),
            cancelled: filteredTasks.filter(t => t.status === 'cancelled'),
        };
    }, [filteredTasks]);
    
    const renderBoard = () => {
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
            <div className="space-y-6">
                 <PerformanceSummary allTasks={tasks} />
                 <FilterBar filters={filters} onFilterChange={setFilters} allUsers={allUsers} />
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
                                {status === 'cancelled' && tasks.length > 0 && (
                                    <button 
                                        onClick={() => onClearCancelledTasks(tasks)}
                                        className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                        title={t.clearCancelledTasksTitle}
                                    >
                                        <TrashIcon size={14} />
                                    </button>
                                )}
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
                                        assignee={task.profiles}
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
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center items-center p-10">
                    <SpinnerIcon size={40} className="animate-spin text-[var(--accent-color)]" />
                </div>
            );
        }
        switch (view) {
            case 'board':
                return renderBoard();
            case 'calendar':
                return <CalendarView tasks={tasks} onTaskClick={onEditTask} />;
            default:
                return null;
        }
    }


    if (!session) {
         return <div className="text-center p-8">{t.signInToManageTasks}</div>;
    }
    
    return (
        <div className="w-full animate-fadeInUp">
            <div className="relative flex justify-center items-center mb-6">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] dark:from-[var(--accent-color-dark)] dark:to-[var(--gradient-to)] text-center">
                    {t.myTasksTitle}
                </h1>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <DashboardViewToggle view={view} setView={setView} />
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default EmployeeDashboard;