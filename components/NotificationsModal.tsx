import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';
import { XIcon, SpinnerIcon, BellIcon, SearchIcon } from './Icons';
import type { Notification } from '../types';
import { formatAbsoluteDateTime } from '../lib/taskUtils';
import Avatar from './common/Avatar';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewTask: (taskId: number) => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onViewTask, setUnreadCount }) => {
    const { t, language, timezone } = useSettings();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActor, setFilterActor] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread'>('all');

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
    
    useEffect(() => {
        if (isOpen) {
            const fetchNotifications = async () => {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setLoading(false);
                    return;
                }
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*, profiles!actor_id(*)')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(50); // Fetch more for better filtering
                
                if (error) {
                    console.error("Error fetching notifications:", error);
                    setNotifications([]);
                } else {
                    setNotifications(data as Notification[]);
                }
                setLoading(false);
            };
            fetchNotifications();
        } else {
             // Reset state on close
            setSearchTerm('');
            setFilterActor('all');
            setFilterType('all');
            setFilterReadStatus('all');
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

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        setNotifications(current => current.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);

        if (error) {
            console.error("Error marking all as read:", error);
            // Optionally revert UI change on error
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        onViewTask(notification.data.task_id);

        if (!notification.is_read) {
            // Optimistic UI update for instant feedback
            setNotifications(currentNotifications =>
                currentNotifications.map(n =>
                    n.id === notification.id ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(c => Math.max(0, c - 1));

            // Persist the change to the database in the background
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id);
            
            if (error) {
                console.error("Failed to mark notification as read:", error);
                // Revert UI change on error
                 setNotifications(currentNotifications =>
                    currentNotifications.map(n =>
                        n.id === notification.id ? { ...n, is_read: false } : n
                    )
                );
                setUnreadCount(c => c + 1);
            }
        }
    };

    const uniqueActors = useMemo(() => {
        const actors = new Map<string, { id: string, name: string }>();
        notifications.forEach(notif => {
            if (notif.profiles && !actors.has(notif.profiles.id)) {
                actors.set(notif.profiles.id, { id: notif.profiles.id, name: notif.profiles.full_name || 'Unknown' });
            }
        });
        return Array.from(actors.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [notifications]);

    const notificationTypes: { [key: string]: string } = useMemo(() => ({
        new_task_assigned: t.notif_type_new_task,
        new_comment: t.notif_type_new_comment,
    }), [t]);

    const uniqueNotificationTypes = useMemo(() => Array.from(new Set(notifications.map(n => n.type))), [notifications]);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(notification => {
            const actorMatch = filterActor === 'all' || notification.actor_id === filterActor;
            const typeMatch = filterType === 'all' || notification.type === filterType;
            const readStatusMatch = filterReadStatus === 'all' || (filterReadStatus === 'read' ? notification.is_read : !notification.is_read);

            let searchMatch = true;
            if (searchTerm.trim()) {
                const lowerCaseSearch = searchTerm.toLowerCase();
                const message = formatNotificationMessage(notification).toLowerCase();
                searchMatch = message.includes(lowerCaseSearch);
            }
            
            return actorMatch && typeMatch && searchMatch && readStatusMatch;
        });
    }, [notifications, searchTerm, filterActor, filterType, filterReadStatus, formatNotificationMessage]);


    const hasUnread = notifications.some(n => !n.is_read);

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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-fadeInUp"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 id="notifications-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.notifications}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label={t.close}
                    >
                        <XIcon size={24} />
                    </button>
                </div>
                
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="relative sm:col-span-1">
                            <input
                                type="text"
                                placeholder={t.notif_searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon size={16} className="text-gray-400" />
                            </div>
                        </div>
                        <select
                            value={filterActor}
                            onChange={(e) => setFilterActor(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            aria-label={t.notif_filterByActor}
                        >
                            <option value="all">{t.notif_allActors}</option>
                            {uniqueActors.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            aria-label={t.notif_filterByType}
                        >
                            <option value="all">{t.notif_allTypes}</option>
                            {uniqueNotificationTypes.map(type => (
                                <option key={type} value={type}>{notificationTypes[type] || type}</option>
                            ))}
                        </select>
                        <select
                            value={filterReadStatus}
                            onChange={(e) => setFilterReadStatus(e.target.value as 'all' | 'read' | 'unread')}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                            aria-label={t.notif_filterByStatus}
                        >
                            <option value="all">{t.notif_allStatuses}</option>
                            <option value="unread">{t.notif_status_unread}</option>
                            <option value="read">{t.notif_status_read}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-y-auto p-2 flex-grow">
                    {loading ? (
                         <div className="flex justify-center items-center h-40">
                            <SpinnerIcon size={32} className="animate-spin text-[var(--accent-color)]" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10 flex flex-col items-center h-full justify-center">
                            <BellIcon size={40} className="mb-4 text-gray-400 dark:text-gray-500" />
                            <p>{notifications.length === 0 ? t.notifications_empty : "No notifications match your filters."}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredNotifications.map(notification => (
                                <li 
                                    key={notification.id} 
                                    className={`p-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 ${!notification.is_read ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {notification.profiles && <Avatar user={notification.profiles} title={notification.profiles.full_name || ''} size={32} />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug"
                                            dangerouslySetInnerHTML={{ __html: formatNotificationMessage(notification)
                                                .replace(/<strong>/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">')
                                            }}
                                        />
                                        <time className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{formatAbsoluteDateTime(notification.created_at, language, timezone)}</time>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="w-2.5 h-2.5 bg-sky-500 rounded-full flex-shrink-0 mt-1" title="Unread"></div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                 {notifications.length > 0 && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-right flex-shrink-0">
                        <button 
                            onClick={handleMarkAllAsRead} 
                            disabled={!hasUnread}
                            className="text-xs font-semibold text-[var(--accent-color)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.mark_all_as_read}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsModal;