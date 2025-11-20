
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XIcon, SpinnerIcon, SettingsIcon } from '@/components/Icons';
import { useSettings } from '@/context/SettingsContext';
import { Task, TaskAttachment, Profile, TaskComment, ProjectMember, Project } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToasts } from '@/context/ToastContext';

import TaskDetailsForm from '@/components/task-modal/TaskDetailsForm';
import AttachmentSection from '@/components/task-modal/AttachmentSection';
import CommentSection, { TempComment } from '@/components/task-modal/CommentSection';
import TaskStatusStepper from '@/components/task-modal/TaskStatusStepper';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>, newFiles: File[], deletedAttachmentIds: number[], newComments: string[]) => Promise<void>;
  task: Task | Partial<Task> | null;
  allUsers: Profile[];
  currentUser: Profile | null;
  userProjects: ProjectMember[];
  onOpenDefaults: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, allUsers, currentUser, userProjects, onOpenDefaults }) => {
  const { t, defaultDueDateOffset, timezone, defaultPriority } = useSettings();
  const { addToast } = useToasts();
  
  // Combined State for Form Data
  const [formData, setFormData] = useState({
      title: '',
      description: '',
      status: 'todo' as Task['status'],
      priority: 'medium' as Task['priority'],
      dueDate: '',
      assigneeId: '',
      projectId: 'personal'
  });

  // State for attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);
  
  // State for comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [tempNewComments, setTempNewComments] = useState<TempComment[]>([]);
  const [optimisticComments, setOptimisticComments] = useState<TempComment[]>([]);
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // Modal/logic state
  const [isSaving, setIsSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null | undefined>(undefined);
  const [validationError, setValidationError] = useState<'title' | 'assignee' | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<Profile[]>(allUsers);

  const modalRef = useRef<HTMLDivElement>(null);
  
  const projectsForSelect = useMemo(() => userProjects.map(p => p.projects).filter((p): p is Project => p !== null), [userProjects]);

  const fetchComments = useCallback(async (taskId: number) => {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*, profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as TaskComment[]);
    }
  }, []);
  
  useEffect(() => {
    if (isOpen) {
        const currentTaskId = task && 'id' in task ? task.id : null;
        if (currentTaskId !== editingTaskId) {
            if (task && 'id' in task) { // Editing existing task
                setFormData({
                    title: task.title || '',
                    description: task.description || '',
                    status: task.status || 'todo',
                    priority: task.priority || 'medium',
                    dueDate: task.due_date ? task.due_date.split('T')[0] : '',
                    assigneeId: task.user_id || '',
                    projectId: task.project_id?.toString() || 'personal'
                });
                setAttachments(task.task_attachments || []);
                fetchComments(task.id);
                setTempNewComments([]);
                setOptimisticComments([]);
            } else { // New task
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + defaultDueDateOffset);
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
                const latestProject = userProjects.length > 0 ? userProjects[0] : null;

                setFormData({
                    title: '',
                    description: '',
                    status: 'todo',
                    priority: defaultPriority,
                    dueDate: formatter.format(targetDate),
                    assigneeId: task?.user_id || currentUser?.id || '',
                    projectId: currentUser?.default_project_id?.toString() || latestProject?.project_id.toString() || 'personal'
                });
                
                setAttachments([]);
                setComments([]);
                setTempNewComments([]);
                setOptimisticComments([]);
            }
            setNewFiles([]);
            setDeletedAttachmentIds([]);
            setEditingTaskId(currentTaskId);
            setValidationError(null);
        }
    } else {
        if (editingTaskId !== undefined) {
             setEditingTaskId(undefined);
        }
    }
  }, [task, isOpen, defaultDueDateOffset, currentUser, fetchComments, editingTaskId, timezone, defaultPriority, userProjects]);
  
   useEffect(() => {
        if (!isOpen || !currentUser) return;

        const updateAssignableUsers = async () => {
            if (formData.projectId === 'personal') {
                const self = allUsers.find(u => u.id === currentUser.id);
                const assignable = self ? [self] : [];
                setAssignableUsers(assignable);
                if (formData.assigneeId !== currentUser.id) {
                    setFormData(prev => ({ ...prev, assigneeId: currentUser.id }));
                }
                return;
            }

            if (currentUser.role === 'admin') {
                setAssignableUsers(allUsers);
                return;
            }

            const { data, error } = await supabase
                .from('project_members')
                .select('profiles!inner(*)')
                .eq('project_id', parseInt(formData.projectId, 10));

            if (error) {
                console.error("Error fetching project members:", error);
                addToast("Could not load project members.", "error");
                setAssignableUsers([]);
            } else {
                const members = data.map(item => item.profiles) as Profile[];
                setAssignableUsers(members);
                
                const isCurrentAssigneeValid = members.some(m => m.id === formData.assigneeId);
                if (!isCurrentAssigneeValid) {
                    const isCurrentUserMember = members.some(m => m.id === currentUser.id);
                    setFormData(prev => ({ ...prev, assigneeId: isCurrentUserMember ? currentUser.id : '' }));
                }
            }
        };

        updateAssignableUsers();
    }, [formData.projectId, allUsers, currentUser, isOpen, addToast, formData.assigneeId]);


  useEffect(() => {
    if (validationError === 'title' && formData.title.trim()) setValidationError(null);
    if (validationError === 'assignee' && formData.assigneeId) setValidationError(null);
  }, [formData.title, formData.assigneeId, validationError]);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.files;
    if (items) {
      const files = Array.from(items);
      if (files.length > 0) setNewFiles(prev => [...prev, ...files]);
    }
  }, []);

  useEffect(() => {
    const currentModalRef = modalRef.current;
    if (isOpen && currentModalRef) {
        currentModalRef.addEventListener('paste', handlePaste as EventListener);
        return () => currentModalRef.removeEventListener('paste', handlePaste as EventListener);
    }
  }, [isOpen, handlePaste]);
  
  const handlePostComment = async (content: string) => {
    if (!content.trim() || !currentUser) return;
    const isNewTask = !task || !('id' in task);
    
    if (isNewTask) {
        setTempNewComments(prev => [...prev, {
            id: `temp-${Date.now()}`,
            content: content,
            profiles: currentUser,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            task_id: 0,
        }]);
    } else {
        setIsPostingComment(true);
        // FIX: Add missing properties `created_at` and `task_id` to satisfy the TempComment interface.
        const tempComment: TempComment = {
            id: `optimistic-${Date.now()}`,
            content: content,
            profiles: currentUser,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            task_id: (task as Task).id,
            isSending: true,
        };
        setOptimisticComments(prev => [...prev, tempComment]);
        
        try {
            const { error } = await supabase.from('task_comments').insert({
                task_id: (task as Task).id,
                user_id: currentUser.id,
                content: content
            });
            if (error) throw error;
            
            // Refetch comments to get the real one from DB
            await fetchComments((task as Task).id);

        } catch (error: any) {
            console.error("Error posting comment:", error.message);
            addToast(`Error posting comment: ${error.message}`, 'error');
            // Remove optimistic comment on failure
            setOptimisticComments(prev => prev.filter(c => c.id !== tempComment.id));
        } finally {
            setIsPostingComment(false);
            // In case of success, the optimistic comment will be replaced by the real one from fetchComments
            // so we always remove it
            setOptimisticComments(prev => prev.filter(c => c.id !== tempComment.id));
        }
    }
  };

  const handleSaveClick = async () => {
    if (!formData.title.trim()) {
      setValidationError('title');
      return;
    }
    if (!formData.assigneeId) {
      setValidationError('assignee');
      return;
    }

    setIsSaving(true);
    
    const taskData: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.dueDate || null,
      user_id: formData.assigneeId,
      project_id: formData.projectId === 'personal' ? null : parseInt(formData.projectId, 10),
    };

    const newCommentContents = tempNewComments.map(c => c.content);

    await onSave(taskData, newFiles, deletedAttachmentIds, newCommentContents);
    setIsSaving(false);
  };
  
  if (!isOpen) return null;

  const combinedComments = [...comments, ...tempNewComments, ...optimisticComments];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl transform transition-all duration-300 ease-out animate-fadeInUp my-auto max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="task-modal-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {editingTaskId ? t.editTask : t.addNewTask}
          </h2>
          <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onOpenDefaults}
                aria-label="Open task default settings"
                title="Task Defaults"
                className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
              <SettingsIcon size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={t.close}
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
            <div className="p-4 md:p-6">
                <TaskStatusStepper currentStatus={formData.status} onStatusChange={(s) => setFormData(prev => ({...prev, status: s}))} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-6">
                <div className="space-y-4">
                     <TaskDetailsForm
                        taskData={formData}
                        onFieldChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                        allUsers={assignableUsers}
                        userProjects={projectsForSelect}
                        validationError={validationError}
                    />
                    <AttachmentSection 
                        attachments={attachments} 
                        newFiles={newFiles}
                        onAddNewFiles={(files) => setNewFiles(prev => [...prev, ...files])}
                        onRemoveNewFile={(index) => setNewFiles(prev => prev.filter((_, i) => i !== index))}
                        onRemoveExistingAttachment={(id) => {
                            setDeletedAttachmentIds(prev => [...prev, id]);
                            setAttachments(prev => prev.filter(att => att.id !== id));
                        }}
                        isSaving={isSaving}
                    />
                </div>
                <div>
                  <CommentSection 
                      comments={combinedComments} 
                      onPostComment={handlePostComment}
                      isPostingComment={isPostingComment}
                  />
                </div>
            </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end items-center space-x-3 rounded-b-2xl flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.cancel}</button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-4 py-2 w-24 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-md shadow-md flex justify-center items-center disabled:opacity-50"
          >
            {isSaving ? <SpinnerIcon size={20} className="animate-spin" /> : t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
