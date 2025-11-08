import React, { useState, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import { useModalManager } from '../../../hooks/useModalManager';
import { useToasts } from '../../../context/ToastContext';
import type { Profile } from '../../../types';
import { EditIcon, TrashIcon, SearchIcon, UsersIcon } from '../../Icons';
import EditEmployeeModal from '../../EditEmployeeModal';
import ActionModal from '../../ActionModal';
import Avatar from '../../common/Avatar';
import { formatAbsoluteDateTime } from '../../../lib/taskUtils';

interface UserManagementDashboardProps {
    allUsers: Profile[];
    onUsersChange: () => void;
}

const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({ allUsers, onUsersChange }) => {
    const { t, language, timezone } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToasts();
    const { modals } = useModalManager();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<Profile | null>(null);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return allUsers;
        }
        const lowerCaseSearch = searchTerm.toLowerCase();
        return allUsers.filter(user =>
            user.full_name?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [allUsers, searchTerm]);

    const handleEditUser = (user: Profile) => {
        setUserToEdit(user);
        setIsEditModalOpen(true);
    };
    
    const handleSaveProfile = async (updatedProfile: Profile) => {
        const { error } = await supabase.from('profiles').update({ 
            full_name: updatedProfile.full_name, 
            avatar_url: updatedProfile.avatar_url, 
            role: updatedProfile.role 
        }).eq('id', updatedProfile.id);
        
        if (error) {
            console.error("Error updating user profile:", error);
            addToast(`Error: ${error.message}`, 'error');
        } else {
            addToast("Profile updated successfully", 'success');
            setIsEditModalOpen(false);
            setUserToEdit(null);
            onUsersChange(); // Re-fetch users
        }
    };

    const executeDelete = async (user: Profile) => {
        // RLS should prevent non-admins, but this is a double-check.
        const { data: { session } } = await supabase.auth.getSession();
        const { data: currentUserProfile } = await supabase.from('profiles').select('role').eq('id', session?.user.id).single();
        if (currentUserProfile?.role !== 'admin') {
            addToast("You do not have permission to delete users.", "error");
            return;
        }
        
        const { error } = await supabase.from('profiles').delete().eq('id', user.id);
        
        if (error) {
            console.error("Error deleting user:", error);
            addToast(`Error: ${error.message}`, 'error');
        } else {
            addToast(`User ${user.full_name} deleted.`, 'success');
            onUsersChange();
        }
    }

    const handleDeleteUser = (user: Profile) => {
        modals.action.setState({
            isOpen: true,
            title: t.deleteUser,
            message: t.confirmDeleteUser(user.full_name || user.id),
            onConfirm: () => executeDelete(user),
            confirmText: t.deleteTask,
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        });
    };

    const RoleBadge: React.FC<{ role: Profile['role'] }> = ({ role }) => {
        const isAdmin = role === 'admin';
        return (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isAdmin ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                {isAdmin ? t.admin : t.employee}
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 w-full animate-fadeInUp">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="font-bold text-xl flex items-center gap-2">
                    <UsersIcon />
                    {t.userManagement} ({filteredUsers.length})
                </h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder={t.searchUsers}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon size={16} className="text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t.fullName}</th>
                            <th scope="col" className="px-6 py-3">{t.role}</th>
                            <th scope="col" className="px-6 py-3">{t.lastUpdated}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                    <div className="flex items-center gap-3">
                                        <Avatar user={user} title={user.full_name || ''} size={32} />
                                        <span>{user.full_name}</span>
                                    </div>
                                </th>
                                <td className="px-6 py-4">
                                    <RoleBadge role={user.role} />
                                </td>
                                <td className="px-6 py-4 tabular-nums">
                                    {formatAbsoluteDateTime(user.updated_at, language, timezone)}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEditUser(user)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={t.editUser}>
                                        <EditIcon size={14} />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t.deleteUser}>
                                        <TrashIcon size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredUsers.length === 0 && (
                     <p className="text-center py-8 text-gray-500">{t.noTasksFound}</p>
                 )}
            </div>
            
            {userToEdit && (
                <EditEmployeeModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveProfile}
                    employee={userToEdit}
                />
            )}
             <ActionModal
                isOpen={modals.action.isOpen}
                onClose={modals.action.close}
                onConfirm={modals.action.onConfirm}
                title={modals.action.title}
                message={modals.action.message}
                confirmText={modals.action.confirmText}
                confirmButtonClass={modals.action.confirmButtonClass}
            />
        </div>
    );
};

export default UserManagementDashboard;