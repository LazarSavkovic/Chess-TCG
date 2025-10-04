import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    // Only use proxy in development mode
    ...(command === 'serve' && {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false 
        },
        // if you also need websocket later:
        // '/game': { target: 'http://127.0.0.1:5000', ws: true, changeOrigin: true },
      },
    }),
  },
  build: {
    // Production build configuration
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          clerk: ['@clerk/clerk-react'],
        },
      },
    },
  },
}))
