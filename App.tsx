import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import AuthModal from './components/Auth';
import AccountModal from './components/AccountModal';
import UserGuideModal from './components/UserGuide';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import TaskModal from './components/TimeEntryModal';
import ActivityLogModal from './components/ActivityLogModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { translations } from './translations';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { Profile, Task, TimeLog } from './types';
import { QuestionMarkCircleIcon, ClipboardListIcon, SpinnerIcon, CheckCircleIcon } from './components/Icons';
import { SettingsContext, SettingsContextType, ColorScheme } from './context/SettingsContext';

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

const AppContainer: React.FC<{ session: Session | null }> = ({ session }) => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>('colorScheme', 'sky');
  const [language, setLanguage] = useLocalStorage<keyof typeof translations>('language', 'en');
  const [defaultDueDateOffset, setDefaultDueDateOffset] = useLocalStorage<number>('defaultDueDateOffset', 0);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [isAdminView, setIsAdminView] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [activeTimer, setActiveTimer] = useState<TimeLog | null>(null);

  const refreshData = useCallback(() => setDataVersion(v => v + 1), []);
  const t = translations[language];

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

  const getAllUsers = useCallback(async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        if (error) throw error;
        setAllUsers(data || []);
    } catch (error: any) {
        console.error('Error fetching users:', error.message);
    }
  }, []);

  const getProfile = useCallback(async (user: Session['user'] | null) => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase.from('profiles').select(`*`).eq('id', user.id).single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, full_name: user.email }) // Use email as a default name
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        
        if (newProfile) {
          setProfile(newProfile);
        }
      }
    } catch (error: any) {
      console.error('Error fetching or creating profile:', error.message);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, []);

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

  const handleOpenTaskModal = useCallback((task: Task | Partial<Task> | null = null) => {
    setEditingTask(task as Task | null);
    setIsTaskModalOpen(true);
  }, []);

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (taskData: Partial<Task>, newFiles: File[], deletedAttachmentIds: number[]) => {
    if (!session?.user) return;

    const userId = taskData.user_id; // Get assignee ID from submitted data
    if (!userId) {
        alert("Assignee is required.");
        return;
    }
    
    const isNewTask = !editingTask?.id;
    const dataToSave = { 
        ...taskData,
        ...(isNewTask && { created_by: session.user.id }) // Set creator on new task
    };

    try {
        const { data: savedTask, error: saveError } = isNewTask
            ? await supabase.from('tasks').insert(dataToSave).select().single()
            : await supabase.from('tasks').update(dataToSave).eq('id', editingTask!.id).select().single();

        if (saveError) throw saveError;
        if (!savedTask) throw new Error("Task could not be saved.");

        const taskId = savedTask.id;
        const taskTitle = savedTask.title;

        if (isNewTask) {
            await logActivity('created_task', { task_id: taskId, task_title: taskTitle });
        } else {
            await logActivity('updated_task', { task_id: taskId, task_title: taskTitle });
        }

        if (deletedAttachmentIds.length > 0) {
            const { data: attachmentsToDelete, error: fetchErr } = await supabase
                .from('task_attachments')
                .select('file_path')
                .in('id', deletedAttachmentIds);

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
                const filePath = `${userId}/${taskId}/${crypto.randomUUID()}-${file.name}`;
                return supabase.storage.from('task-attachments').upload(filePath, file);
            });
            const uploadResults = await Promise.all(uploadPromises);

            const newAttachmentRecords = [];
            for (let i = 0; i < uploadResults.length; i++) {
                const result = uploadResults[i];
                const file = newFiles[i];
                if (result.error) {
                    console.error('Upload Error:', result.error.message);
                    continue;
                }
                newAttachmentRecords.push({
                    task_id: taskId, user_id: userId, file_name: file.name,
                    file_path: result.data.path, file_type: file.type, file_size: file.size,
                });
            }

            if (newAttachmentRecords.length > 0) {
                const { error: insertAttachmentsError } = await supabase.from('task_attachments').insert(newAttachmentRecords);
                if (insertAttachmentsError) throw insertAttachmentsError;
                await logActivity('added_attachments', { task_id: taskId, task_title: taskTitle, count: newFiles.length });
            }
        }
        
        refreshData();
        handleCloseTaskModal();

    } catch (error: any) {
        console.error("Error in save task process:", error.message);
        alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (window.confirm(t.deleteTaskConfirmationMessage(task.title))) {
        try {
            // Log before deleting
            await logActivity('deleted_task', { task_id: task.id, task_title: task.title });

            // 1. Delete associated attachments from storage
            if (task.task_attachments && task.task_attachments.length > 0) {
                const filePaths = task.task_attachments.map(att => att.file_path);
                const { error: storageError } = await supabase.storage.from('task-attachments').remove(filePaths);
                if (storageError) {
                    // Log error but proceed, as we still want to delete the DB record
                    console.error("Error deleting storage files:", storageError.message);
                }
            }
            
            // 2. Delete the task record.
            const { data, error: deleteTaskError } = await supabase
                .from('tasks')
                .delete()
                .eq('id', task.id)
                .select();

            if (deleteTaskError) throw deleteTaskError;
            
            if (!data || data.length === 0) {
                console.warn(`Task ${task.id} was not deleted. This might be due to RLS policies.`);
                alert("Could not delete task. You may not have permission.");
                return; // Stop execution if delete failed
            }

            // 3. If the active timer was for this task, clear it.
            if (activeTimer?.task_id === task.id) {
                setActiveTimer(null);
            }
            
            refreshData();
        } catch (error: any) {
            console.error("Error deleting task:", error.message);
            alert(`Error deleting task: ${error.message}`);
        }
    }
  };
    
  const handleUpdateStatus = async (task: Task, status: Task['status']) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id);
      if (error) {
          console.error("Error updating task status:", error.message);
      } else {
          await logActivity('status_changed', { task_id: task.id, task_title: task.title, from: task.status, to: status });
          refreshData();
      }
  };

  const handleStartTimer = async (task: Task) => {
    if (!session || activeTimer) return;
    try {
        const { data, error } = await supabase
            .from('task_time_logs')
            .insert({
                task_id: task.id,
                user_id: session.user.id,
                start_time: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        setActiveTimer(data);
        refreshData();
    } catch (error: any) {
        console.error("Error starting timer:", error.message);
        alert(`Error: ${error.message}`);
    }
  };

  const handleStopTimer = async (timeLog: TimeLog) => {
    if (!activeTimer || activeTimer.id !== timeLog.id) return;
    try {
        const { error } = await supabase
            .from('task_time_logs')
            .update({ end_time: new Date().toISOString() })
            .eq('id', timeLog.id);

        if (error) throw error;
        setActiveTimer(null);
        refreshData();
    } catch (error: any)
    {
        console.error("Error stopping timer:", error.message);
        alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (session) {
      getProfile(session.user);
      getAllUsers();
    }
    else {
      setProfile(null);
      setLoadingProfile(false);
      setIsAdminView(false);
      setAllUsers([]);
      setActiveTimer(null);
    }
  }, [session, getProfile, getAllUsers]);
  
  const handleSignOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const settingsContextValue: SettingsContextType = { theme, setTheme, colorScheme, setColorScheme, language, setLanguage, t, defaultDueDateOffset, setDefaultDueDateOffset };
  
  const renderDashboard = () => {
      if (!session) {
        return (
          <div className="flex flex-col justify-center items-center text-center flex-grow animate-fadeIn p-4">
            <div className="w-full max-w-sm mx-auto mb-8">
              <div className="flex justify-between items-center text-center mb-2">
                <div className="w-24 text-center">
                  <ClipboardListIcon size={32} className="text-orange-400 mx-auto" />
                  <span className="mt-2 font-semibold text-sm block">{t.todo}</span>
                </div>
                <div className="w-24 text-center">
                  <SpinnerIcon size={32} className="text-indigo-400 mx-auto animate-spin" />
                  <span className="mt-2 font-semibold text-sm block">{t.inprogress}</span>
                </div>
                <div className="w-24 text-center">
                  <CheckCircleIcon size={32} className="text-green-400 mx-auto" />
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
      if (loadingProfile) {
          return <div className="text-center p-8">Loading user data...</div>;
      }
      if (!profile) {
          return <div className="text-center p-8 text-xl text-red-500">Could not load user profile. Please try refreshing.</div>
      }
      
      if (profile?.role === 'admin' && isAdminView) {
          return <AdminDashboard 
            dataVersion={dataVersion} 
            refreshData={refreshData} 
            allUsers={allUsers}
            onEditTask={handleOpenTaskModal}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            activeTimer={activeTimer}
          />;
      }
      
      return <EmployeeDashboard 
        session={session} 
        dataVersion={dataVersion} 
        refreshData={refreshData}
        onEditTask={handleOpenTaskModal}
        onDeleteTask={handleDeleteTask}
        onUpdateStatus={handleUpdateStatus}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
        activeTimer={activeTimer}
      />;
  }

  return (
    <SettingsContext.Provider value={settingsContextValue}>
      <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen font-sans flex flex-col">
        <Header 
          session={session}
          profile={profile}
          handleSignOut={handleSignOut}
          onSignInClick={() => setIsAuthModalOpen(true)}
          onAccountClick={() => setIsAccountModalOpen(true)}
          isAdminView={isAdminView}
          setIsAdminView={setIsAdminView}
          onAddNewTask={() => handleOpenTaskModal(null)}
          dataVersion={dataVersion}
          onEditTask={handleOpenTaskModal}
          onDeleteTask={handleDeleteTask}
          onUpdateStatus={handleUpdateStatus}
          onOpenActivityLog={() => setIsActivityLogOpen(true)}
        />

        <main className="container mx-auto px-4 py-8 flex-grow flex flex-col">
          {isSupabaseConfigured ? renderDashboard() : <SupabaseNotConfigured />}
        </main>
        
        <Footer />

        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            <ScrollToTopButton />
            <button
              type="button"
              onClick={() => setIsUserGuideOpen(true)}
              aria-label={t.openUserGuideAria}
              title={t.howToUseThisApp}
              className="p-2 rounded-full bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-lg hover:shadow-xl transform-gpu transition-all duration-300 ease-in-out hover:scale-110"
            >
              <QuestionMarkCircleIcon size={20} />
            </button>
        </div>
        
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <AccountModal isOpen={isAccountModalOpen} onClose={() => { setIsAccountModalOpen(false); if (session) getProfile(session.user); }} session={session} />
        <UserGuideModal isOpen={isUserGuideOpen} onClose={() => setIsUserGuideOpen(false)} />
        <TaskModal 
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          onSave={handleSaveTask}
          task={editingTask}
          allUsers={allUsers}
          currentUser={profile}
        />
        <ActivityLogModal isOpen={isActivityLogOpen} onClose={() => setIsActivityLogOpen(false)} />
      </div>
    </SettingsContext.Provider>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppContainer session={session} />
  );
}