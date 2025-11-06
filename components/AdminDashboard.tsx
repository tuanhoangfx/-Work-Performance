import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import type { Profile, Task, TimeLog } from '../types';
import { PlusIcon, EditIcon, UsersIcon, SpinnerIcon, ViewGridIcon, CalendarDaysIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './Icons';
import TaskCard from './TaskCard';
import EditEmployeeModal from './EditEmployeeModal';
import CalendarView from './CalendarView';
import PerformanceSummary from './PerformanceSummary';

interface AdminDashboardProps {
    dataVersion: number;
    refreshData: () => void;
    allUsers: Profile[];
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onStartTimer: (task: Task) => void;
    onStopTimer: (timeLog: TimeLog) => void;
    activeTimer: TimeLog | null;
}

const DashboardViewToggle: React.FC<{ view: 'board' | 'calendar'; setView: (view: 'board' | 'calendar') => void; }> = ({ view, setView }) => {
    const { t } = useSettings();
    return (
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
            <button onClick={() => setView('board')} aria-label={t.boardView} title={t.boardView} className={`p-1.5 rounded-full transition-colors ${view === 'board' ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}><ViewGridIcon size={18} /></button>
            <button onClick={() => setView('calendar')} aria-label={t.calendarView} title={t.calendarView} className={`p-1.5 rounded-full transition-colors ${view === 'calendar' ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}><CalendarDaysIcon size={18} /></button>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ dataVersion, refreshData, allUsers, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks }) => {
    const { t } = useSettings();
    const [view, setView] = useState<'all' | 'employee'>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Profile | null>(null);

    useEffect(() => { setLoading(allUsers.length === 0); }, [allUsers]);
    
    const openEditModal = (employee: Profile) => {
        setEmployeeToEdit(employee);
        setIsEditModalOpen(true);
    };
    
    const handleSaveEmployeeProfile = async (updatedProfile: Profile) => {
        const { error } = await supabase.from('profiles').update({ full_name: updatedProfile.full_name, avatar_url: updatedProfile.avatar_url, role: updatedProfile.role }).eq('id', updatedProfile.id);
        if (error) {
            console.error("Error updating employee profile:", error);
        } else {
            setIsEditModalOpen(false);
            setEmployeeToEdit(null);
            refreshData();
        }
    };
    
    const handleSelectEmployee = (employee: Profile) => {
        setView('employee');
        setSelectedEmployee(employee);
    }

    const renderContent = () => {
        switch (view) {
            case 'all':
                return <AllTasksView 
                            dataVersion={dataVersion}
                            allUsers={allUsers}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onUpdateStatus={onUpdateStatus}
                            onClearCancelledTasks={onClearCancelledTasks}
                        />;
            case 'employee':
                return selectedEmployee ? <EmployeeTaskView 
                                                employee={selectedEmployee} 
                                                key={selectedEmployee.id} 
                                                dataVersion={dataVersion} 
                                                onEditTask={onEditTask}
                                                onDeleteTask={onDeleteTask}
                                                onUpdateStatus={onUpdateStatus}
                                                onClearCancelledTasks={onClearCancelledTasks}
                                            /> : null;
            default:
                return null;
        }
    }

    return (
        <div className="w-full animate-fadeInUp">
            <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] pb-2">{t.adminDashboard}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4">
                    <h2 className="font-bold text-lg mb-4">{t.allEmployees}</h2>
                     {loading ? <p>Loading...</p> : (
                        <ul className="space-y-1 max-h-96 lg:max-h-[calc(100vh-280px)] overflow-y-auto">
                            <li><button onClick={() => { setView('all'); setSelectedEmployee(null); }} className={`w-full text-left p-2 rounded-md transition-colors text-sm font-semibold flex items-center gap-3 ${view === 'all' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><UsersIcon size={20} /><span>{t.allTasksBoard}</span></button></li>
                            <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                            {allUsers.map(emp => (
                                <li key={emp.id} className={`group flex items-center justify-between p-1 rounded-md transition-colors ${selectedEmployee?.id === emp.id ? 'bg-[var(--accent-color)]/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>
                                    <div onClick={() => handleSelectEmployee(emp)} className={`flex-grow flex items-center gap-3 cursor-pointer p-1 rounded-md ${selectedEmployee?.id === emp.id ? ' text-gray-800 dark:text-white font-semibold' : ''}`}>
                                        {emp.avatar_url ? <img src={emp.avatar_url} alt={emp.full_name || 'avatar'} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">{(emp.full_name || '?').charAt(0).toUpperCase()}</div>}
                                        <span className="truncate text-sm">{emp.full_name || emp.id}</span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(emp); }} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" title={`Edit ${emp.full_name}`}>
                                            <EditIcon size={14} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>
             {isEditModalOpen && employeeToEdit && <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEmployeeProfile} employee={employeeToEdit} />}
        </div>
    );
};

interface EmployeeTaskViewProps {
    employee: Profile;
    dataVersion: number;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
}

const EmployeeTaskView: React.FC<EmployeeTaskViewProps> = ({ employee, dataVersion, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks }) => {
    const { t } = useSettings();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);

    const fetchTasks = useCallback(async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks').select('*, profiles!user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').eq('user_id', userId).order('priority', { ascending: false }).order('created_at', { ascending: true });
        if (error) console.error("Error fetching tasks:", error); else setTasks((data as Task[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchTasks(employee.id); }, [employee.id, dataVersion, fetchTasks]);

    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = tasks.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== status) {
            onUpdateStatus(taskToMove, status);
        }
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const { todo, inprogress, done, cancelled } = useMemo(() => ({
        todo: tasks.filter(t => t.status === 'todo'),
        inprogress: tasks.filter(t => t.status === 'inprogress'),
        done: tasks.filter(t => t.status === 'done'),
        cancelled: tasks.filter(t => t.status === 'cancelled'),
    }), [tasks]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
                    {columns.map(({ tasks, status }) => {
                        const { icon, borderColor, title } = statusConfig[status];
                        return (
                        <div
                            key={status}
                            onDrop={() => handleDrop(status)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
                            onDragLeave={() => setDragOverStatus(null)}
                            className={`bg-white dark:bg-gray-800/50 rounded-lg p-3 flex flex-col transition-colors duration-200 ${dragOverStatus === status ? 'bg-sky-100 dark:bg-sky-900/30' : ''}`}
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
                                    <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} onUpdateStatus={onUpdateStatus} onDragStart={setDraggedTaskId} assignee={task.profiles} creator={task.creator} />
                                ))}
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 gap-4">
                 <div className="flex-grow">
                    <h2 className="text-2xl font-bold">{t.tasksFor(employee.full_name || "...")}</h2>
                 </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onEditTask({ user_id: employee.id })} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md focus:outline-none">
                        <PlusIcon size={14} />
                        <span className="hidden sm:inline">{t.addNewTask}</span>
                    </button>
                    <DashboardViewToggle view={view} setView={setView} />
                 </div>
            </div>
            {loading ? <div className="flex justify-center p-10"><SpinnerIcon size={40} className="animate-spin text-[var(--accent-color)]" /></div> : (
                view === 'board' ? renderBoard() : <CalendarView tasks={tasks} onTaskClick={onEditTask} />
            )}
        </div>
    );
};

const AllTasksView: React.FC<Omit<AdminDashboardProps, 'refreshData' | 'onStartTimer' | 'onStopTimer' | 'activeTimer' | 'onClearCancelledTasks'> & { onClearCancelledTasks: (tasks: Task[]) => void; }> = ({ dataVersion, allUsers, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks }) => {
    const { t } = useSettings();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUserId, setFilterUserId] = useState<string>('all');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);

    const fetchAllTasks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks').select('*, profiles!user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').order('priority', { ascending: false }).order('created_at', { ascending: true });
        if (error) console.error("Error fetching all tasks:", error);
        else setAllTasks(data as Task[] || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAllTasks(); }, [fetchAllTasks, dataVersion]);

    const filteredTasks = useMemo(() => {
        if (filterUserId === 'all') return allTasks;
        return allTasks.filter(task => task.user_id === filterUserId);
    }, [allTasks, filterUserId]);

    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = allTasks.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== status) {
            onUpdateStatus(taskToMove, status);
        }
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const { todo, inprogress, done, cancelled } = useMemo(() => ({
        todo: filteredTasks.filter(t => t.status === 'todo'),
        inprogress: filteredTasks.filter(t => t.status === 'inprogress'),
        done: filteredTasks.filter(t => t.status === 'done'),
        cancelled: filteredTasks.filter(t => t.status === 'cancelled'),
    }), [filteredTasks]);

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
            <div className="flex justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">{t.allTasksBoard}</h2>
                <select 
                    value={filterUserId} 
                    onChange={e => setFilterUserId(e.target.value)}
                    className="block px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm"
                >
                    <option value="all">{t.allEmployees}</option>
                    {allUsers.map(user => <option key={user.id} value={user.id}>{user.full_name}</option>)}
                </select>
            </div>
            {loading ? <div className="flex justify-center p-10"><SpinnerIcon size={40} className="animate-spin text-[var(--accent-color)]" /></div> : (
                <div className="space-y-6">
                    <PerformanceSummary allTasks={filteredTasks} />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
                        {columns.map(({ tasks, status }) => {
                            const { icon, borderColor, title } = statusConfig[status];
                            return (
                            <div
                                key={status}
                                onDrop={() => handleDrop(status)}
                                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
                                onDragLeave={() => setDragOverStatus(null)}
                                className={`bg-white dark:bg-gray-800/50 rounded-lg p-3 flex flex-col transition-colors duration-200 ${dragOverStatus === status ? 'bg-sky-100 dark:bg-sky-900/30' : ''}`}
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
                                        <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} onUpdateStatus={onUpdateStatus} onDragStart={setDraggedTaskId} assignee={task.profiles} creator={task.creator}/>
                                    ))}
                                </div>
                            </div>
                        )})}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;