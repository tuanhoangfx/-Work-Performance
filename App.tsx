

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useLocalStorage } from './hooks/useLocalStorage';
import { translations } from './translations';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Task, ProjectMember, Profile, Project, Notification } from './types';
import { QuestionMarkCircleIcon, ClipboardListIcon, SpinnerIcon, CheckCircleIcon } from './components/Icons';
// FIX: Import useSettings hook to access translation and language settings.
import { SettingsContext, ColorScheme, useSettings } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { useToasts } from './context/ToastContext';

// Custom Hooks for logic separation
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useModalManager } from './hooks/useModalManager';
import { useProfileAndUsers } from './hooks/useProfileAndUsers';
import { useNotifications } from './hooks/useNotifications';
import { useAppActions } from './hooks/useAppActions';
import useIdleTimer from './hooks/useIdleTimer';

// Lazy load components
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const ScrollToTopButton = lazy(() => import('./components/ScrollToTopButton'));
const AuthModal = lazy(() => import('./components/Auth'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const UserGuideModal = lazy(() => import('./components/UserGuide'));
const EmployeeDashboard = lazy(() => import('./components/dashboard/employee/EmployeeDashboard'));
const AdminTaskDashboard = lazy(() => import('./components/dashboard/admin/AdminTaskDashboard'));
const ManagementDashboard = lazy(() => import('./components/dashboard/admin/ManagementDashboard'));
const TaskModal = lazy(() => import('./components/TaskModal'));
const ActivityLogModal = lazy(() => import('./components/ActivityLogModal'));
const NotificationsModal = lazy(() => import('./components/NotificationsModal'));
const ActionModal = lazy(() => import('./components/ActionModal'));
const ToastContainer = lazy(() => import('./components/ToastContainer'));
const EditEmployeeModal = lazy(() => import('./components/EditEmployeeModal'));
const ProjectDetailsModal = lazy(() => import('./components/dashboard/admin/ManageProjectMembersModal'));
import { MemberDetails } from './components/dashboard/admin/ManageProjectMembersModal';
const TaskDefaultsModal = lazy(() => import('./components/task-modal/TaskDefaultsModal'));


export type DataChange = {
  type: 'add' | 'update' | 'delete' | 'delete_many' | 'batch_update' | 'profile_change';
  payload: any;
  timestamp: number;
};

export interface TaskCounts {
  todo: number;
  inprogress: number;
  done: number;
}

export type AdminView = 'myTasks' | 'taskDashboard' | 'management';

const SupabaseNotConfigured: React.FC = () => (
  <div className="flex flex-col justify-center items-center text-center flex-grow animate-fadeIn bg-amber-100 dark:bg-amber-900/30 p-8 rounded-lg border border-amber-300 dark:border-amber-700">
    <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-300">Supabase Not Configured</h2>
    <p className="mt-4 text-lg text-amber-800 dark:text-amber-400">
      To enable authentication and task management features, you need to configure your Supabase credentials.
    </p>
    <p className="mt-2">Please update the following file with your project's URL and anon key:</p>
    <p className="mt-2 font-mono bg-amber-200 dark:bg-gray-700 p-2 rounded text-sm text-amber-900 dark:text-amber-200">
      lib/supabase.ts
    </p>
     <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
      Note: Remember to run the SQL provided in the response to set up your database tables.
    </p>
  </div>
);

const LoadingSpinner: React.FC = () => (
  <div className="suspense-loader">
    <div className="suspense-spinner"></div>
  </div>
);

const DashboardManager: React.FC<{
    session: ReturnType<typeof useSupabaseAuth>['session'];
    loadingProfile: boolean;
    authLoading: boolean;
    profile: Profile | null;
    t: (typeof translations)['en'];
    adminView: AdminView;
    modals: ReturnType<typeof useModalManager>['modals'];
    taskActions: ReturnType<typeof useAppActions>['taskActions'];
    timerActions: ReturnType<typeof useAppActions>['timerActions'];
    activeTimer: ReturnType<typeof useAppActions>['activeTimer'];
    allUsers: Profile[];
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
    userProjects: ProjectMember[];
    lastDataChange: DataChange | null;
    getAllUsers: () => Promise<void>;
    onEditUser: (employee: Profile) => void;
    onEditProject: (project: Project | null) => void;
}> = React.memo(({
    session, loadingProfile, authLoading, profile, t, adminView, modals,
    taskActions, timerActions, activeTimer, allUsers, setTaskCounts,
    userProjects, lastDataChange, getAllUsers, onEditUser, onEditProject
}) => {
    if (!session) {
        return (
            <div className="flex flex-col justify-center items-center text-center flex-grow animate-fadeIn p-4">
                <div className="w-full max-w-xs mx-auto mb-8">
                    <div className="flex justify-between items-center text-center mb-2">
                        <div className="w-24 text-center">
                            <ClipboardListIcon size={28} className="text-orange-400 mx-auto" />
                            <span className="mt-2 font-semibold text-sm block">{t.todo}</span>
                        </div>
                        <div className="w-24 text-center">
                            <SpinnerIcon size={28} className="text-indigo-400 mx-auto animate-spin" />
                            <span className="mt-2 font-semibold text-sm block">{t.inprogress}</span>
                        </div>
                        <div className="w-24 text-center">
                            <CheckCircleIcon size={28} className="text-green-400 mx-auto" />
                            <span className="mt-2 font-semibold text-sm block">{t.done}</span>
                        </div>
                    </div>
                    <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full animate-progress-fill"></div>
                    </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{t.signInToManageTasks}</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Track progress, manage deadlines, and collaborate seamlessly.</p>
            </div>
        );
    }

    if (loadingProfile || authLoading) {
        return <div className="text-center p-8">Loading user data...</div>;
    }

    if (!profile) {
        return <div className="text-center p-8 text-xl text-red-500">Could not load user profile. Please try refreshing.</div>;
    }

    const isMyTasksVisible = (profile.role === 'employee') || ((profile.role === 'admin' || profile.role === 'manager') && adminView === 'myTasks');

    return (
        <>
            <div className={isMyTasksVisible ? 'block' : 'hidden'}>
                <EmployeeDashboard
                    session={session}
                    lastDataChange={lastDataChange}
                    onEditTask={modals.task.open}
                    onDeleteTask={taskActions.handleDeleteTask}
                    onClearCancelledTasks={taskActions.handleClearCancelledTasks}
                    onUpdateStatus={taskActions.handleUpdateStatus}
                    onStartTimer={timerActions.handleStartTimer}
                    onStopTimer={timerActions.handleStopTimer}
                    activeTimer={activeTimer}
                    allUsers={allUsers}
                    setTaskCounts={setTaskCounts}
                    userProjects={userProjects}
                />
            </div>

            {profile.role === 'admin' && (
                <div className={adminView === 'taskDashboard' ? 'block' : 'hidden'}>
                    <AdminTaskDashboard
                        lastDataChange={lastDataChange}
                        allUsers={allUsers}
                        onEditTask={modals.task.open}
                        onDeleteTask={taskActions.handleDeleteTask}
                        onClearCancelledTasks={taskActions.handleClearCancelledTasks}
                        onUpdateStatus={taskActions.handleUpdateStatus}
                        onStartTimer={timerActions.handleStartTimer}
                        onStopTimer={timerActions.handleStopTimer}
                        activeTimer={activeTimer}
                        setTaskCounts={setTaskCounts}
                    />
                </div>
            )}
            
            {(profile.role === 'admin' || profile.role === 'manager') && (
                <div className={adminView === 'management' ? 'block' : 'hidden'}>
                    <ManagementDashboard
                        allUsers={allUsers}
                        onUsersChange={getAllUsers}
                        currentUserProfile={profile}
                        onEditUser={onEditUser}
                        onEditProject={onEditProject}
                        lastDataChange={lastDataChange}
                    />
                </div>
            )}
        </>
    );
});

const AppContent: React.FC = () => {
  const { session, loading: authLoading, handleSignOut } = useSupabaseAuth();
  const { modals } = useModalManager();
  const { addToast } = useToasts();
  const { t, language } = useSettings();
  
  const [lastDataChange, setLastDataChange] = useState<DataChange | null>(null);
  const notifyDataChange = useCallback((change: Omit<DataChange, 'timestamp'>) => {
    setLastDataChange({ ...change, timestamp: Date.now() });
  }, []);

  const [taskCounts, setTaskCounts] = useState<TaskCounts>({ todo: 0, inprogress: 0, done: 0 });
  const [userProjects, setUserProjects] = useLocalStorage<ProjectMember[]>(
    session ? `user_projects_${session.user.id}` : 'user_projects_guest',
    []
  );

  const {
      profile, allUsers, loadingProfile, adminView, setAdminView, getProfile, getAllUsers
  } = useProfileAndUsers(session, lastDataChange);
  
  const { unreadCount, setUnreadCount } = useNotifications(session);

  const {
      activeTimer,
      taskActions,
      timerActions,
  } = useAppActions({
      session,
      setActionModal: modals.action.setState,
      notifyDataChange: notifyDataChange,
      t
  });

  const handleIdle = useCallback(() => {
    if (session && navigator.onLine) {
        console.log('User is idle. Refreshing data in the background...');
        notifyDataChange({ type: 'batch_update', payload: { reason: 'idle_refresh' } });
        addToast(t.dataRefreshed, 'info');
    }
  }, [session, notifyDataChange, addToast, t.dataRefreshed]);

  useIdleTimer(handleIdle, 5 * 60 * 1000);

  const canAddTask = !!(session && profile);

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!session) {
        setUserProjects([]);
        return;
      }
      const { data, error } = await supabase
        .from('project_members')
        .select('*, projects!inner(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching user projects:", error);
      } else {
        setUserProjects(data as ProjectMember[]);
      }
    };
    fetchUserProjects();
  }, [session, lastDataChange, setUserProjects]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        if (event.ctrlKey || event.metaKey || event.altKey) return;
        
        // --- Global Shortcuts ---

        // Close any open modal with 'Escape'
        if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            // This priority order is important to close top-level modals first
            if (modals.action.isOpen) {
                modals.action.close();
            } else if (modals.taskDefaults.isOpen) {
                modals.taskDefaults.close();
            } else if (modals.task.isOpen) {
                modals.task.close();
            } else if (modals.editEmployee.isOpen) {
                modals.editEmployee.close();
            } else if (modals.editProject.isOpen) {
                modals.editProject.close();
            } else if (modals.account.isOpen) {
                modals.account.close();
            } else if (modals.activityLog.isOpen) {
                modals.activityLog.close();
            } else if (modals.notifications.isOpen) {
                modals.notifications.close();
            } else if (modals.userGuide.isOpen) {
                modals.userGuide.close();
            } else if (modals.auth.isOpen) {
                modals.auth.close();
            }
            return;
        }

        // --- Shortcuts that should not work while typing ---
        if (isTyping) return;

        // Open 'New Task' modal with 'N'
        if (event.key.toLowerCase() === 'n' && canAddTask) {
            event.preventDefault();
            const anyModalOpen = Object.values(modals).some(m => m.isOpen);
            if (!anyModalOpen) {
                modals.task.open(null);
            }
        }

        // Focus search input with 'F'
        if (event.key.toLowerCase() === 'f') {
            event.preventDefault();
            const searchInputs = Array.from(document.querySelectorAll<HTMLInputElement>(
                'input[name="searchTerm"], #user-management-search, #project-management-search'
            ));
            const visibleSearchInput = searchInputs.find(input => input.offsetParent !== null);
            if (visibleSearchInput) {
                visibleSearchInput.focus();
                visibleSearchInput.select();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAddTask, modals]);

  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    const channels: RealtimeChannel[] = [];
    const tasksChannel = supabase.channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data: task, error } = await supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').eq('id', payload.new.id).single();
            if (error) { console.error('Error fetching task from realtime update:', error); return; }
            if (task) notifyDataChange({ type: payload.eventType === 'INSERT' ? 'add' : 'update', payload: task });
          } else if (payload.eventType === 'DELETE') {
            notifyDataChange({ type: 'delete', payload: { id: (payload.old as any).id } });
          }
        }
      ).subscribe();
    channels.push(tasksChannel);
    const tablesToWatch = ['task_attachments', 'task_comments', 'projects', 'project_members', 'profiles'];
    tablesToWatch.forEach(table => {
      const channel = supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: table },
          (payload) => {
            if (table === 'profiles' && payload.eventType !== 'DELETE' && (payload.new as Profile).id === session?.user.id) {
                 notifyDataChange({ type: 'profile_change', payload: payload.new });
            } else {
                 notifyDataChange({ type: 'batch_update', payload: { table } });
            }
          }
        ).subscribe();
      channels.push(channel);
    });
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [session, notifyDataChange]);

  useEffect(() => {
    if (!session) setTaskCounts({ todo: 0, inprogress: 0, done: 0 });
  }, [session]);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
      modals.notifications.close();
      if ((notification.type === 'new_task_assigned' || notification.type === 'new_comment') && notification.data.task_id) {
          try {
              const { data, error } = await supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').eq('id', notification.data.task_id).single();
              if (error) {
                  if (error.code === 'PGRST116') modals.action.setState({ isOpen: true, title: t.taskNotFound, message: t.taskDeleted });
                  else throw error;
              } else if (data) {
                  modals.task.open(data as Task);
              }
          } catch (error: any) {
              console.error("Error fetching task from notification:", error.message);
              modals.action.setState({ isOpen: true, title: 'Error', message: `Could not load task: ${error.message}` });
          }
      } else if (notification.type === 'new_project_created' && notification.data.project_id) {
           if (profile?.role === 'admin') {
                setAdminView('management');
                const { data: project, error } = await supabase.from('projects').select('*').eq('id', notification.data.project_id).single();
                if (error) {
                    addToast(`Error fetching project: ${error.message}`, 'error');
                } else if (project) {
                    modals.editProject.open(project);
                }
           }
      }
  }, [modals, t, profile, setAdminView, addToast]);

  const handleSaveProject = async (name: string, color: string, updatedMembers: MemberDetails[], originalMembers: MemberDetails[], project: Project | null) => {
    if (!profile) return;

    const isNew = !project?.id;
    const projectData = { name, color, ...(isNew && { created_by: profile.id }) };

    const { data: savedProject, error: projectError } = isNew
        ? await supabase.from('projects').insert(projectData).select().single()
        : await supabase.from('projects').update({ name, color }).eq('id', project.id).select().single();

    if (projectError) { addToast(projectError.message, 'error'); return; }

    const projectId = savedProject.id;
    
    if (isNew && savedProject) {
        const { data: admins, error: adminError } = await supabase.from('profiles').select('id').eq('role', 'admin');
        if (adminError) {
            console.error("Could not fetch admins to notify", adminError);
        } else if (admins) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                actor_id: profile.id,
                type: 'new_project_created',
                data: {
                    project_id: savedProject.id,
                    project_name: savedProject.name,
                    creator_name: profile.full_name,
                }
            }));
            const { error: notifError } = await supabase.from('notifications').insert(notifications);
            if (notifError) console.error("Failed to create project notifications", notifError);
        }
    }
    
    if (!isNew) {
        const originalMemberIds = new Set(originalMembers.map(m => m.user_id));
        const updatedMemberIds = new Set(updatedMembers.map(m => m.user_id));
        const toAddIds = [...updatedMemberIds].filter(id => !originalMemberIds.has(id));
        const toRemoveIds = [...originalMemberIds].filter(id => !updatedMemberIds.has(id));

        if (toRemoveIds.length > 0) {
            const { error } = await supabase.from('project_members').delete().eq('project_id', projectId).in('user_id', toRemoveIds);
            if (error) addToast(`Error removing members: ${error.message}`, 'error');
        }

        if (toAddIds.length > 0) {
            const { error } = await supabase.from('project_members').insert(toAddIds.map(userId => ({ project_id: projectId, user_id: userId })));
            if (error) addToast(`Error adding members: ${error.message}`, 'error');
        }
    } else {
         const { error: memberError } = await supabase.from('project_members').insert({ project_id: projectId, user_id: profile.id });
         if (memberError) addToast("Project created, but failed to add creator as member.", 'error');
    }
    
    addToast(`Project ${isNew ? 'created' : 'updated'} successfully`, 'success');
    modals.editProject.close();
    notifyDataChange({ type: 'batch_update', payload: { table: 'projects' } });
};

  return (
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-sans flex flex-col">
        <ToastContainer />
        <Header 
          session={session}
          profile={profile}
          handleSignOut={handleSignOut}
          onSignInClick={modals.auth.open}
          onAccountClick={modals.account.open}
          adminView={adminView}
          setAdminView={setAdminView}
          onAddNewTask={() => modals.task.open(null)}
          onEditTask={modals.task.open}
          onDeleteTask={taskActions.handleDeleteTask}
          onUpdateStatus={taskActions.handleUpdateStatus}
          onOpenActivityLog={modals.activityLog.open}
          onOpenNotifications={modals.notifications.open}
          unreadCount={unreadCount}
          taskCounts={taskCounts}
        />

        <main className="container mx-auto px-4 py-8 flex-grow flex flex-col">
          {isSupabaseConfigured ? <DashboardManager 
            session={session}
            loadingProfile={loadingProfile}
            authLoading={authLoading}
            profile={profile}
            t={t}
            adminView={adminView}
            modals={modals}
            taskActions={taskActions}
            timerActions={timerActions}
            activeTimer={activeTimer}
            allUsers={allUsers}
            setTaskCounts={setTaskCounts}
            userProjects={userProjects}
            lastDataChange={lastDataChange}
            getAllUsers={getAllUsers}
            onEditUser={modals.editEmployee.open}
            onEditProject={modals.editProject.open}
          /> : <SupabaseNotConfigured />}
        </main>
        
        <Footer />

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <ScrollToTopButton />
            <button
              type="button"
              onClick={modals.userGuide.open}
              aria-label={t.openUserGuideAria}
              title={t.howToUseThisApp}
              className="p-2 rounded-full bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-lg hover:shadow-xl transform-gpu transition-all duration-300 ease-in-out hover:scale-110"
            >
              <QuestionMarkCircleIcon size={20} />
            </button>
        </div>
        
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
      </div>
  );
}

const AppContextProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
    const [rawColorScheme, setRawColorScheme] = useLocalStorage<ColorScheme | 'ocean'>('colorScheme', 'sky');
    const [language, setLanguage] = useLocalStorage<keyof typeof translations>('language', 'en');
    const [defaultDueDateOffset, setDefaultDueDateOffset] = useLocalStorage<number>('taskDefaults_dueDateOffset', 0);
    const [defaultPriority, setDefaultPriority] = useLocalStorage<Task['priority']>('taskDefaults_priority', 'medium');
    const [timezone, setTimezone] = useLocalStorage<string>('timezone', 'Asia/Ho_Chi_Minh');

    // Simple migration for old theme
    const colorScheme = rawColorScheme === 'ocean' ? 'amethyst' : (rawColorScheme as ColorScheme);
    const setColorScheme = (scheme: ColorScheme) => {
      setRawColorScheme(scheme);
    };

    const t = translations[language];

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('theme-sky', 'theme-ocean', 'theme-sunset', 'theme-amethyst', 'theme-emerald', 'theme-crimson');
        root.classList.add(`theme-${colorScheme}`);
    }, [colorScheme]);

    const settingsValue = { theme, setTheme, colorScheme, setColorScheme, language, setLanguage, t, defaultDueDateOffset, setDefaultDueDateOffset, defaultPriority, setDefaultPriority, timezone, setTimezone };

    return (
        <SettingsContext.Provider value={settingsValue}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </SettingsContext.Provider>
    );
};

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppContextProviders>
        <AppContent />
      </AppContextProviders>
    </Suspense>
  );
}