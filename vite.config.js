import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Xóa import tailwindcss từ @tailwindcss/vite
export default defineConfig({
  plugins: [
    react(),
  ],
})