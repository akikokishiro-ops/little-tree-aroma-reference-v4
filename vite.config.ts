import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/little-tree-aroma-reference-v4/',
  plugins: [react()],
})
