import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default () => {
  return defineConfig({
    plugins: [
      react(),
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: 'framer-motion', replacement: path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js') }
      ],
      extensions: ['.js', '.cjs', '.mjs', '.ts', '.jsx', '.tsx', '.json', '.JSON']
    },
    server: {
      open: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      include: ['framer-motion']
    }
    ,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id) return null;
            if (id.includes('src/lib/localLanguageDataLazy')) return 'local-language-data';
            if (id.includes('src/pages/Lesson')) return 'lesson';
            if (id.includes('src/pages/Learn')) return 'learn';
            if (id.includes('src/pages/Exercise')) return 'exercise';
            if (id.includes('node_modules')) return 'vendor';
          }
        }
      }
    }
  })
}

