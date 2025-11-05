import React from 'react';
import SessionInfo from './SessionInfo';
import ActivityTicker from './ActivityTicker';
import type { Session } from '@supabase/supabase-js';
import { PlusIcon, HistoryIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';
import { Profile, Task } from '../types';

interface TopBarProps {
    session: Session | null;
    dataVersion: number;
    onAddNewTask: () => void;
    profile: Profile | null;
    isAdminView: boolean;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onOpenActivityLog: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ session, dataVersion, onAddNewTask, profile, isAdminView, onEditTask, onDeleteTask, onUpdateStatus, onOpenActivityLog }) => {
    const { t } = useSettings();
    const canAddTask = session && !(profile?.role === 'admin' && isAdminView);

    return (
        <div className="relative bg-slate-100 dark:bg-black/20 text-gray-600 dark:text-gray-400 animate-fadeInDown border-b border-black/5 dark:border-white/5">
            <div className="container mx-auto px-4 h-10 flex items-center justify-between gap-4">
                
                {/* Left Side */}
                <div className="hidden md:flex flex-1 justify-start">
                    <SessionInfo />
                </div>
                
                {/* Center Ticker */}
                <div className="flex-1 flex justify-center">
                     <ActivityTicker 
                        session={session} 
                        dataVersion={dataVersion}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onUpdateStatus={onUpdateStatus}
                    />
                </div>

                {/* Right Side */}
                <div className="flex-1 flex justify-end items-center gap-2">
                   {canAddTask && (
                     <button
                        onClick={onAddNewTask}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md focus:outline-none"
                    >
                        <PlusIcon size={14}/>
                        <span className="hidden sm:inline">{t.addNewTask}</span>
                    </button>
                   )}
                   {session && (
                     <button
                        onClick={onOpenActivityLog}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title={t.activityLog}
                    >
                        <HistoryIcon size={18} />
                    </button>
                   )}
                </div>

            </div>
        </div>
    );
};

export default TopBar;