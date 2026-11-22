import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { getManualChunk } from './src/config/chunks';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
});
