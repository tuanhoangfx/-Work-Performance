import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { translations } from './translations';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Task } from './types';
import { QuestionMarkCircleIcon, ClipboardListIcon, SpinnerIcon, CheckCircleIcon } from './components/Icons';
import { SettingsContext, ColorScheme } from './context/SettingsContext';

// Custom Hooks for logic separation
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useModalManager } from './hooks/useModalManager';
import { useProfileAndUsers } from './hooks/useProfileAndUsers';
import { useNotifications } from './hooks/useNotifications';
import { useAppActions } from './hooks/useAppActions';

// Lazy load components
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const ScrollToTopButton = lazy(() => import('./components/ScrollToTopButton'));
const AuthModal = lazy(() => import('./components/Auth'));
const AccountModal = lazy(() => import('./components/AccountModal'));
const UserGuideModal = lazy(() => import('./components/UserGuide'));
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TaskModal = lazy(() => import('./components/TaskModal'));
const ActivityLogModal = lazy(() => import('./components/ActivityLogModal'));
const NotificationsModal = lazy(() => import('./components/NotificationsModal'));
const ActionModal = lazy(() => import('./components/ActionModal'));

export type DataChange = {
  type: 'add' | 'update' | 'delete' | 'delete_many' | 'batch_update';
  payload: any;
  timestamp: number;
};

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

const AppContent: React.FC = () => {
  const { session, loading: authLoading, handleSignOut } = useSupabaseAuth();
  const { modals } = useModalManager();
  
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>('colorScheme', 'sky');
  const [language, setLanguage] = useLocalStorage<keyof typeof translations>('language', 'en');
  const [defaultDueDateOffset, setDefaultDueDateOffset] = useLocalStorage<number>('defaultDueDateOffset', 0);
  
  const [lastDataChange, setLastDataChange] = useState<DataChange | null>(null);
  const notifyDataChange = useCallback((change: Omit<DataChange, 'timestamp'>) => {
    setLastDataChange({ ...change, timestamp: Date.now() });
  }, []);

  const t = translations[language];

  const {
      profile, allUsers, loadingProfile, isAdminView, setIsAdminView, getProfile
  } = useProfileAndUsers(session);
  
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

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-sky', 'theme-ocean', 'theme-sunset');
    root.classList.add(`theme-${colorScheme}`);
  }, [colorScheme]);

  const handleViewTaskFromNotification = useCallback(async (taskId: number) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assignee:user_id(*), creator:created_by(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
            .eq('id', taskId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                modals.action.setState({
                  isOpen: true,
                  title: t.taskNotFound,
                  message: t.taskDeleted,
                });
            } else {
                throw error;
            }
        } else if (data) {
            modals.notifications.close();
            modals.task.open(data as Task);
        }
    } catch (error: any) {
        console.error("Error fetching task from notification:", error.message);
        modals.action.setState({
            isOpen: true,
            title: 'Error',
            message: `Could not load task: ${error.message}`,
        });
    }
  }, [modals.action, modals.notifications, modals.task, t]);

  const renderDashboard = () => {
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
        )
      }
      if (loadingProfile || authLoading) {
          return <div className="text-center p-8">Loading user data...</div>;
      }
      if (!profile) {
          return <div className="text-center p-8 text-xl text-red-500">Could not load user profile. Please try refreshing.</div>
      }
      
      if (profile?.role === 'admin' && isAdminView) {
          return <AdminDashboard 
            lastDataChange={lastDataChange}
            allUsers={allUsers}
            onEditTask={modals.task.open}
            onDeleteTask={taskActions.handleDeleteTask}
            onClearCancelledTasks={taskActions.handleClearCancelledTasks}
            onUpdateStatus={taskActions.handleUpdateStatus}
            onStartTimer={timerActions.handleStartTimer}
            onStopTimer={timerActions.handleStopTimer}
            activeTimer={activeTimer}
          />;
      }
      
      return <EmployeeDashboard 
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
      />;
  }

  return (
    <SettingsContext.Provider value={{ theme, setTheme, colorScheme, setColorScheme, language, setLanguage, t, defaultDueDateOffset, setDefaultDueDateOffset }}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-sans flex flex-col">
        <Header 
          session={session}
          profile={profile}
          handleSignOut={handleSignOut}
          onSignInClick={modals.auth.open}
          onAccountClick={modals.account.open}
          isAdminView={isAdminView}
          setIsAdminView={setIsAdminView}
          onAddNewTask={() => modals.task.open(null)}
          onEditTask={modals.task.open}
          onDeleteTask={taskActions.handleDeleteTask}
          onUpdateStatus={taskActions.handleUpdateStatus}
          onOpenActivityLog={modals.activityLog.open}
          onOpenNotifications={modals.notifications.open}
          unreadCount={unreadCount}
        />

        <main className="container mx-auto px-4 py-8 flex-grow flex flex-col">
          {isSupabaseConfigured ? renderDashboard() : <SupabaseNotConfigured />}
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
            if (success) {
              modals.task.close();
            }
          }}
          task={modals.task.editingTask}
          allUsers={allUsers}
          currentUser={profile}
        />
        <ActivityLogModal isOpen={modals.activityLog.isOpen} onClose={modals.activityLog.close} />
        <NotificationsModal isOpen={modals.notifications.isOpen} onClose={modals.notifications.close} onViewTask={handleViewTaskFromNotification} setUnreadCount={setUnreadCount} />
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
    </SettingsContext.Provider>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppContent />
    </Suspense>
  );
}
