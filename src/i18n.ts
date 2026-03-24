const translations: Record<string, Record<string, string>> = {
  en: {
    // Sidebar
    'preferences': 'Preferences',
    'back_to_projects': 'Back to projects',
    'new_project_placeholder': 'Project name — Enter to create',
    'sign_out': 'Sign out',

    // Tabs
    'board': 'Board',
    'details': 'Details',
    'new_task': '+ Task',

    // Empty states
    'welcome': 'Welcome to Mission Control',
    'welcome_desc': 'Create a project to get started. Each project gets its own task board with drag-and-drop columns.',
    'new_project': '+ New Project',
    'or_press': 'or press',
    'no_tasks': 'No tasks yet',
    'no_tasks_desc': 'Add tasks to track your work. Drag them between columns to update status.',
    'new_task_btn': '+ New Task',
    'select_project': 'Select a project from the sidebar',

    // Project details
    'status': 'Status',
    'tasks_label': 'Tasks',
    'open': 'open',
    'total': 'total',
    'stack': 'Stack',
    'repo_path': 'Repository / Path',
    'context': 'Context',
    'edit_details': 'Edit details',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete_project': 'Delete project',

    // Board
    'add_task': '+ Add task',
    'task_placeholder': 'Task title — Enter to create',
    'add_column': '+ Column',
    'column_name': 'Column name',

    // Settings
    'account': 'Account',
    'interface': 'Interface',
    'agent_context': 'Agent context',
    'api_keys': 'API keys',
    'rtl_layout': 'RTL layout',
    'rtl_desc': 'Use right-to-left text direction',
    'agent_context_desc': 'Key-value pairs shared across all projects. Agents use this to find resources like vaults, skills folders, or API keys.',
    'add_field': '+ Add field',
    'api_keys_desc': 'Authenticate agents via',
    'generate': 'Generate',
    'key_placeholder': 'Key name (e.g. claude-agent)',
    'revoke': 'Revoke',
    'key_created': 'New key created — copy it now, it won\'t be shown again:',
    'dismiss': 'Dismiss',
    'saved': 'Saved',
    'no_api_keys': 'No API keys yet.',

    // Task dialog
    'new_task_title': 'New Task',
    'edit_task': 'Edit Task',
    'title': 'Title',
    'description': 'Description',
    'priority': 'Priority',
    'urgent': 'Urgent',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'create': 'Create',
    'delete': 'Delete',

    // Login
    'mission_control': 'Mission Control',
    'login_desc': 'Project dashboard & task board',
    'sign_in_google': 'Sign in with Google',
    'loading': 'Loading...',
  },
  he: {
    // Sidebar
    'preferences': 'העדפות',
    'back_to_projects': 'חזרה לפרויקטים',
    'new_project_placeholder': 'שם פרויקט — Enter ליצירה',
    'sign_out': 'התנתק',

    // Tabs
    'board': 'לוח',
    'details': 'פרטים',
    'new_task': '+ משימה',

    // Empty states
    'welcome': 'ברוכים הבאים ל-Mission Control',
    'welcome_desc': 'צרו פרויקט כדי להתחיל. כל פרויקט מקבל לוח משימות משלו עם עמודות גרירה.',
    'new_project': '+ פרויקט חדש',
    'or_press': 'או לחצו',
    'no_tasks': 'אין משימות עדיין',
    'no_tasks_desc': 'הוסיפו משימות כדי לעקוב אחרי העבודה. גררו משימות בין עמודות כדי לעדכן סטטוס.',
    'new_task_btn': '+ משימה חדשה',
    'select_project': 'בחרו פרויקט מהסרגל הצדדי',

    // Project details
    'status': 'סטטוס',
    'tasks_label': 'משימות',
    'open': 'פתוחות',
    'total': 'סה"כ',
    'stack': 'טכנולוגיות',
    'repo_path': 'מאגר / נתיב',
    'context': 'הקשר',
    'edit_details': 'עריכת פרטים',
    'save': 'שמירה',
    'cancel': 'ביטול',
    'delete_project': 'מחיקת פרויקט',

    // Board
    'add_task': '+ הוספת משימה',
    'task_placeholder': 'כותרת משימה — Enter ליצירה',
    'add_column': '+ עמודה',
    'column_name': 'שם עמודה',

    // Settings
    'account': 'חשבון',
    'interface': 'ממשק',
    'agent_context': 'הקשר סוכנים',
    'api_keys': 'מפתחות API',
    'rtl_layout': 'תצוגה מימין לשמאל',
    'rtl_desc': 'שימוש בכיוון טקסט מימין לשמאל',
    'agent_context_desc': 'זוגות מפתח-ערך משותפים לכל הפרויקטים. סוכנים משתמשים בזה כדי למצוא משאבים.',
    'add_field': '+ הוספת שדה',
    'api_keys_desc': 'אימות סוכנים באמצעות',
    'generate': 'יצירה',
    'key_placeholder': 'שם מפתח (למשל claude-agent)',
    'revoke': 'ביטול',
    'key_created': 'מפתח חדש נוצר — העתיקו אותו עכשיו, הוא לא יוצג שוב:',
    'dismiss': 'סגירה',
    'saved': 'נשמר',
    'no_api_keys': 'אין מפתחות API עדיין.',

    // Task dialog
    'new_task_title': 'משימה חדשה',
    'edit_task': 'עריכת משימה',
    'title': 'כותרת',
    'description': 'תיאור',
    'priority': 'עדיפות',
    'urgent': 'דחוף',
    'high': 'גבוה',
    'medium': 'בינוני',
    'low': 'נמוך',
    'create': 'יצירה',
    'delete': 'מחיקה',

    // Login
    'mission_control': 'Mission Control',
    'login_desc': 'לוח פרויקטים ומשימות',
    'sign_in_google': 'כניסה עם Google',
    'loading': 'טוען...',
  },
}

let currentLang = 'en'

export function setLanguage(lang: string) {
  currentLang = lang
}

export function getLanguage(): string {
  return currentLang
}

export function t(key: string): string {
  return translations[currentLang]?.[key] ?? translations.en[key] ?? key
}

export function isRtl(): boolean {
  return currentLang === 'he' || currentLang === 'ar'
}
