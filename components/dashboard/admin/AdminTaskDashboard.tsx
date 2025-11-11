
import React from 'react';
import type { Profile, Task, TimeLog } from '../../../types';
import type { DataChange, TaskCounts } from '../../../App';
import AllTasksView from './AllTasksView';

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
    return (
        <div className="w-full animate-fadeInUp">
            <AllTasksView {...props} />
        </div>
    );
};


export default AdminTaskDashboard;