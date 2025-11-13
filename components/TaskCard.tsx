import React, { useMemo, useState, useEffect } from 'react';
import { Task, Profile } from '../types';
import { useSettings } from '../context/SettingsContext';
import { TrashIcon, EditIcon, ClockIcon, PlayIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, PaperclipIcon, ArrowRightIcon, ChatBubbleIcon, CheckIcon } from './Icons';
import PriorityIndicator from './common/PriorityIndicator';
import Avatar from './common/Avatar';
import { PROJECT_COLORS } from '../../constants';
import { getTodayDateString } from '../lib/taskUtils';

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
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatExactTime = (dateString: string, lang: string, timezone: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: timezone,
        hour12: false,
    };
    const formatted = new Intl.DateTimeFormat('vi-VN', options).format(date);
    const parts = formatted.split(', ');
    if (parts.length === 2) {
        return `${parts[1]} ${parts[0]}`;
    }
    return formatted; // Fallback
};

const formatShortDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    };
    return new Intl.DateTimeFormat('vi-VN', options).format(date);
};


const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onUpdateStatus, onDragStart, assignee, creator }) => {
    const { t, language, timezone } = useSettings();
    const [duration, setDuration] = useState(0);
    const [copied, setCopied] = useState(false);

    const isDone = task.status === 'done';
    const isCancelled = task.status === 'cancelled';
    const isArchived = isDone || isCancelled;

    const isOverdue = useMemo(() => {
        if (isArchived || !task.due_date) return false;
        const todayInUserTz = getTodayDateString(timezone);
        return task.due_date < todayInUserTz;
    }, [task.due_date, isArchived, timezone]);

    const isToday = useMemo(() => {
        if (isArchived || !task.due_date) return false;
        const todayInUserTz = getTodayDateString(timezone);
        return task.due_date === todayInUserTz;
    }, [task.due_date, isArchived, timezone]);
    
    const dueDateClasses = useMemo(() => {
        if (isOverdue) return 'text-red-500 dark:text-red-400 font-semibold';
        if (isToday) return 'text-amber-600 dark:text-amber-400 font-semibold';
        return '';
    }, [isOverdue, isToday]);

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
        navigator.clipboard.writeText(`#${task.id.toString().padStart(4, '0')}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    
    const project = task.projects;
    const projectName = project ? project.name : t.personalProject;
    const projectColor = project ? (project.color || PROJECT_COLORS[project.id % PROJECT_COLORS.length]) : '#6b7280'; // gray-500 for Personal

    return (
        <div 
            className={`relative bg-white dark:bg-gray-900/70 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 animate-fadeIn flex flex-col gap-2 transition-all ${cardDynamicStyles}`}
            draggable={!isArchived}
            onDragStart={() => onDragStart(task.id)}
        >
            {/* Row 1: ID, Actions */}
            <div className="flex justify-between items-center gap-2">
                <div className="relative flex-shrink-0">
                    <button
                        onClick={handleCopyId}
                        title={t.copyTaskId}
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full transition-all duration-300
                        ${copied
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color-dark)]'
                        }`
                    }
                    >
                        {copied ? (
                            <span className="flex items-center gap-1">
                                <CheckIcon size={12} />
                                Copied!
                            </span>
                        ) : (
                            `#${task.id.toString().padStart(4, '0')}`
                        )}
                    </button>
                </div>
                
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
            
            {/* Row 2: Title */}
            <h4 className={`font-bold text-gray-800 dark:text-gray-200 break-words ${isCancelled ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                {task.title}
            </h4>

            {/* Row 3: Description */}
            {task.description && (
                <p className={`text-sm text-gray-600 dark:text-gray-400 break-words ${isCancelled ? 'line-through' : ''}`}>{task.description}</p>
            )}

            {/* Row 4: Priority, Project (left) | Comments, Attachments, Assignee (right) */}
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <PriorityIndicator priority={task.priority} />
                    <div title={projectName} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: projectColor }}></span>
                        <span className="truncate max-w-[100px]">{projectName}</span>
                    </div>
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
                    <div className="flex items-center gap-1.5">
                        {creator && creator.id !== assignee?.id && (
                            <>
                                <Avatar user={creator} title={`${t.createdBy}: ${creator.full_name}`} size={20} />
                                <ArrowRightIcon size={12} className="text-gray-400" />
                            </>
                        )}
                        {assignee && <Avatar user={assignee} title={`${t.assignee}: ${assignee.full_name}`} size={20} />}
                    </div>
                </div>
            </div>

            {/* Row 5: Creation/Completion Time, Total Logged Time, Due Date */}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/50 pt-2 mt-1">
                {isArchived ? (
                    <span className="tabular-nums flex items-center gap-1" title={t.completionDate}>
                        {isDone ? (
                            <span className="text-sm" role="img" aria-label="flag">🚩</span>
                        ) : ( // isCancelled
                            <span className="text-sm" role="img" aria-label="prohibited">🚫</span>
                        )}
                        {formatExactTime(task.updated_at, language, timezone)}
                    </span>
                ) : (
                    <span className="tabular-nums flex items-center gap-1" title={t.creationTime}>
                        <span role="img" aria-label="rocket" className="text-sm">🚀</span>
                        {formatExactTime(task.created_at, language, timezone)}
                    </span>
                )}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-300" title={t.totalTimeLogged}>
                        <ClockIcon size={12} className={task.status === 'inprogress' ? 'text-sky-500' : ''}/>
                        <span>{formatDuration(duration)}</span>
                    </div>
                    {task.due_date && (
                        <div title={t.dueDateLabel} className={`flex items-center gap-1 ${dueDateClasses}`}>
                            {isOverdue ? (
                                <span className="animate-gentle-shake text-sm">⏰</span>
                            ) : isToday ? (
                                <span className="animate-gentle-shake text-sm">🔥</span>
                            ) : (
                                <CalendarIcon size={12} />
                            )}
                            <span>{formatShortDate(task.due_date)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TaskCard);