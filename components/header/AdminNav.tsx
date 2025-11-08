import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { BriefcaseIcon, UsersIcon, ClipboardListIcon } from '../Icons';
import { AdminView } from '../../App';

interface AdminNavProps {
    activeView: AdminView;
    setView: (view: AdminView) => void;
}

const AdminNav: React.FC<AdminNavProps> = ({ activeView, setView }) => {
    const { t } = useSettings();

    const navItems = [
        { view: 'myTasks' as AdminView, label: t.employeeDashboard, icon: BriefcaseIcon },
        { view: 'taskDashboard' as AdminView, label: t.adminDashboard, icon: ClipboardListIcon },
        { view: 'userManagement' as AdminView, label: t.userManagement, icon: UsersIcon },
    ];

    return (
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-0.5">
            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors ${activeView === item.view ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}
                    title={item.label}
                >
                    <item.icon size={14}/>
                    <span className="hidden lg:inline">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default AdminNav;
