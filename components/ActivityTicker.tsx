import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardListIcon, SpinnerIcon, CheckCircleIcon, XIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Task } from '../types';
import TaskCard from './TaskCard';

interface AnimatedNumberProps {
  value: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value }) => {
  return (
    <span key={value} className="animate-numberFlip inline-block font-semibold">
      {value.toLocaleString()}
    </span>
  );
};

interface TaskPreviewPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    tasks: Task[];
    isLoading: boolean;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
}

const TaskPreviewPopover: React.FC<TaskPreviewPopoverProps> = ({ isOpen, onClose, title, tasks, isLoading, onEditTask, onDeleteTask, onUpdateStatus }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { t } = useSettings();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-start justify-center pt-10" aria-hidden="true" onClick={onClose}>
            <div 
                ref={popoverRef}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-4xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-fadeInDown overflow-hidden flex flex-col max-h-[60vh]"
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label={t.close}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <SpinnerIcon size={32} className="animate-spin text-[var(--accent-color)]" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">{t.noTasksFound}</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {tasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onEdit={onEditTask} 
                                    onDelete={onDeleteTask} 
                                    onUpdateStatus={onUpdateStatus} 
                                    onDragStart={() => {}}
                                    assignee={task.profiles}
                                    creator={task.creator}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ActivityTickerProps {
    session: Session | null;
    dataVersion: number;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
}

const ActivityTicker: React.FC<ActivityTickerProps> = ({ session, dataVersion, onEditTask, onDeleteTask, onUpdateStatus }) => {
  const { t } = useSettings();
  const [taskCounts, setTaskCounts] = useState({ todo: 0, inprogress: 0, done: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const [activePreview, setActivePreview] = useState<Task['status'] | null>(null);
  const [previewTasks, setPreviewTasks] = useState<Task[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fetchTickerData = useCallback(async () => {
    if (!session) {
      setTaskCounts({ todo: 0, inprogress: 0, done: 0 });
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('status', { count: 'exact' })
      .eq('user_id', session.user.id);
      
    if (error) {
      console.error("Error fetching task counts:", error);
    } else {
      const counts = {
        todo: data.filter(task => task.status === 'todo').length,
        inprogress: data.filter(task => task.status === 'inprogress').length,
        done: data.filter(task => task.status === 'done').length,
      };
      setTaskCounts(counts);
    }

    if (isLoading) {
        setIsLoading(false);
    }
  }, [session, isLoading]);
  
  useEffect(() => {
    fetchTickerData();
  }, [fetchTickerData, dataVersion]);

  useEffect(() => {
    if (!activePreview || !session) {
        setPreviewTasks([]);
        return;
    }
    const fetchPreviewTasks = async () => {
        setIsLoadingPreview(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*, profiles!user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
            .eq('user_id', session.user.id)
            .eq('status', activePreview)
            .order('priority', { ascending: false });
        if (error) {
            console.error('Error fetching preview tasks:', error);
            setPreviewTasks([]);
        } else {
            setPreviewTasks(data as Task[]);
        }
        setIsLoadingPreview(false);
    };
    fetchPreviewTasks();
  }, [activePreview, session, dataVersion]);

  const handleStatClick = (status: Task['status']) => {
    setActivePreview(current => (current === status ? null : status));
  };
  
  if (isLoading) {
    return <div className="text-xs animate-pulse">...</div>;
  }
  
  const stats = [
    { label: t.tasksTodo, value: taskCounts.todo, icon: <ClipboardListIcon size={14} className="text-orange-500" />, status: 'todo' as Task['status'] },
    { label: t.tasksInProgress, value: taskCounts.inprogress, icon: <SpinnerIcon size={14} className="text-indigo-500 animate-spin" />, status: 'inprogress' as Task['status'] },
    { label: t.tasksDone, value: taskCounts.done, icon: <CheckCircleIcon size={14} className="text-green-500" />, status: 'done' as Task['status'] },
  ];

  const popoverTitle = activePreview === 'todo' ? t.tasksTodo : activePreview === 'inprogress' ? t.tasksInProgress : t.tasksDone;

  return (
    <>
        <div className="flex flex-wrap justify-center items-center gap-x-3 md:gap-x-4 gap-y-1 text-xs">
          {stats.map(stat => (
             <button 
                key={stat.label} 
                onClick={() => handleStatClick(stat.status)}
                className={`flex items-center gap-x-1.5 p-1 rounded-md transition-colors ${activePreview === stat.status ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                title={stat.label}
             >
                {stat.icon}
                <AnimatedNumber value={stat.value} />
                <span className="hidden lg:inline">{stat.label}</span>
            </button>
          ))}
        </div>
        <TaskPreviewPopover
            isOpen={!!activePreview}
            onClose={() => setActivePreview(null)}
            title={`${popoverTitle} (${previewTasks.length})`}
            tasks={previewTasks}
            isLoading={isLoadingPreview}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onUpdateStatus={onUpdateStatus}
        />
    </>
  );
};

export default ActivityTicker;