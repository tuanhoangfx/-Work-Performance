

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XIcon, SpinnerIcon, SettingsIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';
import { Task, TaskAttachment, Profile, TaskComment, ProjectMember, Project } from '../types';
import { supabase } from '../lib/supabase';
import { useToasts } from '../context/ToastContext';

import TaskDetailsForm from './task-modal/TaskDetailsForm';
import AttachmentSection from './task-modal/AttachmentSection';
import CommentSection, { TempComment } from './task-modal/CommentSection';
import TaskStatusStepper from './task-modal/TaskStatusStepper';

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
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('personal');

  // State for attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
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
  
  const projectsForSelect = useMemo(() => userProjects.map(p => p.projects), [userProjects]);

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
                setTitle(task.title || '');
                setDescription(task.description || '');
                setStatus(task.status || 'todo');
                setPriority(task.priority || 'medium');
                setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
                setAttachments(task.task_attachments || []);
                setAssigneeId(task.user_id || '');
                setProjectId(task.project_id?.toString() || 'personal');
                fetchComments(task.id);
                setTempNewComments([]);
                setOptimisticComments([]);
            } else { // New task
                setTitle('');
                setDescription('');
                setStatus('todo');
                setPriority(defaultPriority);
                
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + defaultDueDateOffset);
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
                setDueDate(formatter.format(targetDate));
                
                setAttachments([]);
                setComments([]);
                setTempNewComments([]);
                setOptimisticComments([]);
                setAssigneeId(task?.user_id || currentUser?.id || '');
                const latestProject = userProjects.length > 0 ? userProjects[0] : null;
                setProjectId(
                    currentUser?.default_project_id?.toString() ||
                    latestProject?.project_id.toString() ||
                    'personal'
                );
            }
            setNewFiles([]);
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
            if (projectId === 'personal') {
                const self = allUsers.find(u => u.id === currentUser.id);
                const assignable = self ? [self] : [];
                setAssignableUsers(assignable);
                if (assigneeId !== currentUser.id) {
                    setAssigneeId(currentUser.id);
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
                .eq('project_id', parseInt(projectId, 10));

            if (error) {
                console.error("Error fetching project members:", error);
                addToast("Could not load project members.", "error");
                setAssignableUsers([]);
            } else {
                const members = data.map(item => item.profiles) as Profile[];
                setAssignableUsers(members);
                
                const isCurrentAssigneeValid = members.some(m => m.id === assigneeId);
                if (!isCurrentAssigneeValid) {
                    const isCurrentUserMember = members.some(m => m.id === currentUser.id);
                    setAssigneeId(isCurrentUserMember ? currentUser.id : '');
                }
            }
        };

        updateAssignableUsers();
    }, [projectId, allUsers, currentUser, isOpen, addToast]);


  useEffect(() => {
    if (validationError === 'title' && title.trim()) setValidationError(null);
    if (validationError === 'assignee' && assigneeId) setValidationError(null);
  }, [title, assigneeId, validationError]);

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
        const tempComment: TempComment = {
            id: `optimistic-${Date.now()}`,
            content: content,
            profiles: currentUser,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            task_id: task.id,
            isSending: true,
        };
        setOptimisticComments(prev => [...prev, tempComment]);
        
        const { error } = await supabase.from('task_comments').insert({ task_id: task.id, user_id: currentUser.id, content });
        
        await fetchComments(task.id);
        setOptimisticComments([]);

        if (error) {
          console.error('Error posting comment:', error);
          addToast(error.message, 'error');
        }
        setIsPostingComment(false);
    }
  };
  
  const combinedComments = useMemo(() => [...comments, ...tempNewComments, ...optimisticComments], [comments, tempNewComments, optimisticComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setValidationError('title'); return; }
    if (!assigneeId) { setValidationError('assignee'); return; }

    setIsSaving(true);
    const originalAttachmentIds = (task && 'task_attachments' in task) ? task.task_attachments?.map(att => att.id) || [] : [];
    const remainingAttachmentIds = attachments.map(att => att.id);
    const deletedAttachmentIds = originalAttachmentIds.filter(id => !remainingAttachmentIds.includes(id));
    
    await onSave({ title, description, status, priority, due_date: dueDate || null, user_id: assigneeId, project_id: projectId === 'personal' ? null : parseInt(projectId, 10) }, 
      newFiles, deletedAttachmentIds, tempNewComments.map(c => c.content));

    setIsSaving(false);
  };
  
  const handleFieldChange = (field: keyof(typeof taskData), value: string | Task['status'] | Task['priority']) => {
      const setters: Record<string, Function> = {
          title: setTitle,
          description: setDescription,
          status: setStatus,
          priority: setPriority,
          dueDate: setDueDate,
          assigneeId: setAssigneeId,
          projectId: setProjectId,
      };
      setters[field]?.(value);
  }

  const taskData = { title, description, status, priority, dueDate, assigneeId, projectId };
  const formTaskData = { title, description, priority, dueDate, assigneeId, projectId };


  if (!isOpen) return null;

  return (
    <>
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] overflow-y-auto p-2 sm:p-4 flex justify-center animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-label={task && 'id' in task ? t.editTask : t.addNewTask}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-5xl transform transition-all duration-300 ease-out animate-fadeInUp flex flex-col my-auto md:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex justify-end items-center px-3 py-2 sm:p-4 flex-shrink-0 gap-2">
                <button 
                    type="button"
                    onClick={onOpenDefaults}
                    className="p-1.5 rounded-full text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                    aria-label="Task Defaults"
                    title="Task Defaults"
                >
                    <SettingsIcon size={22} />
                </button>
                <button 
                    type="button"
                    onClick={onClose} 
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors z-10"
                    aria-label={t.close}
                >
                    <XIcon size={24} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="px-3 pt-0 sm:px-6 sm:pt-0">
                <TaskStatusStepper 
                    currentStatus={status} 
                    onStatusChange={(newStatus) => handleFieldChange('status', newStatus)}
                />
              </div>

              <div className="px-3 py-2 sm:px-6 sm:py-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 md:gap-y-0">
                <div className="space-y-3">
                  <TaskDetailsForm
                    taskData={formTaskData}
                    onFieldChange={handleFieldChange}
                    allUsers={assignableUsers}
                    userProjects={projectsForSelect}
                    validationError={validationError}
                  />
                  <AttachmentSection
                    attachments={attachments}
                    newFiles={newFiles}
                    onAddNewFiles={(files) => setNewFiles(prev => [...prev, ...files])}
                    onRemoveNewFile={(index) => setNewFiles(prev => prev.filter((_, i) => i !== index))}
                    onRemoveExistingAttachment={(id) => setAttachments(prev => prev.filter(att => att.id !== id))}
                    isSaving={isSaving}
                  />
                </div>
                <div className="flex flex-col mt-3 md:mt-0">
                  <CommentSection
                    comments={combinedComments}
                    isPostingComment={isPostingComment}
                    onPostComment={handlePostComment}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 sm:px-6 sm:py-3 flex justify-end items-center space-x-3 rounded-b-2xl flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.cancel}</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 w-24 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-md shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none disabled:opacity-50 flex justify-center items-center">
                    {isSaving ? <SpinnerIcon className="animate-spin" size={20} /> : t.save}
                </button>
            </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default TaskModal;