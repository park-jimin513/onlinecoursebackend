// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://onlinecoursebackend-u2ls.vercel.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
});