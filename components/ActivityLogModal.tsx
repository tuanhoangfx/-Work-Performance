import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { XIcon, SpinnerIcon, SearchIcon } from './Icons';
import type { ActivityLog } from '../types';
import { formatAbsoluteDateTime } from '../lib/taskUtils';
import Avatar from './common/Avatar';
import VirtualItem from './common/VirtualItem';
import { ActivityLogItemSkeleton } from './Skeleton';
import MultiSelectDropdown, { MultiSelectOption } from './dashboard/admin/MultiSelectEmployeeDropdown';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
    const { t, language, timezone } = useSettings();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUsers, setFilterUsers] = useState<string[]>([]);
    const [filterActions, setFilterActions] = useState<string[]>([]);
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
            setFilterUsers([]);
            setFilterActions([]);
        }
    }, [isOpen]);

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

    const userOptions: MultiSelectOption[] = useMemo(() => {
        const users = new Map<string, { id: string, label: string, avatarUrl?: string }>();
        logs.forEach(log => {
            if (log.profiles && !users.has(log.profiles.id)) {
                users.set(log.profiles.id, { id: log.profiles.id, label: log.profiles.full_name || 'Unknown', avatarUrl: log.profiles.avatar_url || undefined });
            }
        });
        return Array.from(users.values()).sort((a, b) => a.label.localeCompare(b.label));
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

    const actionOptions: MultiSelectOption[] = useMemo(() => 
        // FIX: Cast to string[] to resolve TypeScript error where `action` is inferred as `unknown`.
        (Array.from(new Set(logs.map(log => log.action))) as string[])
        .map(action => ({ id: action, label: actionTypes[action] || action }))
    , [logs, actionTypes]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const userMatch = filterUsers.length === 0 || (log.user_id && filterUsers.includes(log.user_id));
            const actionMatch = filterActions.length === 0 || filterActions.includes(log.action);
            
            let searchMatch = true;
            if (searchTerm.trim()) {
                const lowerCaseSearch = searchTerm.toLowerCase();
                const message = formatLogMessage(log).toLowerCase();
                searchMatch = message.includes(lowerCaseSearch);
            }
            
            return userMatch && actionMatch && searchMatch;
        });
    }, [logs, searchTerm, filterUsers, filterActions, formatLogMessage]);
    
    const getUserLabel = (selectedCount: number, totalCount: number) => {
        if (selectedCount === 0 || selectedCount === totalCount) return t.log_allUsers;
        if (selectedCount === 1) {
            const user = userOptions.find(u => u.id === filterUsers[0]);
            return user?.label || '1 User';
        }
        return `${selectedCount} Users`;
    };

    const getActionLabel = (selectedCount: number, totalCount: number) => {
        if (selectedCount === 0 || selectedCount === totalCount) return t.log_allActions;
        return `${selectedCount} Actions`;
    };


    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex justify-center overflow-y-auto p-4 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-log-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-fadeInUp my-auto"
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
                        <MultiSelectDropdown
                            options={userOptions}
                            selectedIds={filterUsers}
                            onChange={setFilterUsers}
                            buttonLabel={getUserLabel}
                            buttonIcon={<></>}
                            searchPlaceholder={t.searchUsers}
                            allLabel={t.log_allUsers}
                            widthClass="w-full"
                        />
                        <MultiSelectDropdown
                            options={actionOptions}
                            selectedIds={filterActions}
                            onChange={setFilterActions}
                            buttonLabel={getActionLabel}
                            buttonIcon={<></>}
                            searchPlaceholder="Search actions..."
                            allLabel={t.log_allActions}
                            widthClass="w-full"
                        />
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