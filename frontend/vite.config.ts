import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cars':        'http://localhost:8000',
      '/services':    'http://localhost:8000',
      '/parts':       'http://localhost:8000',
      '/maintenance': 'http://localhost:8000',
      '/attachments': 'http://localhost:8000',
      '/uploads':     'http://localhost:8000',
    },
  },
})
