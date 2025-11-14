# Infi Project - Source Code Bundle

This document contains the complete source code for the Infi Project Task Manager, organized for easy review by developers and AI tools. The code is structured into two main parts: Main Functionality and Helper Components.

## MỤC LỤC (TABLE OF CONTENTS)

*   [Phần 1: Chức Năng Chính (Main Functionality)](#phần-1-chức-năng-chính-main-functionality)
    *   [1.1. App.tsx (Main Orchestrator)](#11-apptsx-main-orchestrator)
    *   [1.2. Dashboards](#12-dashboards)
    *   [1.3. Core Task & Board Components](#13-core-task--board-components)
    *   [1.4. Task Creation/Editing Modal](#14-task-creationediting-modal)
    *   [1.5. Data Display & Summary](#15-data-display--summary)
*   [Phần 2: Các Thành Phần Phụ Trợ (Helper Components & Utilities)](#phần-2-các-thành-phần-phụ-trợ-helper-components--utilities)
    *   [2.1. Core Setup & Entry Point](#21-core-setup--entry-point)
    *   [2.2. Layout & Navigation Components](#22-layout--navigation-components)
    *   [2.3. User & Authentication Components](#23-user--authentication-components)
    *   [2.4. Common & Reusable UI Components](#24-common--reusable-ui-components)
    *   [2.5. Custom Hooks (Logic Abstractions)](#25-custom-hooks-logic-abstractions)
    *   [2.6. Context & State Management](#26-context--state-management)
    *   [2.7. Configuration & Utilities](#27-configuration--utilities)
    *   [2.8. Project Documentation & Build Config](#28-project-documentation--build-config)

---

## PHẦN 1: CHỨC NĂNG CHÍNH (MAIN FUNCTIONALITY)

This section contains the core logic and components responsible for the main task management features of the application.

### 1.1. App.tsx (Main Orchestrator)

This is the root component that orchestrates the entire application, managing state, modals, and rendering the appropriate dashboards.

```typescript
// --- START OF FILE App.tsx ---

import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { translations } from '@/translations';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Task, ProjectMember, Profile, Project, Notification, MemberDetails } from '@/types';
import { QuestionMarkCircleIcon, ClipboardListIcon, SpinnerIcon, CheckCircleIcon } from '@/components/Icons';
import { SettingsContext, ColorScheme, useSettings } from '@/context/SettingsContext';
import { ToastProvider } from '@/context/ToastContext';
import { useToasts } from '@/context/ToastContext';

// Custom Hooks
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useModalManager } from '@/hooks/useModalManager';
import { useProfileAndUsers } from '@/hooks/useProfileAndUsers';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppActions } from '@/hooks/useAppActions';
import useIdleTimer from '@/hooks/useIdleTimer';
import { useProjects } from '@/hooks/useProjects';
import { useRealtime } from '@/hooks/useRealtime';
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
// FIX: Import the missing useLocalStorage hook.
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Lazy load components
const Header = lazy(() => import('@/components/Header'));
const Footer = lazy(() => import('@/components/Footer'));
const ScrollToTopButton = lazy(() => import('@/components/ScrollToTopButton'));
const EmployeeDashboard = lazy(() => import('@/components/dashboard/employee/EmployeeDashboard'));
const AdminTaskDashboard = lazy(() => import('@/components/dashboard/admin/AdminTaskDashboard'));
const ManagementDashboard = lazy(() => import('@/components/dashboard/admin/ManagementDashboard'));
const ToastContainer = lazy(() => import('@/components/ToastContainer'));
const AppModals = lazy(() => import('@/components/AppModals'));


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
    const dummySetTaskCounts = () => {};

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
                    setTaskCounts={isMyTasksVisible ? setTaskCounts : dummySetTaskCounts}
                    userProjects={userProjects}
                />
            </div>

            {(profile.role === 'admin' || profile.role === 'manager') && (
                <div className={adminView === 'taskDashboard' ? 'block' : 'hidden'}>
                    <AdminTaskDashboard
                        profile={profile}
                        lastDataChange={lastDataChange}
                        allUsers={allUsers}
                        onEditTask={modals.task.open}
                        onDeleteTask={taskActions.handleDeleteTask}
                        onClearCancelledTasks={taskActions.handleClearCancelledTasks}
                        onUpdateStatus={taskActions.handleUpdateStatus}
                        onStartTimer={timerActions.handleStartTimer}
                        onStopTimer={timerActions.handleStopTimer}
                        activeTimer={activeTimer}
                        setTaskCounts={adminView === 'taskDashboard' ? setTaskCounts : dummySetTaskCounts}
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
  const { t } = useSettings();
  
  const locallyUpdatedTaskIds = useRef(new Set<number>());
  const [lastDataChange, setLastDataChange] = useState<DataChange | null>(null);
  const notifyDataChange = useCallback((change: Omit<DataChange, 'timestamp'>) => {
    setLastDataChange({ ...change, timestamp: Date.now() });
  }, []);

  const [taskCounts, setTaskCounts] = useState<TaskCounts>({ todo: 0, inprogress: 0, done: 0 });

  const {
      profile, allUsers, loadingProfile, adminView, setAdminView, getProfile, getAllUsers
  } = useProfileAndUsers(session, lastDataChange);

  const { userProjects, handleSaveProject } = useProjects({
      session,
      profile,
      lastDataChange,
      notifyDataChange,
      closeProjectModal: modals.editProject.close,
  });
  
  const { unreadCount, setUnreadCount } = useNotifications(session);

  const {
      activeTimer,
      taskActions,
      timerActions,
  } = useAppActions({
      session,
      setActionModal: modals.action.setState,
      notifyDataChange: notifyDataChange,
      t,
      locallyUpdatedTaskIds,
  });
  
  const canAddTask = !!(session && profile);
  useRealtime({ session, locallyUpdatedTaskIds, notifyDataChange });
  useGlobalShortcuts({ modals, canAddTask });

  const handleIdle = useCallback(() => {
    if (session && navigator.onLine) {
        console.log('User is idle. Refreshing data in the background...');
        notifyDataChange({ type: 'batch_update', payload: { reason: 'idle_refresh' } });
        addToast(t.dataRefreshed, 'info');
    }
  }, [session, notifyDataChange, addToast, t.dataRefreshed]);

  useIdleTimer(handleIdle, 5 * 60 * 1000);

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
        
        <AppModals
            session={session}
            profile={profile}
            allUsers={allUsers}
            userProjects={userProjects}
            modals={modals}
            taskActions={taskActions}
            getProfile={getProfile}
            getAllUsers={getAllUsers}
            setUnreadCount={setUnreadCount}
            handleNotificationClick={handleNotificationClick}
            handleSaveProject={handleSaveProject}
        />
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
```

### 1.2. Dashboards

Components responsible for displaying tasks and management views for different user roles.

#### Employee Dashboard

```typescript
// --- START OF FILE components/dashboard/employee/EmployeeDashboard.tsx ---

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { supabase } from '../../../lib/supabase';
import type { Task, TimeLog, Profile, ProjectMember, Project } from '../../../types';
import type { Session } from '@supabase/supabase-js';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon } from '../../Icons';
import CalendarView from '../../CalendarView';
import PerformanceSummary, { TimeRange } from '../../PerformanceSummary';
import FilterBar, { Filters } from '../../FilterBar';
import type { DataChange, TaskCounts } from '../../../App';
import { type SortConfig, sortTasks } from '../../../lib/taskUtils';
import { useCachedSupabaseQuery } from '../../../hooks/useCachedSupabaseQuery';
import { useTaskFilter } from '../../../hooks/useTaskFilter';
import { TaskBoardSkeleton } from '../../Skeleton';
import TaskColumn from '../../TaskColumn';
import DashboardViewToggle from '../DashboardViewToggle';
import { CalendarSortState } from '../../CalendarView';


interface TaskDashboardProps {
    session: Session;
    lastDataChange: DataChange | null;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onClearCancelledTasks: (tasks: Task[]) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onStartTimer: (task: Task) => void;
    onStopTimer: (timeLog: TimeLog) => void;
    activeTimer: TimeLog | null;
    allUsers: Profile[];
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
    userProjects: ProjectMember[];
}

const EmployeeDashboard: React.FC<TaskDashboardProps> = ({ session, lastDataChange, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, allUsers, setTaskCounts, userProjects }) => {
    const { t, timezone } = useSettings();
    const [view, setView] = useState<'board' | 'calendar'>('board');
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorIds: [], priorities: [], dueDates: [], projectIds: [] });
    const [sortConfigs, setSortConfigs] = useState<{ [key in Task['status']]: SortConfig }>({
        todo: { field: 'priority', direction: 'desc' },
        inprogress: { field: 'priority', direction: 'desc' },
        done: { field: 'updated_at', direction: 'desc' },
        cancelled: { field: 'updated_at', direction: 'desc' },
    });
    
    const [calendarSort, setCalendarSort] = useState<CalendarSortState>({
        id: 'default',
        config: { field: 'compound_status_priority', direction: 'desc' }
    });
    
    const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
    const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const taskQuery = useCallback(() => {
        return supabase
            .from('tasks')
            .select('*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))')
            .or(`user_id.eq.${session.user.id},created_by.eq.${session.user.id}`)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });
    }, [session.user.id]);

    const { data: tasks, loading } = useCachedSupabaseQuery<Task[]>({
        cacheKey: `user_tasks_${session.user.id}`,
        query: taskQuery,
        dependencies: [session.user.id],
        lastDataChange,
    });
    
    const tasks_safe = tasks || [];

    const { tasksForSummaryAndChart } = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        switch (timeRange) {
            case 'today':
                startDate = todayStart;
                endDate = todayEnd;
                break;
            case 'thisWeek':
                const firstDayOfWeek = new Date(todayStart);
                firstDayOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
                startDate = firstDayOfWeek;
                endDate = todayEnd;
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
                break;
            case 'last7':
                startDate = new Date();
                startDate.setDate(todayStart.getDate() - 6);
                startDate.setHours(0,0,0,0);
                endDate = todayEnd;
                break;
            case 'last30':
                startDate = new Date();
                startDate.setDate(todayStart.getDate() - 29);
                startDate.setHours(0,0,0,0);
                endDate = todayEnd;
                break;
            case 'customMonth':
                if (!customMonth) return { tasksForSummaryAndChart: tasks_safe };
                const [year, month] = customMonth.split('-').map(Number);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                if (!customStartDate) return { tasksForSummaryAndChart: tasks_safe };
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
        }

        const filtered = tasks_safe.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        });
        return { tasksForSummaryAndChart: filtered };
    }, [tasks_safe, timeRange, customMonth, customStartDate, customEndDate]);


    const filteredTasksForBoard = useTaskFilter(tasks_safe, filters, timezone);
    
    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = tasks_safe.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== status) {
            onUpdateStatus(taskToMove, status);
        }
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const { todo, inprogress, done, cancelled } = useMemo(() => {
        const grouped = {
            todo: filteredTasksForBoard.filter(t => t.status === 'todo'),
            inprogress: filteredTasksForBoard.filter(t => t.status === 'inprogress'),
            done: filteredTasksForBoard.filter(t => t.status === 'done'),
            cancelled: filteredTasksForBoard.filter(t => t.status === 'cancelled'),
        };
        return {
            todo: sortTasks(grouped.todo, sortConfigs.todo),
            inprogress: sortTasks(grouped.inprogress, sortConfigs.inprogress),
            done: sortTasks(grouped.done, sortConfigs.done),
            cancelled: sortTasks(grouped.cancelled, sortConfigs.cancelled),
        };
    }, [filteredTasksForBoard, sortConfigs]);
    
    useEffect(() => {
        setTaskCounts({
            todo: todo.length,
            inprogress: inprogress.length,
            done: done.length,
        });
    }, [todo, inprogress, done, setTaskCounts]);
    
    const renderBoardColumns = () => {
        const statusConfig = {
            todo: { icon: <ClipboardListIcon size={16} className="text-orange-500" />, borderColor: 'border-orange-500', title: t.todo },
            inprogress: { icon: <SpinnerIcon size={16} className="text-indigo-500 animate-spin" />, borderColor: 'border-indigo-500', title: t.inprogress },
            done: { icon: <CheckCircleIcon size={16} className="text-green-500" />, borderColor: 'border-green-500', title: t.done },
            cancelled: { icon: <XCircleIcon size={16} className="text-gray-500" />, borderColor: 'border-gray-500', title: t.cancelled },
        };
        const columns: { tasks: Task[]; status: Task['status'] }[] = [
            { tasks: todo, status: 'todo' },
            { tasks: inprogress, status: 'inprogress' },
            { tasks: done, status: 'done' },
            { tasks: cancelled, status: 'cancelled' },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
                {columns.map(({ tasks, status }) => (
                    <TaskColumn
                        key={status}
                        status={status}
                        title={statusConfig[status].title}
                        icon={statusConfig[status].icon}
                        borderColor={statusConfig[status].borderColor}
                        tasks={tasks}
                        sortConfig={sortConfigs[status]}
                        onSortChange={(newConfig) => setSortConfigs(prev => ({ ...prev, [status]: newConfig }))}
                        dragOverStatus={dragOverStatus}
                        onDrop={handleDrop}
                        setDragOverStatus={setDragOverStatus}
                        setDraggedTaskId={setDraggedTaskId}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onUpdateStatus={onUpdateStatus}
                        onClearCancelledTasks={onClearCancelledTasks}
                        lastDataChange={lastDataChange}
                    />
                ))}
            </div>
        );
    };

    if (!session) {
         return <div className="text-center p-8">{t.signInToManageTasks}</div>;
    }
    
    const projectsForFilter = userProjects.map(p => p.projects).filter((p): p is Project => p !== null);
    
    return (
        <div className="w-full animate-fadeInUp space-y-6">
            <FilterBar 
                filters={filters} 
                onFilterChange={setFilters} 
                allUsers={allUsers}
                projects={projectsForFilter}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                customMonth={customMonth}
                setCustomMonth={setCustomMonth}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
            >
                <DashboardViewToggle view={view} setView={setView} />
            </FilterBar>

            <PerformanceSummary
                title={t.performanceSummary}
                tasks={tasksForSummaryAndChart}
             />
            
            {loading && tasks_safe.length === 0 ? (
                <TaskBoardSkeleton />
            ) : view === 'board' ? (
                renderBoardColumns()
            ) : (
                <CalendarView
                    tasks={filteredTasksForBoard}
                    onTaskClick={onEditTask}
                    calendarSort={calendarSort}
                    onCalendarSortChange={setCalendarSort}
                />
            )}
        </div>
    );
};

export default EmployeeDashboard;
```

#### Admin & Manager Dashboards

```typescript
// --- START OF FILE components/dashboard/admin/AdminTaskDashboard.tsx ---

import React, { useState, useEffect, useCallback } from 'react';
import type { Profile, Task, TimeLog, Project } from '../../../types';
import type { DataChange, TaskCounts } from '../../../App';
import AllTasksView from './AllTasksView';
import { supabase } from '../../../lib/supabase';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface AdminTaskDashboardProps {
    profile: Profile | null;
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

    const fetchProjects = useCallback(async () => {
        if (!props.profile) return;
        
        let query = supabase.from('projects').select('*');

        if (props.profile.role === 'manager') {
             const { data: memberProjectIds, error: memberError } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('user_id', props.profile.id);
            
            if (memberError) {
                console.error("Error fetching manager's projects:", memberError);
                return;
            }
            const projectIds = memberProjectIds.map(p => p.project_id);
            if (projectIds.length > 0) {
                 query = query.in('id', projectIds);
            } else {
                setAllProjects([]);
                return;
            }
        }

        const { data, error } = await query;
        if (error) {
            console.error("Error fetching projects for admin dashboard:", error);
        } else if (data) {
            setAllProjects(data as Project[]);
        }
    }, [props.profile, setAllProjects]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects, props.lastDataChange]);


    return (
        <div className="w-full animate-fadeInUp">
            <AllTasksView {...props} profile={props.profile} allProjects={allProjects} />
        </div>
    );
};


export default AdminTaskDashboard;

// --- START OF FILE components/dashboard/admin/ManagementDashboard.tsx ---

import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { Project, Profile, ProjectMember } from '../../../types';
import { ProjectIcon, UsersIcon } from '../../Icons';
import { DataChange } from '../../../App';
import UserManagementDashboard from './UserManagementDashboard';
import ProjectManagementDashboard from './ProjectManagementDashboard';
import { supabase } from '../../../lib/supabase';
import { useLocalStorage } from '../../../hooks/useLocalStorage';


interface ManagementDashboardProps {
    allUsers: Profile[];
    onUsersChange: () => void;
    currentUserProfile: Profile | null;
    onEditUser: (user: Profile) => void;
    lastDataChange: DataChange | null;
    onEditProject: (project: Project | null) => void;
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = (props) => {
    const { t } = useSettings();
    const [view, setView] = useState<'users' | 'projects'>('users');
    const [projectMemberships, setProjectMemberships] = useLocalStorage<ProjectMember[]>('admin_project_memberships', []);
    const [projects, setProjects] = useLocalStorage<Project[]>('admin_projects_with_counts', []);
    const [loadingProjects, setLoadingProjects] = useState(projects.length === 0);

    const fetchMemberships = useCallback(async () => {
        const { data, error } = await supabase
            .from('project_members')
            .select('*, projects!inner(*)');
        if (error) {
            console.error("Error fetching all memberships", error);
        } else if (data) {
            setProjectMemberships(data as any);
        }
    }, [setProjectMemberships]);
    
    const fetchProjects = useCallback(async () => {
        if (!props.currentUserProfile) return;

        if (projects.length === 0) {
            setLoadingProjects(true);
        }
        
        let query = supabase.from('projects').select('*, project_members(count)');

        if (props.currentUserProfile.role === 'manager') {
            const { data: memberProjectIds, error: memberError } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('user_id', props.currentUserProfile.id);

            if (memberError) {
                console.error("Error fetching manager's projects:", memberError);
                setLoadingProjects(false);
                return;
            }
            
            const projectIds = memberProjectIds.map(p => p.project_id);
            if (projectIds.length > 0) {
                 query = query.in('id', projectIds);
            } else {
                // If manager is not in any project, set projects to empty and return
                setProjects([]);
                setLoadingProjects(false);
                return;
            }
        }


        const { data, error } = await query;
        if (error) {
            console.error("Error fetching projects", error);
        } else if (data) {
            setProjects(data as Project[]);
        }
        setLoadingProjects(false);
    }, [projects.length, setProjects, props.currentUserProfile]);

    useEffect(() => {
        fetchMemberships();
        fetchProjects();
    }, [fetchMemberships, fetchProjects]);

    useEffect(() => {
        if (props.lastDataChange) {
            if (props.lastDataChange.payload?.table === 'project_members') {
                fetchMemberships();
            }
            if (props.lastDataChange.payload?.table === 'projects' || props.lastDataChange.payload?.table === 'project_members') {
                fetchProjects();
            }
        }
    }, [props.lastDataChange, fetchMemberships, fetchProjects]);
    

    return (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4 w-full animate-fadeInUp">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h2 className="font-bold text-xl flex items-center gap-2">
                    {view === 'users' ? <UsersIcon /> : <ProjectIcon />}
                    {view === 'users' ? `${t.userManagement}` : `${t.projectManagement}`}
                </h2>
                 <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
                    <button onClick={() => setView('users')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 transition-all ${view === 'users' ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}>
                        <UsersIcon size={16} /> {t.userManagement}
                    </button>
                    {(props.currentUserProfile?.role === 'admin' || props.currentUserProfile?.role === 'manager') && (
                        <button onClick={() => setView('projects')} className={`px-4 py-1.5 text-sm font-semibold rounded-full flex items-center gap-2 transition-all ${view === 'projects' ? 'bg-white dark:bg-gray-800 shadow text-[var(--accent-color)]' : 'text-gray-600 dark:text-gray-400'}`}>
                            <ProjectIcon size={16} /> {t.projectManagement}
                        </button>
                    )}
                </div>
            </div>

            {view === 'users' ? (
                <UserManagementDashboard 
                    allUsers={props.allUsers}
                    onUsersChange={props.onUsersChange}
                    currentUserProfile={props.currentUserProfile}
                    onEditUser={props.onEditUser}
                    projectMemberships={projectMemberships}
                />
            ) : (
                (props.currentUserProfile?.role === 'admin' || props.currentUserProfile?.role === 'manager') && (
                    <ProjectManagementDashboard
                        onEditProject={props.onEditProject}
                        projects={projects}
                        loadingProjects={loadingProjects}
                        onProjectsChange={fetchProjects}
                        currentUserProfile={props.currentUserProfile}
                    />
                )
            )}
        </div>
    );
};

export default React.memo(ManagementDashboard);

// --- START OF FILE components/dashboard/admin/AllTasksView.tsx ---

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Profile, Task, Project } from '../../../types';
import { ClipboardListIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon, UsersIcon } from '../../Icons';
import PerformanceSummary, { TimeRange } from '../../PerformanceSummary';
import FilterBar, { Filters } from '../../FilterBar';
import type { DataChange, TaskCounts } from '../../../App';
import { type SortConfig, sortTasks } from '../../../lib/taskUtils';
import { useCachedSupabaseQuery } from '../../../hooks/useCachedSupabaseQuery';
import { useTaskFilter } from '../../../hooks/useTaskFilter';
import { TaskBoardSkeleton } from '../../Skeleton';
import TaskColumn from '../../TaskColumn';
import MultiSelectDropdown from './MultiSelectEmployeeDropdown';

interface AllTasksViewProps {
    profile: Profile | null;
    lastDataChange: DataChange | null;
    allUsers: Profile[];
    allProjects: Project[];
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onClearCancelledTasks: (tasks: Task[]) => void;
    setTaskCounts: React.Dispatch<React.SetStateAction<TaskCounts>>;
}

const AllTasksView: React.FC<AllTasksViewProps> = ({ profile, lastDataChange, allUsers, allProjects, onEditTask, onDeleteTask, onUpdateStatus, onClearCancelledTasks, setTaskCounts }) => {
    const { t, language, timezone } = useSettings();
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);
    const [filters, setFilters] = useState<Filters>({ searchTerm: '', creatorIds: [], priorities: [], dueDates: [], projectIds: [] });
    const [sortConfigs, setSortConfigs] = useState<{ [key in Task['status']]: SortConfig }>({
        todo: { field: 'priority', direction: 'desc' },
        inprogress: { field: 'priority', direction: 'desc' },
        done: { field: 'updated_at', direction: 'desc' },
        cancelled: { field: 'updated_at', direction: 'desc' },
    });
    
    const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
    const [customMonth, setCustomMonth] = useState(new Date().toISOString().slice(0, 7));
    const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const allTasksQuery = useCallback(async () => {
        if (!profile) return { data: [], error: null };

        let query = supabase.from('tasks').select('*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').order('priority', { ascending: false }).order('created_at', { ascending: true });

        if (profile.role === 'manager') {
            const projectIds = allProjects.map(p => p.id);
            if (projectIds.length === 0) {
                 return { data: [], error: null };
            }
            query = query.in('project_id', projectIds);
        }
        
        return query;

    }, [profile, allProjects]);

    const { data: allTasks, loading } = useCachedSupabaseQuery<Task[]>({
        cacheKey: `admin_all_tasks_${profile?.id}`,
        query: allTasksQuery,
        dependencies: [profile, allProjects],
        lastDataChange,
    });
    
    const allTasks_safe = allTasks || [];
    
    const filteredTasksByAssignee = useMemo(() => {
        if (selectedUserIds.length === 0) {
            return allTasks_safe;
        }
        return allTasks_safe.filter(task => selectedUserIds.includes(task.user_id));
    }, [allTasks_safe, selectedUserIds]);

    const { tasksForSummaryAndChart } = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        switch (timeRange) {
            case 'today':
                startDate = todayStart;
                endDate = todayEnd;
                break;
            case 'thisWeek':
                const firstDayOfWeek = new Date(todayStart);
                firstDayOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
                startDate = firstDayOfWeek;
                endDate = todayEnd;
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
                break;
            case 'last7':
                startDate = new Date();
                startDate.setDate(todayStart.getDate() - 6);
                startDate.setHours(0,0,0,0);
                endDate = todayEnd;
                break;
            case 'last30':
                startDate = new Date();
                startDate.setDate(todayStart.getDate() - 29);
                startDate.setHours(0,0,0,0);
                endDate = todayEnd;
                break;
            case 'customMonth':
                if (!customMonth) return { tasksForSummaryAndChart: filteredTasksByAssignee };
                const [year, month] = customMonth.split('-').map(Number);
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                if (!customStartDate) return { tasksForSummaryAndChart: filteredTasksByAssignee };
                startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = customEndDate ? new Date(customEndDate) : new Date(customStartDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = todayEnd;
        }

        const filtered = filteredTasksByAssignee.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        });
        return { tasksForSummaryAndChart: filtered };
    }, [filteredTasksByAssignee, timeRange, customMonth, customStartDate, customEndDate]);


    const filteredTasksForBoard = useTaskFilter(filteredTasksByAssignee, filters, timezone);


    const handleDrop = (status: Task['status']) => {
        if (draggedTaskId === null) return;
        const taskToMove = allTasks_safe.find(t => t.id === draggedTaskId);
        if (taskToMove && taskToMove.status !== status) {
            onUpdateStatus(taskToMove, status);
        }
        setDraggedTaskId(null);
        setDragOverStatus(null);
    };

    const { todo, inprogress, done, cancelled } = useMemo(() => {
        const grouped = {
            todo: filteredTasksForBoard.filter(t => t.status === 'todo'),
            inprogress: filteredTasksForBoard.filter(t => t.status === 'inprogress'),
            done: filteredTasksForBoard.filter(t => t.status === 'done'),
            cancelled: filteredTasksForBoard.filter(t => t.status === 'cancelled'),
        };
        return {
            todo: sortTasks(grouped.todo, sortConfigs.todo),
            inprogress: sortTasks(grouped.inprogress, sortConfigs.inprogress),
            done: sortTasks(grouped.done, sortConfigs.done),
            cancelled: sortTasks(grouped.cancelled, sortConfigs.cancelled),
        };
    }, [filteredTasksForBoard, sortConfigs]);
    
    useEffect(() => {
        setTaskCounts({
            todo: todo.length,
            inprogress: inprogress.length,
            done: done.length,
        });
    }, [todo, inprogress, done, setTaskCounts]);
    
    const getEmployeeLabel = (selectedCount: number, totalCount: number) => {
        if (selectedCount === 0 || selectedCount === totalCount) {
          return t.allEmployees;
        }
        if (selectedCount === 1) {
            const user = allUsers.find(u => u.id === selectedUserIds[0]);
            return user?.full_name || `1 ${t.employee}`;
        }
        const pluralEmployee = language === 'vi' ? t.employee : `${t.employee}s`;
        return `${selectedCount}/${allUsers.length} ${pluralEmployee}`;
    };

    const statusConfig = {
        todo: { icon: <ClipboardListIcon size={16} className="text-orange-500" />, borderColor: 'border-orange-500', title: t.todo },
        inprogress: { icon: <SpinnerIcon size={16} className="text-indigo-500 animate-spin" />, borderColor: 'border-indigo-500', title: t.inprogress },
        done: { icon: <CheckCircleIcon size={16} className="text-green-500" />, borderColor: 'border-green-500', title: t.done },
        cancelled: { icon: <XCircleIcon size={16} className="text-gray-500" />, borderColor: 'border-gray-500', title: t.cancelled },
    };
    const columns: { tasks: Task[]; status: Task['status'] }[] = [
        { tasks: todo, status: 'todo' },
        { tasks: inprogress, status: 'inprogress' },
        { tasks: done, status: 'done' },
        { tasks: cancelled, status: 'cancelled' },
    ];

    return (
        <div className="w-full">
            <div className="space-y-6">
                 <FilterBar 
                    filters={filters} 
                    onFilterChange={setFilters} 
                    allUsers={allUsers}
                    projects={allProjects}
                    timeRange={timeRange}
                    setTimeRange={setTimeRange}
                    customMonth={customMonth}
                    setCustomMonth={setCustomMonth}
                    customStartDate={customStartDate}
                    setCustomStartDate={setCustomStartDate}
                    customEndDate={customEndDate}
                    setCustomEndDate={setCustomEndDate}
                >
                    <MultiSelectDropdown
                        options={allUsers.map(u => ({ id: u.id, label: u.full_name || '', avatarUrl: u.avatar_url || undefined }))}
                        selectedIds={selectedUserIds}
                        onChange={setSelectedUserIds}
                        buttonLabel={getEmployeeLabel}
                        buttonIcon={<UsersIcon size={16} />}
                        searchPlaceholder={t.searchUsers}
                        allLabel={t.allEmployees}
                    />
                </FilterBar>
                <PerformanceSummary
                    title={t.allTasksBoard}
                    tasks={tasksForSummaryAndChart}
                />
                {loading && allTasks_safe.length === 0 ? <TaskBoardSkeleton /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
                        {columns.map(({ tasks, status }) => (
                            <TaskColumn
                                key={status}
                                status={status}
                                title={statusConfig[status].title}
                                icon={statusConfig[status].icon}
                                borderColor={statusConfig[status].borderColor}
                                tasks={tasks}
                                sortConfig={sortConfigs[status]}
                                onSortChange={(newConfig) => setSortConfigs(prev => ({ ...prev, [status]: newConfig }))}
                                dragOverStatus={dragOverStatus}
                                onDrop={handleDrop}
                                setDragOverStatus={setDragOverStatus}
                                setDraggedTaskId={setDraggedTaskId}
                                onEditTask={onEditTask}
                                onDeleteTask={onDeleteTask}
                                onUpdateStatus={onUpdateStatus}
                                onClearCancelledTasks={onClearCancelledTasks}
                                lastDataChange={lastDataChange}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(AllTasksView);
```

### 1.3. Core Task & Board Components

These components are the building blocks of the Kanban board.

```typescript
// --- START OF FILE components/TaskColumn.tsx ---

import React, { useRef } from 'react';
import { Task } from '../types';
import { useSettings } from '../context/SettingsContext';
import { type SortConfig } from '../lib/taskUtils';
import SortDropdown from './SortDropdown';
import TaskCard from './TaskCard';
import { TrashIcon } from './Icons';
import VirtualItem from './common/VirtualItem';
import { TaskCardSkeleton } from './Skeleton';
import { DataChange } from '@/App';

interface TaskColumnProps {
    status: Task['status'];
    title: string;
    icon: React.ReactNode;
    borderColor: string;
    tasks: Task[];
    sortConfig: SortConfig;
    dragOverStatus: Task['status'] | null;
    lastDataChange: DataChange | null;
    onDrop: (status: Task['status']) => void;
    setDragOverStatus: (status: Task['status'] | null) => void;
    setDraggedTaskId: (taskId: number | null) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => Promise<boolean>;
    onSortChange: (newConfig: SortConfig) => void;
    onClearCancelledTasks?: (tasks: Task[]) => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({
    status,
    title,
    icon,
    borderColor,
    tasks,
    sortConfig,
    dragOverStatus,
    lastDataChange,
    onDrop,
    setDragOverStatus,
    setDraggedTaskId,
    onEditTask,
    onDeleteTask,
    onUpdateStatus,
    onSortChange,
    onClearCancelledTasks,
}) => {
    const { t } = useSettings();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            onDrop={() => onDrop(status)}
            onDragOver={(e) => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus(null)}
            className={`bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col transition-colors duration-200 ${dragOverStatus === status ? 'bg-sky-100 dark:bg-sky-900/30' : ''}`}
        >
            <h3 className={`font-bold text-gray-700 dark:text-gray-300 px-2 pb-2 border-b-2 ${borderColor} flex-shrink-0 flex items-center justify-between gap-2`}>
                <div className="flex items-center gap-2">
                    {icon}
                    <span>{title} ({tasks.length})</span>
                </div>
                <div className="flex items-center">
                    {status === 'cancelled' && tasks.length > 0 && onClearCancelledTasks && (
                        <button
                            onClick={() => onClearCancelledTasks(tasks)}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title={t.clearCancelledTasksTitle}
                        >
                            <TrashIcon size={14} />
                        </button>
                    )}
                    <SortDropdown
                        status={status}
                        config={sortConfig}
                        onChange={onSortChange}
                    />
                </div>
            </h3>
            <div ref={scrollContainerRef} className="mt-4 space-y-3 flex-grow overflow-y-auto">
                {tasks.map(task => (
                    <VirtualItem key={task.id} placeholder={<TaskCardSkeleton />} rootRef={scrollContainerRef}>
                        <TaskCard
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            onUpdateStatus={onUpdateStatus}
                            onDragStart={setDraggedTaskId}
                            assignee={task.assignee}
                            creator={task.creator}
                            lastDataChange={lastDataChange}
                        />
                    </VirtualItem>
                ))}
                {tasks.length === 0 && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 p-4">{t.noTasksFound}</p>
                )}
            </div>
        </div>
    );
}

export default React.memo(TaskColumn);

// --- START OF FILE components/TaskCard.tsx ---

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Task, Profile } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { TrashIcon, EditIcon, ClockIcon, PlayIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, PaperclipIcon, ArrowRightIcon, ChatBubbleIcon, CheckIcon } from '@/components/Icons';
import PriorityIndicator from '@/components/common/PriorityIndicator';
import Avatar from '@/components/common/Avatar';
import { PROJECT_COLORS } from '@/constants';
import { getTodayDateString } from '@/lib/taskUtils';
import { DataChange } from '@/App';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onDragStart: (taskId: number) => void;
    assignee?: Profile | null;
    creator?: Profile | null;
    lastDataChange: DataChange | null;
}

const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatExactTime = (dateString: string, lang: string, timezone: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: timezone,
        hour12: false,
    };
    const formatted = new Intl.DateTimeFormat('vi-VN', options).format(date);
    const parts = formatted.split(', ');
    if (parts.length === 2) {
        return `${parts[1]} ${parts[0]}`;
    }
    return formatted; // Fallback
};

const formatShortDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    };
    return new Intl.DateTimeFormat('vi-VN', options).format(date);
};


const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onUpdateStatus, onDragStart, assignee, creator, lastDataChange }) => {
    const { t, language, timezone } = useSettings();
    const [duration, setDuration] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        if (lastDataChange && lastDataChange.type === 'update' && lastDataChange.payload.id === task.id) {
            // Check if the update was recent to avoid highlighting on stale re-renders
            if (Date.now() - lastDataChange.timestamp < 1500) {
                 setIsHighlighted(true);
                 const timer = setTimeout(() => setIsHighlighted(false), 1500); // Match animation duration
                 return () => clearTimeout(timer);
            }
        }
    }, [lastDataChange, task.id]);


    const isDone = task.status === 'done';
    const isCancelled = task.status === 'cancelled';
    const isArchived = isDone || isCancelled;

    const isOverdue = useMemo(() => {
        if (isArchived || !task.due_date) return false;
        const todayInUserTz = getTodayDateString(timezone);
        return task.due_date < todayInUserTz;
    }, [task.due_date, isArchived, timezone]);

    const isToday = useMemo(() => {
        if (isArchived || !task.due_date) return false;
        const todayInUserTz = getTodayDateString(timezone);
        return task.due_date === todayInUserTz;
    }, [task.due_date, isArchived, timezone]);
    
    const dueDateClasses = useMemo(() => {
        if (isOverdue) return 'text-red-500 dark:text-red-400 font-semibold';
        if (isToday) return 'text-amber-600 dark:text-amber-400 font-semibold';
        return '';
    }, [isOverdue, isToday]);

    useEffect(() => {
        let interval: number | undefined;

        if (isArchived) {
            const start = new Date(task.created_at).getTime();
            const end = new Date(task.updated_at).getTime();
            setDuration(Math.max(0, end - start));
            if (interval) clearInterval(interval);
        } else {
            const start = new Date(task.created_at).getTime();
            const updateDuration = () => {
                setDuration(Date.now() - start);
            };
            updateDuration();
            interval = window.setInterval(updateDuration, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [task.created_at, task.updated_at, task.status, isArchived]);
    
    const cardDynamicStyles = useMemo(() => {
        const classes = [];
        if (isArchived) {
            classes.push('opacity-60');
        }
        
        if (task.priority === 'high' && !isArchived) {
            classes.push('animate-breathingGlowRed');
        } else if (task.status === 'inprogress' && !isArchived) {
            classes.push('border-sky-500');
        }
        
        return classes.join(' ');
    }, [task.priority, task.status, isArchived]);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(task);
    };

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`#${task.id.toString().padStart(4, '0')}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    
    const project = task.projects;
    const projectName = project ? project.name : t.personalProject;
    const projectColor = project ? (project.color || PROJECT_COLORS[project.id % PROJECT_COLORS.length]) : '#6b7280'; // gray-500 for Personal

    return (
        <div 
            className={`relative bg-white dark:bg-gray-900/70 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 animate-fadeIn flex flex-col gap-2 transition-all ${cardDynamicStyles} ${isHighlighted ? 'animate-highlight-update' : ''}`}
            draggable={!isArchived}
            onDragStart={() => onDragStart(task.id)}
        >
            {/* Row 1: ID, Actions */}
            <div className="flex justify-between items-center gap-2">
                <div className="relative flex-shrink-0">
                    <button
                        onClick={handleCopyId}
                        title={t.copyTaskId}
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full transition-all duration-300
                        ${copied
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color-dark)]'
                        }`
                    }
                    >
                        {copied ? (
                            <span className="flex items-center gap-1">
                                <CheckIcon size={12} />
                                Copied!
                            </span>
                        ) : (
                            `#${task.id.toString().padStart(4, '0')}`
                        )}
                    </button>
                </div>
                
                <div 
                    className="flex items-center gap-0.5 flex-shrink-0"
                    draggable="false"
                >
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" title={t.editTask}><EditIcon size={14}/></button>
                    {!isArchived && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task, 'inprogress'); }} title={t.tasksInProgress} disabled={task.status === 'inprogress'} className="p-1.5 rounded-full text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed"><PlayIcon size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task, 'done'); }} title={t.tasksDone} className="p-1.5 rounded-full text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"><CheckCircleIcon size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(task, 'cancelled'); }} title={t.cancelTask} className="p-1.5 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"><XCircleIcon size={14}/></button>
                        </>
                    )}
                    <button onClick={handleDeleteClick} className="p-1.5 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" title={t.deleteTask}><TrashIcon size={14}/></button>
                </div>
            </div>
            
            {/* Row 2: Title */}
            <h4 className={`font-bold text-gray-800 dark:text-gray-200 break-words ${isCancelled ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                {task.title}
            </h4>

            {/* Row 3: Description */}
            {task.description && (
                <p className={`text-sm text-gray-600 dark:text-gray-400 break-words ${isCancelled ? 'line-through' : ''}`}>{task.description}</p>
            )}

            {/* Row 4: Priority, Project (left) | Comments, Attachments, Assignee (right) */}
            <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <PriorityIndicator priority={task.priority} />
                    <div title={projectName} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: projectColor }}></span>
                        <span className="truncate max-w-[100px]">{projectName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {task.task_comments && task.task_comments.length > 0 && (
                        <div title={`${task.task_comments.length} ${t.comments}`} className="flex items-center gap-1">
                            <ChatBubbleIcon size={12} />
                            <span>{task.task_comments.length}</span>
                        </div>
                    )}
                    {task.task_attachments && task.task_attachments.length > 0 && (
                        <div title={`${task.task_attachments.length} ${t.attachments}`} className="flex items-center gap-1">
                            <PaperclipIcon size={12} />
                            <span>{task.task_attachments.length}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        {creator && creator.id !== assignee?.id && (
                            <>
                                <Avatar user={creator} title={`${t.createdBy}: ${creator.full_name}`} size={20} />
                                <ArrowRightIcon size={12} className="text-gray-400" />
                            </>
                        )}
                        {assignee && <Avatar user={assignee} title={`${t.assignee}: ${assignee.full_name}`} size={20} />}
                    </div>
                </div>
            </div>

            {/* Row 5: Creation/Completion Time, Total Logged Time, Due Date */}
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700/50 pt-2 mt-1">
                {isArchived ? (
                    <span className="tabular-nums flex items-center gap-1" title={t.completionDate}>
                        {isDone ? (
                            <span className="text-sm" role="img" aria-label="flag">🚩</span>
                        ) : ( // isCancelled
                            <span className="text-sm" role="img" aria-label="prohibited">🚫</span>
                        )}
                        {formatExactTime(task.updated_at, language, timezone)}
                    </span>
                ) : (
                    <span className="tabular-nums flex items-center gap-1" title={t.creationTime}>
                        <span role="img" aria-label="rocket" className="text-sm">🚀</span>
                        {formatExactTime(task.created_at, language, timezone)}
                    </span>
                )}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-300" title={t.totalTimeLogged}>
                        <ClockIcon size={12} className={task.status === 'inprogress' ? 'text-sky-500' : ''}/>
                        <span>{formatDuration(duration)}</span>
                    </div>
                    {task.due_date && (
                        <div title={t.dueDateLabel} className={`flex items-center gap-1 ${dueDateClasses}`}>
                            {isOverdue ? (
                                <span className="animate-gentle-shake text-sm">⏰</span>
                            ) : isToday ? (
                                <span className="animate-gentle-shake text-sm">🔥</span>
                            ) : (
                                <CalendarIcon size={12} />
                            )}
                            <span>{formatShortDate(task.due_date)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(TaskCard);
```

### 1.4. Task Creation/Editing Modal

This is the modal and its sub-components for creating and editing tasks.

```typescript
// --- START OF FILE components/TaskModal.tsx ---

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { XIcon, SpinnerIcon, SettingsIcon } from '@/components/Icons';
import { useSettings } from '@/context/SettingsContext';
import { Task, TaskAttachment, Profile, TaskComment, ProjectMember, Project } from '@/types';
import { supabase } from '@/lib/supabase';
import { useToasts } from '@/context/ToastContext';

import TaskDetailsForm from '@/components/task-modal/TaskDetailsForm';
import AttachmentSection from '@/components/task-modal/AttachmentSection';
import CommentSection, { TempComment } from '@/components/task-modal/CommentSection';
import TaskStatusStepper from '@/components/task-modal/TaskStatusStepper';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>, newFiles: File[], deletedAttachmentIds: number[], newComments: string[]) => Promise<void>;
  task: Task | Partial<Task> | null;
  allUsers: Profile[];
  currentUser: Profile | null;
  userProjects: ProjectMember[];
  onOpenDefaults: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task, allUsers, currentUser, userProjects, onOpenDefaults }) => {
  const { t, defaultDueDateOffset, timezone, defaultPriority } = useSettings();
  const { addToast } = useToasts();
  
  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('personal');

  // State for attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([]);
  
  // State for comments
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [tempNewComments, setTempNewComments] = useState<TempComment[]>([]);
  const [optimisticComments, setOptimisticComments] = useState<TempComment[]>([]);
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // Modal/logic state
  const [isSaving, setIsSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null | undefined>(undefined);
  const [validationError, setValidationError] = useState<'title' | 'assignee' | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<Profile[]>(allUsers);

  const modalRef = useRef<HTMLDivElement>(null);
  
  const projectsForSelect = useMemo(() => userProjects.map(p => p.projects).filter((p): p is Project => p !== null), [userProjects]);

  const fetchComments = useCallback(async (taskId: number) => {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*, profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data as TaskComment[]);
    }
  }, []);
  
  useEffect(() => {
    if (isOpen) {
        const currentTaskId = task && 'id' in task ? task.id : null;
        if (currentTaskId !== editingTaskId) {
            if (task && 'id' in task) { // Editing existing task
                setTitle(task.title || '');
                setDescription(task.description || '');
                setStatus(task.status || 'todo');
                setPriority(task.priority || 'medium');
                setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
                setAttachments(task.task_attachments || []);
                setAssigneeId(task.user_id || '');
                setProjectId(task.project_id?.toString() || 'personal');
                fetchComments(task.id);
                setTempNewComments([]);
                setOptimisticComments([]);
            } else { // New task
                setTitle('');
                setDescription('');
                setStatus('todo');
                setPriority(defaultPriority);
                
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + defaultDueDateOffset);
                const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
                setDueDate(formatter.format(targetDate));
                
                setAttachments([]);
                setComments([]);
                setTempNewComments([]);
                setOptimisticComments([]);
                setAssigneeId(task?.user_id || currentUser?.id || '');
                const latestProject = userProjects.length > 0 ? userProjects[0] : null;
                setProjectId(
                    currentUser?.default_project_id?.toString() ||
                    latestProject?.project_id.toString() ||
                    'personal'
                );
            }
            setNewFiles([]);
            setDeletedAttachmentIds([]);
            setEditingTaskId(currentTaskId);
            setValidationError(null);
        }
    } else {
        if (editingTaskId !== undefined) {
             setEditingTaskId(undefined);
        }
    }
  }, [task, isOpen, defaultDueDateOffset, currentUser, fetchComments, editingTaskId, timezone, defaultPriority, userProjects]);
  
   useEffect(() => {
        if (!isOpen || !currentUser) return;

        const updateAssignableUsers = async () => {
            if (projectId === 'personal') {
                const self = allUsers.find(u => u.id === currentUser.id);
                const assignable = self ? [self] : [];
                setAssignableUsers(assignable);
                if (assigneeId !== currentUser.id) {
                    setAssigneeId(currentUser.id);
                }
                return;
            }

            if (currentUser.role === 'admin') {
                setAssignableUsers(allUsers);
                return;
            }

            const { data, error } = await supabase
                .from('project_members')
                .select('profiles!inner(*)')
                .eq('project_id', parseInt(projectId, 10));

            if (error) {
                console.error("Error fetching project members:", error);
                addToast("Could not load project members.", "error");
                setAssignableUsers([]);
            } else {
                const members = data.map(item => item.profiles) as Profile[];
                setAssignableUsers(members);
                
                const isCurrentAssigneeValid = members.some(m => m.id === assigneeId);
                if (!isCurrentAssigneeValid) {
                    const isCurrentUserMember = members.some(m => m.id === currentUser.id);
                    setAssigneeId(isCurrentUserMember ? currentUser.id : '');
                }
            }
        };

        updateAssignableUsers();
    }, [projectId, allUsers, currentUser, isOpen, addToast, assigneeId]);


  useEffect(() => {
    if (validationError === 'title' && title.trim()) setValidationError(null);
    if (validationError === 'assignee' && assigneeId) setValidationError(null);
  }, [title, assigneeId, validationError]);

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.files;
    if (items) {
      const files = Array.from(items);
      if (files.length > 0) setNewFiles(prev => [...prev, ...files]);
    }
  }, []);

  useEffect(() => {
    const currentModalRef = modalRef.current;
    if (isOpen && currentModalRef) {
        currentModalRef.addEventListener('paste', handlePaste as EventListener);
        return () => currentModalRef.removeEventListener('paste', handlePaste as EventListener);
    }
  }, [isOpen, handlePaste]);
  
  const handlePostComment = async (content: string) => {
    if (!content.trim() || !currentUser) return;
    const isNewTask = !task || !('id' in task);
    
    if (isNewTask) {
        setTempNewComments(prev => [...prev, {
            id: `temp-${Date.now()}`,
            content: content,
            profiles: currentUser,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            task_id: 0,
        }]);
    } else {
        setIsPostingComment(true);
        // FIX: Add missing properties `created_at` and `task_id` to satisfy the TempComment interface.
        const tempComment: TempComment = {
            id: `optimistic-${Date.now()}`,
            content: content,
            profiles: currentUser,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            task_id: (task as Task).id,
            isSending: true,
        };
        setOptimisticComments(prev => [...prev, tempComment]);
        
        try {
            const { error } = await supabase.from('task_comments').insert({
                task_id: (task as Task).id,
                user_id: currentUser.id,
                content: content
            });
            if (error) throw error;
            
            // Refetch comments to get the real one from DB
            await fetchComments((task as Task).id);

        } catch (error: any) {
            console.error("Error posting comment:", error.message);
            addToast(`Error posting comment: ${error.message}`, 'error');
            // Remove optimistic comment on failure
            setOptimisticComments(prev => prev.filter(c => c.id !== tempComment.id));
        } finally {
            setIsPostingComment(false);
            // In case of success, the optimistic comment will be replaced by the real one from fetchComments
            // so we always remove it
            setOptimisticComments(prev => prev.filter(c => c.id !== tempComment.id));
        }
    }
  };

  const handleSaveClick = async () => {
    if (!title.trim()) {
      setValidationError('title');
      return;
    }
    if (!assigneeId) {
      setValidationError('assignee');
      return;
    }

    setIsSaving(true);
    
    const taskData: Partial<Task> = {
      title,
      description,
      status,
      priority,
      due_date: dueDate || null,
      user_id: assigneeId,
      project_id: projectId === 'personal' ? null : parseInt(projectId, 10),
    };

    const newCommentContents = tempNewComments.map(c => c.content);

    await onSave(taskData, newFiles, deletedAttachmentIds, newCommentContents);
    setIsSaving(false);
  };
  
  if (!isOpen) return null;

  const combinedComments = [...comments, ...tempNewComments, ...optimisticComments];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl transform transition-all duration-300 ease-out animate-fadeInUp my-auto max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 id="task-modal-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {editingTaskId ? t.editTask : t.addNewTask}
          </h2>
          <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onOpenDefaults}
                aria-label="Open task default settings"
                title="Task Defaults"
                className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
              <SettingsIcon size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={t.close}
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
            <div className="p-4 md:p-6">
                <TaskStatusStepper currentStatus={status} onStatusChange={setStatus} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-6">
                <div className="space-y-4">
                     <TaskDetailsForm
                        taskData={{ title, description, priority, dueDate, assigneeId, projectId }}
                        onFieldChange={(field, value) => {
                            if (field === 'title') setTitle(value as string);
                            if (field === 'description') setDescription(value as string);
                            if (field === 'priority') setPriority(value as Task['priority']);
                            if (field === 'dueDate') setDueDate(value as string);
                            if (field === 'assigneeId') setAssigneeId(value as string);
                            if (field === 'projectId') setProjectId(value as string);
                        }}
                        allUsers={assignableUsers}
                        userProjects={projectsForSelect}
                        validationError={validationError}
                    />
                    <AttachmentSection 
                        attachments={attachments} 
                        newFiles={newFiles}
                        onAddNewFiles={(files) => setNewFiles(prev => [...prev, ...files])}
                        onRemoveNewFile={(index) => setNewFiles(prev => prev.filter((_, i) => i !== index))}
                        onRemoveExistingAttachment={(id) => {
                            setDeletedAttachmentIds(prev => [...prev, id]);
                            setAttachments(prev => prev.filter(att => att.id !== id));
                        }}
                        isSaving={isSaving}
                    />
                </div>
                <div>
                  <CommentSection 
                      comments={combinedComments} 
                      onPostComment={handlePostComment}
                      isPostingComment={isPostingComment}
                  />
                </div>
            </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end items-center space-x-3 rounded-b-2xl flex-shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.cancel}</button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-4 py-2 w-24 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-md shadow-md flex justify-center items-center disabled:opacity-50"
          >
            {isSaving ? <SpinnerIcon size={20} className="animate-spin" /> : t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
```

#### Task Modal Sub-components

```typescript
// --- START OF FILE components/task-modal/TaskDetailsForm.tsx ---

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Task, Profile, Project } from '../../types';
import { ChevronDownIcon } from '../../components/Icons';
import StatusPrioritySelect, { CustomSelectOption } from '../common/StatusPrioritySelect';
import AssigneeSelect from '../common/AssigneeSelect';
import { PROJECT_COLORS } from '../../constants';


interface TaskDetailsFormProps {
    taskData: {
        title: string;
        description: string;
        priority: Task['priority'];
        dueDate: string;
        assigneeId: string;
        projectId: string;
    };
    onFieldChange: (field: keyof TaskDetailsFormProps['taskData'], value: string | Task['priority']) => void;
    allUsers: Profile[];
    userProjects: Project[];
    validationError: 'title' | 'assignee' | null;
}

const TaskDetailsForm: React.FC<TaskDetailsFormProps> = ({ taskData, onFieldChange, allUsers, userProjects, validationError }) => {
    const { t } = useSettings();

    const [isProjectOpen, setIsProjectOpen] = useState(false);
    const projectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
                setIsProjectOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const projectOptions = useMemo(() => [
        { id: 'personal', name: t.personalProject, color: '#6b7280' },
        ...userProjects.map(p => ({ id: p.id.toString(), name: p.name, color: p.color || PROJECT_COLORS[p.id % PROJECT_COLORS.length] }))
    ], [userProjects, t]);

    const selectedProject = projectOptions.find(p => p.id === taskData.projectId) || projectOptions[0];

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
                    <label htmlFor="project" className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t.project}</label>
                     <div className="relative mt-1" ref={projectRef}>
                        <button type="button" onClick={() => setIsProjectOpen(!isProjectOpen)} className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left">
                            <div className="flex items-center gap-2">
                                {selectedProject && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedProject.color }}></span>}
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedProject?.name || 'Select Project'}</span>
                            </div>
                            <ChevronDownIcon size={16} className="text-gray-400" />
                        </button>
                        {isProjectOpen && (
                            <div className="absolute z-20 top-full mt-1 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-md shadow-lg border dark:border-gray-600 animate-fadeIn max-h-48 overflow-y-auto">
                                {projectOptions.map((option) => (
                                    <button key={option.id} type="button" onClick={() => { onFieldChange('projectId', option.id); setIsProjectOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }}></span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{option.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
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

// --- START OF FILE components/task-modal/AttachmentSection.tsx ---

import React, { useState, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';
import { TaskAttachment } from '../../types';
import { PaperclipIcon } from '../../components/Icons';
import AttachmentItem from './attachments/AttachmentItem';
import AttachmentPreviewModal from './attachments/AttachmentPreviewModal';


interface AttachmentSectionProps {
    attachments: TaskAttachment[];
    newFiles: File[];
    onAddNewFiles: (files: File[]) => void;
    onRemoveNewFile: (index: number) => void;
    onRemoveExistingAttachment: (id: number) => void;
    isSaving: boolean;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
    attachments,
    newFiles,
    onAddNewFiles,
    onRemoveNewFile,
    onRemoveExistingAttachment,
    isSaving
}) => {
    const { t } = useSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

    const getPublicUrl = (filePath: string) => {
        const { data } = supabase.storage.from('task-attachments').getPublicUrl(filePath);
        return data.publicUrl;
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onAddNewFiles(Array.from(e.target.files));
        }
    };

    return (
        <div>
            <label className="hidden md:block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.attachments}</label>
            <div className="flex items-stretch gap-2 sm:gap-3">
                <div className="flex-grow border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
                    <p>{t.pasteOrDrop}</p>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors">
                    <PaperclipIcon size={14} /> <span>{t.addAttachment}</span>
                </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
            <div className="space-y-2 mt-2">
                {attachments.map(att => {
                    const attachmentWithUrl = { ...att, name: att.file_name, size: att.file_size, dataUrl: getPublicUrl(att.file_path) };
                    return <AttachmentItem key={att.id} file={attachmentWithUrl} onRemove={() => onRemoveExistingAttachment(att.id)} isNew={false} onPreview={() => setPreviewAttachment(attachmentWithUrl)} isSaving={false} />;
                })}
                {newFiles.map((file, index) => {
                    const fileWithUrl = { name: file.name, size: file.size, file_type: file.type, dataUrl: URL.createObjectURL(file) };
                    return <AttachmentItem key={index} file={fileWithUrl} onRemove={() => onRemoveNewFile(index)} isNew={true} onPreview={() => setPreviewAttachment(fileWithUrl)} isSaving={isSaving} />;
                })}
            </div>
            {previewAttachment && <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />}
        </div>
    );
};

export default AttachmentSection;

// --- START OF FILE components/task-modal/CommentSection.tsx ---

import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { TaskComment, Profile } from '../../types';
import { formatAbsoluteDateTime } from '../../lib/taskUtils';
import { ChatBubbleIcon, SendIcon, SpinnerIcon } from '../../components/Icons';
import Avatar from '../common/Avatar';

export interface TempComment {
    id: string;
    content: string;
    profiles: Profile;
    user_id: string;
    created_at: string;
    task_id: number;
    isSending?: boolean;
}

interface CommentSectionProps {
    comments: (TaskComment | TempComment)[];
    onPostComment: (comment: string) => Promise<void>;
    isPostingComment: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onPostComment, isPostingComment }) => {
    const { t, language, timezone } = useSettings();
    const [newComment, setNewComment] = useState('');
    const [isCommentInputVisible, setCommentInputVisible] = useState(false);

    const handlePost = async () => {
        if (!newComment.trim()) return;
        await onPostComment(newComment);
        setNewComment('');
    };

    return (
        <div className="flex flex-col h-full">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.comments} ({comments.length})</label>
            <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-3 overflow-y-auto min-h-[80px] md:min-h-[400px]">
                {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                        <ChatBubbleIcon size={32} className="mb-2 opacity-50" />
                        <p className="text-sm font-medium">{t.noCommentsYet}</p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={`flex items-start gap-2.5 transition-opacity ${'isSending' in comment && comment.isSending ? 'opacity-60' : ''}`}>
                            <div className="flex-shrink-0">
                                <Avatar user={comment.profiles} title={comment.profiles.full_name || ''} size={28} />
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{comment.profiles?.full_name}</span>
                                    <time className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                        {'isSending' in comment && comment.isSending ? 'Sending...' : formatAbsoluteDateTime(comment.created_at, language, timezone)}
                                    </time>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-2">
                {isCommentInputVisible ? (
                    <div className="flex items-center gap-2">
                        <textarea
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder={t.addComment}
                            rows={1}
                            autoFocus
                            disabled={isPostingComment}
                            className="flex-grow block px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm resize-none disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        />
                        <button
                            type="button"
                            onClick={handlePost}
                            disabled={isPostingComment || !newComment.trim()}
                            className="p-2 rounded-full text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] disabled:opacity-50 transition-opacity transform hover:scale-110"
                            aria-label={t.post}
                        >
                            {isPostingComment ? <SpinnerIcon size={20} className="animate-spin" /> : <SendIcon size={20} />}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setCommentInputVisible(true)}
                        className="w-full text-left px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:border-[var(--accent-color)] dark:hover:border-[var(--accent-color-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] text-sm transition-colors"
                    >
                        {t.addComment}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
```

### 1.5. Data Display & Summary

Components for displaying data in different formats, like calendars and performance summaries.

```typescript
// --- START OF FILE components/CalendarView.tsx ---

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@/components/Icons';
import { type SortConfig, sortTasks } from '@/lib/taskUtils';
import CalendarSortDropdown from '@/components/CalendarSortDropdown';

export type CalendarSortState = { id: 'default' | 'status' | 'priority' | 'creation_date'; config: SortConfig; };

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  calendarSort: CalendarSortState;
  onCalendarSortChange: (state: CalendarSortState) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick, calendarSort, onCalendarSortChange }) => {
  const { language, t } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => currentDate.getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2023, 0, i + 1); // A non-leap year starting on Sunday
      return formatter.format(d);
    });
  }, [language]);

  const { monthName, year, days, monthEmoji } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = new Intl.DateTimeFormat(language, { month: 'long' }).format(currentDate);
    const monthEmojis = ["❄️", "💖", "🍀", "🌧️", "🎓", "🌤️", "🏖️", "🏝️", "📚", "🎃", "🍁", "🎄"];
    const monthEmoji = monthEmojis[month];

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const daysInMonth = [];
    // Add padding for days from the previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }
    // Add days of the current month
    for (let i = 1; i <= totalDays; i++) {
      daysInMonth.push(new Date(year, month, i));
    }
    return { monthName, year, days: daysInMonth, monthEmoji };
  }, [currentDate, language]);

  const pickerMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(pickerYear, i).toLocaleString(language, { month: 'short' })), [pickerYear, language]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
            setIsMonthPickerOpen(false);
        }
    };
    if (isMonthPickerOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMonthPickerOpen]);

  useEffect(() => {
    setPickerYear(currentDate.getFullYear());
  }, [currentDate]);

  const sortedTasks = useMemo(() => {
    return sortTasks(tasks, calendarSort.config);
  }, [tasks, calendarSort.config]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    sortedTasks.forEach(task => {
      if (task.due_date) { // due_date is 'YYYY-MM-DD'
        // Parse date string manually to avoid timezone interpretation issues.
        // new Date('2023-10-26') creates a date at UTC midnight, which can be the previous day in some timezones.
        // This creates the date at local midnight, which is what we want for a calendar view.
        const parts = task.due_date.split('-').map(s => parseInt(s, 10));
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
        const dateKey = localDate.toDateString();
        
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(task);
      }
    });
    return map;
  }, [sortedTasks]);
  
  const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(new Date(pickerYear, monthIndex, 1));
    setIsMonthPickerOpen(false);
  };
  
  const statusColors: { [key in Task['status']]: string } = {
    todo: 'bg-orange-500 hover:bg-orange-600',
    inprogress: 'bg-indigo-500 hover:bg-indigo-600',
    done: 'bg-green-500 hover:bg-green-600',
    cancelled: 'bg-gray-500 hover:bg-gray-600 line-through',
  };


  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md p-4">
      <div className="flex items-center mb-4 flex-wrap gap-2">
        <div className="flex-1">
          {/* Spacer */}
        </div>
        
        <div className="flex justify-center">
            <div className="relative" ref={monthPickerRef}>
              <button 
                type="button" 
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="w-48 sm:w-52 flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-left text-sm"
                aria-haspopup="true"
                aria-expanded={isMonthPickerOpen}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-base flex-shrink-0" aria-hidden="true">{monthEmoji}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{monthName} {year}</span>
                </div>
                <ChevronDownIcon size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMonthPickerOpen && (
                  <div className="absolute z-10 top-full mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border dark:border-gray-700 p-3 animate-fadeIn">
                      <div className="flex items-center justify-between mb-3">
                          <button type="button" onClick={() => setPickerYear(y => y - 1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Previous year"><ChevronLeftIcon size={18}/></button>
                          <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums">{pickerYear}</span>
                          <button type="button" onClick={() => setPickerYear(y => y + 1)} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Next year"><ChevronRightIcon size={18}/></button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                          {pickerMonths.map((month, index) => (
                              <button
                                  key={month}
                                  type="button"
                                  onClick={() => handleMonthSelect(index)}
                                  className={`p-2 text-sm rounded-md transition-colors text-gray-800 dark:text-gray-200 ${pickerYear === year && currentDate.getMonth() === index ? 'bg-[var(--accent-color)] text-white font-bold' : 'hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20'}`}
                              >
                                  {month}
                              </button>
                          ))}
                      </div>
                       <div className="flex justify-between items-center mt-3 pt-2 border-t dark:border-gray-700">
                          <button type="button" onClick={() => { setCurrentDate(new Date()); setIsMonthPickerOpen(false); }} className="text-xs font-semibold text-[var(--accent-color)] hover:underline">{t.today}</button>
                       </div>
                  </div>
              )}
            </div>
        </div>

        <div className="flex-1 flex justify-end">
          <CalendarSortDropdown 
            currentSortId={calendarSort.id} 
            onSortChange={(id, config) => onCalendarSortChange({id, config})} 
          />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 pb-2">{day}</div>
        ))}

        {days.map((day, index) => (
          <div key={index} className="h-28 md:h-36 border border-gray-200 dark:border-gray-700 rounded-md p-1.5 overflow-hidden flex flex-col">
            {day && (
              <>
                <span className={`text-sm font-medium ${isToday(day) ? 'bg-[var(--accent-color)] text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-800 dark:text-gray-200'}`}>
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto">
                    {tasksByDate.get(day.toDateString())?.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => onTaskClick(task)}
                            className={`p-1 rounded text-white text-xs cursor-pointer transition-colors flex items-center gap-1.5 ${statusColors[task.status]}`}
                            title={task.title}
                        >
                            <span className="truncate">{task.title}</span>
                        </div>
                    ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(CalendarView);

// --- START OF FILE components/PerformanceSummary.tsx ---

import React from 'react';
import { Task } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { ClipboardListIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@/components/Icons';
import StatCard from '@/components/performance-summary/StatCard';

// FIX: Define and export the TimeRange type to resolve import errors.
export type TimeRange = 'today' | 'thisWeek' | 'thisMonth' | 'last7' | 'last30' | 'customMonth' | 'customRange';

interface PerformanceSummaryProps {
  title: string;
  tasks: Task[];
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  title,
  tasks,
}) => {
  const { t } = useSettings();
  
  const stats = React.useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      done: tasks.filter(t => t.status === 'done').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };
  }, [tasks]);

  const avgCompletionTime = React.useMemo(() => {
      const doneTasks = tasks.filter(t => t.status === 'done');
      if (doneTasks.length === 0) return 'N/A';
      
      const totalTime = doneTasks.reduce((acc, task) => {
          const created = new Date(task.created_at).getTime();
          const completed = new Date(task.updated_at).getTime();
          return acc + (completed - created);
      }, 0);

      const avgTimeMs = totalTime / doneTasks.length;
      if (avgTimeMs < 0) return 'N/A';
      
      const days = Math.floor(avgTimeMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((avgTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;

  }, [tasks]);
  
  return (
      <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={<ClipboardListIcon className="text-blue-500" />} label={t.totalTasks} value={stats.total} />
              <StatCard icon={<ClipboardListIcon className="text-orange-500" />} label={t.todo} value={stats.todo} />
              <StatCard icon={<SpinnerIcon className="text-indigo-500 animate-spin"/>} label={t.inprogress} value={stats.inprogress} />
              <StatCard icon={<CheckCircleIcon className="text-green-500" />} label={t.done} value={stats.done} />
              <StatCard icon={<XCircleIcon className="text-gray-500" />} label={t.cancelled} value={stats.cancelled} />
              <StatCard icon={<ClockIcon className="text-purple-500" />} label={t.avgCompletionTime} value={avgCompletionTime} />
          </div>
      </div>
  );
};

export default React.memo(PerformanceSummary);
```

---

## PHẦN 2: CÁC THÀNH PHẦN PHỤ TRỢ (HELPER COMPONENTS & UTILITIES)

This section includes all supporting code: UI components, hooks, configuration files, type definitions, and other utilities.

### 2.1. Core Setup & Entry Point

The foundational files that bootstrap the React application.

```typescript
// --- START OF FILE index.tsx ---

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- START OF FILE index.html ---

<!DOCTYPE html>
<html lang="en" class="theme-sky">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNjQgNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJsb2dvLWdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMGVhNWU5IiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzRmNDZlNSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2xvZ28tZ3JhZGllbnQpIiBkPSJNNDMuMzQsMjAuMDhDMzYuMzgsMTUuNCwyNS44LDE4LjQsMjEuNiwyNi4zMmMtNC4zMiw4LjEyLDEuMjEsMTguNDEsOC4zLDIzLjI4LDcuMzgsNC42NCwxNy43MSwxLjQsMjEuODQsLTYuNiwyLjgzLTUuNDgsMi4zMy0xMS44LS44Mi0xNi45Mi0yLjMtMy41Mi01Ljc0LTYuMTktOS41OC03LjkyWk0zNi43LDQxLjQ4Yy00LjQ4LDIuOC0xMC4yNywxLjA3LTEyLjg0LTMuNDFzLTEuMDktMTAuMzcsMy40LTEzLjE5LDEwLjI4LTEuMDgsMTIuODUsMy40UzQxLjE5LDM4LjY3LDM2LjcsNDEuNDhabTEyLjE5LTEyLjRjLTQuNDgtMi44MS01LjI2LTguNjYtMi42OS0xMy4xNHM4LjEyLTYsMTIuNi0zLjE4LDUuMjYsOC42NiwyLjY5LDEzLjE0UzUzLjM4LDMxLjg4LDQ4Ljg5LDI5LjA4WiIgLz48L3N2Zz4=" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Infi Project Performance</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html.theme-sky {
        --gradient-from: #0ea5e9; /* sky-500 */
        --gradient-to: #4f46e5; /* indigo-600 */
        --accent-color: #0ea5e9;
        --accent-color-dark: #38bdf8; /* sky-400 */
        --accent-stop-1: #0ea5e9;
        --accent-stop-2: #4f46e5;
        --accent-dark-stop-1: #38bdf8;
        --accent-dark-stop-2: #6366f1; /* indigo-400 */
        --breathing-glow-color: rgba(14, 165, 233, 0.2);
        --breathing-glow-color-strong: rgba(14, 165, 233, 0.4);
      }
      html.theme-amethyst {
        --gradient-from: #7c3aed; /* violet-600 */
        --gradient-to: #1f2937; /* gray-800 */
        --accent-color: #7c3aed;
        --accent-color-dark: #8b5cf6; /* violet-500 */
        --accent-stop-1: #7c3aed;
        --accent-stop-2: #1f2937;
        --accent-dark-stop-1: #8b5cf6;
        --accent-dark-stop-2: #374151; /* gray-700 */
        --breathing-glow-color: rgba(124, 58, 237, 0.2);
        --breathing-glow-color-strong: rgba(124, 58, 237, 0.4);
      }
      html.theme-sunset {
        --gradient-from: #f97316; /* orange-500 */
        --gradient-to: #e11d48; /* rose-600 */
        --accent-color: #f97316;
        --accent-color-dark: #fb923c; /* orange-400 */
        --accent-stop-1: #f97316;
        --accent-stop-2: #e11d48;
        --accent-dark-stop-1: #fb923c;
        --accent-dark-stop-2: #f43f5e; /* rose-500 */
        --breathing-glow-color: rgba(249, 115, 22, 0.2);
        --breathing-glow-color-strong: rgba(249, 115, 22, 0.4);
      }
      html.theme-emerald {
        --gradient-from: #10b981; /* emerald-500 */
        --gradient-to: #047857; /* emerald-700 */
        --accent-color: #10b981;
        --accent-color-dark: #34d399; /* emerald-400 */
        --accent-stop-1: #10b981;
        --accent-stop-2: #047857;
        --accent-dark-stop-1: #34d399;
        --accent-dark-stop-2: #059669; /* emerald-600 */
        --breathing-glow-color: rgba(16, 185, 129, 0.2);
        --breathing-glow-color-strong: rgba(16, 185, 129, 0.4);
      }
      html.theme-crimson {
        --gradient-from: #dc2626; /* red-600 */
        --gradient-to: #1f2937; /* gray-800 */
        --accent-color: #dc2626;
        --accent-color-dark: #ef4444; /* red-500 */
        --accent-stop-1: #dc2626;
        --accent-stop-2: #1f2937;
        --accent-dark-stop-1: #ef4444;
        --accent-dark-stop-2: #374151; /* gray-700 */
        --breathing-glow-color: rgba(220, 38, 38, 0.2);
        --breathing-glow-color-strong: rgba(220, 38, 38, 0.4);
      }
      #root .suspense-loader {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;
        background-color: transparent;
      }
      #root .suspense-spinner {
        width: 48px;
        height: 48px;
        border: 5px solid #FFF;
        border-bottom-color: var(--accent-color);
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
      }
      @keyframes rotation {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            keyframes: {
              fadeIn: {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
              fadeInUp: {
                '0%': { opacity: 0, transform: 'translateY(20px) scale(0.98)' },
                '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
              },
              fadeInDown: {
                '0%': { opacity: 0, transform: 'translateY(-20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
              fadeOutUp: {
                'from': { opacity: 1, transform: 'translateY(0)' },
                'to': { opacity: 0, transform: 'translateY(-20px)' },
              },
              slideInRight: {
                '0%': { opacity: 0, transform: 'translateX(100%)' },
                '100%': { opacity: 1, transform: 'translateX(0)' },
              },
              slideOutRight: {
                '0%': { opacity: 1, transform: 'translateX(0)' },
                '100%': { opacity: 0, transform: 'translateX(100%)' },
              },
              numberFlip: {
                '0%': { opacity: 0, transform: 'translateY(0.5em)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
              'background-pan': {
                '0%': { 'background-position': '0% 50%' },
                '50%': { 'background-position': '100% 50%' },
                '100%': { 'background-position': '0% 50%' },
              },
              'breathingGlow': {
                '0%, 100%': { 'box-shadow': '0 0 15px 5px var(--breathing-glow-color)' },
                '50%': { 'box-shadow': '0 0 30px 10px var(--breathing-glow-color-strong)' },
              },
              'breathingGlowRed': {
                '0%, 100%': {
                  'box-shadow': '0 0 10px 2px rgba(239, 68, 68, 0.4)',
                  'border-color': 'rgba(239, 68, 68, 0.6)'
                },
                '50%': {
                  'box-shadow': '0 0 20px 5px rgba(239, 68, 68, 0.6)',
                  'border-color': 'rgba(239, 68, 68, 1)'
                },
              },
              'press-down': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(0.97)' },
              },
              spin: {
                'from': { transform: 'rotate(0deg)' },
                'to': { transform: 'rotate(360deg)' },
              },
              'progress-fill': {
                '0%': { width: '0%' },
                '100%': { width: '100%' },
              },
              'shake': {
                '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
              },
              'gentle-shake': {
                '0%, 20%, 100%': { transform: 'translateX(0)' },
                '2%, 6%, 10%, 14%, 18%': { transform: 'translateX(-1px)' },
                '4%, 8%, 12%, 16%': { transform: 'translateX(1px)' },
              },
              'highlight-update': {
                '0%, 100%': { 'box-shadow': 'inset 0 0 0 0px var(--accent-color)' },
                '50%': { 'box-shadow': 'inset 0 0 0 3px var(--accent-color)' },
              },
            },
            animation: {
              fadeIn: 'fadeIn 0.3s ease-out forwards',
              fadeInUp: 'fadeInUp 0.3s ease-out forwards',
              fadeInDown: 'fadeInDown 0.3s ease-out forwards',
              fadeOutUp: 'fadeOutUp 0.3s ease-in forwards',
              slideInRight: 'slideInRight 0.3s ease-out forwards',
              slideOutRight: 'slideOutRight 0.3s ease-out forwards',
              numberFlip: 'numberFlip 0.3s ease-out forwards',
              'background-pan': 'background-pan 15s ease infinite',
              'breathingGlow': 'breathingGlow 5s ease-in-out infinite',
              'breathingGlowRed': 'breathingGlowRed 3s ease-in-out infinite',
              'press-down': 'press-down 0.2s ease-in-out',
              spin: 'spin 1s linear infinite',
              'progress-fill': 'progress-fill 8s ease-in-out infinite alternate',
              'shake': 'shake 0.82s cubic-bezier(.36,.07,.19,.97) both',
              'gentle-shake': 'gentle-shake 5s cubic-bezier(.36,.07,.19,.97) infinite',
              'highlight-update': 'highlight-update 1.5s ease-out',
            },
          },
        },
      }
    </script>
  <script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "@supabase/supabase-js": "https://aistudiocdn.com/@supabase/supabase-js@^2.75.0",
    "vite": "https://aistudiocdn.com/vite@^7.2.2",
    "url": "https://aistudiocdn.com/url@^0.11.4",
    "path": "https://aistudiocdn.com/path@^0.12.7"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>
```

### 2.2. Layout & Navigation Components

Components that form the main structure and navigation of the app.

```typescript
// --- START OF FILE components/Header.tsx ---

import React from 'react';
import TopBar from '@/components/TopBar';
import SettingsController from '@/components/SettingsController';
import { LogoIcon } from '@/components/Icons';
import type { Session } from '@supabase/supabase-js';
import { useSettings } from '@/context/SettingsContext';
import type { Profile, Task } from '@/types';
import { TaskCounts, AdminView } from '@/App';
import UserMenu from '@/components/header/UserMenu';
import AdminNav from '@/components/header/AdminNav';

interface HeaderProps {
  session: Session | null;
  profile: Profile | null;
  handleSignOut: () => void;
  onSignInClick: () => void;
  onAccountClick: () => void;
  adminView: AdminView;
  setAdminView: (view: AdminView) => void;
  onAddNewTask: () => void;
  onEditTask: (task: Task | Partial<Task> | null) => void;
  onDeleteTask: (task: Task) => void;
  onUpdateStatus: (task: Task, status: Task['status']) => void;
  onOpenActivityLog: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  taskCounts: TaskCounts;
}

const Header: React.FC<HeaderProps> = ({ session, profile, handleSignOut, onSignInClick, onAccountClick, adminView, setAdminView, onAddNewTask, onEditTask, onDeleteTask, onUpdateStatus, onOpenActivityLog, onOpenNotifications, unreadCount, taskCounts }) => {
  const { t } = useSettings();

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-sm flex flex-col">
      <TopBar 
        session={session}
        onAddNewTask={onAddNewTask}
        profile={profile}
        adminView={adminView}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onUpdateStatus={onUpdateStatus}
        onOpenActivityLog={onOpenActivityLog}
        onOpenNotifications={onOpenNotifications}
        unreadCount={unreadCount}
        taskCounts={taskCounts}
      />
      <div className="container mx-auto px-4 py-2 md:py-0 md:h-16 flex flex-wrap items-center">
        
        {/* Center Logo (spans full width on mobile, takes middle on desktop) */}
        <div className="w-full md:flex-1 flex justify-center order-1 md:order-2 mb-2 md:mb-0">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              role="button"
              aria-label={t.backToTopAria}
            >
              <LogoIcon />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] dark:from-[var(--accent-color-dark)] dark:to-[var(--gradient-to)]">
                Infi Project
              </span>
            </div>
        </div>

        {/* Left Side (half width on mobile, auto on desktop) */}
        <div className="w-1/2 md:flex-1 flex justify-start order-2 md:order-1">
            {session && (profile?.role === 'admin' || profile?.role === 'manager') && <AdminNav activeView={adminView} setView={setAdminView} profile={profile} />}
        </div>
        
        {/* Right Side (half width on mobile, auto on desktop) */}
        <div className="w-1/2 md:flex-1 flex justify-end items-center space-x-3 order-3 md:order-3">
          {session ? (
            <UserMenu session={session} profile={profile} onAccountClick={onAccountClick} handleSignOut={handleSignOut} />
          ) : (
             <button 
                onClick={onSignInClick}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none"
            >
                {t.signIn}
            </button>
          )}
          <SettingsController />
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);

// --- START OF FILE components/TopBar.tsx ---

import React from 'react';
import SessionInfo from '@/components/SessionInfo';
import ActivityTicker from '@/components/ActivityTicker';
import type { Session } from '@supabase/supabase-js';
import { PlusIcon, HistoryIcon, BellIcon } from '@/components/Icons';
import { useSettings } from '@/context/SettingsContext';
import { Profile, Task } from '@/types';
import { TaskCounts, AdminView } from '@/App';

interface TopBarProps {
    session: Session | null;
    onAddNewTask: () => void;
    profile: Profile | null;
    adminView: AdminView;
    onEditTask: (task: Task | Partial<Task> | null) => void;
    onDeleteTask: (task: Task) => void;
    onUpdateStatus: (task: Task, status: Task['status']) => void;
    onOpenActivityLog: () => void;
    onOpenNotifications: () => void;
    unreadCount: number;
    taskCounts: TaskCounts;
}

const TopBar: React.FC<TopBarProps> = ({ session, onAddNewTask, profile, adminView, onEditTask, onDeleteTask, onUpdateStatus, onOpenActivityLog, onOpenNotifications, unreadCount, taskCounts }) => {
    const { t } = useSettings();
    const canAddTask = !!(session && profile);

    return (
        <div className="relative z-10 bg-slate-100 dark:bg-black/20 text-gray-600 dark:text-gray-400 animate-fadeInDown border-b border-black/5 dark:border-white/5">
            <div className="container mx-auto px-4 h-10 flex items-center justify-between gap-4">
                
                {/* Left Side */}
                <div className="hidden md:flex flex-1 justify-start">
                    <SessionInfo />
                </div>
                
                {/* Center Ticker */}
                <div className="flex-1 flex justify-center">
                     <ActivityTicker 
                        session={session}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onUpdateStatus={onUpdateStatus}
                        taskCounts={taskCounts}
                    />
                </div>

                {/* Right Side */}
                <div className="flex-1 flex justify-end items-center gap-2">
                   {canAddTask && (
                     <button
                        onClick={onAddNewTask}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md focus:outline-none"
                    >
                        <PlusIcon size={14}/>
                        <span className="hidden sm:inline">{t.addNewTask}</span>
                    </button>
                   )}
                   {session && (
                     <button
                        onClick={onOpenActivityLog}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title={t.activityLog}
                    >
                        <HistoryIcon size={18} />
                    </button>
                   )}
                   {session && (
                     <button
                        onClick={onOpenNotifications}
                        className="relative p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        title={t.notifications}
                    >
                        <BellIcon size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 justify-center items-center text-[9px] text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </span>
                        )}
                    </button>
                   )}
                </div>

            </div>
        </div>
    );
};

export default React.memo(TopBar);

// --- START OF FILE components/header/AdminNav.tsx ---

import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { BriefcaseIcon, UsersIcon, ClipboardListIcon, SettingsIcon } from '../Icons';
import { AdminView } from '../../App';
import { Profile } from '../../types';

interface AdminNavProps {
    activeView: AdminView;
    setView: (view: AdminView) => void;
    profile: Profile | null;
}

const AdminNav: React.FC<AdminNavProps> = ({ activeView, setView, profile }) => {
    const { t } = useSettings();

    const navItems = [
        { view: 'myTasks' as AdminView, label: t.employeeDashboard, icon: BriefcaseIcon },
        { view: 'taskDashboard' as AdminView, label: t.adminDashboard, icon: ClipboardListIcon },
        { view: 'management' as AdminView, label: t.management, icon: SettingsIcon },
    ];

    const availableNavItems = !profile ? [] : navItems;

    return (
        <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-0.5">
            {availableNavItems.map(item => (
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

export default React.memo(AdminNav);

// --- START OF FILE components/Footer.tsx ---

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

const Footer: React.FC = () => {
  const { t } = useSettings();

  return (
    <footer className="mt-16 py-8 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
            <p>{t.copyright(new Date().getFullYear())}</p>
            <span className="hidden sm:inline text-gray-400 dark:text-gray-600">|</span>
            <a href="mailto:support@miehair.dev" className="hover:text-[var(--accent-color)] transition-colors">{t.contactUs}</a>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
```

### 2.3. User & Authentication Components

Modals and menus related to user authentication, account management, and profile settings.

```typescript
// --- START OF FILE components/Auth.tsx ---

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LogoIcon, XIcon } from '@/components/Icons';
import { useSettings } from '@/context/SettingsContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt?: string;
}

type AuthView = 'signIn' | 'signUp' | 'forgotPassword';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, prompt }) => {
  const { t } = useSettings();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('signIn');

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setEmail('');
      setPassword('');
      setError(null);
      setMessage(null);
      setAuthView('signIn');
      if (prompt) {
        setMessage(prompt);
      }
    }
  }, [isOpen, prompt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    let authError = null;

    if (authView === 'signUp') {
      const { error } = await supabase.auth.signUp({ email, password });
      authError = error;
      if (!error) setMessage(t.magicLinkSent);
    } else { // 'signIn'
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
      if (!error) onClose();
    }
    
    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  };
  
  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
       // Also provide redirectTo for password reset emails to work in this environment
       redirectTo: window.location.origin,
    });
    if (error) {
        setError(error.message);
    } else {
        setMessage(t.magicLinkSent);
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex justify-center overflow-y-auto p-4 animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 ease-out animate-fadeInUp overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 relative">
          <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
              aria-label={t.close}
          >
              <XIcon size={24} />
          </button>
          
          <div className="flex flex-col items-center mb-6">
              <LogoIcon size={40} />
              <h1 id="auth-modal-title" className="text-2xl font-bold text-center mt-3 bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] dark:from-[var(--accent-color-dark)] dark:to-[var(--gradient-to)]">
                 {authView === 'forgotPassword' ? 'Reset Password' : (prompt ? t.signInToContinue : t.authHeader)}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mt-1">
                {authView !== 'forgotPassword' && (prompt || t.authPrompt)}
              </p>
          </div>

          {authView !== 'forgotPassword' ? (
            <>
            <div className="grid grid-cols-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-6">
                <button onClick={() => setAuthView('signIn')} className={`py-3 transition-colors ${authView === 'signIn' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {t.signIn}
                </button>
                 <button onClick={() => setAuthView('signUp')} className={`py-3 transition-colors ${authView === 'signUp' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'hover:text-gray-700 dark:hover:text-gray-200'}`}>
                    {t.signUp}
                </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                  <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">
                          {t.emailLabel}
                      </label>
                      <input
                          id="email"
                          className="mt-1 block w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent sm:text-sm"
                          type="email"
                          placeholder={t.emailLabel}
                          value={email}
                          required
                          onChange={(e) => setEmail(e.target.value)}
                      />
                  </div>
                  <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">
                         {t.passwordLabel}
                      </label>
                      <input
                          id="password"
                          className="mt-1 block w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent sm:text-sm"
                          type="password"
                          placeholder={t.passwordLabel}
                          value={password}
                          required
                          onChange={(e) => setPassword(e.target.value)}
                      />
                  </div>
              </div>
              
              {authView === 'signIn' && (
                <div className="text-right mt-2">
                    <button type="button" onClick={() => setAuthView('forgotPassword')} className="text-xs text-gray-500 dark:text-gray-400 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color-dark)] transition-colors">
                        Forgot Password?
                    </button>
                </div>
              )}

              {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
              {message && <p className="mt-3 text-center text-xs text-green-500">{message}</p>}

              <div className="mt-6">
                  <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] disabled:opacity-50 transition"
                  >
                      {loading ? (authView === 'signIn' ? t.signingIn : t.signingUp) : (authView === 'signIn' ? t.signIn : t.signUp)}
                  </button>
              </div>
            </form>
            </>
          ) : (
            <form onSubmit={handlePasswordReset}>
                 <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">Enter your email and we'll send you a link to reset your password.</p>
                 <input
                    id="email-reset"
                    className="mt-1 block w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent sm:text-sm"
                    type="email"
                    placeholder={t.emailLabel}
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                />
                 {error && <p className="mt-3 text-center text-xs text-red-500">{error}</p>}
                 {message && <p className="mt-3 text-center text-xs text-green-500">{message}</p>}

                 <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)] disabled:opacity-50 transition"
                >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setAuthView('signIn')} className="mt-3 w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color-dark)] transition-colors">
                    Back to Sign In
                </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthModal;

// --- START OF FILE components/AccountModal.tsx ---

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { XIcon, UserIcon } from '@/components/Icons';
import type { Session } from '@supabase/supabase-js';
import { useSettings } from '@/context/SettingsContext';
import { useToasts } from '@/context/ToastContext';
import { ProjectMember } from '@/types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, session }) => {
    const { t } = useSettings();
    const { addToast } = useToasts();
    const [activeTab, setActiveTab] = useState('profile');
    
    const [profileLoading, setProfileLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);


    const fileInputRef = useRef<HTMLInputElement>(null);

    const getProfile = useCallback(async () => {
        if (!session) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`full_name, avatar_url`)
                .eq('id', session.user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setFullName(data.full_name || '');
                setAvatarUrl(data.avatar_url || null);
            }
        } catch (error: any) {
            console.error('Error fetching profile:', error.message);
        } finally {
            setProfileLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (isOpen && session) {
            getProfile();
            setActiveTab('profile');
            setPassword('');
            setConfirmPassword('');
            setAvatarFile(null);
            setPasswordError(null);
        }
    }, [isOpen, session, getProfile]);
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatarUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;

        setProfileLoading(true);
        setUploading(!!avatarFile);
        
        try {
            let newAvatarUrl = avatarUrl;
            
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                newAvatarUrl = urlData.publicUrl;
            }

            const updates = {
                id: session.user.id,
                full_name: fullName,
                avatar_url: newAvatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error: profileError } = await supabase.from('profiles').upsert(updates);
            if (profileError) throw profileError;
            
            await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: newAvatarUrl } });
            
            addToast(t.profileUpdated, 'success');
            setAvatarFile(null);
        } catch (error: any) {
            addToast(`Error updating profile: ${error.message}`, 'error');
            console.error("Error updating profile:", error.message);
        } finally {
            setProfileLoading(false);
            setUploading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        if (password !== confirmPassword) {
            setPasswordError(t.passwordsDoNotMatch);
            return;
        }
        setPasswordLoading(true);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setPasswordError(error.message);
        } else {
            addToast(t.passwordUpdated, 'success');
            setPassword('');
            setConfirmPassword('');
        }
        setPasswordLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center overflow-y-auto p-4 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out animate-fadeInUp max-h-[90vh] flex flex-col my-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 pb-0 relative flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
                        aria-label={t.close}
                    >
                        <XIcon size={24} />
                    </button>
                    <h2 id="account-modal-title" className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t.accountSettings}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</p>

                    <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>{t.profile}</button>
                            <button onClick={() => setActiveTab('password')} className={`${activeTab === 'password' ? 'border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>{t.password}</button>
                        </nav>
                    </div>
                </div>

                <div className="overflow-y-auto p-6">
                    {activeTab === 'profile' ? (
                        <form onSubmit={handleProfileUpdate}>
                            <h3 className="text-lg font-medium">{t.updateProfile}</h3>
                            {profileLoading && !avatarFile ? (
                                <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading profile...</div>
                            ) : (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.avatar}</label>
                                    <div className="mt-2 flex items-center gap-4">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <UserIcon size={32} className="text-gray-400" />
                                            </div>
                                        )}
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">{t.uploadAvatar}</button>
                                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/png, image/jpeg" className="hidden"/>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.fullName}</label>
                                    <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                                </div>
                            </div>
                            )}
                            <div className="mt-6 flex items-center justify-end">
                                <button type="submit" disabled={profileLoading || uploading} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none disabled:opacity-50">
                                    {uploading ? t.uploading : (profileLoading ? t.updating : t.update)}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordUpdate}>
                            <h3 className="text-lg font-medium">{t.changePassword}</h3>
                                <div className="mt-4 space-y-4">
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.newPassword}</label>
                                    <input type="password" id="newPassword" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.confirmNewPassword}</label>
                                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                                </div>
                            </div>
                            {passwordError && <p className="mt-4 text-xs text-red-500 text-center animate-shake">{passwordError}</p>}
                            <div className="mt-6 flex items-center justify-end">
                                <button type="submit" disabled={passwordLoading} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] rounded-full shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none disabled:opacity-50">
                                    {passwordLoading ? t.updating : t.update}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountModal;

// --- START OF FILE components/header/UserMenu.tsx ---

import React, { useState, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useSettings } from '../../context/SettingsContext';
import type { Profile } from '../../types';
import { LogOutIcon, UserIcon } from '../Icons';
import Avatar from '../common/Avatar';

interface UserMenuProps {
  session: Session;
  profile: Profile | null;
  onAccountClick: () => void;
  handleSignOut: () => void;
}

const UserMenu: React.FC<UserMenuProps> = 
({ session, profile, onAccountClick, handleSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useSettings();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayName = profile?.full_name || session.user.email || '';
    const avatarUrl = profile?.avatar_url;

    const userForAvatar = {
        full_name: displayName,
        avatar_url: avatarUrl
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[var(--accent-color)] dark:hover:text-[var(--accent-color-dark)] transition-colors"
            >
                <Avatar 
                    user={userForAvatar}
                    title={displayName}
                    size={28}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] flex items-center justify-center text-white font-bold text-xs"
                />
                <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-fadeIn">
                    <div className="p-2">
                        <button
                            onClick={() => { onAccountClick(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-[var(--accent-color)]/10 dark:hover:bg-[var(--accent-color)]/20 transition-colors"
                        >
                            <UserIcon size={16} />
                            <span>{t.accountSettings}</span>
                        </button>
                        <div className="my-1 border-t border-black/10 dark:border-white/10"></div>
                        <button
                            onClick={() => { handleSignOut(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                        >
                            <LogOutIcon size={16} />
                            <span>{t.signOut}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(UserMenu);
```

### 2.4. Common & Reusable UI Components

A collection of generic components used throughout the application.

```typescript
// --- START OF FILE components/Icons.tsx ---

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  fill?: string;
}

export const SunIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export const LogoIcon: React.FC<IconProps> = ({ className, size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" className="stop-1" />
        <stop offset="100%" className="stop-2" />
      </linearGradient>
    </defs>
    <path fill="url(#logo-gradient)" d="M43.34,20.08C36.38,15.4,25.8,18.4,21.6,26.32c-4.32,8.12,1.21,18.41,8.3,23.28,7.38,4.64,17.71,1.4,21.84-6.6,2.83-5.48,2.53-11.8-.82-16.92-2.3-3.52-5.74-6.19-9.58-7.92ZM36.7,41.48c-4.48,2.8-10.27,1.07-12.84-3.41s-1.09-10.37,3.4-13.19,10.28-1.08,12.85,3.4S41.19,38.67,36.7,41.48Zm12.19-12.4c-4.48-2.81-5.26-8.66-2.69-13.14s8.12-6,12.6-3.18,5.26,8.66,2.69,13.14S53.38,31.88,48.89,29.08Z" />
    <style>{`
      .stop-1 { stop-color: var(--accent-stop-1); }
      .stop-2 { stop-color: var(--accent-stop-2); }
      .dark .stop-1 { stop-color: var(--accent-dark-stop-1); }
      .dark .stop-2 { stop-color: var(--accent-dark-stop-2); }
    `}</style>
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export const LogOutIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const MinusIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

export const XIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export const XCircleIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export const QuestionMarkCircleIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

export const StarIcon: React.FC<IconProps> = ({ className, size = 24, fill = "none" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

export const EditIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

// FIX: Add missing ArrowRightIcon to be used in TaskCard.tsx
export const ArrowRightIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className, size = 24, fill="currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className, size = 24, fill="currentColor" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
    </svg>
);

export const BriefcaseIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

export const BarChartIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="20" x2="12" y2="10"></line>
        <line x1="18" y1="20" x2="18" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="16"></line>
    </svg>
);

export const TrendingUpIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
);

export const ClipboardListIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <path d="M12 11h4"></path>
        <path d="M12 16h4"></path>
        <path d="M8 11h.01"></path>
        <path d="M8 16h.01"></path>
    </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

export const PaperclipIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);

export const DocumentTextIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const CalendarDaysIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
    <path d="M8 14h.01"/>
    <path d="M12 14h.01"/>
    <path d="M16 14h.01"/>
    <path d="M8 18h.01"/>
    <path d="M12 18h.01"/>
    <path d="M16 18h.01"/>
  </svg>
);

export const ViewGridIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="7" x="3" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="14" rx="1"/>
    <rect width="7" height="7" x="3" y="14" rx="1"/>
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ className, size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v5h5"></path>
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
    <path d="M12 7v5l4 2"></path>
  </svg>
);

export const ChatBubbleIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export const SendIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const RunningManIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="1"/>
      <path d="M12 21.5V16l-3.5-2-2.5 3"/>
      <path d="M15.5 13.5L18 16l-3-1-1-3.5"/>
      <path d="m5 13 2-4 3 2 3.5-3"/>
    </svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
);

export const BellIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export const SortIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const KeyboardIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="7" width="20" height="13" rx="2" ry="2"></rect>
        <path d="M6 11h.01"></path>
        <path d="M10 11h.01"></path>
        <path d="M14 11h.01"></path>
        <path d="M18 11h.01"></path>
        <path d="M6 15h.01"></path>
        <path d="M10 15h.01"></path>
        <path d="M14 15h.01"></path>
        <path d="M18 15h.01"></path>
    </svg>
);

export const ProjectIcon: React.FC<IconProps> = ({ className, size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M12 18v-6"></path>
        <path d="M9 15h6"></path>
    </svg>
);

// --- START OF FILE components/common/Avatar.tsx ---

import React from 'react';
import { Profile } from '../../types';

interface AvatarProps {
    user: Partial<Profile> & { full_name: string | null };
    title: string;
    size?: number;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, title, size = 20, className }) => {
    const style = { width: `${size}px`, height: `${size}px` };
    const fontSize = size < 24 ? 10 : (size < 32 ? 12 : 14);
    const userInitial = (user.full_name || '?').charAt(0).toUpperCase();
    const defaultClassName = 'rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold';

    return (
        <div title={title}>
            {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name || ''} style={style} className="rounded-full object-cover" />
            ) : (
                <div style={style} className={className || defaultClassName}>
                    <span style={{ fontSize: `${fontSize}px` }}>{userInitial}</span>
                </div>
            )}
        </div>
    );
};
export default React.memo(Avatar);

// --- START OF FILE components/common/PriorityIndicator.tsx ---

import React from 'react';
import { Task } from '../../types';
import { useSettings } from '../../context/SettingsContext';

const PriorityIndicator: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
    const { t } = useSettings();
    const priorityConfig: { [key in Task['priority']]: { label: string; icon: string; color: string, bg: string } } = {
        low: { label: t.low, icon: '💤', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/50' },
        medium: { label: t.medium, icon: '⚡', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
        high: { label: t.high, icon: '🚨', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/50' },
    };
    
    const config = priorityConfig[priority];

    return (
        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.color}`}>
            <span className="text-sm">{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}

export default React.memo(PriorityIndicator);

// --- START OF FILE components/common/AnimatedNumber.tsx ---

import React from 'react';

interface AnimatedNumberProps {
  value: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = React.memo(({ value }) => {
  return (
    <span key={value} className="animate-numberFlip inline-block font-semibold">
      {value.toLocaleString()}
    </span>
  );
});

export default AnimatedNumber;
```

### 2.5. Custom Hooks (Logic Abstractions)

Reusable hooks that encapsulate business logic and state management.

```typescript
// --- START OF FILE hooks/useAppActions.ts ---

import { useState, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Task, TimeLog } from '../types';
import type { DataChange } from '../App';
import { useToasts } from '../context/ToastContext';

interface ActionModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  confirmButtonClass?: string;
}

type SetActionModal = Dispatch<SetStateAction<ActionModalState>>;

interface UseAppActionsProps {
    session: Session | null;
    setActionModal: SetActionModal;
    notifyDataChange: (change: Omit<DataChange, 'timestamp'>) => void;
    t: any; // Translation object
    // FIX: Use MutableRefObject directly instead of React.MutableRefObject
    locallyUpdatedTaskIds: MutableRefObject<Set<number>>;
}

export const useAppActions = ({ session, setActionModal, notifyDataChange, t, locallyUpdatedTaskIds }: UseAppActionsProps) => {
    const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null);
    const { addToast } = useToasts();

    const logActivity = useCallback(async (action: string, details: Record<string, any>) => {
        if (!session?.user?.id) return;
        const { error } = await supabase.from('activity_logs').insert({
            user_id: session.user.id,
            action,
            details,
            task_id: details.task_id,
        });
        if (error) {
            console.error('Error logging activity:', error);
        }
    }, [session]);

    const handleSaveTask = async (
        taskData: Partial<Task>, 
        editingTask: Task | Partial<Task> | null, 
        newFiles: File[], 
        deletedAttachmentIds: number[], 
        newComments: string[]
    ): Promise<boolean> => {
        if (!session?.user) return false;

        const userId = taskData.user_id;
        if (!userId) {
            console.error('Assignee is required.');
            return false;
        }
        
        const isNewTask = !editingTask || !('id' in editingTask) || !editingTask.id;
        if (!isNewTask) {
            const taskId = (editingTask as Task).id;
            locallyUpdatedTaskIds.current.add(taskId);
            setTimeout(() => {
                locallyUpdatedTaskIds.current.delete(taskId);
            }, 5000);
        }
        
        const dataToSave = { 
            ...taskData,
            ...(isNewTask && { created_by: session.user.id })
        };

        try {
            const selectQuery = '*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))';
            const { data: savedTask, error: saveError } = isNewTask
                ? await supabase.from('tasks').insert(dataToSave).select(selectQuery).single()
                : await supabase.from('tasks').update(dataToSave).eq('id', editingTask!.id).select(selectQuery).single();

            if (saveError) throw saveError;
            if (!savedTask) throw new Error("Task could not be saved.");

            const taskId = savedTask.id;
            const taskTitle = savedTask.title;
            
            if (isNewTask && newComments.length > 0) {
                const commentRecords = newComments.map(content => ({
                    task_id: taskId,
                    user_id: session.user.id,
                    content: content,
                }));
                const { error: insertCommentsError } = await supabase.from('task_comments').insert(commentRecords);
                if (insertCommentsError) console.error("Error saving comments for new task:", insertCommentsError);
            }

            await logActivity(isNewTask ? 'created_task' : 'updated_task', { task_id: taskId, task_title: taskTitle });

            if (deletedAttachmentIds.length > 0) {
                const { data: attachmentsToDelete, error: fetchErr } = await supabase
                    .from('task_attachments').select('file_path').in('id', deletedAttachmentIds);

                if (fetchErr) console.error("Error fetching attachments to delete:", fetchErr);
                else if (attachmentsToDelete && attachmentsToDelete.length > 0) {
                    const paths = attachmentsToDelete.map(a => a.file_path);
                    await supabase.storage.from('task-attachments').remove(paths);
                }
                
                const { error: deleteDbError } = await supabase.from('task_attachments').delete().in('id', deletedAttachmentIds);
                if (deleteDbError) throw deleteDbError;
                
                await logActivity('removed_attachments', { task_id: taskId, task_title: taskTitle, count: deletedAttachmentIds.length });
            }

            if (newFiles.length > 0) {
                const uploadPromises = newFiles.map(file => {
                    const filePath = `${session.user.id}/${taskId}/${crypto.randomUUID()}-${file.name}`;
                    return supabase.storage.from('task-attachments').upload(filePath, file);
                });
                const uploadResults = await Promise.all(uploadPromises);

                const newAttachmentRecords = uploadResults
                    .map((result, i) => {
                        if (result.error) {
                            console.error('Upload Error:', result.error.message);
                            return null;
                        }
                        return {
                            task_id: taskId, user_id: session.user.id, file_name: newFiles[i].name,
                            file_path: result.data.path, file_type: newFiles[i].type, file_size: newFiles[i].size,
                        };
                    })
                    .filter(Boolean);

                if (newAttachmentRecords.length > 0) {
                    const { error } = await supabase.from('task_attachments').insert(newAttachmentRecords as any);
                    if (error) throw error;
                    await logActivity('added_attachments', { task_id: taskId, task_title: taskTitle, count: newFiles.length });
                }
            }
            
            const { data: finalTask, error: finalError } = await supabase.from('tasks').select(selectQuery).eq('id', taskId).single();
            if (finalError) throw finalError;
            
            notifyDataChange({ type: isNewTask ? 'add' : 'update', payload: finalTask });
            addToast(isNewTask ? "Task created successfully." : "Task updated successfully.", 'success');
            return true;
        } catch (error: any) {
            console.error("Error in save task process:", error.message);
            addToast(`Error saving task: ${error.message}`, 'error');
            if (!isNewTask) {
                const taskId = (editingTask as Task).id;
                locallyUpdatedTaskIds.current.delete(taskId);
            }
            return false;
        }
    };

    const executeDeleteTask = useCallback(async (task: Task) => {
        try {
            await logActivity('deleted_task', { task_id: task.id, task_title: task.title });

            if (task.task_attachments && task.task_attachments.length > 0) {
                const filePaths = task.task_attachments.map(att => att.file_path);
                const { error: storageError } = await supabase.storage.from('task-attachments').remove(filePaths);
                if (storageError) console.error("Error deleting storage files:", storageError.message);
            }
            
            const { data, error } = await supabase.from('tasks').delete().eq('id', task.id).select();
            if (error) throw error;
            
            if (!data || data.length === 0) {
                addToast('Could not delete task. You may not have permission.', 'error');
                return;
            }

            if (activeTimer?.task_id === task.id) setActiveTimer(null);
            notifyDataChange({ type: 'delete', payload: { id: task.id } });
            addToast('Task deleted successfully.', 'success');
        } catch (error: any) {
            console.error("Error deleting task:", error.message);
            addToast(`Error: ${error.message}`, 'error');
        }
    }, [logActivity, activeTimer, notifyDataChange, addToast]);

    const handleDeleteTask = useCallback((task: Task) => {
        setActionModal({
            isOpen: true,
            title: t.confirmDeleteTask,
            message: t.deleteTaskConfirmationMessage(task.title),
            onConfirm: () => executeDeleteTask(task),
            confirmText: t.deleteTask,
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        });
    }, [setActionModal, executeDeleteTask, t]);

    const executeClearCancelledTasks = useCallback(async (tasksToClear: Task[]) => {
        try {
            const taskIds = tasksToClear.map(t => t.id);
            await logActivity('cleared_cancelled_tasks', { count: tasksToClear.length });

            const allAttachments = tasksToClear.flatMap(t => t.task_attachments || []);
            if (allAttachments.length > 0) {
                const filePaths = allAttachments.map(att => att.file_path);
                await supabase.storage.from('task-attachments').remove(filePaths);
            }

            const { error } = await supabase.from('tasks').delete().in('id', taskIds);
            if (error) throw error;

            if (activeTimer && taskIds.includes(activeTimer.task_id)) setActiveTimer(null);
            notifyDataChange({ type: 'delete_many', payload: { ids: taskIds } });
            addToast("Cancelled tasks cleared.", 'success');
        } catch (error: any) {
            console.error("Error clearing cancelled tasks:", error.message);
            addToast(`Error: ${error.message}`, 'error');
        }
    }, [logActivity, activeTimer, notifyDataChange, addToast]);

    const handleClearCancelledTasks = useCallback((tasksToClear: Task[]) => {
        if (tasksToClear.length === 0) return;
        setActionModal({
            isOpen: true,
            title: t.clearCancelledTasksTitle,
            message: t.clearCancelledTasksConfirmation(tasksToClear.length),
            onConfirm: () => executeClearCancelledTasks(tasksToClear),
            confirmText: t.deleteTask,
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        });
    }, [setActionModal, executeClearCancelledTasks, t]);
    
    const handleUpdateStatus = useCallback(async (task: Task, status: Task['status']): Promise<boolean> => {
        locallyUpdatedTaskIds.current.add(task.id);
        setTimeout(() => {
            locallyUpdatedTaskIds.current.delete(task.id);
        }, 5000);

        const { data, error } = await supabase.from('tasks').update({ status }).eq('id', task.id).select('*, assignee:user_id(*), creator:created_by(*), projects(*), task_attachments(*), task_time_logs(*), task_comments(*, profiles(*))').single();
        if (error) {
            console.error("Error updating task status:", error.message);
            addToast('Failed to update task status.', 'error');
            locallyUpdatedTaskIds.current.delete(task.id);
            return false;
        } else {
            await logActivity('status_changed', { task_id: task.id, task_title: task.title, from: task.status, to: status });
            notifyDataChange({ type: 'update', payload: data });
            return true;
        }
    }, [logActivity, notifyDataChange, addToast, locallyUpdatedTaskIds]);

    const handleStartTimer = useCallback(async (task: Task) => {
        if (!session || activeTimer) return;
        try {
            const { data, error } = await supabase
                .from('task_time_logs').insert({
                    task_id: task.id, user_id: session.user.id,
                    start_time: new Date().toISOString()
                }).select().single();
            if (error) throw error;
            setActiveTimer(data);
            notifyDataChange({ type: 'batch_update', payload: null }); // generic update
        } catch (error: any) {
            console.error(error.message);
            addToast(`Error starting timer: ${error.message}`, 'error');
        }
    }, [session, activeTimer, notifyDataChange, addToast]);

    const handleStopTimer = useCallback(async (timeLog: TimeLog) => {
        if (!activeTimer || activeTimer.id !== timeLog.id) return;
        try {
            const { error } = await supabase
                .from('task_time_logs').update({ end_time: new Date().toISOString() }).eq('id', timeLog.id);
            if (error) throw error;
            setActiveTimer(null);
            notifyDataChange({ type: 'batch_update', payload: null }); // generic update
        } catch (error: any)
 {
            console.error(error.message);
            addToast(`Error stopping timer: ${error.message}`, 'error');
        }
    }, [activeTimer, notifyDataChange, addToast]);
    
    return {
        activeTimer,
        logActivity,
        taskActions: {
            handleSaveTask,
            handleDeleteTask,
            handleClearCancelledTasks,
            handleUpdateStatus,
        },
        timerActions: {
            handleStartTimer,
            handleStopTimer,
        },
    };
};

// --- START OF FILE hooks/useCachedSupabaseQuery.ts ---

import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { DataChange } from '../App';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache duration in milliseconds (e.g., 5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export function useCachedSupabaseQuery<T>({
  cacheKey,
  query,
  dependencies = [],
  lastDataChange,
}: {
  cacheKey: string;
  query: () => Promise<{ data: T | null; error: any }>;
  dependencies?: any[];
  lastDataChange: DataChange | null;
}) {
  const [cachedData, setCachedData] = useLocalStorage<CacheEntry<T> | null>(cacheKey, null);
  const [data, setData] = useState<T | null>(cachedData?.data ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchData = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const { data: freshData, error: queryError } = await query();
      if (queryError) throw queryError;
      
      setData(freshData as T);
      setCachedData({ data: freshData as T, timestamp: Date.now() });
    } catch (err: any) {
      console.error(`Error fetching data for ${cacheKey}:`, err.message);
      setError(err);
      if (!cachedData?.data) {
        setData(null);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...dependencies]);

  // Effect for initial load and when main dependencies change
  useEffect(() => {
    const isCacheStale = !cachedData || (Date.now() - cachedData.timestamp > CACHE_DURATION);

    if (isCacheStale || !cachedData?.data) {
      fetchData(false);
    } else {
      setData(cachedData.data);
      setLoading(false);
      fetchData(true); // Background refresh for freshness
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  // Effect for handling real-time data changes from subscriptions
  useEffect(() => {
    if (!lastDataChange || loading) {
      return;
    }
    
    const currentData = data;
    
    const isArrayOfObjects = (d: any): d is { id: any }[] => Array.isArray(d);

    if (!isArrayOfObjects(currentData) && lastDataChange.type !== 'batch_update') {
      fetchData(true);
      return;
    }

    const updateAndCache = (newData: T) => {
      setData(newData);
      setCachedData({ data: newData, timestamp: Date.now() });
    };

    switch (lastDataChange.type) {
      case 'add':
        if(isArrayOfObjects(currentData)) {
            if (!currentData.find(item => item.id === lastDataChange.payload.id)) {
              updateAndCache([...currentData, lastDataChange.payload] as unknown as T);
            }
        }
        break;
      case 'update':
        if(isArrayOfObjects(currentData)) {
            let itemFound = false;
            const updatedData = currentData.map(item => {
              if (item.id === lastDataChange.payload.id) {
                itemFound = true;
                return lastDataChange.payload;
              }
              return item;
            });
            if (!itemFound) {
              updatedData.push(lastDataChange.payload);
            }
            updateAndCache(updatedData as unknown as T);
        }
        break;
      case 'delete':
        if(isArrayOfObjects(currentData)) {
            updateAndCache(currentData.filter(item => item.id !== lastDataChange.payload.id) as unknown as T);
        }
        break;
      case 'delete_many':
        if(isArrayOfObjects(currentData)) {
            const idsToDelete = new Set(lastDataChange.payload.ids);
            updateAndCache(currentData.filter(item => !idsToDelete.has(item.id)) as unknown as T);
        }
        break;
      default:
        // For batch_update or unknown types, fall back to a full refetch
        fetchData(true);
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDataChange]);


  return { data, loading, error };
}

// --- START OF FILE hooks/useGlobalShortcuts.ts ---

import { useEffect } from 'react';
import type { useModalManager } from '@/hooks/useModalManager';

interface UseGlobalShortcutsProps {
    modals: ReturnType<typeof useModalManager>['modals'];
    canAddTask: boolean;
}

export const useGlobalShortcuts = ({ modals, canAddTask }: UseGlobalShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            if (event.ctrlKey || event.metaKey || event.altKey) return;

            if (event.key === 'Escape' || event.key === 'Esc') {
                event.preventDefault();
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

            if (isTyping) return;

            if (event.key.toLowerCase() === 'n' && canAddTask) {
                event.preventDefault();
                const anyModalOpen = Object.values(modals).some(m => m.isOpen);
                if (!anyModalOpen) {
                    modals.task.open(null);
                }
            }

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
};

// --- START OF FILE hooks/useIdleTimer.ts ---

import { useEffect, useRef, useCallback } from 'react';

/**
 * A custom hook to detect user inactivity.
 * @param onIdle The callback function to execute when the user is idle.
 * @param timeout The idle timeout in milliseconds. Defaults to 5 minutes.
 */
const useIdleTimer = (onIdle: () => void, timeout: number = 5 * 60 * 1000) => {
  const timeoutId = useRef<number | null>(null);

  // Function to reset the idle timer
  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    // Set a new timer only if the document is visible
    if (document.visibilityState === 'visible') {
      timeoutId.current = window.setTimeout(onIdle, timeout);
    }
  }, [onIdle, timeout]);

  // Event handler that resets the timer on any user activity
  const handleEvent = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // List of events that indicate user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];

    // Function to handle visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // If the page is hidden, clear the timer to save resources
        if (timeoutId.current) {
          window.clearTimeout(timeoutId.current);
          timeoutId.current = null;
        }
      } else {
        // When the tab becomes visible again, reset the timer
        resetTimer();
      }
    };

    // Attach event listeners for user activity
    events.forEach(event => window.addEventListener(event, handleEvent));
    // Attach event listener for page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start the initial timer
    resetTimer();

    // Cleanup function to remove listeners and clear the timer on unmount
    return () => {
      events.forEach(event => window.removeEventListener(event, handleEvent));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, [handleEvent, resetTimer]); // Re-run effect if handlers change
};

export default useIdleTimer;

// --- START OF FILE hooks/useLocalStorage.ts ---

import React, { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // This effect will update the state if the key changes (e.g., user logs in/out)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  }, [key]);
  
  return [storedValue, setValue];
}

// --- START OF FILE hooks/useModalManager.ts ---

import { useState, useCallback } from 'react';
import type { Task, Profile, Project } from '../types';

export interface ActionModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    confirmButtonClass?: string;
}

export const useModalManager = () => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isTaskDefaultsModalOpen, setIsTaskDefaultsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | Partial<Task> | null>(null);
    
    const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);

    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [actionModal, setActionModal] = useState<ActionModalState>({
        isOpen: false,
        title: '',
        message: '',
    });

    const handleOpenTaskModal = useCallback((task: Task | Partial<Task> | null = null) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    }, []);

    const handleCloseTaskModal = useCallback(() => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
    }, []);

    const handleOpenEditEmployeeModal = useCallback((employee: Profile) => {
        setEditingEmployee(employee