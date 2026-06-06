import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

import { cloudflare } from "@cloudflare/vite-plugin";

// BASE_PATH lets the same code deploy to Cloudflare/root ('/') and GitHub Pages ('/new-omen-labs/').
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});