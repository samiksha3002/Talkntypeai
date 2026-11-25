import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { assertProductionBuildEnv } from './scripts/check-build-env.mjs'

export default defineConfig(({ command, mode }) => {
  // A production build must know the real API origin (see scripts/check-build-env.mjs).
  if (command === 'build' && mode === 'production') assertProductionBuildEnv(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
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
  }
})
