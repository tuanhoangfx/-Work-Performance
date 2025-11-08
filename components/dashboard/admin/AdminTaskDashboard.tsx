import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Profile, Task, TimeLog } from '../../../types';
import { EditIcon, UsersIcon } from '../../Icons';
import EditEmployeeModal from '../../EditEmployeeModal';
import type { DataChange, TaskCounts } from '../../../App';
import { EmployeeListSkeleton } from '../../Skeleton';
import AllTasksView from './AllTasksView';
import EmployeeTaskView from './EmployeeTaskView';
import Avatar from '../../common/Avatar';

interface AdminTaskDashboardProps {
    lastDataChange: DataChange | null;
    allUsers: Profile[];
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onStartTimer: (task: Task) => void;
    onStopTimer: (timeLog: TimeLog) => void;
    activeTimer: TimeLog | null;
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const AdminTaskDashboard: React.FC<AdminTaskDashboardProps> = ({ lastDataChange, allUsers, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, setTaskCounts }) => {
    const { t } = useSettings();
    const [view, setView] = useState<'all' | 'employee'>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Profile | null>(null);

    useEffect(() => { setLoading(allUsers.length === 0); }, [allUsers]);
    
    const openEditModal = (employee: Profile) => {
        setEmployeeToEdit(employee);
        setIsEditModalOpen(true);
    };
    
    const handleSaveEmployeeProfile = async (updatedProfile: Profile) => {
        const { error } = await supabase.from('profiles').update({ full_name: updatedProfile.full_name, avatar_url: updatedProfile.avatar_url, role: updatedProfile.role }).eq('id', updatedProfile.id);
        if (error) {
            console.error("Error updating employee profile:", error);
        } else {
            setIsEditModalOpen(false);
            setEmployeeToEdit(null);
            // This is a profile change, a full refresh is acceptable here.
            window.location.reload();
        }
    };
    
    const handleSelectEmployee = (employee: Profile) => {
        setView('employee');
        setSelectedEmployee(employee);
    }

    const renderContent = () => {
        switch (view) {
            case 'all':
                return <AllTasksView 
                            lastDataChange={lastDataChange}
                            allUsers={allUsers}
                            onEditTask={onEditTask}
                            onDeleteTask={onDeleteTask}
                            onUpdateStatus={onUpdateStatus}
                            onClearCancelledTasks={onClearCancelledTasks}
                            setTaskCounts={setTaskCounts}
                        />;
            case 'employee':
                return selectedEmployee ? <EmployeeTaskView 
                                                employee={selectedEmployee} 
                                                key={selectedEmployee.id} 
                                                lastDataChange={lastDataChange}
                                                onEditTask={onEditTask}
                                                onDeleteTask={onDeleteTask}
                                                onUpdateStatus={onUpdateStatus}
                                                onClearCancelledTasks={onClearCancelledTasks}
                                                allUsers={allUsers}
                                                setTaskCounts={setTaskCounts}
                                            /> : null;
            default:
                return null;
        }
    }

    return (
        <div className="w-full animate-fadeInUp">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4">
                    <h2 className="font-bold text-lg mb-4">{t.allEmployees}</h2>
                     {loading ? <EmployeeListSkeleton /> : (
                        <ul className="space-y-1 max-h-96 lg:max-h-[calc(100vh-280px)] overflow-y-auto">
                            <li><button onClick={() => { setView('all'); setSelectedEmployee(null); }} className={`w-full text-left p-2 rounded-md transition-colors text-sm font-semibold flex items-center gap-3 ${view === 'all' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}><UsersIcon size={20} /><span>{t.allTasksBoard}</span></button></li>
                            <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                            {allUsers.map(emp => (
                                <li key={emp.id} className={`group flex items-center justify-between p-1 rounded-md transition-colors ${selectedEmployee?.id === emp.id ? 'bg-[var(--accent-color)]/20' : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}>
                                    <div onClick={() => handleSelectEmployee(emp)} className={`flex-grow flex items-center gap-3 cursor-pointer p-1 rounded-md ${selectedEmployee?.id === emp.id ? ' text-gray-800 dark:text-white font-semibold' : ''}`}>
                                        <Avatar user={emp} title={emp.full_name || ''} size={32} />
                                        <span className="truncate text-sm">{emp.full_name || emp.id}</span>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(emp); }} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600" title={`Edit ${emp.full_name}`}>
                                            <EditIcon size={14} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>
             {isEditModalOpen && employeeToEdit && <EditEmployeeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEmployeeProfile} employee={employeeToEdit} />}
        </div>
    );
};


export default AdminTaskDashboard;