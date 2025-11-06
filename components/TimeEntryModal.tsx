import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, SpinnerIcon, PaperclipIcon, DocumentTextIcon, TrashIcon, DownloadIcon, SendIcon, CalendarIcon, ClipboardListIcon, CheckCircleIcon, XCircleIcon, ChevronDownIcon, ChevronUpIcon, MinusIcon } from './Icons';
import { useSettings } from '../context/SettingsContext';
import { Task, TaskAttachment, Profile, TaskComment } from '../types';
import { supabase } from '../lib/supabase';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>, newFiles: File[], deletedAttachmentIds: number[]) => Promise<void>;
  task: Task | Partial<Task> | null;
  allUsers: Profile[];
  currentUser: Profile | null;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const timeAgo = (dateString: string, lang: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
};


const AttachmentItem: React.FC<{
    file: { name: string; type?: string; size: number; id?: number, file_path?: string, file_type?: string, dataUrl?: string };
    onRemove: () => void;
    onPreview: () => void;
    isNew: boolean;
}> = ({ file, onRemove, onPreview, isNew }) => {
    
    const handleDownload = async () => {
        if (isNew || !file.file_path) return;
        try {
            const { data, error } = await supabase.storage.from('task-attachments').download(file.file_path);
            if (error) throw error;
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Error downloading file:', error.message);
            alert('Could not download file.');
        }
    };

    const isPreviewable = file.file_type?.startsWith('image/') || file.file_type?.startsWith('video/');

    return (
        <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
                {isPreviewable ? (
                     <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0 cursor-pointer" onClick={onPreview}>
                        {file.file_type?.startsWith('image/') && <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover rounded" />}
                        {file.file_type?.startsWith('video/') && <video src={file.dataUrl} className="w-full h-full object-cover rounded" />}
                    </div>
                ) : (
                     <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0 flex items-center justify-center">
                        <DocumentTextIcon size={24} className="text-gray-500 dark:text-gray-400" />
                    </div>
                )}
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(file.size)}</span>
                </div>
            </div>
            <div className="flex items-center flex-shrink-0">
                {!isNew && (
                     <button type="button" onClick={handleDownload} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" title="Download">
                        <DownloadIcon size={16} />
                    </button>
                )}
                <button type="button" onClick={onRemove} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors" title="Remove">
                    <TrashIcon size={16} />
                </button>
            </div>
        </div>
    );
};


const AttachmentPreviewModal: React.FC<{ attachment: any; onClose: () => void }> = ({ attachment, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                 <button onClick={onClose} className="absolute -top-8 -right-2 text-white hover:text-gray-300" aria-label="Close preview"><XIcon size={28}/></button>
                 {attachment.file_type.startsWith('image/') && <img src={attachment.dataUrl} alt={attachment.name} className="max-w-full max-h-[90vh] object-contain rounded-lg" />}
                 {attachment.file_type.startsWith('video/') && <video src={attachment.dataUrl} controls autoPlay className="max-w-full max-h-[90vh] object-contain rounded-lg" />}
            </div>
        </div>
    )
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, allUsers, currentUser }) => {
  const { t, language, defaultDueDateOffset } = useSettings();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [assigneeId, setAssigneeId] = useState('');
  
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null | undefined>(undefined);


  const fileInputRef = useRef<HTMLInputElement>(null);
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
        // Only reset the form state if the task prop has changed.
        // This prevents wiping user input on re-renders while the modal is open.
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
            } else { // New task
                setTitle('');
                setDescription('');
                setStatus('todo');
                setPriority('medium');
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + defaultDueDateOffset);
                setDueDate(defaultDate.toISOString().split('T')[0]);
                setAttachments([]);
                setComments([]);
                setAssigneeId(task?.user_id || currentUser?.id || '');
            }
            setNewFiles([]);
            setNewComment('');
            setEditingTaskId(currentTaskId);
        }
    } else {
        // When the modal closes, reset the tracked ID so it re-initializes next time it opens.
        if (editingTaskId !== undefined) {
             setEditingTaskId(undefined);
        }
    }
  }, [task, isOpen, defaultDueDateOffset, currentUser, fetchComments, editingTaskId]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.files;
    if (items) {
      const files = Array.from(items);
      if (files.length > 0) {
        setNewFiles(prev => [...prev, ...files]);
      }
    }
  }, []);

  useEffect(() => {
    const currentModalRef = modalRef.current;
    if (isOpen && currentModalRef) {
        currentModalRef.addEventListener('paste', handlePaste as EventListener);
        return () => {
            currentModalRef.removeEventListener('paste', handlePaste as EventListener);
        };
    }
  }, [isOpen, handlePaste]);
  
  const handleRemoveNewFile = (index: number) => {
      setNewFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemoveExistingAttachment = (id: number) => {
      setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const getPublicUrl = (filePath: string) => {
      const { data } = supabase.storage.from('task-attachments').getPublicUrl(filePath);
      return data.publicUrl;
  }

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser || !task || !('id' in task)) return;

    setIsPostingComment(true);
    const { error } = await supabase.from('task_comments').insert({
      task_id: task.id,
      user_id: currentUser.id,
      content: newComment,
    });
    
    if (error) {
      console.error('Error posting comment:', error);
      alert(error.message);
    } else {
      setNewComment('');
      fetchComments(task.id); // Refresh comments
    }
    setIsPostingComment(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
        alert("Title is required.");
        return;
    }
    if (!assigneeId) {
        alert("Assignee is required.");
        return;
    }
    setIsSaving(true);
    const originalAttachmentIds = (task && 'task_attachments' in task) ? task.task_attachments?.map(att => att.id) || [] : [];
    const remainingAttachmentIds = attachments.map(att => att.id);
    const deletedAttachmentIds = originalAttachmentIds.filter(id => !remainingAttachmentIds.includes(id));
    
    await onSave({
      title,
      description,
      status,
      priority,
      due_date: dueDate || null,
      user_id: assigneeId,
    }, newFiles, deletedAttachmentIds);

    setIsSaving(false);
  };

  const statusConfig: { [key in Task['status']]: { label: string; icon: React.FC<any>; color: string; iconClass?: string } } = {
    todo: { label: t.todo, icon: ClipboardListIcon, color: 'text-orange-600 dark:text-orange-400' },
    inprogress: { label: t.inprogress, icon: SpinnerIcon, iconClass: 'animate-spin', color: 'text-indigo-600 dark:text-indigo-400' },
    done: { label: t.done, icon: CheckCircleIcon, color: 'text-green-600 dark:text-green-400' },
    cancelled: { label: t.cancelled, icon: XCircleIcon, color: 'text-gray-500 dark:text-gray-400' },
  };

  const priorityConfig: { [key in Task['priority']]: { label: string; icon: string | React.FC<any>; color: string } } = {
    low: { label: t.low, icon: '💤', color: 'text-green-600 dark:text-green-400' },
    medium: { label: t.medium, icon: '⚡', color: 'text-yellow-600 dark:text-yellow-400' },
    high: { label: t.high, icon: '🚨', color: 'text-red-600 dark:text-red-400' },
  };

  const CustomSelect = ({ value, options, onChange }: { value: string; options: any; onChange: (value: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options[value];
    const Icon = selectedOption.icon;

    return (
        <div className="relative mt-1" ref={ref}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left">
                <div className="flex items-center gap-2">
                    {typeof Icon === 'string'
                        ? <span className="text-base">{Icon}</span>
                        : <Icon size={16} className={`${selectedOption.color} ${selectedOption.iconClass || ''}`} />}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedOption.label}</span>
                </div>
                <ChevronDownIcon size={16} className="text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg border dark:border-gray-600 animate-fadeIn">
                    {Object.entries(options).map(([key, option]: [string, any]) => {
                        const ItemIcon = option.icon;
                        return (
                            <button key={key} type="button" onClick={() => { onChange(key); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-md last:rounded-b-md">
                                {typeof ItemIcon === 'string'
                                    ? <span className="text-base">{ItemIcon}</span>
                                    : <ItemIcon size={16} className={`${option.color} ${option.iconClass || ''}`} />}
                                <span className="font-medium text-gray-800 dark:text-gray-200">{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    );
  };

  const AssigneeSelect = ({ value, options, onChange }: { value: string; options: Profile[]; onChange: (value: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    const UserAvatar = ({ user }: { user: Profile | undefined }) => {
        if (!user) return null;
        return user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || ''} className="w-5 h-5 rounded-full object-cover" />
        ) : (
            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-[10px]">
                {(user.full_name || '?').charAt(0).toUpperCase()}
            </div>
        );
    };

    return (
        <div className="relative mt-1" ref={ref}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left">
                <div className="flex items-center gap-2">
                    <UserAvatar user={selectedOption} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedOption?.full_name || t.selectEmployee}</span>
                </div>
                <ChevronDownIcon size={16} className="text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-gray-700 rounded-md shadow-lg border dark:border-gray-600 animate-fadeIn max-h-48 overflow-y-auto">
                    {options.map((option) => (
                        <button key={option.id} type="button" onClick={() => { onChange(option.id); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                             <UserAvatar user={option} />
                            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{option.full_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
  };


  if (!isOpen) return null;

  return (
    <>
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-4 flex justify-center animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={task && 'id' in task ? t.editTask : t.addNewTask}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out animate-fadeInUp flex flex-col my-4 sm:my-8"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-4 sm:p-6 pb-0 relative flex-shrink-0">
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
              <div className="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 md:gap-y-0">
                {/* Left Column: Task Details */}
                <div className="space-y-4">
                     <div>
                        <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.taskTitleLabel}</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.descriptionLabel}</label>
                        <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                            <label htmlFor="assignee" className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.assignee}</label>
                            <AssigneeSelect value={assigneeId} options={allUsers} onChange={setAssigneeId} />
                        </div>
                         <div>
                            <label htmlFor="dueDate" className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.dueDateLabel}</label>
                            <div className="relative mt-1">
                                <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.status}</label>
                            <CustomSelect value={status} options={statusConfig} onChange={setStatus} />
                        </div>
                        <div>
                            <label className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.priority}</label>
                            <CustomSelect value={priority} options={priorityConfig} onChange={setPriority} />
                        </div>
                    </div>
                    
                     <div>
                        <label className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.attachments}</label>
                         <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                          <p>{t.pasteOrDrop}</p>
                        </div>
                        <div className="space-y-2 mt-2">
                           {attachments.map(att => {
                                const attachmentWithUrl = {...att, name: att.file_name, size: att.file_size, dataUrl: getPublicUrl(att.file_path)};
                                return <AttachmentItem key={att.id} file={attachmentWithUrl} onRemove={() => handleRemoveExistingAttachment(att.id)} isNew={false} onPreview={() => setPreviewAttachment(attachmentWithUrl)} />;
                           })}
                           {newFiles.map((file, index) => {
                                const fileWithUrl = {name: file.name, size: file.size, file_type: file.type, dataUrl: URL.createObjectURL(file)};
                                return <AttachmentItem key={index} file={fileWithUrl} onRemove={() => handleRemoveNewFile(index)} isNew={true} onPreview={() => setPreviewAttachment(fileWithUrl)}/>;
                           })}
                        </div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors">
                           <PaperclipIcon size={14} /> {t.addAttachment}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden"/>
                    </div>
                </div>
                {/* Right Column: Comments */}
                {task && 'id' in task && (
                 <div className="flex flex-col mt-4 md:mt-0">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.comments} ({comments.length})</label>
                    <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-3 overflow-y-auto min-h-[200px]">
                      {comments.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-10">{t.noCommentsYet}</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.id} className="flex items-start gap-2.5">
                            {comment.profiles?.avatar_url ? (
                              <img src={comment.profiles.avatar_url} alt={comment.profiles.full_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {(comment.profiles?.full_name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{comment.profiles?.full_name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(comment.created_at, language)}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <textarea 
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder={t.addComment}
                          rows={1}
                          className="flex-grow block px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm resize-none"
                        />
                         <button 
                            type="button" 
                            onClick={handlePostComment}
                            disabled={isPostingComment || !newComment.trim()}
                            className="p-2 rounded-full text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] disabled:opacity-50 transition-opacity transform hover:scale-110"
                            aria-label={t.post}
                         >
                            {isPostingComment ? <SpinnerIcon size={20} className="animate-spin" /> : <SendIcon size={20}/>}
                         </button>
                    </div>
                </div>
                )}
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
    {previewAttachment && <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />}
    </>
  );
};

export default TaskModal;