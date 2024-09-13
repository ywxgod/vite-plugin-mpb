import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import mpb from 'vite-plugin-mpb';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),mpb()],
  server: {
    port: 1142,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/main/index.html'),
        page1: resolve(__dirname, 'src/pages/page1/index.html'),
      },
    },
  },
})
