import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import type { Profile, Task, TimeLog } from '../types';
import { PlusIcon, EditIcon, UsersIcon, SpinnerIcon, ViewGridIcon, CalendarDaysIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from './Icons';
import TaskCard from './TaskCard';
import EditEmployeeModal from './EditEmployeeModal';
import CalendarView from './CalendarView';
import PerformanceSummary, { TimeRange } from './PerformanceSummary';
import FilterBar, { Filters } from './FilterBar';
import type { DataChange, TaskCounts } from '../App';
import SortDropdown from './SortDropdown';
import { type SortConfig, sortTasks } from '../lib/taskUtils';

interface AdminDashboardProps {
    lastDataChange: DataChange | null;
    allUsers: Profile[];
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onStartTimer: (task: Task) => void;
    onStopTimer: (timeLog: TimeLog) => void;
    activeTimer: TimeLog | null;
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ lastDataChange, allUsers, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, setTaskCounts }) => {
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
            // This is a profile change, a full refresh is acceptable here.
            window.location.reload();
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
                            lastDataChange={lastDataChange}
                            allUsers={allUsers}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onUpdateStatus={onUpdateStatus}
                            onClearCancelledTasks={onClearCancelledTasks}
                            setTaskCounts={setTaskCounts}
                        />;
            case 'employee':
                return selectedEmployee ? <EmployeeTaskView 
                                                employee={selectedEmployee} 
                                                key={selectedEmployee.id} 
                                                lastDataChange={lastDataChange}
                                                onEditTask={onEditTask}
                                                onDeleteTask={onDeleteTask}
                                                onUpdateStatus={onUpdateStatus}
                                                onClearCancelledTasks={onClearCancelledTasks}
                                                allUsers={allUsers}
                                                setTaskCounts={setTaskCounts}
                                            /> : null;
            default:
                return null;
        }
    }

    return (
        <div className="w-full animate-fadeInUp">
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
    lastDataChange: DataChange | null;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    allUsers: Profile[];
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const EmployeeTaskView: React.FC<EmployeeTaskViewProps> = ({ employee, lastDataChange, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, allUsers, setTaskCounts }) => {
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
        const { data, error } = await supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').eq('user_id', userId).order('priority', { ascending: false }).order('created_at', { ascending: true });
        if (error) console.error("Error fetching tasks:", error); else setTasks((data as Task[]) || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchTasks(employee.id); }, [employee.id, fetchTasks]);

    useEffect(() => {
        if (!lastDataChange) return;
        const isRelevant = (task: Task) => task.user_id === employee.id;

        const { type, payload } = lastDataChange;
        switch (type) {
            case 'add':
                if (isRelevant(payload)) setTasks(prev => [payload, ...prev]);
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
            case 'batch_update':
                fetchTasks(employee.id);
                break;
        }
    }, [lastDataChange, employee.id, fetchTasks]);

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
                        className={`bg-white dark:bg-gray-800/50 rounded-lg p-3 flex flex-col transition-colors duration-200 ${dragOverStatus === status ? 'bg-sky-100 dark:bg-sky-900/30' : ''}`}
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
                                <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} onUpdateStatus={onUpdateStatus} onDragStart={setDraggedTaskId} assignee={task.assignee} creator={task.creator} />
                            ))}
                            {tasks.length === 0 && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">{t.noTasksFound}</p>
                            )}
                        </div>
                    </div>
                )})}
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
                <div className="flex justify-center p-10"><SpinnerIcon size={40} className="animate-spin text-[var(--accent-color)]" /></div>
            ) : view === 'board' ? (
                renderBoardColumns()
            ) : (
                <CalendarView tasks={filteredTasksForBoard} onTaskClick={onEditTask} />
            )}
        </div>
    );
};

interface AllTasksViewProps extends Omit<AdminDashboardProps, 'onStartTimer' | 'onStopTimer' | 'activeTimer' | 'onClearCancelledTasks' | 'setTaskCounts'>{
    onClearCancelledTasks: (tasks: Task[]) => void;
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}


const AllTasksView: React.FC<AllTasksViewProps> = ({ lastDataChange, allUsers, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, setTaskCounts }) => {
    const { t } = useSettings();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterUserId, setFilterUserId] = useState<string>('all');
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


    const fetchAllTasks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').order('priority', { ascending: false }).order('created_at', { ascending: true });
        if (error) console.error("Error fetching all tasks:", error);
        else setAllTasks(data as Task[] || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAllTasks(); }, [fetchAllTasks]);
    
    useEffect(() => {
        if (!lastDataChange) return;

        const { type, payload } = lastDataChange;
        switch (type) {
            case 'add':
                setAllTasks(prev => [payload, ...prev]);
                break;
            case 'update':
                setAllTasks(prev => prev.map(t => t.id === payload.id ? payload : t));
                break;
            case 'delete':
                setAllTasks(prev => prev.filter(t => t.id !== payload.id));
                break;
            case 'delete_many':
                setAllTasks(prev => prev.filter(t => !payload.ids.includes(t.id)));
                break;
            case 'batch_update':
                fetchAllTasks();
                break;
        }
    }, [lastDataChange, fetchAllTasks]);
    
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
                if (!customMonth) return { tasksForSummaryAndChart: allTasks };
                const [year, month] = customMonth.split('-').map(Number);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                if (!customStartDate) return { tasksForSummaryAndChart: allTasks };
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
        }

        const filtered = allTasks.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        });
        return { tasksForSummaryAndChart: filtered };
    }, [allTasks, timeRange, customMonth, customStartDate, customEndDate]);


    const filteredTasksForBoard = useMemo(() => {
        return allTasks.filter(task => {
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
                                      (task.description && task.description.toLowerCase().includes(lowerCaseSearch));
                }
            }

            const creatorMatch = filters.creatorId === 'all' || task.created_by === filters.creatorId;
            const priorityMatch = filters.priority === 'all' || task.priority === filters.priority;

            return assigneeMatch && searchTermMatch && creatorMatch && priorityMatch;
        });
    }, [allTasks, filterUserId, filters]);

    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = allTasks.find(t => t.id === draggedTaskId);
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
            {loading ? <div className="flex justify-center p-10"><SpinnerIcon size={40} className="animate-spin text-[var(--accent-color)]" /></div> : (
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
                                        <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} onUpdateStatus={onUpdateStatus} onDragStart={setDraggedTaskId} assignee={task.assignee} creator={task.creator}/>
                                    ))}
                                    {tasks.length === 0 && (
                                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">{t.noTasksFound}</p>
                                    )}
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