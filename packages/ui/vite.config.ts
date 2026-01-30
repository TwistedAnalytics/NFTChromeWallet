import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
   build: {
    outDir: '../extension/dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        approval: resolve(__dirname, 'approval.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
