import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Fix invalid hook call errors
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  server: {
    // ✅ Proxy API requests to your local backend during dev
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your local backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
