

import React, { useState, useEffect } from 'react';
import type { Profile, Task, TimeLog, Project } from '../../../types';
import type { DataChange, TaskCounts } from '../../../App';
import AllTasksView from './AllTasksView';
import { supabase } from '../../../lib/supabase';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

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

const AdminTaskDashboard: React.FC<AdminTaskDashboardProps> = (props) => {
    const [allProjects, setAllProjects] = useLocalStorage<Project[]>('all_admin_projects', []);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) {
                console.error("Error fetching all projects for admin dashboard:", error);
            } else if (data) {
                setAllProjects(data as Project[]);
            }
        };
        fetchProjects();
    }, [setAllProjects]);

    return (
        <div className="w-full animate-fadeInUp">
            <AllTasksView {...props} allProjects={allProjects} />
        </div>
    );
};


export default AdminTaskDashboard;