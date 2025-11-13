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
