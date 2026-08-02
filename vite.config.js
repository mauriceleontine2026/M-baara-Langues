import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default () => {
  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, 'src') },
        { find: 'framer-motion', replacement: path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js') }
      ],
      extensions: ['.js', '.cjs', '.mjs', '.ts', '.jsx', '.tsx', '.json']
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
  })
}

