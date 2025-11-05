export interface Profile {
  id: string; // should match user.id
  updated_at: string;
  full_name: string;
  avatar_url: string;
  role: 'admin' | 'employee';
}

export interface TaskAttachment {
  id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface TimeLog {
  id: number;
  task_id: number;
  user_id: string;
  start_time: string;
  end_time: string | null;
}

export interface TaskComment {
  id: number;
  created_at: string;
  task_id: number;
  user_id: string;
  content: string;
  profiles: Profile;
}

export interface Task {
  id: number;
  user_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  status: 'todo' | 'inprogress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  task_attachments?: TaskAttachment[];
  profiles?: Profile; // For showing assignee info
  creator?: Profile; // For showing creator info
  task_time_logs?: TimeLog[];
  task_comments?: TaskComment[];
}

export interface ActivityLog {
  id: number;
  created_at: string;
  user_id: string;
  task_id: number | null;
  action: string;
  details: {
    task_title?: string;
    from?: Task['status'];
    to?: Task['status'];
    count?: number;
    files?: string[];
  } | null;
  profiles: Profile; // for user info
}


// FIX: Add TimeEntry interface to resolve import errors in multiple components.
export interface TimeEntry {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string | null;
  created_at: string;
}

// FIX: Add PerformanceReview interface to resolve import error in UpdatePerformanceModal.
export interface PerformanceReview {
  id: number;
  user_id: string;
  reviewer_id: string;
  score: number; // 1-5
  comments: string;
  reviewDate: string;
}


export type Translation = {
  // Header
  facebookAria: string;
  phoneAria: string;
  telegramAria: string;
  backToTopAria: string;
  scrollToTopAria: string;
  settingsAria: string;
  openUserGuideAria: string;
  howToUseThisApp: string;
  adminDashboard: string;
  employeeDashboard: string;
  activityLog: string;
  
  // ThemeController
  toggleThemeAria: string;
  appearanceSettingsAria: string;
  themeLabel: string;
  lightTheme: string;
  darkTheme: string;
  accentColorLabel: string;

  // LanguageSwitcher
  language: string;

  // Footer
  copyright: (year: number) => string;
  contactUs: string;

  // TopBar (Simplified)
  liveActivity: string;
  totalTasks: string;
  myTasks: string;
  tasksTodo: string;
  tasksInProgress: string;
  tasksDone: string;
  // FIX: Add missing translation keys for SessionInfo component.
  ipAddress: string;
  sessionTime: string;
  
  // Auth
  authHeader: string;
  authPrompt: string;
  authPromptLogin: string;
  emailLabel: string;
  passwordLabel: string;
  signIn: string;
  signUp: string;
  signOut: string;
  signingIn: string;
  signingUp: string;
  magicLinkSent: string;
  signInToContinue: string;
  cancel: string;

  // Account Modal
  accountSettings: string;
  profile: string;
  password: string;
  updateProfile: string;
  fullName: string;
  avatar: string;
  uploading: string;
  uploadAvatar: string;
  update: string;
  updating: string;
  profileUpdated: string;
  changePassword: string;
  newPassword: string;
  confirmNewPassword: string;
  passwordUpdated: string;
  passwordsDoNotMatch: string;
  
  // Task Dashboard
  dashboardTitle: string;
  myTasksTitle: string;
  allTasksTitle: string;
  signInToManageTasks: string;
  noTasksFound: string;
  addNewTask: string;
  editTask: string;
  deleteTask: string;
  confirmDeleteTask: string;
  deleteTaskConfirmationMessage: (taskTitle: string) => string;
  boardView: string;
  calendarView: string;
  summaryView: string;

  // Task Status
  status: string;
  todo: string;
  inprogress: string;
  done: string;
  cancelled: string;
  overdue: string;

  // Task Priority
  priority: string;
  low: string;
  medium: string;
  high: string;

  // Task Card
  creationTime: string;
  assignee: string;
  createdBy: string;
  totalTimeLogged: string;
  startTimer: string;
  stopTimer: string;
  timerRunningOnAnotherTask: string;
  cancelTask: string;

  // Task Modal
  taskTitleLabel: string;
  descriptionLabel: string;
  dueDateLabel: string;
  attachments: string;
  addAttachment: string;
  pasteOrDrop: string;
  comments: string;
  addComment: string;
  post: string;
  posting: string;
  noCommentsYet: string;

  // Admin Dashboard
  allEmployees: string;
  selectEmployeePrompt: string;
  tasksFor: (name: string) => string;
  addTaskFor: (name: string) => string;
  overallSummary: string;
  performanceSummary: string;
  tasksByStatus: string;
  tasksByPriority: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  last7Days: string;
  last30Days: string;
  avgCompletionTime: string;
  allTasksBoard: string;
  customMonth: string;
  customRange: string;
  clearCancelledTasks: string;
  clearCancelledTasksConfirmation: (count: number) => string;
  
  // Generic Actions
  close: string;
  save: string;
  
  // Admin Modals
  employee: string;
  selectEmployee: string;
  editEmployeeProfile: string;
  role: string;
  admin: string;
  // FIX: Add missing translation keys for modals.
  addNewTimeEntry: string;
  date: string;
  startTime: string;
  endTime: string;
  editPerformanceReview: string;
  score: string;
  // comments: string; // Already exists in new comment section

  // Activity Log
  noActivity: string;
  log_created_task: (user: string, task: string) => string;
  log_updated_task: (user: string, task: string) => string;
  log_deleted_task: (user: string, task: string) => string;
  log_status_changed: (user: string, task: string, from: string, to: string) => string;
  log_added_attachments: (user: string, count: number, task: string) => string;
  log_removed_attachments: (user: string, count: number, task: string) => string;
  log_cleared_cancelled_tasks: (user: string, count: number) => string;
  a_user: string;
  a_task: string;
  
  // Settings
  defaultDueDateIn: string;
  days: string;

  // User Guide
  userGuide_s1_title: string;
  userGuide_s1_l1_strong: string;
  userGuide_s1_l1_text: string;
  userGuide_s1_l2_strong: string;
  userGuide_s1_l2_text: string;

  userGuide_s2_title: string;
  userGuide_s2_l1_strong: string;
  userGuide_s2_l1_text: string;
  userGuide_s2_l2_strong: string;
  userGuide_s2_l2_text: string;
  userGuide_s2_l3_strong: string;
  userGuide_s2_l3_text: string;

  userGuide_s3_title: string;
  userGuide_s3_l1_strong: string;
  userGuide_s3_l1_text: string;
  userGuide_s3_l2_strong: string;
  userGuide_s3_l2_text: string;

  userGuide_s4_title: string;
  userGuide_s4_l1_strong: string;
  userGuide_s4_l1_text: string;
  userGuide_s4_l2_strong: string;
  userGuide_s4_l2_text: string;
};