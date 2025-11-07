
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XIcon, SpinnerIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';
import { Task, TaskAttachment, Profile, TaskComment } from '../types';
import { supabase } from '../lib/supabase';

import TaskDetailsForm from './task-modal/TaskDetailsForm';
import AttachmentSection from './task-modal/AttachmentSection';
import CommentSection, { TempComment } from './task-modal/CommentSection';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>, newFiles: File[], deletedAttachmentIds: number[], newComments: string[]) => Promise<void>;
  task: Task | Partial<Task> | null;
  allUsers: Profile[];
  currentUser: Profile | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, allUsers, currentUser }) => {
  const { t, defaultDueDateOffset, timezone } = useSettings();
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  // State for attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  // State for comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [tempNewComments, setTempNewComments] = useState<TempComment[]>([]);
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // Modal/logic state
  const [isSaving, setIsSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null | undefined>(undefined);
  const [validationError, setValidationError] = useState<'title' | 'assignee' | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

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
                fetchComments(task.id);
                setTempNewComments([]);
            } else { // New task
                setTitle('');
                setDescription('');
                setStatus('todo');
                setPriority('medium');
                
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + defaultDueDateOffset);
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
                setDueDate(formatter.format(targetDate));
                
                setAttachments([]);
                setComments([]);
                setTempNewComments([]);
                setAssigneeId(task?.user_id || currentUser?.id || '');
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
  }, [task, isOpen, defaultDueDateOffset, currentUser, fetchComments, editingTaskId, timezone]);

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
        const { error } = await supabase.from('task_comments').insert({ task_id: task.id, user_id: currentUser.id, content });
        if (error) {
          console.error('Error posting comment:', error);
          alert(error.message);
        } else {
          fetchComments(task.id); // Refresh comments
        }
        setIsPostingComment(false);
    }
  };
  
  const combinedComments = useMemo(() => [...comments, ...tempNewComments], [comments, tempNewComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setValidationError('title'); return; }
    if (!assigneeId) { setValidationError('assignee'); return; }

    setIsSaving(true);
    const originalAttachmentIds = (task && 'task_attachments' in task) ? task.task_attachments?.map(att => att.id) || [] : [];
    const remainingAttachmentIds = attachments.map(att => att.id);
    const deletedAttachmentIds = originalAttachmentIds.filter(id => !remainingAttachmentIds.includes(id));
    
    await onSave({ title, description, status, priority, due_date: dueDate || null, user_id: assigneeId }, 
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
          assigneeId: setAssigneeId
      };
      setters[field]?.(value);
  }

  const taskData = { title, description, status, priority, dueDate, assigneeId };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 flex justify-center animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-label={task && 'id' in task ? t.editTask : t.addNewTask}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm md:max-w-4xl transform transition-all duration-300 ease-out animate-fadeInUp flex flex-col my-auto md:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-3 sm:p-6 pb-0 relative flex-shrink-0">
                <button 
                    type="button"
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
                    aria-label={t.close}
                >
                    <XIcon size={24} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="p-3 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 md:gap-y-0">
                <div className="space-y-4">
                  <TaskDetailsForm
                    taskData={taskData}
                    onFieldChange={handleFieldChange}
                    allUsers={allUsers}
                    validationError={validationError}
                  />
                  <AttachmentSection
                    attachments={attachments}
                    newFiles={newFiles}
                    onAddNewFiles={(files) => setNewFiles(prev => [...prev, ...files])}
                    onRemoveNewFile={(index) => setNewFiles(prev => prev.filter((_, i) => i !== index))}
                    onRemoveExistingAttachment={(id) => setAttachments(prev => prev.filter(att => att.id !== id))}
                  />
                </div>
                <div className="flex flex-col mt-4 md:mt-0">
                  <CommentSection
                    comments={combinedComments}
                    isPostingComment={isPostingComment}
                    onPostComment={handlePostComment}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6 flex justify-end items-center space-x-3 rounded-b-2xl flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.cancel}</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 w-24 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-md shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none disabled:opacity-50 flex justify-center items-center">
                    {isSaving ? <SpinnerIcon className="animate-spin" size={20} /> : t.save}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;