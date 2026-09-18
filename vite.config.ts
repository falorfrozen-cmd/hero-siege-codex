import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  plugins: [react()],
  publicDir: 'web/public',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./web', import.meta.url)),
      '@desktop': fileURLToPath(new URL('./src', import.meta.url)),
      'next/image': fileURLToPath(new URL('./src/image.tsx', import.meta.url)),
      'next/navigation': fileURLToPath(new URL('./src/navigation.ts', import.meta.url)),
    },
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { target: 'es2022', sourcemap: false },
  server: { host: '127.0.0.1', port: 5190, strictPort: true },
});
