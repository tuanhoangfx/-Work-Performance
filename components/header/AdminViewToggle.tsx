import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { BriefcaseIcon, UsersIcon } from '../Icons';

const AdminViewToggle: React.FC<{isAdminView: boolean, setIsAdminView: (isAdminView: boolean) => void}> = ({isAdminView, setIsAdminView}) => {
    const { t } = useSettings();
    return (
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-0.5">
            <button
                onClick={() => setIsAdminView(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors ${!isAdminView ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}
                title={t.employeeDashboard}
            >
                <BriefcaseIcon size={14}/>
                <span className="hidden sm:inline">{t.employeeDashboard}</span>
            </button>
             <button
                onClick={() => setIsAdminView(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors ${isAdminView ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}
                title={t.adminDashboard}
            >
                <UsersIcon size={14}/>
                <span className="hidden sm:inline">{t.adminDashboard}</span>
            </button>
        </div>
    );
};

export default AdminViewToggle;
