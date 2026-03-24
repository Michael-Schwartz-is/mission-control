import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { dataServerPlugin } from './server-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), dataServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/data.json'],
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
