# Infi Project Source Code

This document contains the complete source code for the Infi Project Performance Tracker, organized to facilitate maintenance, development, and code reuse. The code is divided into two main parts: the reusable core/UI framework and the application-specific logic.

---

## 1. Hàm phụ trợ (Reusable Core & UI Framework)

This section includes foundational code that can be reused in other projects. It covers the UI shell, authentication, settings management, generic components, and utility hooks.

### 1.1. Cấu trúc và Điểm vào (Structure & Entrypoint)

#### `index.html`
```html
<!DOCTYPE html>
<html lang="en" class="theme-sky">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNjQgNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJsb2dvLWdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMGVhNWU5IiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzRmNDZlNSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2xvZ28tZ3JhZGllbnQpIiBkPSJNNDMuMzQsMjAuMDhDMzYuMzgsMTUuNCwyNS44LDE4LjQsMjEuNiwyNi4zMmMtNC4zMiw4LjEyLDEuMjEsMTguNDEsOC4zLDIzLjI4LDcuMzgsNC42NCwxNy43MSwxLjQsMjEuODQsLTYuNiwyLjgzLTUuNDgsMi41My0xMS44LS44Mi0xNi45Mi0yLjMtMy41Mi01Ljc0LTYuMTktOS41OC03LjkyWk0zNi43LDQxLjQ4Yy00LjQ4LDIuOC0xMC4yNywxLjA3LTEyLjg0LTMuNDFzLTEuMDktMTAuMzcsMy40LTEzLjE5LDEwLjI4LTEuMDgsMTIuODUsMy40UzQxLjE5LDM4LjY3LDM2LjcsNDEuNDhabTEyLjE5LTEyLjRjLTQuNDgtMi44MS01LjI2LTguNjYtMi42OS0xMy4xNHM4LjEyLTYsMTIuNi0zLjE4LDUuMjYsOC42NiwyLjY5LDEzLjE0UzUzLjM4LDMxLjg4LDQ4Ljg5LDI5LjA4WiIgLz48L3N2Zz4=" />
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
                  'border-color': 'rgba(239, 68, 68, 0.6)'
                },
                '50%': {
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

#### `index.tsx`
```typescript
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
```

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // FIX: __dirname is not available in ES modules. Use import.meta.url to derive the directory path.
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './'),
    },
  },
});
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["."],
  "exclude": ["node_modules", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

#### `metadata.json`
```json
{
  "name": "Infi Project Performance Tracker",
  "description": "An elegant performance tracker for team members at Infi Project, featuring a calendar-based interface for tracking time and goals, and manager dashboards.",
  "requestFramePermissions": []
}
```

### 1.2. Thư viện và Cấu hình (Libraries & Configuration)

#### `lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These credentials connect to the new Supabase project.
const supabaseUrl: string = 'https://yhnqwxejjkfgmjmiquhb.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlobnF3eGVqamtmZ21qbWlxdWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjMxOTIsImV4cCI6MjA3ODU5OTE5Mn0.U_h3961ZbbF_udT4M2fyJsMpvk8f0bJaOvMo5Mr6O5s';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Please add your SUPABASE_URL and SUPABASE_ANON_KEY to lib/supabase.ts to enable authentication."
  );
}

// Initialize the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### `constants.ts`
```typescript
export const PROJECT_COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#14b8a6', // teal-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
];

export const getRandomColor = (): string => {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
};
```

### 1.3. Giao diện người dùng chung (Generic UI Components)

#### `components/Icons.tsx`
```typescript
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
```

#### `components/common/Avatar.tsx`
```typescript
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
```

#### `components/common/AnimatedNumber.tsx`
```typescript
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

#### `components/common/VirtualItem.tsx`
```typescript
import React, { useState, useRef, useEffect } from 'react';

interface VirtualItemProps {
  children: React.ReactNode;
  placeholder: React.ReactNode;
  rootRef: React.RefObject<HTMLElement>;
}

const VirtualItem: React.FC<VirtualItemProps> = ({ children, placeholder, rootRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We need the root element to be available to initialize the observer
    const rootElement = rootRef.current;
    if (!rootElement) {
        return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the item is intersecting, we set it to visible.
        // We can then unobserve it to prevent further checks, as we are only lazy-loading.
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (itemRef.current) {
            observer.unobserve(itemRef.current);
          }
        }
      },
      {
        root: rootElement,
        rootMargin: '200px 0px', // Pre-load items 200px below and above the visible area of the scroll container
      }
    );

    const currentRef = itemRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [rootRef]);

  return (
    <div ref={itemRef}>
      {isVisible ? children : placeholder}
    </div>
  );
};

export default VirtualItem;
```

#### `components/ActionModal.tsx`
```typescript
import React, { useEffect, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  children?: React.ReactNode;
  maxWidth?: string;
};

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonClass = 'bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)]',
  children,
  maxWidth = 'max-w-md',
}) => {
  const { t } = useSettings();

  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm();
      onClose();
    }
  }, [onConfirm, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Chỉ kích hoạt khi nhấn 'Enter' nếu đó là một modal xác nhận đơn giản (không có children)
      // và có một hành động xác nhận tồn tại. Điều này tránh xung đột với các modal có form.
      if (event.key === 'Enter' && onConfirm && !children) {
        event.preventDefault();
        handleConfirm();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, children, handleConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex justify-center overflow-y-auto p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all duration-300 ease-out animate-fadeInUp my-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 relative">
          <h2 id="action-modal-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          {message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{message}</p>}
        </div>
        {children}
        {!children && (
          <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 flex justify-end items-center space-x-3 rounded-b-2xl">
            {onConfirm && (
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-colors">
                {cancelText || t.cancel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm ? handleConfirm : onClose}
              className={`px-4 py-2 text-sm font-semibold text-white ${confirmButtonClass} rounded-md shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none`}
            >
              {onConfirm ? (confirmText || t.save) : t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionModal;
```

#### `components/Toast.tsx`
```typescript
import React, { useEffect, useState } from 'react';
import { useToasts } from '../context/ToastContext';
import type { Toast as ToastType } from '../context/ToastContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from './Icons';

interface ToastProps {
  toast: ToastType;
}

const toastIcons: { [key in ToastType['type']]: React.FC<any> } = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
};

const toastColors: { [key in ToastType['type']]: string } = {
  success: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  error: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  info: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
};

const iconColors: { [key in ToastType['type']]: string } = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const { removeToast } = useToasts();
  const [isExiting, setIsExiting] = useState(false);
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 3000); // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isExiting, toast.id, removeToast]);
  
  const animationClass = isExiting ? 'animate-fadeOutUp' : 'animate-fadeInDown';

  return (
    <div className={`rounded-full shadow-lg px-4 py-2 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg ${toastColors[toast.type]} ${animationClass}`}>
      <Icon size={18} className={iconColors[toast.type]} />
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
};

export default Toast;
```

#### `components/ToastContainer.tsx`
```typescript
import React from 'react';
import { useToasts } from '../context/ToastContext';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const { toasts } = useToasts();

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[1000] space-y-2 flex flex-col items-center">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
```

#### `components/Skeleton.tsx`
```typescript
import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

export const TaskCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-900/70 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
        </div>
        <Skeleton className="h-4 w-full mt-1" />
        <Skeleton className="h-4 w-2/3 mt-1" />
        <div className="flex flex-wrap justify-between items-center mt-2 gap-y-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-1.5">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
        </div>
    </div>
);

export const TaskBoardSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <div className="space-y-3">
                    <TaskCardSkeleton />
                    <TaskCardSkeleton />
                    <TaskCardSkeleton />
                </div>
            </div>
        ))}
    </div>
);

export const EmployeeListSkeleton: React.FC = () => (
    <ul className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 flex-grow" />
            </li>
        ))}
    </ul>
);

export const ActivityLogItemSkeleton: React.FC = () => (
    <div className="flex items-start gap-3 p-1">
        <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
        <div className="flex-grow">
            <Skeleton className="h-4 w-3/4 mb-1.5" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    </div>
);
```

#### `components/ScrollToTopButton.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { ChevronUpIcon } from '@/components/Icons';
import { useSettings } from '@/context/SettingsContext';

const ScrollToTopButton: React.FC = () => {
  const { t } = useSettings();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t.scrollToTopAria}
      className={`p-2 rounded-full bg-gradient-to-br from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-lg hover:shadow-xl transform-gpu transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`
      }
    >
      <ChevronUpIcon size={20} />
    </button>
  );
};

export default React.memo(ScrollToTopButton);
```

### 1.4. Bố cục chính và Điều hướng (Main Layout & Navigation)

#### `components/Header.tsx`
```typescript
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
```

#### `components/header/UserMenu.tsx`
```typescript
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

#### `components/header/AdminNav.tsx`
```typescript
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
```

#### `components/TopBar.tsx`
```typescript
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
```

#### `components/Footer.tsx`
```typescript
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

#### `components/AppModals.tsx`
```typescript
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
```

### 1.5. Quản lý Trạng thái và Ngữ cảnh (State Management & Context)

#### `context/SettingsContext.tsx`
```typescript
import React from 'react';
import { translations } from '@/translations';
import { Translation, Task } from '@/types';

export type ColorScheme = 'sky' | 'amethyst' | 'sunset' | 'emerald' | 'crimson';

// Define the shape of the context data
export interface SettingsContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  language: keyof typeof translations;
  setLanguage: (lang: keyof typeof translations) => void;
  t: Translation;
  defaultDueDateOffset: number;
  setDefaultDueDateOffset: (offset: number) => void;
  defaultPriority: Task['priority'];
  setDefaultPriority: (priority: Task['priority']) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
}

// Create the context with an undefined initial value
export const SettingsContext = React.createContext<SettingsContextType | undefined>(undefined);

// Custom hook for consuming the context, which provides better type safety and error handling
export const useSettings = (): SettingsContextType => {
    const context = React.useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
```

#### `context/ToastContext.tsx`
```typescript
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now() + Math.random();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};
```

### 1.6. Hooks Tái sử dụng (Reusable Hooks)

#### `hooks/useLocalStorage.ts`
```typescript
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
```

#### `hooks/useSupabaseAuth.ts`
```typescript
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const useSupabaseAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error.message);
        }
    };

    return { session, loading, handleSignOut };
};
```

#### `hooks/useModalManager.ts`
```typescript
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
        setEditingEmployee(employee);
        setIsEditEmployeeModalOpen(true);
    }, []);

    const handleCloseEditEmployeeModal = useCallback(() => {
        setIsEditEmployeeModalOpen(false);
        setEditingEmployee(null);
    }, []);
    
    const handleOpenProjectModal = useCallback((project: Project | null) => {
        setEditingProject(project);
        setIsProjectModalOpen(true);
    }, []);

    const handleCloseProjectModal = useCallback(() => {
        setIsProjectModalOpen(false);
        setEditingProject(null);
    }, []);


    return {
        modals: {
            auth: { isOpen: isAuthModalOpen, open: () => setIsAuthModalOpen(true), close: () => setIsAuthModalOpen(false) },
            account: { isOpen: isAccountModalOpen, open: () => setIsAccountModalOpen(true), close: () => setIsAccountModalOpen(false) },
            userGuide: { isOpen: isUserGuideOpen, open: () => setIsUserGuideOpen(true), close: () => setIsUserGuideOpen(false) },
            activityLog: { isOpen: isActivityLogOpen, open: () => setIsActivityLogOpen(true), close: () => setIsActivityLogOpen(false) },
            notifications: { isOpen: isNotificationsOpen, open: () => setIsNotificationsOpen(true), close: () => setIsNotificationsOpen(false) },
            taskDefaults: { isOpen: isTaskDefaultsModalOpen, open: () => setIsTaskDefaultsModalOpen(true), close: () => setIsTaskDefaultsModalOpen(false) },
            task: { 
                isOpen: isTaskModalOpen, 
                open: handleOpenTaskModal, 
                close: handleCloseTaskModal, 
                editingTask 
            },
            editEmployee: {
                isOpen: isEditEmployeeModalOpen,
                open: handleOpenEditEmployeeModal,
                close: handleCloseEditEmployeeModal,
                editingEmployee,
            },
            editProject: {
                isOpen: isProjectModalOpen,
                open: handleOpenProjectModal,
                close: handleCloseProjectModal,
                editingProject,
            },
            action: {
                ...actionModal,
                open: (config: Omit<ActionModalState, 'isOpen'>) => setActionModal({ ...config, isOpen: true }),
                close: () => setActionModal(prev => ({ ...prev, isOpen: false })),
                setState: setActionModal,
            }
        }
    };
};
```

#### `hooks/useIdleTimer.ts`
```typescript
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
```

#### `hooks/useGlobalShortcuts.ts`
```typescript
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
```

#### `hooks/useCachedSupabaseQuery.ts`
```typescript
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
```

### 1.7. Xác thực và Cài đặt (Authentication & Settings)

#### `components/Auth.tsx`
```typescript
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
```

#### `components/AccountModal.tsx`
```typescript
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
```

#### `components/SettingsController.tsx`
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { SunIcon, MoonIcon, CheckIcon, SettingsIcon } from '@/components/Icons';
import { translations, languageOptions } from '@/translations';
import { useSettings, ColorScheme } from '@/context/SettingsContext';

const colorThemes: { name: ColorScheme, from: string, to: string }[] = [
    { name: 'sky', from: 'from-sky-500', to: 'to-indigo-600' },
    { name: 'amethyst', from: 'from-violet-600', to: 'to-gray-800' },
    { name: 'sunset', from: 'from-orange-500', to: 'to-rose-600' },
    { name: 'emerald', from: 'from-emerald-500', to: 'to-emerald-700' },
    { name: 'crimson', from: 'from-red-600', to: 'to-gray-800' },
];

const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Hanoi (GMT+7)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Chicago', label: 'Chicago (CST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
];

const SettingsController: React.FC = () => {
  const {
    theme,
    setTheme,
    colorScheme,
    setColorScheme,
    language,
    setLanguage,
    t,
    timezone,
    setTimezone,
  } = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLanguageChange = (langId: keyof typeof translations) => {
    setLanguage(langId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        aria-label={t.settingsAria}
        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <SettingsIcon size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-fadeIn p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.themeLabel}</label>
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full p-1">
              <button onClick={() => setTheme('light')} className={`w-1/2 flex justify-center items-center gap-2 py-1 text-sm rounded-full ${theme === 'light' ? 'bg-white shadow' : ''}`}><SunIcon size={16}/> {t.lightTheme}</button>
              <button onClick={() => setTheme('dark')} className={`w-1/2 flex justify-center items-center gap-2 py-1 text-sm rounded-full ${theme === 'dark' ? 'bg-gray-800 text-white shadow' : ''}`}><MoonIcon size={16}/> {t.darkTheme}</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.accentColorLabel}</label>
            <div className="flex items-center gap-3">
              {colorThemes.map(ct => (
                <button key={ct.name} onClick={() => setColorScheme(ct.name)} className={`w-8 h-8 rounded-full bg-gradient-to-br ${ct.from} ${ct.to} flex items-center justify-center`}>
                  {colorScheme === ct.name && <CheckIcon size={16} className="text-white"/>}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.language}</label>
            <select id="language" value={language} onChange={e => handleLanguageChange(e.target.value as keyof typeof translations)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm">
                {languageOptions.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.timezone}</label>
            <select id="timezone" value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm">
                {timezones.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>

        </div>
      )}
    </div>
  );
};

export default SettingsController;
```

#### `components/UserGuide.tsx`
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { XIcon, SearchIcon, PlayIcon, ClipboardListIcon, UsersIcon, SettingsIcon, KeyboardIcon } from '@/components/Icons';
import { useSettings } from '@/context/SettingsContext';
import type { Translation } from '@/types';

// FIX: Add IconProps to strongly type icon components.
interface IconProps {
  className?: string;
  size?: number;
  fill?: string;
}

// FIX: Define a type for translation keys that point to string values to ensure type safety.
type StringTranslationKey = {
  [K in keyof Translation]: Translation[K] extends string ? K : never;
}[keyof Translation];

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <details className="group border-b border-gray-200 dark:border-gray-700 py-4 last:border-b-0" open>
    <summary className="font-semibold text-lg cursor-pointer flex justify-between items-center text-gray-800 dark:text-gray-200 group-hover:text-[var(--accent-color)] dark:group-hover:text-[var(--accent-color-dark)] transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        {title}
      </div>
      <span className="transform transition-transform duration-200 group-open:rotate-180 text-sm">▼</span>
    </summary>
    <div className="mt-4 text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none">
      {children}
    </div>
  </details>
);

// FIX: Strongly type the guideSections array to prevent type errors with translation keys.
const guideSections: Array<{
    titleKey: StringTranslationKey;
    icon: React.FC<IconProps>;
    items: Array<{
        strongKey: StringTranslationKey;
        textKey: StringTranslationKey;
    }>;
}> = [
    {
        titleKey: 'userGuide_s1_title',
        icon: PlayIcon,
        items: [
            { strongKey: 'userGuide_s1_l1_strong', textKey: 'userGuide_s1_l1_text' },
            { strongKey: 'userGuide_s1_l2_strong', textKey: 'userGuide_s1_l2_text' },
        ]
    },
    {
        titleKey: 'userGuide_s2_title',
        icon: ClipboardListIcon,
        items: [
            { strongKey: 'userGuide_s2_l1_strong', textKey: 'userGuide_s2_l1_text' },
            { strongKey: 'userGuide_s2_l2_strong', textKey: 'userGuide_s2_l2_text' },
            { strongKey: 'userGuide_s2_l3_strong', textKey: 'userGuide_s2_l3_text' },
        ]
    },
    {
        titleKey: 'userGuide_s3_title',
        icon: UsersIcon,
        items: [
            { strongKey: 'userGuide_s3_l1_strong', textKey: 'userGuide_s3_l1_text' },
            { strongKey: 'userGuide_s3_l2_strong', textKey: 'userGuide_s3_l2_text' },
        ]
    },
    {
        titleKey: 'userGuide_s4_title',
        icon: SettingsIcon,
        items: [
            { strongKey: 'userGuide_s4_l1_strong', textKey: 'userGuide_s4_l1_text' },
            { strongKey: 'userGuide_s4_l2_strong', textKey: 'userGuide_s4_l2_text' },
        ]
    },
    {
        titleKey: 'userGuide_s5_title',
        icon: KeyboardIcon,
        items: [
            { strongKey: 'userGuide_s5_l1_strong', textKey: 'userGuide_s5_l1_text' },
            { strongKey: 'userGuide_s5_l2_strong', textKey: 'userGuide_s5_l2_text' },
            { strongKey: 'userGuide_s5_l3_strong', textKey: 'userGuide_s5_l3_text' },
        ]
    },
];


const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
    const { t } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSections = useMemo(() => {
        if (!searchTerm.trim()) {
            return guideSections;
        }
        const lowercasedFilter = searchTerm.toLowerCase();

        return guideSections.filter(section => {
            const titleText = t[section.titleKey];
            const titleMatch = typeof titleText === 'string' && titleText.toLowerCase().includes(lowercasedFilter);
            if (titleMatch) {
                return true;
            }
            
            const contentMatch = section.items.some(item => {
                const strongText = t[item.strongKey];
                const regularText = t[item.textKey];
                const strongMatch = typeof strongText === 'string' && strongText.toLowerCase().includes(lowercasedFilter);
                const textMatch = typeof regularText === 'string' && regularText.toLowerCase().includes(lowercasedFilter);
                return strongMatch || textMatch;
            });
            return contentMatch;
        });

    }, [searchTerm, t]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSearchTerm(''); // Reset search on open
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;
  
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex justify-center overflow-y-auto p-4 animate-fadeIn"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-guide-modal-title"
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-out animate-fadeInUp my-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="user-guide-modal-title" className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.howToUseThisApp}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label={t.close}
                    >
                        <XIcon size={24} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t.userGuide_searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon size={20} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto p-6">
                    {filteredSections.length > 0 ? (
                        filteredSections.map((section, index) => {
                           const SectionIcon = section.icon;
                           return (
                             // FIX: Use strongly typed key to ensure title is a string.
                             <GuideSection key={index} title={t[section.titleKey]} icon={<SectionIcon size={20} className="text-gray-500" />}>
                                <ul>
                                    {section.items.map((item, itemIndex) => (
                                        <li key={itemIndex}>
                                            {/* FIX: Use strongly typed keys to ensure text content is valid ReactNode. */}
                                            <strong>{t[item.strongKey]}</strong> {t[item.textKey]}
                                        </li>
                                    ))}
                                </ul>
                             </GuideSection>
                           )
                        })
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">No results found for "{searchTerm}".</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserGuideModal;
```

---

## 2. Hàm main (Application-Specific Logic)

This section contains the core logic and components specific to the Task Management and Performance Tracking functionality of the Infi Project.

### 2.1. Định nghĩa kiểu dữ liệu (Domain-Specific Types)

#### `types.ts`
```typescript
export interface Profile {
  id: string; // should match user.id
  created_at?: string;
  updated_at: string | null;
  last_sign_in_at?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'employee';
  default_project_id?: number | null;
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

export interface Project {
  id: number;
  created_at: string;
  name: string;
  created_by: string;
  project_members?: { count: number }[];
  color?: string | null;
}

export interface ProjectMember {
    project_id: number;
    user_id: string;
    created_at: string;
    projects: Project | null;
    profiles?: Profile;
}

export interface MemberDetails extends ProjectMember {
    profiles: Profile;
    task_count: number;
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
  project_id?: number | null;
  projects?: Project; // For showing project info
  task_attachments?: TaskAttachment[];
  assignee?: Profile; // For showing assignee info
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

export interface Notification {
  id: number;
  created_at: string;
  user_id: string;
  actor_id: string;
  type: 'new_task_assigned' | 'new_comment' | 'new_project_created' | 'new_user_registered';
  data: {
    task_id?: number;
    task_title?: string;
    assigner_name?: string;
    commenter_name?: string;
    project_id?: number;
    project_name?: string;
    creator_name?: string;
    new_user_id?: string;
    new_user_name?: string;
  };
  is_read: boolean;
  profiles: Profile; // For actor info
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
  notifications: string;
  notifications_new_task: (assigner: string, task: string) => string;
  notifications_new_comment: (commenter: string, task: string) => string;
  notifications_new_project: (creator: string, project: string) => string;
  notifications_new_user: (newUser: string) => string;
  notifications_empty: string;
  mark_all_as_read: string;
  view_task: string;
  
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
  taskDeleted: string;
  taskNotFound: string;
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
  completionTime: string; // for sorting
  completionDate: string; // for card display
  assignee: string;
  createdBy: string;
  totalTimeLogged: string;
  startTimer: string;
  stopTimer: string;
  timerRunningOnAnotherTask: string;
  cancelTask: string;
  copyTaskId: string;
  project: string;

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
  saveTaskToComment: string;

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
  lastWeek: string;
  avgCompletionTime: string;
  allTasksBoard: string;
  customMonth: string;
  customRange: string;
  userManagement: string;
  projectManagement: string;
  management: string;
  searchUsers: string;
  lastUpdated: string;
  actions: string;
  editUser: string;
  deleteUser: string;
  confirmDeleteUser: (name: string) => string;
  
  // Generic Actions
  close: string;
  save: string;
  
  // Admin Modals
  employee: string;
  manager: string;
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
  log_searchPlaceholder: string;
  log_filterByUser: string;
  log_allUsers: string;
  log_filterByAction: string;
  log_allActions: string;
  log_action_created_task: string;
  log_action_updated_task: string;
  log_action_deleted_task: string;
  log_action_status_changed: string;
  log_action_added_attachments: string;
  log_action_removed_attachments: string;
  log_action_cleared_cancelled_tasks: string;

  // Notifications filters
  notif_searchPlaceholder: string;
  notif_filterByActor: string;
  notif_allActors: string;
  notif_filterByType: string;
  notif_allTypes: string;
  notif_type_new_task: string;
  notif_type_new_comment: string;
  notif_type_new_project: string;
  notif_type_new_user: string;
  notif_filterByStatus: string;
  notif_allStatuses: string;
  notif_status_read: string;
  notif_status_unread: string;

  // Settings
  defaultDueDateIn: string;
  days: string;
  clearCancelledTasksTitle: string;
  clearCancelledTasksConfirmation: (count: number) => string;
  timezone: string;
  defaultProject: string;
  personalProject: string;

  // User Guide
  userGuide_searchPlaceholder: string;
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

  userGuide_s5_title: string;
  userGuide_s5_l1_strong: string;
  userGuide_s5_l1_text: string;
  userGuide_s5_l2_strong: string;
  userGuide_s5_l2_text: string;
  userGuide_s5_l3_strong: string;
  userGuide_s5_l3_text: string;

  // Filters
  searchPlaceholder: string;
  filterByCreator: string;
  allCreators: string;
  filterByPriority: string;
  allPriorities: string;
  filterByDueDate: string;
  allDates: string;
  dueToday: string;
  dueThisWeek: string;
  filterByProject: string;
  allProjects: string;
  
  // Calendar Sorting
  sortBy: string;
  sortDefault: string;
  sortStatus: string;
  sortPriority: string;
  sortCreationDate: string;

  // General App
  dataRefreshed: string;

  // Project Management
  createdAt: string;
  members: string;
  manageMembers: string;
  addMember: string;
  removeMember: string;
  joinedOn: string;
  tasksInProject: string;
  confirmRemoveMember: (name: string, project: string) => string;
  selectUserToAdd: string;
  noMembers: string;
};
```

#### `translations.ts`
```typescript
import { Translation } from "@/types";

const en: Translation = {
  // Header
  facebookAria: "Facebook Profile",
  phoneAria: "Telephone/Zalo",
  telegramAria: "Telegram Profile",
  backToTopAria: "Back to top",
  scrollToTopAria: "Scroll to top",
  settingsAria: "Open settings",
  openUserGuideAria: "Open User Guide",
  howToUseThisApp: "How to Use This App",
  adminDashboard: "Task Dashboard",
  employeeDashboard: "My Tasks",
  activityLog: "Activity Log",
  notifications: "Notifications",
  notifications_new_task: (assigner, task) => `<strong>${assigner}</strong> assigned you a new task: <strong>${task}</strong>.`,
  notifications_new_comment: (commenter, task) => `<strong>${commenter}</strong> commented on your task: <strong>${task}</strong>.`,
  notifications_new_project: (creator, project) => `<strong>${creator}</strong> created a new project: <strong>${project}</strong>.`,
  notifications_new_user: (newUser) => `A new user has registered: <strong>${newUser}</strong>.`,
  notifications_empty: "You have no new notifications.",
  mark_all_as_read: "Mark all as read",
  view_task: "View Task",

  // ThemeToggle & Controller
  toggleThemeAria: "Toggle theme",
  appearanceSettingsAria: "Appearance",
  themeLabel: "Theme",
  lightTheme: "Light",
  darkTheme: "Dark",
  accentColorLabel: "Accent Color",

  // LanguageSwitcher
  language: "Language",

  // Footer
  copyright: (year) => `© ${year} Infi Project. All rights reserved.`,
  contactUs: "Contact Us",

  // TopBar
  liveActivity: "Activity",
  totalTasks: "Total Tasks",
  myTasks: "My Tasks",
  tasksTodo: "To Do",
  tasksInProgress: "In Progress",
  tasksDone: "Done",
  // FIX: Add missing translations for SessionInfo.
  ipAddress: "IP Address",
  sessionTime: "Session Time",

  // Auth
  authHeader: "Welcome to Infi Project",
  authPrompt: "Sign in to manage your tasks.",
  authPromptLogin: "Don't have an account?",
  emailLabel: "Email address",
  passwordLabel: "Password",
  signIn: "Sign In",
  signUp: "Sign Up",
  signOut: "Sign Out",
  signingIn: "Signing In...",
  signingUp: "Signing Up...",
  magicLinkSent: "Check your email for the login link!",
  signInToContinue: "Sign in to continue",
  cancel: "Cancel",

  // Account Modal
  accountSettings: "Account Settings",
  profile: "Profile",
  password: "Password",
  updateProfile: "Update Profile",
  fullName: "Full Name",
  avatar: "Avatar",
  uploading: "Uploading...",
  uploadAvatar: "Upload Avatar",
  update: "Update",
  updating: "Updating...",
  profileUpdated: "Profile updated successfully!",
  changePassword: "Change Password",
  newPassword: "New Password",
  confirmNewPassword: "Confirm New Password",
  passwordUpdated: "Password updated successfully!",
  passwordsDoNotMatch: "Passwords do not match.",

  // Task Dashboard
  dashboardTitle: "Task Board",
  myTasksTitle: "My Tasks",
  allTasksTitle: "All Tasks",
  signInToManageTasks: "Please sign in to manage your tasks.",
  noTasksFound: "No tasks found. Add one to get started!",
  addNewTask: "Add New Task",
  editTask: "Edit Task",
  deleteTask: "Delete Task",
  confirmDeleteTask: "Confirm Deletion",
  deleteTaskConfirmationMessage: (taskTitle: string) => `Are you sure you want to delete the task "${taskTitle}"? This action cannot be undone.`,
  taskDeleted: "This task has been deleted.",
  taskNotFound: "Task Not Found",
  boardView: "Board View",
  calendarView: "Calendar View",
  summaryView: "Summary View",

  // Task Status
  status: "Status",
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
  overdue: "Overdue",

  // Task Priority
  priority: "Priority",
  low: "Low",
  medium: "Medium",
  high: "High",

  // Task Card
  creationTime: "Created at",
  completionTime: "Finished At",
  completionDate: "Completed at",
  assignee: "Assignee",
  createdBy: "Created by",
  totalTimeLogged: "Total time logged",
  startTimer: "Start Timer",
  stopTimer: "Stop Timer",
  timerRunningOnAnotherTask: "Timer is running on another task",
  cancelTask: "Cancel Task",
  copyTaskId: "Copy Task ID",
  project: "Project",

  // Task Modal
  taskTitleLabel: "Task Title",
  descriptionLabel: "Description (optional)",
  dueDateLabel: "Due Date",
  attachments: "Attachments",
  addAttachment: "Add Attachment",
  pasteOrDrop: "Drop files here or paste from clipboard",
  comments: "Comments",
  addComment: "Add a comment...",
  post: "Post",
  posting: "Posting...",
  noCommentsYet: "No comments yet.",
  saveTaskToComment: "Save the task to add comments.",

  // Admin Dashboard
  allEmployees: "All Employees",
  selectEmployeePrompt: "Select an employee to view their tasks.",
  tasksFor: (name: string) => `Tasks for ${name}`,
  addTaskFor: (name: string) => `Add Task for ${name}`,
  overallSummary: "Overall Summary",
  performanceSummary: "Performance Summary",
  tasksByStatus: "Tasks by Status",
  tasksByPriority: "Tasks by Priority",
  today: "Today",
  thisWeek: "This Week",
  thisMonth: "This Month",
  lastWeek: "Last Week",
  avgCompletionTime: "Avg. Completion Time",
  allTasksBoard: "All Tasks Board",
  customMonth: "By Month",
  customRange: "Date Range",
  userManagement: "User Management",
  projectManagement: "Project Management",
  management: "Management",
  searchUsers: "Search users by name...",
  lastUpdated: "Last Updated",
  actions: "Actions",
  editUser: "Edit User",
  deleteUser: "Delete User",
  confirmDeleteUser: (name: string) => `Are you sure you want to delete the user "${name}"? This action is irreversible.`,

  // Generic Actions
  close: "Close",
  save: "Save",
  
  // Admin Modals
  employee: "Employee",
  manager: "Manager",
  selectEmployee: "Select an Employee",
  editEmployeeProfile: "Edit Employee Profile",
  role: "Position",
  admin: "Admin",
  // FIX: Add missing translations for modals.
  addNewTimeEntry: "Add New Time Entry",
  date: "Date",
  startTime: "Start Time",
  endTime: "End Time (optional)",
  editPerformanceReview: "Edit Performance Review",
  score: "Score",
  // comments: "Comments", // Already exists

  // Activity Log
  noActivity: "No recent activity found.",
  log_created_task: (user, task) => `${user} created task ${task}.`,
  log_updated_task: (user, task) => `${user} updated task ${task}.`,
  log_deleted_task: (user, task) => `${user} deleted task ${task}.`,
  log_status_changed: (user, task, from, to) => `${user} changed status of ${task} from ${from} to ${to}.`,
  log_added_attachments: (user, count, task) => `${user} added ${count} attachment(s) to ${task}.`,
  log_removed_attachments: (user, count, task) => `${user} removed ${count} attachment(s) from ${task}.`,
  log_cleared_cancelled_tasks: (user, count) => `${user} cleared ${count} cancelled tasks.`,
  a_user: "A user",
  a_task: "a task",
  log_searchPlaceholder: "Search logs by user, action, or task...",
  log_filterByUser: "Filter by User",
  log_allUsers: "All Users",
  log_filterByAction: "Filter by Action",
  log_allActions: "All Actions",
  log_action_created_task: "Task Created",
  log_action_updated_task: "Task Updated",
  log_action_deleted_task: "Task Deleted",
  log_action_status_changed: "Status Changed",
  log_action_added_attachments: "Attachments Added",
  log_action_removed_attachments: "Attachments Removed",
  log_action_cleared_cancelled_tasks: "Cleared Cancelled Tasks",

  // Notifications filters
  notif_searchPlaceholder: "Search by content, user, or task...",
  notif_filterByActor: "Filter by Actor",
  notif_allActors: "All Actors",
  notif_filterByType: "Filter by Type",
  notif_allTypes: "All Types",
  notif_type_new_task: "New Task Assigned",
  notif_type_new_comment: "New Comment",
  notif_type_new_project: "New Project Created",
  notif_type_new_user: "New User Registered",
  notif_filterByStatus: "Filter by Status",
  notif_allStatuses: "All Statuses",
  notif_status_read: "Read",
  notif_status_unread: "Unread",

  // Settings
  defaultDueDateIn: "Default due date in",
  days: "days",
  clearCancelledTasksTitle: "Clear all cancelled tasks",
  clearCancelledTasksConfirmation: (count) => `Are you sure you want to permanently delete ${count} cancelled tasks? This cannot be undone.`,
  timezone: "Timezone",
  defaultProject: "Default Project",
  personalProject: "Personal",

  // User Guide
  userGuide_searchPlaceholder: "Search guide...",
  userGuide_s1_title: "Getting Started",
  userGuide_s1_l1_strong: "Sign In:",
  userGuide_s1_l1_text: "Log in to access your personal task board.",
  userGuide_s1_l2_strong: "Dashboard Overview:",
  userGuide_s1_l2_text: "The main dashboard displays your tasks organized by status: To Do, In Progress, and Done.",

  userGuide_s2_title: "Managing Your Tasks",
  userGuide_s2_l1_strong: "Add a Task:",
  userGuide_s2_l1_text: "Click the 'Add New Task' button to create a new task. You can set a title, description, priority, and due date.",
  userGuide_s2_l2_strong: "Update a Task:",
  userGuide_s2_l2_text: "Click on any task card to open the editor. You can change its status by moving it to another column or edit its details.",
  userGuide_s2_l3_strong: "Priorities & Status:",
  userGuide_s2_l3_text: "Use priorities (Low, Medium, High) to organize your work. The status columns help you track progress from start to finish.",

  userGuide_s3_title: "Manager Dashboard",
  userGuide_s3_l1_strong: "Switch to Manager View:",
  userGuide_s3_l1_text: "If you are a manager, use the toggle in the header to switch to the 'Manager Dashboard'.",
  userGuide_s3_l2_strong: "View Employee Tasks:",
  userGuide_s3_l2_text: "Select an employee from the list to view and manage their tasks. You can also view an overall summary of all tasks in the system.",

  userGuide_s4_title: "Account & Settings",
  userGuide_s4_l1_strong: "Account Settings:",
  userGuide_s4_l1_text: "Click your name to update your profile information, such as your full name and avatar.",
  userGuide_s4_l2_strong: "Appearance:",
  userGuide_s4_l2_text: "Use the settings icon to switch between light/dark themes and change the application's language.",

  userGuide_s5_title: "Keyboard Shortcuts",
  userGuide_s5_l1_strong: "N:",
  userGuide_s5_l1_text: "Press 'N' to open the 'Add New Task' modal.",
  userGuide_s5_l2_strong: "F:",
  userGuide_s5_l2_text: "Press 'F' to focus the main search bar.",
  userGuide_s5_l3_strong: "Esc:",
  userGuide_s5_l3_text: "Press 'Escape' to close any open modal window.",

  // Filters
  searchPlaceholder: "Search by title, description, ID, or comments...",
  filterByCreator: "Creator",
  allCreators: "All Creators",
  filterByPriority: "Priority",
  allPriorities: "All Priorities",
  filterByDueDate: "Due Date",
  allDates: "All Due Dates",
  dueToday: "Due Today",
  dueThisWeek: "Due This Week",
  filterByProject: "Project",
  allProjects: "All Projects",
  
  // Calendar Sorting
  sortBy: "Sort by",
  sortDefault: "Default",
  sortStatus: "Status",
  sortPriority: "Priority",
  sortCreationDate: "Creation Date",

  // General App
  dataRefreshed: "Data refreshed automatically.",

  // Project Management
  createdAt: "Created At",
  members: "Members",
  manageMembers: "Manage Members",
  addMember: "Add Member",
  removeMember: "Remove Member",
  joinedOn: "Joined on",
  tasksInProject: "Tasks in project",
  confirmRemoveMember: (name: string, project: string) => `Are you sure you want to remove ${name} from ${project}?`,
  selectUserToAdd: "Select a user to add",
  noMembers: "No members in this project yet.",
};

const vi: Translation = {
  // Header
  facebookAria: "Hồ sơ Facebook",
  phoneAria: "Điện thoại/Zalo",
  telegramAria: "Hồ sơ Telegram",
  backToTopAria: "Quay về đầu trang",
  scrollToTopAria: "Cuộn lên đầu trang",
  settingsAria: "Mở cài đặt",
  openUserGuideAria: "Mở Hướng dẫn sử dụng",
  howToUseThisApp: "Hướng dẫn sử dụng ứng dụng",
  adminDashboard: "Dashboard Công việc",
  employeeDashboard: "Việc của tôi",
  activityLog: "Nhật ký hoạt động",
  notifications: "Thông báo",
  notifications_new_task: (assigner, task) => `<strong>${assigner}</strong> đã giao cho bạn công việc mới: <strong>${task}</strong>.`,
  notifications_new_comment: (commenter, task) => `<strong>${commenter}</strong> đã bình luận về công việc của bạn: <strong>${task}</strong>.`,
  notifications_new_project: (creator, project) => `<strong>${creator}</strong> đã tạo dự án mới: <strong>${project}</strong>.`,
  notifications_new_user: (newUser) => `Một người dùng mới đã đăng ký: <strong>${newUser}</strong>.`,
  notifications_empty: "Bạn không có thông báo nào.",
  mark_all_as_read: "Đánh dấu tất cả là đã đọc",
  view_task: "Xem công việc",

  // ThemeToggle & Controller
  toggleThemeAria: "Chuyển đổi giao diện",
  appearanceSettingsAria: "Giao diện",
  themeLabel: "Giao diện",
  lightTheme: "Sáng",
  darkTheme: "Tối",
  accentColorLabel: "Màu nhấn",

  // LanguageSwitcher
  language: "Ngôn ngữ",

  // Footer
  copyright: (year) => `© ${year} Infi Project. Đã đăng ký bản quyền.`,
  contactUs: "Liên hệ",

  // TopBar
  liveActivity: "Hoạt động",
  totalTasks: "Tổng số công việc",
  myTasks: "Việc của tôi",
  tasksTodo: "Cần làm",
  tasksInProgress: "Đang làm",
  tasksDone: "Hoàn thành",
  // FIX: Add missing translations for SessionInfo.
  ipAddress: "Địa chỉ IP",
  sessionTime: "Thời gian phiên",
  
  // Auth
  authHeader: "Chào mừng đến với Infi Project",
  authPrompt: "Đăng nhập để quản lý công việc của bạn.",
  authPromptLogin: "Chưa có tài khoản?",
  emailLabel: "Địa chỉ email",
  passwordLabel: "Mật khẩu",
  signIn: "Đăng nhập",
  signUp: "Đăng ký",
  signOut: "Đăng xuất",
  signingIn: "Đang đăng nhập...",
  signingUp: "Đang đăng ký...",
  magicLinkSent: "Kiểm tra email của bạn để lấy liên kết đăng nhập!",
  signInToContinue: "Đăng nhập để tiếp tục",
  cancel: "Hủy",

  // Account Modal
  accountSettings: "Cài đặt tài khoản",
  profile: "Hồ sơ",
  password: "Mật khẩu",
  updateProfile: "Cập nhật hồ sơ",
  fullName: "Họ và tên",
  avatar: "Ảnh đại diện",
  uploading: "Đang tải lên...",
  uploadAvatar: "Tải ảnh đại diện",
  update: "Cập nhật",
  updating: "Đang cập nhật...",
  profileUpdated: "Hồ sơ đã được cập nhật thành công!",
  changePassword: "Đổi mật khẩu",
  newPassword: "Mật khẩu mới",
  confirmNewPassword: "Xác nhận mật khẩu mới",
  passwordUpdated: "Mật khẩu đã được cập nhật thành công!",
  passwordsDoNotMatch: "Mật khẩu không khớp.",
  
  // Task Dashboard
  dashboardTitle: "Bảng Công Việc",
  myTasksTitle: "Công Việc Của Tôi",
  allTasksTitle: "Tất Cả Công Việc",
  signInToManageTasks: "Vui lòng đăng nhập để quản lý công việc của bạn.",
  noTasksFound: "Không có công việc nào. Thêm một việc để bắt đầu!",
  addNewTask: "Thêm Công Việc Mới",
  editTask: "Chỉnh Sửa Công Việc",
  deleteTask: "Xóa Công Việc",
  confirmDeleteTask: "Xác Nhận Xóa",
  deleteTaskConfirmationMessage: (taskTitle: string) => `Bạn có chắc muốn xóa công việc "${taskTitle}" không? Hành động này không thể hoàn tác.`,
  taskDeleted: "Công việc này đã bị xóa.",
  taskNotFound: "Không tìm thấy công việc",
  boardView: "Xem dạng bảng",
  calendarView: "Xem dạng lịch",
  summaryView: "Xem tóm tắt",

  // Task Status
  status: "Trạng thái",
  todo: "Cần làm",
  inprogress: "Đang làm",
  done: "Hoàn thành",
  cancelled: "Đã hủy",
  overdue: "Quá hạn",

  // Task Priority
  priority: "Ưu tiên",
  low: "Thấp",
  medium: "Vừa",
  high: "Cao",

  // Task Card
  creationTime: "Tạo lúc",
  completionTime: "Hoàn thành lúc",
  completionDate: "Hoàn thành lúc",
  assignee: "Người phụ trách",
  createdBy: "Người giao việc",
  totalTimeLogged: "Tổng thời gian",
  startTimer: "Bắt đầu tính giờ",
  stopTimer: "Dừng tính giờ",
  timerRunningOnAnotherTask: "Đang tính giờ cho công việc khác",
  cancelTask: "Hủy công việc",
  copyTaskId: "Sao chép ID công việc",
  project: "Dự án",

  // Task Modal
  taskTitleLabel: "Tiêu đề công việc",
  descriptionLabel: "Mô tả (tùy chọn)",
  dueDateLabel: "Ngày hết hạn",
  attachments: "Tệp đính kèm",
  addAttachment: "Thêm tệp",
  pasteOrDrop: "Thả tệp vào đây hoặc dán từ clipboard",
  comments: "Bình luận",
  addComment: "Thêm bình luận...",
  post: "Đăng",
  posting: "Đang đăng...",
  noCommentsYet: "Chưa có bình luận nào.",
  saveTaskToComment: "Lưu công việc để thêm bình luận.",

  // Admin Dashboard
  allEmployees: "Tất cả Nhân viên",
  selectEmployeePrompt: "Chọn một nhân viên để xem công việc của họ.",
  tasksFor: (name: string) => `Công việc của ${name}`,
  addTaskFor: (name: string) => `Thêm việc cho ${name}`,
  overallSummary: "Tổng quan chung",
  performanceSummary: "Tóm tắt hiệu suất",
  tasksByStatus: "Công việc theo Trạng thái",
  tasksByPriority: "Công việc theo Mức độ ưu tiên",
  today: "Hôm nay",
  thisWeek: "Tuần này",
  thisMonth: "Tháng này",
  lastWeek: "Tuần trước",
  avgCompletionTime: "Thời gian hoàn thành TB",
  allTasksBoard: "Bảng công việc chung",
  customMonth: "Theo Tháng",
  customRange: "Khoảng Ngày",
  userManagement: "Quản lý Người dùng",
  projectManagement: "Quản lý Dự án",
  management: "Quản lý",
  searchUsers: "Tìm người dùng theo tên...",
  lastUpdated: "Cập nhật lần cuối",
  actions: "Hành động",
  editUser: "Sửa người dùng",
  deleteUser: "Xóa người dùng",
  confirmDeleteUser: (name: string) => `Bạn có chắc muốn xóa người dùng "${name}" không? Hành động này không thể đảo ngược.`,

  // Generic Actions
  close: "Đóng",
  save: "Lưu",

  // Admin Modals
  employee: "Nhân viên",
  manager: "Quản lý",
  selectEmployee: "Chọn một Nhân viên",
  editEmployeeProfile: "Chỉnh sửa Hồ sơ Nhân viên",
  role: "Chức vụ",
  admin: "Admin",
  // FIX: Add missing translations for modals.
  addNewTimeEntry: "Thêm Chấm Công Mới",
  date: "Ngày",
  startTime: "Giờ Bắt Đầu",
  endTime: "Giờ Kết Thúc (tùy chọn)",
  editPerformanceReview: "Chỉnh Sửa Đánh Giá Hiệu Suất",
  score: "Điểm",
  // comments: "Nhận xét",

  // Activity Log
  noActivity: "Không tìm thấy hoạt động gần đây.",
  log_created_task: (user, task) => `${user} đã tạo công việc ${task}.`,
  log_updated_task: (user, task) => `${user} đã cập nhật công việc ${task}.`,
  log_deleted_task: (user, task) => `${user} đã xóa công việc ${task}.`,
  log_status_changed: (user, task, from, to) => `${user} đã đổi trạng thái của ${task} từ ${from} sang ${to}.`,
  log_added_attachments: (user, count, task) => `${user} đã thêm ${count} tệp đính kèm vào ${task}.`,
  log_removed_attachments: (user, count, task) => `${user} đã xóa ${count} tệp đính kèm khỏi ${task}.`,
  log_cleared_cancelled_tasks: (user, count) => `${user} đã dọn dẹp ${count} công việc đã hủy.`,
  a_user: "Một người dùng",
  a_task: "một công việc",
  log_searchPlaceholder: "Tìm kiếm nhật ký theo người dùng, hành động, hoặc công việc...",
  log_filterByUser: "Lọc theo người dùng",
  log_allUsers: "Tất cả người dùng",
  log_filterByAction: "Lọc theo hành động",
  log_allActions: "Tất cả hành động",
  log_action_created_task: "Tạo công việc",
  log_action_updated_task: "Cập nhật công việc",
  log_action_deleted_task: "Xóa công việc",
  log_action_status_changed: "Thay đổi trạng thái",
  log_action_added_attachments: "Thêm tệp đính kèm",
  log_action_removed_attachments: "Xóa tệp đính kèm",
  log_action_cleared_cancelled_tasks: "Dọn dẹp công việc đã hủy",

  // Notifications filters
  notif_searchPlaceholder: "Tìm theo nội dung, người dùng, hoặc công việc...",
  notif_filterByActor: "Lọc theo người gửi",
  notif_allActors: "Tất cả người gửi",
  notif_filterByType: "Lọc theo loại",
  notif_allTypes: "Tất cả các loại",
  notif_type_new_task: "Giao việc mới",
  notif_type_new_comment: "Bình luận mới",
  notif_type_new_project: "Tạo dự án mới",
  notif_type_new_user: "Người dùng mới",
  notif_filterByStatus: "Lọc theo trạng thái",
  notif_allStatuses: "Tất cả trạng thái",
  notif_status_read: "Đã đọc",
  notif_status_unread: "Chưa đọc",

  // Settings
  defaultDueDateIn: "Ngày hết hạn mặc định sau",
  days: "ngày",
  clearCancelledTasksTitle: "Dọn dẹp các công việc đã hủy",
  clearCancelledTasksConfirmation: (count) => `Bạn có chắc muốn xóa vĩnh viễn ${count} công việc đã hủy không? Hành động này không thể hoàn tác.`,
  timezone: "Múi giờ",
  defaultProject: "Dự án mặc định",
  personalProject: "Cá nhân",

  // User Guide
  userGuide_searchPlaceholder: "Tìm kiếm hướng dẫn...",
  userGuide_s1_title: "Bắt đầu",
  userGuide_s1_l1_strong: "Đăng nhập:",
  userGuide_s1_l1_text: "Đăng nhập để truy cập bảng công việc cá nhân của bạn.",
  userGuide_s1_l2_strong: "Tổng quan trang chính:",
  userGuide_s1_l2_text: "Trang chính hiển thị các công việc của bạn được sắp xếp theo trạng thái: Cần làm, Đang làm và Hoàn thành.",

  userGuide_s2_title: "Quản lý Công việc",
  userGuide_s2_l1_strong: "Thêm công việc:",
  userGuide_s2_l1_text: "Nhấp vào nút 'Thêm Công Việc Mới' để tạo một công việc mới. Bạn có thể đặt tiêu đề, mô tả, mức độ ưu tiên và ngày hết hạn.",
  userGuide_s2_l2_strong: "Cập nhật công việc:",
  userGuide_s2_l2_text: "Nhấp vào bất kỳ thẻ công việc nào để mở trình chỉnh sửa. Bạn có thể thay đổi trạng thái của nó bằng cách di chuyển nó sang cột khác hoặc chỉnh sửa chi tiết của nó.",
  userGuide_s2_l3_strong: "Ưu tiên & Trạng thái:",
  userGuide_s2_l3_text: "Sử dụng các mức độ ưu tiên (Thấp, Vừa, Cao) để tổ chức công việc của bạn. Các cột trạng thái giúp bạn theo dõi tiến độ từ đầu đến cuối.",

  userGuide_s3_title: "Trang Quản lý",
  userGuide_s3_l1_strong: "Chuyển sang chế độ xem Quản lý:",
  userGuide_s3_l1_text: "Nếu bạn là quản lý, sử dụng nút chuyển đổi trên thanh tiêu đề để chuyển sang 'Trang Quản lý'.",
  userGuide_s3_l2_strong: "Xem công việc của nhân viên:",
  userGuide_s3_l2_text: "Chọn một nhân viên từ danh sách để xem và quản lý công việc của họ. Bạn cũng có thể xem tổng quan về tất cả các công việc trong hệ thống.",

  userGuide_s4_title: "Tài khoản & Cài đặt",
  userGuide_s4_l1_strong: "Cài đặt tài khoản:",
  userGuide_s4_l1_text: "Nhấp vào tên của bạn để cập nhật thông tin hồ sơ, chẳng hạn như họ tên và ảnh đại diện.",
  userGuide_s4_l2_strong: "Giao diện:",
  userGuide_s4_l2_text: "Sử dụng biểu tượng cài đặt để chuyển đổi giữa giao diện sáng/tối và thay đổi ngôn ngữ của ứng dụng.",
  
  userGuide_s5_title: "Phím tắt",
  userGuide_s5_l1_strong: "N:",
  userGuide_s5_l1_text: "Nhấn 'N' để mở cửa sổ 'Thêm Công Việc Mới'.",
  userGuide_s5_l2_strong: "F:",
  userGuide_s5_l2_text: "Nhấn 'F' để trỏ chuột vào thanh tìm kiếm chính.",
  userGuide_s5_l3_strong: "Esc:",
  userGuide_s5_l3_text: "Nhấn 'Escape' để đóng bất kỳ cửa sổ nào đang mở.",

  // Filters
  searchPlaceholder: "Tìm theo tiêu đề, mô tả, ID, hoặc bình luận...",
  filterByCreator: "Người giao",
  allCreators: "Tất cả người giao",
  filterByPriority: "Ưu tiên",
  allPriorities: "Tất cả ưu tiên",
  filterByDueDate: "Ngày hết hạn",
  allDates: "Tất cả ngày hết hạn",
  // FIX: Removed duplicate 'overdue' key that caused a compilation error. The 'overdue' key is already defined in the 'Task Status' section.
  dueToday: "Hết hạn hôm nay",
  dueThisWeek: "Hết hạn trong tuần",
  filterByProject: "Dự án",
  allProjects: "Tất cả dự án",
  
  // Calendar Sorting
  sortBy: "Sắp xếp theo",
  sortDefault: "Mặc định",
  sortStatus: "Trạng thái",
  sortPriority: "Ưu tiên",
  sortCreationDate: "Ngày tạo",
  
  // General App
  dataRefreshed: "Dữ liệu đã được làm mới tự động.",

  // Project Management
  createdAt: "Ngày tạo",
  members: "Thành viên",
  manageMembers: "Quản lý thành viên",
  addMember: "Thêm thành viên",
  removeMember: "Xóa thành viên",
  joinedOn: "Tham gia ngày",
  tasksInProject: "Việc trong dự án",
  confirmRemoveMember: (name, project) => `Bạn có chắc muốn xóa ${name} khỏi dự án ${project} không?`,
  selectUserToAdd: "Chọn người dùng để thêm",
  noMembers: "Chưa có thành viên trong dự án này.",
};

export const translations = { en, vi };

export const languageOptions = [
    { id: 'en', name: 'English' },
    { id: 'vi', name: 'Tiếng Việt' },
];
```

### 2.2. Luồng ứng dụng chính (Main Application Flow)

#### `App.tsx`
```typescript
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

### 2.3. Hooks Lõi (Core Hooks)

#### `hooks/useAppActions.ts`
```typescript
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
    }, [setActionModal, executeClearCancelledTasks