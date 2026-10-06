import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { port: 5000 },
  build: { assetsInlineLimit: 0 }
});
