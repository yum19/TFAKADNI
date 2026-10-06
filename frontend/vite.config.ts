import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['face-api.js']
  },
  assetsInclude: [
    '**/*-shard1',
    '**/*-shard2',
    '**/*-shard3',
    '**/public/models/*'
  ],
  server: {
    fs: {
      allow: ['..']
    }
  }
});