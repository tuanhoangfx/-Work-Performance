import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { XIcon, SpinnerIcon, BellIcon } from './Icons';
import type { Notification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTask: (taskId: number) => void;
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


const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onViewTask }) => {
    const { t, language } = useSettings();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchNotifications = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*, profiles!actor_id(*)')
                    .order('created_at', { ascending: false })
                    .limit(20);
                
                if (error) {
                    console.error("Error fetching notifications:", error);
                    setNotifications([]);
                } else {
                    setNotifications(data as Notification[]);
                }
                setLoading(false);
            };
            fetchNotifications();
        }
    }, [isOpen]);

    const formatNotificationMessage = (notification: Notification) => {
        const actorName = notification.profiles?.full_name || 'Someone';
        const taskTitle = notification.data?.task_title || 'a task';

        switch (notification.type) {
            case 'new_task_assigned':
                return t.notifications_new_task(actorName, taskTitle);
            case 'new_comment':
                return t.notifications_new_comment(actorName, taskTitle);
            default:
                return `New activity on task: ${taskTitle}`;
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start md:items-center p-4 pt-16 md:pt-4 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-fadeInUp"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="notifications-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.notifications}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label={t.close}
                    >
                        <XIcon size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-2">
                    {loading ? (
                         <div className="flex justify-center items-center h-40">
                            <SpinnerIcon size={32} className="animate-spin text-[var(--accent-color)]" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10 flex flex-col items-center">
                            <BellIcon size={40} className="mb-4 text-gray-400 dark:text-gray-500" />
                            <p>{t.notifications_empty}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {notifications.map(notification => (
                                <li 
                                    key={notification.id} 
                                    className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 ${!notification.is_read ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                                    onClick={() => onViewTask(notification.data.task_id)}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {notification.profiles?.avatar_url ? (
                                            <img src={notification.profiles.avatar_url} alt={notification.profiles.full_name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                                                {(notification.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug"
                                            dangerouslySetInnerHTML={{ __html: formatNotificationMessage(notification)
                                                .replace(/<strong>/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">')
                                            }}
                                        />
                                        <time className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(notification.created_at, language)}</time>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0 mt-1" title="Unread"></div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsModal;
