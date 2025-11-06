import { useState, useCallback } from 'react';
import type { Task } from '../types';

export interface ActionModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    confirmButtonClass?: string;
}

export const useModalManager = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | Partial<Task> | null>(null);
    
    const [actionModal, setActionModal] = useState<ActionModalState>({
        isOpen: false,
        title: '',
        message: '',
    });

    const handleOpenTaskModal = useCallback((task: Task | Partial<Task> | null = null) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    }, []);

    const handleCloseTaskModal = useCallback(() => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
    }, []);

    return {
        modals: {
            auth: { isOpen: isAuthModalOpen, open: () => setIsAuthModalOpen(true), close: () => setIsAuthModalOpen(false) },
            account: { isOpen: isAccountModalOpen, open: () => setIsAccountModalOpen(true), close: () => setIsAccountModalOpen(false) },
            userGuide: { isOpen: isUserGuideOpen, open: () => setIsUserGuideOpen(true), close: () => setIsUserGuideOpen(false) },
            activityLog: { isOpen: isActivityLogOpen, open: () => setIsActivityLogOpen(true), close: () => setIsActivityLogOpen(false) },
            notifications: { isOpen: isNotificationsOpen, open: () => setIsNotificationsOpen(true), close: () => setIsNotificationsOpen(false) },
            task: { 
                isOpen: isTaskModalOpen, 
                open: handleOpenTaskModal, 
                close: handleCloseTaskModal, 
                editingTask 
            },
            action: {
                ...actionModal,
                open: (config: Omit<ActionModalState, 'isOpen'>) => setActionModal({ ...config, isOpen: true }),
                close: () => setActionModal(prev => ({ ...prev, isOpen: false })),
                setState: setActionModal,
            }
        }
    };
};
