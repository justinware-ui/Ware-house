import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.join(process.cwd(), 'src') },
  },
  server: { port: 5173, open: true },
})
