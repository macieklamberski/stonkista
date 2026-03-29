import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [preact()],
  server: {
    port: 3000,
    proxy: {
      '/forex': 'http://stonkista:3000',
      '/crypto': 'http://stonkista:3000',
      '/static': 'http://stonkista:3000',
    },
  },
})
