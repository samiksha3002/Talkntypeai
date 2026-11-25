import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      // ✅ Explicit alias for pdfjs worker
      'pdfjs-dist/build/pdf.worker.min.js': path.resolve(__dirname, './node_modules/pdfjs-dist/build/pdf.worker.min.js'),
    },
  },

  server: {
    mimeTypes: {
      'pdf.worker.min.js': 'application/javascript'
    }
  },

  build: {
    rollupOptions: {
      // ✅ Ensure worker is bundled, not excluded
      external: []
    }
  }
})
