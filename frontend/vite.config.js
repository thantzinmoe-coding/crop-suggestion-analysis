import react from '@vitejs/plugin-react'

export default {
  plugins: [react()],
  // Keep Vite's generated cache separate from node_modules, which may be
  // temporarily locked by OneDrive while the app is being developed.
  cacheDir: 'C:/Users/thunn/OneDrive/Desktop/UIT/job analysis/.greenvista-vite-cache',
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
}
