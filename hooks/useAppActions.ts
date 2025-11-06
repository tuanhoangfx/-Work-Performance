import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Task, TimeLog } from '../types';
import type { DataChange } from '../App';

interface ActionModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  confirmButtonClass?: string;
}

type SetActionModal = Dispatch<SetStateAction<ActionModalState>>;

interface UseAppActionsProps {
    session: Session | null;
    setActionModal: SetActionModal;
    notifyDataChange: (change: Omit<DataChange, 'timestamp'>) => void;
    t: any; // Translation object
}

export const useAppActions = ({ session, setActionModal, notifyDataChange, t }: UseAppActionsProps) => {
    const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null);

    const logActivity = useCallback(async (action: string, details: Record<string, any>) => {
        if (!session?.user?.id) return;
        const { error } = await supabase.from('activity_logs').insert({
            user_id: session.user.id,
            action,
            details,
            task_id: details.task_id,
        });
        if (error) {
            console.error('Error logging activity:', error);
        }
    }, [session]);

    const handleSaveTask = async (
        taskData: Partial<Task>, 
        editingTask: Task | Partial<Task> | null, 
        newFiles: File[], 
        deletedAttachmentIds: number[], 
        newComments: string[]
    ): Promise<boolean> => {
        if (!session?.user) return false;

        const userId = taskData.user_id;
        if (!userId) {
            console.error('Assignee is required.');
            return false;
        }
        
        const isNewTask = !editingTask || !('id' in editingTask) || !editingTask.id;
        const dataToSave = { 
            ...taskData,
            ...(isNewTask && { created_by: session.user.id })
        };

        try {
            const { data: savedTask, error: saveError } = isNewTask
                ? await supabase.from('tasks').insert(dataToSave).select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').single()
                : await supabase.from('tasks').update(dataToSave).eq('id', editingTask!.id).select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').single();

            if (saveError) throw saveError;
            if (!savedTask) throw new Error("Task could not be saved.");

            const taskId = savedTask.id;
            const taskTitle = savedTask.title;
            
            if (isNewTask && newComments.length > 0) {
                const commentRecords = newComments.map(content => ({
                    task_id: taskId,
                    user_id: session.user.id,
                    content: content,
                }));
                const { error: insertCommentsError } = await supabase.from('task_comments').insert(commentRecords);
                if (insertCommentsError) console.error("Error saving comments for new task:", insertCommentsError);
            }

            await logActivity(isNewTask ? 'created_task' : 'updated_task', { task_id: taskId, task_title: taskTitle });

            if (deletedAttachmentIds.length > 0) {
                const { data: attachmentsToDelete, error: fetchErr } = await supabase
                    .from('task_attachments').select('file_path').in('id', deletedAttachmentIds);

                if (fetchErr) console.error("Error fetching attachments to delete:", fetchErr);
                else if (attachmentsToDelete && attachmentsToDelete.length > 0) {
                    const paths = attachmentsToDelete.map(a => a.file_path);
                    await supabase.storage.from('task-attachments').remove(paths);
                }
                
                const { error: deleteDbError } = await supabase.from('task_attachments').delete().in('id', deletedAttachmentIds);
                if (deleteDbError) throw deleteDbError;
                
                await logActivity('removed_attachments', { task_id: taskId, task_title: taskTitle, count: deletedAttachmentIds.length });
            }

            if (newFiles.length > 0) {
                const uploadPromises = newFiles.map(file => {
                    const filePath = `${userId}/${taskId}/${crypto.randomUUID()}-${file.name}`;
                    return supabase.storage.from('task-attachments').upload(filePath, file);
                });
                const uploadResults = await Promise.all(uploadPromises);

                const newAttachmentRecords = uploadResults
                    .map((result, i) => {
                        if (result.error) {
                            console.error('Upload Error:', result.error.message);
                            return null;
                        }
                        return {
                            task_id: taskId, user_id: userId, file_name: newFiles[i].name,
                            file_path: result.data.path, file_type: newFiles[i].type, file_size: newFiles[i].size,
                        };
                    })
                    .filter(Boolean);

                if (newAttachmentRecords.length > 0) {
                    const { error } = await supabase.from('task_attachments').insert(newAttachmentRecords as any);
                    if (error) throw error;
                    await logActivity('added_attachments', { task_id: taskId, task_title: taskTitle, count: newFiles.length });
                }
            }
            
            const { data: finalTask, error: finalError } = await supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').eq('id', taskId).single();
            if (finalError) throw finalError;
            
            notifyDataChange({ type: isNewTask ? 'add' : 'update', payload: finalTask });
            console.log(isNewTask ? "Task created successfully." : "Task updated successfully.");
            return true;
        } catch (error: any) {
            console.error("Error in save task process:", error.message);
            return false;
        }
    };

    const executeDeleteTask = useCallback(async (task: Task) => {
        try {
            await logActivity('deleted_task', { task_id: task.id, task_title: task.title });

            if (task.task_attachments && task.task_attachments.length > 0) {
                const filePaths = task.task_attachments.map(att => att.file_path);
                const { error: storageError } = await supabase.storage.from('task-attachments').remove(filePaths);
                if (storageError) console.error("Error deleting storage files:", storageError.message);
            }
            
            const { data, error } = await supabase.from('tasks').delete().eq('id', task.id).select();
            if (error) throw error;
            
            if (!data || data.length === 0) {
                console.error('Could not delete task. You may not have permission.');
                return;
            }

            if (activeTimer?.task_id === task.id) setActiveTimer(null);
            notifyDataChange({ type: 'delete', payload: { id: task.id } });
            console.log('Task deleted successfully.');
        } catch (error: any) {
            console.error("Error deleting task:", error.message);
        }
    }, [logActivity, activeTimer, notifyDataChange]);

    const handleDeleteTask = useCallback((task: Task) => {
        setActionModal({
            isOpen: true,
            title: t.confirmDeleteTask,
            message: t.deleteTaskConfirmationMessage(task.title),
            onConfirm: () => executeDeleteTask(task),
            confirmText: t.deleteTask,
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        });
    }, [setActionModal, executeDeleteTask, t]);

    const executeClearCancelledTasks = useCallback(async (tasksToClear: Task[]) => {
        try {
            const taskIds = tasksToClear.map(t => t.id);
            await logActivity('cleared_cancelled_tasks', { count: tasksToClear.length });

            const allAttachments = tasksToClear.flatMap(t => t.task_attachments || []);
            if (allAttachments.length > 0) {
                const filePaths = allAttachments.map(att => att.file_path);
                await supabase.storage.from('task-attachments').remove(filePaths);
            }

            const { error } = await supabase.from('tasks').delete().in('id', taskIds);
            if (error) throw error;

            if (activeTimer && taskIds.includes(activeTimer.task_id)) setActiveTimer(null);
            notifyDataChange({ type: 'delete_many', payload: { ids: taskIds } });
            console.log("Cancelled tasks cleared.");
        } catch (error: any) {
            console.error("Error clearing cancelled tasks:", error.message);
        }
    }, [logActivity, activeTimer, notifyDataChange]);

    const handleClearCancelledTasks = useCallback((tasksToClear: Task[]) => {
        if (tasksToClear.length === 0) return;
        setActionModal({
            isOpen: true,
            title: t.clearCancelledTasksTitle,
            message: t.clearCancelledTasksConfirmation(tasksToClear.length),
            onConfirm: () => executeClearCancelledTasks(tasksToClear),
            confirmText: t.deleteTask,
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        });
    }, [setActionModal, executeClearCancelledTasks, t]);
    
    const handleUpdateStatus = useCallback(async (task: Task, status: Task['status']) => {
        const { data, error } = await supabase.from('tasks').update({ status }).eq('id', task.id).select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').single();
        if (error) {
            console.error("Error updating task status:", error.message);
        } else {
            await logActivity('status_changed', { task_id: task.id, task_title: task.title, from: task.status, to: status });
            notifyDataChange({ type: 'update', payload: data });
            console.log('Task status updated.');
        }
    }, [logActivity, notifyDataChange]);

    const handleStartTimer = useCallback(async (task: Task) => {
        if (!session || activeTimer) return;
        try {
            const { data, error } = await supabase
                .from('task_time_logs').insert({
                    task_id: task.id, user_id: session.user.id,
                    start_time: new Date().toISOString()
                }).select().single();
            if (error) throw error;
            setActiveTimer(data);
            notifyDataChange({ type: 'batch_update', payload: null }); // generic update
        } catch (error: any) {
            console.error(error.message);
        }
    }, [session, activeTimer, notifyDataChange]);

    const handleStopTimer = useCallback(async (timeLog: TimeLog) => {
        if (!activeTimer || activeTimer.id !== timeLog.id) return;
        try {
            const { error } = await supabase
                .from('task_time_logs').update({ end_time: new Date().toISOString() }).eq('id', timeLog.id);
            if (error) throw error;
            setActiveTimer(null);
            notifyDataChange({ type: 'batch_update', payload: null }); // generic update
        } catch (error: any)
 {
            console.error(error.message);
        }
    }, [activeTimer, notifyDataChange]);
    
    return {
        activeTimer,
        logActivity,
        taskActions: {
            handleSaveTask,
            handleDeleteTask,
            handleClearCancelledTasks,
            handleUpdateStatus,
        },
        timerActions: {
            handleStartTimer,
            handleStopTimer,
        },
    };
};
