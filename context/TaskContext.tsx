import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';

interface TaskContextType {
    allTasks: Task[];
    isLoading: boolean;
    fetchTasks: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { session } = useSupabaseAuth();
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (!session) {
            setAllTasks([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all tasks:', error);
            setAllTasks([]);
        } else {
            setAllTasks(data as Task[] || []);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchTasks();

        if (!session) {
            return;
        }

        const tasksChannel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
                console.log('Realtime task change received!', payload);
                
                // Refetch individual items to get all relations correctly
                if (payload.eventType === 'INSERT') {
                    const { data: task } = await supabase
                        .from('tasks')
                        .select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
                        .eq('id', payload.new.id)
                        .single();
                    if (task) {
                        setAllTasks(prev => [task as Task, ...prev.filter(t => t.id !== task.id)]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const { data: task } = await supabase
                        .from('tasks')
                        .select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
                        .eq('id', payload.new.id)
                        .single();
                    if (task) {
                        setAllTasks(prev => prev.map(t => t.id === task.id ? task as Task : t));
                    }
                } else if (payload.eventType === 'DELETE') {
                    setAllTasks(prev => prev.filter(t => t.id !== (payload.old as any).id));
                }
            })
            .subscribe();

        const attachmentsChannel = supabase.channel('public:task_attachments')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'task_attachments' },
          (payload) => {
              console.log('Realtime attachment change received, refetching tasks!', payload);
              fetchTasks();
          }
        ).subscribe();
        
        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(attachmentsChannel);
        };
    }, [session, fetchTasks]);


    return (
        <TaskContext.Provider value={{ allTasks, isLoading, fetchTasks }}>
            {children}
        </TaskContext.Provider>
    );
};
