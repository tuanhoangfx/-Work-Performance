
import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Task, Profile } from '../../types';
import { ClipboardListIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon } from '../../components/Icons';
import StatusPrioritySelect, { CustomSelectOption } from '../common/StatusPrioritySelect';
import AssigneeSelect from '../common/AssigneeSelect';


interface TaskDetailsFormProps {
    taskData: {
        title: string;
        description: string;
        priority: Task['priority'];
        dueDate: string;
        assigneeId: string;
    };
    onFieldChange: (field: keyof TaskDetailsFormProps['taskData'], value: string | Task['priority']) => void;
    allUsers: Profile[];
    validationError: 'title' | 'assignee' | null;
}

const TaskDetailsForm: React.FC<TaskDetailsFormProps> = ({ taskData, onFieldChange, allUsers, validationError }) => {
    const { t } = useSettings();

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
