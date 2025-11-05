import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { XIcon, SpinnerIcon } from './Icons';
import type { ActivityLog } from '../types';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeAgo = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
};


const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
    const { t, language } = useSettings();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchLogs = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*, profiles(*)')
                    .order('created_at', { ascending: false })
                    .limit(50);
                
                if (error) {
                    console.error("Error fetching activity logs:", error);
                    setLogs([]);
                } else {
                    setLogs(data as ActivityLog[]);
                }
                setLoading(false);
            };
            fetchLogs();
        }
    }, [isOpen]);

    const formatLogMessage = (log: ActivityLog) => {
        const user = <strong className="font-semibold">{log.profiles?.full_name || t.a_user}</strong>;
        const task = <strong className="font-semibold text-[var(--accent-color)] dark:text-[var(--accent-color-dark)]">{log.details?.task_title ? `"${log.details.task_title}"` : t.a_task}</strong>;
        
        const statusMap = {
            todo: t.todo,
            inprogress: t.inprogress,
            done: t.done,
            cancelled: t.cancelled,
        };

        switch (log.action) {
            case 'created_task':
                return t.log_created_task(user.props.children, task.props.children);
            case 'updated_task':
                return t.log_updated_task(user.props.children, task.props.children);
            case 'deleted_task':
                return t.log_deleted_task(user.props.children, task.props.children);
            case 'status_changed':
                const fromStatus = statusMap[log.details?.from as keyof typeof statusMap] || log.details?.from;
                const toStatus = statusMap[log.details?.to as keyof typeof statusMap] || log.details?.to;
                return t.log_status_changed(user.props.children, task.props.children, fromStatus, toStatus);
            case 'added_attachments':
                return t.log_added_attachments(user.props.children, log.details?.count || 0, task.props.children);
            case 'removed_attachments':
                 return t.log_removed_attachments(user.props.children, log.details?.count || 0, task.props.children);
            default:
                return `${user.props.children} ${log.action} ${task.props.children}`;
        }
    };

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
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="activity-log-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.activityLog}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label={t.close}
                    >
                        <XIcon size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-4">
                    {loading ? (
                         <div className="flex justify-center items-center h-40">
                            <SpinnerIcon size={32} className="animate-spin text-[var(--accent-color)]" />
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t.noActivity}</p>
                    ) : (
                        <ul className="space-y-3">
                            {logs.map(log => (
                                <li key={log.id} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {log.profiles?.avatar_url ? (
                                            <img src={log.profiles.avatar_url} alt={log.profiles.full_name} className="w-7 h-7 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                                {(log.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                           {formatLogMessage(log)}
                                        </p>
                                        <time className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(log.created_at, language)}</time>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLogModal;