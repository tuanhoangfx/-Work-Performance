import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Task, TimeLog } from '../types';
import { useToasts } from '../context/ToastContext';
import { useTasks } from '../context/TaskContext';

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
    t: any; // Translation object
}

export const useAppActions = ({ session, setActionModal, t }: UseAppActionsProps) => {
    const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null);
    const { addToast } = useToasts();
    const { fetchTasks } = useTasks();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

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
                ? await supabase.from('tasks').insert(dataToSave).select('id, title').single()
                : await supabase.from('tasks').update(dataToSave).eq('id', editingTask!.id).select('id, title').single();

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
                    const filePath = `${session.user.id}/${taskId}/${crypto.randomUUID()}-${file.name}`;
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
                            task_id: taskId, user_id: session.user.id, file_name: newFiles[i].name,
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
            
            // No longer need to notifyDataChange, the realtime subscription will handle it.
            addToast(isNewTask ? "Task created successfully." : "Task updated successfully.", 'success');
            return true;
        } catch (error: any) {
            console.error("Error in save task process:", error.message);
            addToast(`Error saving task: ${error.message}`, 'error');
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
                addToast('Could not delete task. You may not have permission.', 'error');
                return;
            }

            if (activeTimer?.task_id === task.id) setActiveTimer(null);
            // No longer need to notifyDataChange
            addToast('Task deleted successfully.', 'success');
        } catch (error: any) {
            console.error("Error deleting task:", error.message);
            addToast(`Error: ${error.message}`, 'error');
        }
    }, [logActivity, activeTimer, addToast]);

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
            // No longer need to notifyDataChange
            addToast("Cancelled tasks cleared.", 'success');
        } catch (error: any) {
            console.error("Error clearing cancelled tasks:", error.message);
            addToast(`Error: ${error.message}`, 'error');
        }
    }, [logActivity, activeTimer, addToast]);

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
    
    const handleUpdateStatus = useCallback(async (task: Task, status: Task['status']): Promise<boolean> => {
        const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id);
        if (error) {
            console.error("Error updating task status:", error.message);
            addToast('Failed to update task status.', 'error');
            return false;
        } else {
            await logActivity('status_changed', { task_id: task.id, task_title: task.title, from: task.status, to: status });
            // No longer need to notifyDataChange
            return true;
        }
    }, [logActivity, addToast]);

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
            fetchTasks(); // generic update
        } catch (error: any) {
            console.error(error.message);
            addToast(`Error starting timer: ${error.message}`, 'error');
        }
    }, [session, activeTimer, addToast, fetchTasks]);

    const handleStopTimer = useCallback(async (timeLog: TimeLog) => {
        if (!activeTimer || activeTimer.id !== timeLog.id) return;
        try {
            const { error } = await supabase
                .from('task_time_logs').update({ end_time: new Date().toISOString() }).eq('id', timeLog.id);
            if (error) throw error;
            setActiveTimer(null);
            fetchTasks(); // generic update
        } catch (error: any)
 {
            console.error(error.message);
            addToast(`Error stopping timer: ${error.message}`, 'error');
        }
    }, [activeTimer, addToast, fetchTasks]);
    
    return {
        activeTimer,
        logActivity,
        taskActions: {
            handleSaveTask,
            handleDeleteTask,
            handleClearCancelledTasks,
            handleUpdateStatus,
            handleSignOut
        },
        timerActions: {
            handleStartTimer,
            handleStopTimer,
        },
    };
};
