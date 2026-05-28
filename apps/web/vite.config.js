import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Explicitly load .env file
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  resolve: {
    dedupe: ['three'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/Components'),
      '@/Components': path.resolve(__dirname, './src/Components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/lib': path.resolve(__dirname, './src/lib'),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@splinetool') || id.includes('three')) return 'spline'
            if (id.includes('@monaco-editor') || id.includes('codemirror') || id.includes('@codemirror')) return 'editors'
            if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
            if (id.includes('framer-motion') || id.includes('gsap')) return 'animation'
            if (id.includes('chart.js') || id.includes('plotly') || id.includes('d3') || id.includes('mermaid')) return 'charts'
            if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('react-icons')) return 'ui'
            if (id.includes('styled-components')) return 'styled'
            return 'vendor'
          }
        },
      },
    },
  },
  // Pre-bundle Spline + runtime so dev doesn’t thrash on nested dynamic imports.
  // Do NOT set optimizeDeps.force here - it causes 504 "Outdated Optimize Dep" when
  // the browser still requests old hashed dep URLs after each restart (see vitejs/vite#14284).
  optimizeDeps: {
    include: ['@splinetool/react-spline', '@splinetool/runtime'],
  },
})
