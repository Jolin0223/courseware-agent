import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const assetVersion = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  Date.now().toString()
).slice(0, 12)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'append-asset-version',
      enforce: 'post',
      transformIndexHtml(html) {
        return html
          .replace('/assets/index.js"', `/assets/index.js?v=${assetVersion}"`)
          .replace('/assets/index.css"', `/assets/index.css?v=${assetVersion}"`)
      },
    },
  ],
  build: {
    rolldownOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
