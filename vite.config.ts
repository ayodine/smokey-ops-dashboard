import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@/components/ui/button': path.resolve(import.meta.dirname, './src/components/ui/Button.tsx'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

