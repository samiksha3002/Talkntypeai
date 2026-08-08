import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// ✅ Unified config (only one export default)
export default defineConfig({
  plugins: [react()],
  
  // Fixes invalid hook call error
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },

  // Fixes MIME type issue for pdf.worker.min.js
  server: {
    mimeTypes: {
      'pdf.worker.min.js': 'application/javascript'
    }
  }
})
