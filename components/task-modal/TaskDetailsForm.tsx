
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Task, Profile, Project } from '../../types';
import { ChevronDownIcon } from '../../components/Icons';
import StatusPrioritySelect, { CustomSelectOption } from '../common/StatusPrioritySelect';
import AssigneeSelect from '../common/AssigneeSelect';
import { PROJECT_COLORS } from '../../constants';


interface TaskDetailsFormProps {
    taskData: {
        title: string;
        description: string;
        priority: Task['priority'];
        dueDate: string;
        assigneeId: string;
        projectId: string;
    };
    onFieldChange: (field: keyof TaskDetailsFormProps['taskData'], value: string | Task['priority']) => void;
    allUsers: Profile[];
    userProjects: Project[];
    validationError: 'title' | 'assignee' | null;
}

const TaskDetailsForm: React.FC<TaskDetailsFormProps> = ({ taskData, onFieldChange, allUsers, userProjects, validationError }) => {
    const { t } = useSettings();

    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const projectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
                setIsProjectOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const projectOptions = useMemo(() => [
        { id: 'personal', name: t.personalProject, color: '#6b7280' },
        ...userProjects.map(p => ({ id: p.id.toString(), name: p.name, color: p.color || PROJECT_COLORS[p.id % PROJECT_COLORS.length] }))
    ], [userProjects, t]);

    const selectedProject = projectOptions.find(p => p.id === taskData.projectId) || projectOptions[0];

    const priorityConfig: { [key in Task['priority']]: CustomSelectOption } = {
        low: { label: t.low, icon: '💤', color: 'text-green-600 dark:text-green-400' },
        medium: { label: t.medium, icon: '⚡', color: 'text-yellow-600 dark:text-yellow-400' },
        high: { label: t.high, icon: '🚨', color: 'text-red-600 dark:text-red-400' },
    };

    return (
        <div className="space-y-3">
            <div>
                <input
                    type="text"
                    id="title"
                    placeholder={t.taskTitleLabel}
                    value={taskData.title}
                    onChange={e => onFieldChange('title', e.target.value)}
                    required
                    className={`block w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-md shadow-sm text-lg sm:text-xl font-semibold ${validationError === 'title' ? 'border-red-500 ring-2 ring-red-500/50 animate-shake' : 'border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]'}`}
                />
            </div>
            <div>
                <textarea
                    id="description"
                    placeholder={t.descriptionLabel}
                    rows={4}
                    value={taskData.description}
                    onChange={e => onFieldChange('description', e.target.value)}
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm"
                />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                 <div>
                    <label htmlFor="project" className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.project}</label>
                     <div className="relative mt-1" ref={projectRef}>
                        <button type="button" onClick={() => setIsProjectOpen(!isProjectOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left">
                            <div className="flex items-center gap-2">
                                {selectedProject && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }}></span>}
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedProject?.name || 'Select Project'}</span>
                            </div>
                            <ChevronDownIcon size={16} className="text-gray-400" />
                        </button>
                        {isProjectOpen && (
                            <div className="absolute z-20 top-full mt-1 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-md shadow-lg border dark:border-gray-600 animate-fadeIn max-h-48 overflow-y-auto">
                                {projectOptions.map((option) => (
                                    <button key={option.id} type="button" onClick={() => { onFieldChange('projectId', option.id); setIsProjectOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }}></span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{option.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label htmlFor="assignee" className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.assignee}</label>
                    <AssigneeSelect
                        value={taskData.assigneeId}
                        options={allUsers}
                        onChange={(value) => onFieldChange('assigneeId', value)}
                        hasError={validationError === 'assignee'}
                    />
                </div>
                <div>
                    <label htmlFor="dueDate" className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.dueDateLabel}</label>
                    <div className="relative mt-1">
                        <input
                            type="date"
                            id="dueDate"
                            value={taskData.dueDate}
                            onChange={e => onFieldChange('dueDate', e.target.value)}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.priority}</label>
                    <StatusPrioritySelect
                        value={taskData.priority}
                        options={priorityConfig}
                        onChange={(value) => onFieldChange('priority', value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsForm;