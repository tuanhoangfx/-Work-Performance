import React, { useMemo, useState, useEffect } from 'react';
import { Task, Profile } from '../types';
import { useSettings } from '../context/SettingsContext';
import { TrashIcon, EditIcon, ClockIcon, PlayIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, PaperclipIcon, ArrowRightIcon, ChatBubbleIcon } from './Icons';

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
    const [copied, setCopied] = useState(false);

    const isDone = task.status === 'done';
    const isCancelled = task.status === 'cancelled';
    const isArchived = isDone || isCancelled;

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = !isArchived && task.due_date && new Date(task.due_date) < today;
    
    const cardDynamicStyles = useMemo(() => {
        const classes = [];
        if (isArchived) {
            classes.push('opacity-60');
        }
        
        if (task.priority === 'high' && !isArchived) {
            classes.push('animate-breathingGlowRed');
        } else if (task.status === 'inprogress' && !isArchived) {
            classes.push('border-sky-500');
        }
        
        return classes.join(' ');
    }, [task.priority, task.status, isArchived]);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(task);
    };

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(task.id.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div 
            className={`relative bg-white dark:bg-gray-900/70 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 animate-fadeIn flex flex-col gap-2 transition-all ${cardDynamicStyles}`}
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
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" title={t.editTask}><EditIcon size={14}/></button>
                    
                    {!isArchived && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task, 'inprogress'); }} title={t.tasksInProgress} disabled={task.status === 'inprogress'} className="p-1.5 rounded-full text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"><PlayIcon size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task, 'done'); }} title={t.tasksDone} className="p-1.5 rounded-full text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"><CheckCircleIcon size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task, 'cancelled'); }} title={t.cancelTask} className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"><XCircleIcon size={14}/></button>
                        </>
                    )}

                    <button onClick={handleDeleteClick} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t.deleteTask}><TrashIcon size={14}/></button>
                </div>
            </div>
            
            {task.description && (
                <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 break-words ${isCancelled ? 'line-through' : ''}`}>{task.description}</p>
            )}
            <div className="flex flex-wrap justify-between items-center mt-2 gap-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <PriorityIndicator priority={task.priority} />
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
                        <div title={t.dueDateLabel} className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 dark:text-red-400 font-semibold' : ''}`}>
                            {isOverdue && <span className="animate-gentle-shake">⏰</span>}
                            <CalendarIcon size={12} />
                            <span>{new Intl.DateTimeFormat(language, { month: 'short', day: 'numeric' }).format(new Date(task.due_date))}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-xs font-mono text-gray-600 dark:text-gray-300" title={t.totalTimeLogged}>
                        <ClockIcon size={12} className={task.status === 'inprogress' ? 'text-sky-500' : ''}/>
                        <span>{formatDuration(duration)}</span>
                    </div>
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
                     <div className="relative h-5 flex items-center">
                        <button 
                            onClick={handleCopyId}
                            title={t.copyTaskId}
                            className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color-dark)] transition-all"
                        >
                            #{task.id.toString().padStart(4, '0')}
                        </button>
                        {copied && (
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-black rounded-md animate-fadeInUp whitespace-nowrap">
                                Copied!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;