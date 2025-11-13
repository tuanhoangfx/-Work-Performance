
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Profile, Task, Project } from '../../../types';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon, UsersIcon } from '../../Icons';
import PerformanceSummary, { TimeRange } from '../../PerformanceSummary';
import FilterBar, { Filters } from '../../FilterBar';
import type { DataChange, TaskCounts } from '../../../App';
import { type SortConfig, sortTasks } from '../../../lib/taskUtils';
import { useCachedSupabaseQuery } from '../../../hooks/useCachedSupabaseQuery';
import { useTaskFilter } from '../../../hooks/useTaskFilter';
import { TaskBoardSkeleton } from '../../Skeleton';
import TaskColumn from '../../TaskColumn';
import MultiSelectDropdown from './MultiSelectEmployeeDropdown';

interface AllTasksViewProps {
    lastDataChange: DataChange | null;
    allUsers: Profile[];
    allProjects: Project[];
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onClearCancelledTasks: (tasks: Task[]) => void;
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const AllTasksView: React.FC<AllTasksViewProps> = ({ lastDataChange, allUsers, allProjects, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, setTaskCounts }) => {
    const { t, language, timezone } = useSettings();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorIds: [], priorities: [], dueDates: [], projectIds: [] });
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
        return supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').order('priority', { ascending: false }).order('created_at', { ascending: true });
    }, []);

    const { data: allTasks, loading } = useCachedSupabaseQuery<Task[]>({
        cacheKey: 'admin_all_tasks',
        query: allTasksQuery,
        lastDataChange,
    });
    
    const allTasks_safe = allTasks || [];
    
    const filteredTasksByAssignee = useMemo(() => {
        if (selectedUserIds.length === 0) {
            return allTasks_safe;
        }
        return allTasks_safe.filter(task => selectedUserIds.includes(task.user_id));
    }, [allTasks_safe, selectedUserIds]);

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
                if (!customMonth) return { tasksForSummaryAndChart: filteredTasksByAssignee };
                const [year, month] = customMonth.split('-').map(Number);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                if (!customStartDate) return { tasksForSummaryAndChart: filteredTasksByAssignee };
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
        }

        const filtered = filteredTasksByAssignee.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        });
        return { tasksForSummaryAndChart: filtered };
    }, [filteredTasksByAssignee, timeRange, customMonth, customStartDate, customEndDate]);


    const filteredTasksForBoard = useTaskFilter(filteredTasksByAssignee, filters, timezone);


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
    
    const getEmployeeLabel = (selectedCount: number, totalCount: number) => {
        if (selectedCount === 0 || selectedCount === totalCount) {
          return t.allEmployees;
        }
        if (selectedCount === 1) {
            const user = allUsers.find(u => u.id === selectedUserIds[0]);
            return user?.full_name || `1 ${t.employee}`;
        }
        const pluralEmployee = language === 'vi' ? t.employee : `${t.employee}s`;
        return `${selectedCount}/${allUsers.length} ${pluralEmployee}`;
    };

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
                 <FilterBar 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    allUsers={allUsers}
                    projects={allProjects}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                    customMonth={customMonth}
                    setCustomMonth={setCustomMonth}
                    customStartDate={customStartDate}
                    setCustomStartDate={setCustomStartDate}
                    customEndDate={customEndDate}
                    setCustomEndDate={setCustomEndDate}
                >
                    <MultiSelectDropdown
                        options={allUsers.map(u => ({ id: u.id, label: u.full_name || '', avatarUrl: u.avatar_url || undefined }))}
                        selectedIds={selectedUserIds}
                        onChange={setSelectedUserIds}
                        buttonLabel={getEmployeeLabel}
                        buttonIcon={<UsersIcon size={16} />}
                        searchPlaceholder={t.searchUsers}
                        allLabel={t.allEmployees}
                    />
                </FilterBar>
                <PerformanceSummary
                    title={t.allTasksBoard}
                    tasks={tasksForSummaryAndChart}
                />
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

export default React.memo(AllTasksView);
