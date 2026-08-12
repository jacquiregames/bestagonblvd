// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; 

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }), 
  ],
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: Number(process.env.VITE_PORT) || 5173,
  },
});