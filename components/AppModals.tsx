import React, { lazy } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Task, Profile, Project, Notification, ProjectMember, MemberDetails } from '@/types';
import type { useModalManager } from '@/hooks/useModalManager';
import type { useAppActions } from '@/hooks/useAppActions';
import { useSettings } from '@/context/SettingsContext';
import { useToasts } from '@/context/ToastContext';

const AuthModal = lazy(() => import('@/components/Auth'));
const AccountModal = lazy(() => import('@/components/AccountModal'));
const UserGuideModal = lazy(() => import('@/components/UserGuide'));
const TaskModal = lazy(() => import('@/components/TaskModal'));
const ActivityLogModal = lazy(() => import('@/components/ActivityLogModal'));
const NotificationsModal = lazy(() => import('@/components/NotificationsModal'));
const ActionModal = lazy(() => import('@/components/ActionModal'));
const EditEmployeeModal = lazy(() => import('@/components/EditEmployeeModal'));
const ProjectDetailsModal = lazy(() => import('@/components/dashboard/admin/ManageProjectMembersModal'));
const TaskDefaultsModal = lazy(() => import('@/components/task-modal/TaskDefaultsModal'));

interface AppModalsProps {
    session: Session | null;
    profile: Profile | null;
    allUsers: Profile[];
    userProjects: ProjectMember[];
    modals: ReturnType<typeof useModalManager>['modals'];
    taskActions: ReturnType<typeof useAppActions>['taskActions'];
    getProfile: (user: Session['user']) => Promise<void>;
    getAllUsers: () => Promise<void>;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    handleNotificationClick: (notification: Notification) => Promise<void>;
    handleSaveProject: (name: string, color: string, updatedMembers: MemberDetails[], originalMembers: MemberDetails[], project: Project | null) => Promise<void>;
}

const AppModals: React.FC<AppModalsProps> = ({
    session,
    profile,
    allUsers,
    userProjects,
    modals,
    taskActions,
    getProfile,
    getAllUsers,
    setUnreadCount,
    handleNotificationClick,
    handleSaveProject,
}) => {
    const { t } = useSettings();
    const { addToast } = useToasts();
    
    return (
        <>
            <AuthModal isOpen={modals.auth.isOpen} onClose={modals.auth.close} />
            <AccountModal isOpen={modals.account.isOpen} onClose={() => { modals.account.close(); if (session) getProfile(session.user); }} session={session} />
            <UserGuideModal isOpen={modals.userGuide.isOpen} onClose={modals.userGuide.close} />
            <TaskModal 
              isOpen={modals.task.isOpen}
              onClose={modals.task.close}
              onSave={async (taskData, newFiles, deletedIds, newComments) => {
                const success = await taskActions.handleSaveTask(taskData, modals.task.editingTask, newFiles, deletedIds, newComments);
                if (success) modals.task.close();
              }}
              task={modals.task.editingTask}
              allUsers={allUsers}
              currentUser={profile}
              userProjects={userProjects}
              onOpenDefaults={modals.taskDefaults.open}
            />
            <ActivityLogModal isOpen={modals.activityLog.isOpen} onClose={modals.activityLog.close} />
            <NotificationsModal isOpen={modals.notifications.isOpen} onClose={modals.notifications.close} onNotificationClick={handleNotificationClick} setUnreadCount={setUnreadCount} />
            <ActionModal
              isOpen={modals.action.isOpen}
              onClose={modals.action.close}
              onConfirm={modals.action.onConfirm}
              title={modals.action.title}
              message={modals.action.message}
              confirmText={modals.action.confirmText}
              confirmButtonClass={modals.action.confirmButtonClass}
            />
            {modals.editEmployee.isOpen && modals.editEmployee.editingEmployee && profile && (
                <EditEmployeeModal
                    isOpen={modals.editEmployee.isOpen}
                    onClose={modals.editEmployee.close}
                    onSave={() => {
                        addToast(t.profileUpdated, 'success');
                        getAllUsers();
                        modals.editEmployee.close();
                    }}
                    employee={modals.editEmployee.editingEmployee}
                    currentUserProfile={profile}
                />
            )}
            {modals.editProject.isOpen && profile && (
              <ProjectDetailsModal
                isOpen={modals.editProject.isOpen}
                onClose={modals.editProject.close}
                onSave={handleSaveProject}
                project={modals.editProject.editingProject}
                allUsers={allUsers}
                currentUserProfile={profile}
              />
            )}
            {modals.taskDefaults.isOpen && profile && (
                <TaskDefaultsModal
                    isOpen={modals.taskDefaults.isOpen}
                    onClose={modals.taskDefaults.close}
                    onSave={() => { if(session) getProfile(session.user) }}
                    currentUser={profile}
                    userProjects={userProjects}
                />
            )}
        </>
    );
}

export default AppModals;
