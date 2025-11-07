import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { XIcon, SpinnerIcon, SearchIcon } from './Icons';
import type { ActivityLog } from '../types';
import { formatAbsoluteDateTime } from '../lib/taskUtils';
import Avatar from './common/Avatar';
import VirtualItem from './common/VirtualItem';
import { ActivityLogItemSkeleton } from './Skeleton';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
    const { t, language, timezone } = useSettings();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUser, setFilterUser] = useState('all');
    const [filterAction, setFilterAction] = useState('all');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchLogs = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*, profiles(*)')
                    .order('created_at', { ascending: false })
                    .limit(200); // Fetch more logs for better filtering
                
                if (error) {
                    console.error("Error fetching activity logs:", error);
                    setLogs([]);
                } else {
                    setLogs(data as ActivityLog[]);
                }
                setLoading(false);
            };
            fetchLogs();
        } else {
            // Reset state on close
            setSearchTerm('');
            setFilterUser('all');
            setFilterAction('all');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const formatLogMessage = useCallback((log: ActivityLog) => {
        const user = log.profiles?.full_name || t.a_user;
        const task = log.details?.task_title ? `"${log.details.task_title}"` : t.a_task;
        
        const statusMap = {
            todo: t.todo,
            inprogress: t.inprogress,
            done: t.done,
            cancelled: t.cancelled,
        };

        switch (log.action) {
            case 'created_task':
                return t.log_created_task(user, task);
            case 'updated_task':
                return t.log_updated_task(user, task);
            case 'deleted_task':
                return t.log_deleted_task(user, task);
            case 'status_changed':
                const fromStatus = statusMap[log.details?.from as keyof typeof statusMap] || log.details?.from;
                const toStatus = statusMap[log.details?.to as keyof typeof statusMap] || log.details?.to;
                return t.log_status_changed(user, task, fromStatus, toStatus);
            case 'added_attachments':
                return t.log_added_attachments(user, log.details?.count || 0, task);
            case 'removed_attachments':
                 return t.log_removed_attachments(user, log.details?.count || 0, task);
            case 'cleared_cancelled_tasks':
                return t.log_cleared_cancelled_tasks(user, log.details?.count || 0);
            default:
                return `${user} ${log.action} ${task}`;
        }
    }, [t]);

    const uniqueUsers = useMemo(() => {
        const users = new Map<string, { id: string, name: string }>();
        logs.forEach(log => {
            if (log.profiles && !users.has(log.profiles.id)) {
                users.set(log.profiles.id, { id: log.profiles.id, name: log.profiles.full_name || 'Unknown' });
            }
        });
        return Array.from(users.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [logs]);

    const actionTypes: { [key: string]: string } = useMemo(() => ({
        created_task: t.log_action_created_task,
        updated_task: t.log_action_updated_task,
        deleted_task: t.log_action_deleted_task,
        status_changed: t.log_action_status_changed,
        added_attachments: t.log_action_added_attachments,
        removed_attachments: t.log_action_removed_attachments,
        cleared_cancelled_tasks: t.log_action_cleared_cancelled_tasks,
    }), [t]);

    const uniqueActions = useMemo(() => Array.from(new Set(logs.map(log => log.action))), [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const userMatch = filterUser === 'all' || log.user_id === filterUser;
            const actionMatch = filterAction === 'all' || log.action === filterAction;
            
            let searchMatch = true;
            if (searchTerm.trim()) {
                const lowerCaseSearch = searchTerm.toLowerCase();
                const message = formatLogMessage(log).toLowerCase();
                searchMatch = message.includes(lowerCaseSearch);
            }
            
            return userMatch && actionMatch && searchMatch;
        });
    }, [logs, searchTerm, filterUser, filterAction, formatLogMessage]);


    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start md:items-center p-4 pt-16 md:pt-4 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-log-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-fadeInUp"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="activity-log-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.activityLog}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label={t.close}
                    >
                        <XIcon size={24} />
                    </button>
                </div>

                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="relative sm:col-span-1">
                            <input
                                type="text"
                                placeholder={t.log_searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon size={16} className="text-gray-400" />
                            </div>
                        </div>
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            aria-label={t.log_filterByUser}
                        >
                            <option value="all">{t.log_allUsers}</option>
                            {uniqueUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            aria-label={t.log_filterByAction}
                        >
                            <option value="all">{t.log_allActions}</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{actionTypes[action] || action}</option>
                            ))}
                        </select>
                    </div>
                </div>


                <div ref={scrollContainerRef} className="overflow-y-auto flex-grow h-[60vh]">
                    {loading ? (
                         <div className="flex justify-center items-center h-full">
                            <SpinnerIcon size={32} className="animate-spin text-[var(--accent-color)]" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t.noActivity}</p>
                    ) : (
                        <ul className="space-y-1 p-4">
                            {filteredLogs.map(log => (
                                <VirtualItem key={log.id} rootRef={scrollContainerRef} placeholder={<ActivityLogItemSkeleton />}>
                                    <li className="flex items-start gap-3 p-1">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {log.profiles && <Avatar user={log.profiles} title={log.profiles.full_name || ''} size={28} />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug"
                                                dangerouslySetInnerHTML={{ __html: formatLogMessage(log)
                                                    .replace(/<strong>/g, '<strong class="font-semibold">')
                                                    .replace(/"(.*?)"/g, `<strong class="font-semibold text-[var(--accent-color)] dark:text-[var(--accent-color-dark)]">"$1"</strong>`)
                                                }}
                                            />
                                            <time className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{formatAbsoluteDateTime(log.created_at, language, timezone)}</time>
                                        </div>
                                    </li>
                                </VirtualItem>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;