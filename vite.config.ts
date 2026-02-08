import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

const buildHash = (() => {
  // Vercel auto-prefixes env vars per framework; check both
  const sha = process.env.VERCEL_GIT_COMMIT_SHA 
           || process.env.VITE_VERCEL_GIT_COMMIT_SHA;
  if (sha) {
    return sha.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

const buildTime = new Date().toLocaleString('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_HASH__: JSON.stringify(buildHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
