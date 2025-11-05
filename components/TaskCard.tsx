import React, { useMemo, useState, useEffect } from 'react';
import { Task, Profile } from '../types';
import { useSettings } from '../context/SettingsContext';
import { TrashIcon, EditIcon, ClockIcon, PlayIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, PaperclipIcon, ArrowRightIcon, ChatBubbleIcon, ChevronDownIcon, MinusIcon, ChevronUpIcon } from './Icons';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onDragStart: (taskId: number) => void;
    assignee?: Profile | null;
    creator?: Profile | null;
}

const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatExactTime = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };
    return new Intl.DateTimeFormat(lang, options).format(date);
};

const PriorityIndicator: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
    const { t } = useSettings();
    const priorityConfig: { [key in Task['priority']]: { label: string; icon: string; color: string, bg: string } } = {
        low: { label: t.low, icon: '💤', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/50' },
        medium: { label: t.medium, icon: '⚡', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
        high: { label: t.high, icon: '🚨', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/50' },
    };
    
    const config = priorityConfig[priority];

    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.color}`}>
            <span className="text-sm">{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}

const Avatar: React.FC<{ user: Profile, title: string }> = ({ user, title }) => (
     <div title={title}>
        {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || ''} className="w-5 h-5 rounded-full object-cover" />
        ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-[10px]">
                {(user.full_name || '?').charAt(0).toUpperCase()}
            </div>
        )}
    </div>
);

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onUpdateStatus, onDragStart, assignee, creator }) => {
    const { t, language } = useSettings();
    const [duration, setDuration] = useState(0);

    const isDone = task.status === 'done';
    const isCancelled = task.status === 'cancelled';
    const isArchived = isDone || isCancelled;

    const isOverdue = useMemo(() => {
        if (isArchived || !task.due_date) return false;
        // The due date is the last moment of that day. It's overdue the next day.
        const dueDateEnd = new Date(`${task.due_date}T23:59:59.999`);
        return new Date() > dueDateEnd;
    }, [task.due_date, isArchived]);

    useEffect(() => {
        let interval: number | undefined;

        if (isArchived) {
            const start = new Date(task.created_at).getTime();
            const end = new Date(task.updated_at).getTime();
            setDuration(Math.max(0, end - start));
            if (interval) clearInterval(interval);
        } else {
            const start = new Date(task.created_at).getTime();
            const updateDuration = () => {
                setDuration(Date.now() - start);
            };
            updateDuration();
            interval = window.setInterval(updateDuration, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [task.created_at, task.updated_at, task.status, isArchived]);
    
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(task);
    };

    return (
        <div 
            className={`relative bg-white dark:bg-gray-900/70 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 animate-fadeIn flex flex-col gap-2 transition-all ${isArchived ? 'opacity-60' : ''} ${task.status === 'inprogress' ? 'border-sky-500 animate-breathingGlow' : ''} ${isOverdue ? 'animate-flashing-border' : ''}`}
            draggable={!isArchived}
            onDragStart={() => onDragStart(task.id)}
        >
            <div className="flex justify-between items-start gap-2">
                <h4 className={`font-bold text-gray-800 dark:text-gray-200 break-words flex-grow ${isCancelled ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                    {task.title}
                </h4>
                
                <div 
                    className="flex items-center gap-0.5 flex-shrink-0"
                    draggable="false"
                >
                    <button onMouseDown={e => e.stopPropagation()} onClick={() => onEdit(task)} className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" title={t.editTask}><EditIcon size={14}/></button>
                    
                    {!isArchived && (
                        <>
                            <button onMouseDown={e => e.stopPropagation()} onClick={() => onUpdateStatus(task, 'inprogress')} title={t.tasksInProgress} disabled={task.status === 'inprogress'} className="p-1.5 rounded-full text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"><PlayIcon size={14}/></button>
                            <button onMouseDown={e => e.stopPropagation()} onClick={() => onUpdateStatus(task, 'done')} title={t.tasksDone} className="p-1.5 rounded-full text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"><CheckCircleIcon size={14}/></button>
                            <button onMouseDown={e => e.stopPropagation()} onClick={() => onUpdateStatus(task, 'cancelled')} title={t.cancelTask} className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"><XCircleIcon size={14}/></button>
                        </>
                    )}

                    <button onMouseDown={e => e.stopPropagation()} onClick={handleDeleteClick} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t.deleteTask}><TrashIcon size={14}/></button>
                </div>
            </div>
            
            {task.description && (
                <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 break-words ${isCancelled ? 'line-through' : ''}`}>{task.description}</p>
            )}
            <div className="flex flex-wrap justify-between items-center mt-2 gap-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <PriorityIndicator priority={task.priority} />
                     {isOverdue && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                            <span>⏰</span>
                            <span>{t.overdue}</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {task.task_comments && task.task_comments.length > 0 && (
                        <div title={`${task.task_comments.length} ${t.comments}`} className="flex items-center gap-1">
                            <ChatBubbleIcon size={12} />
                            <span>{task.task_comments.length}</span>
                        </div>
                    )}
                    {task.task_attachments && task.task_attachments.length > 0 && (
                        <div title={`${task.task_attachments.length} ${t.attachments}`} className="flex items-center gap-1">
                            <PaperclipIcon size={12} />
                            <span>{task.task_attachments.length}</span>
                        </div>
                    )}
                    {task.due_date && (
                        <div title={t.dueDateLabel} className="flex items-center gap-1">
                            <CalendarIcon size={12} />
                            <span>{new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(new Date(task.due_date))}</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
                 <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {creator && creator.id !== assignee?.id && (
                        <>
                            <Avatar user={creator} title={`${t.createdBy}: ${creator.full_name}`} />
                            <ArrowRightIcon size={12} className="text-gray-400" />
                        </>
                    )}
                    {assignee && <Avatar user={assignee} title={`${t.assignee}: ${assignee.full_name}`} />}
                    <span className="ml-1 tabular-nums">{formatExactTime(task.created_at, language)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-mono text-gray-600 dark:text-gray-300" title={t.totalTimeLogged}>
                        <ClockIcon size={14} className={task.status === 'inprogress' ? 'text-sky-500' : ''}/>
                        <span>{formatDuration(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;