import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // We need this line

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- THIS FIXES THE INVALID HOOK CALL ERROR ---
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
})  