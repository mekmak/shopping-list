import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pin the port so localStorage (keyed by origin) stays stable across runs.
  server: {
    port: 5173,
    strictPort: true,
  },
})
