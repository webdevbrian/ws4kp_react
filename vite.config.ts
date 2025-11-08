import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/radar': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/spc': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/mesonet': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/forecast': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/playlist.json': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/cache': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/geoip': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/fonts': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/music': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/radar': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/spc': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/mesonet': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/forecast': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/data': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/playlist.json': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/cache': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/geoip': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/fonts': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/music': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});