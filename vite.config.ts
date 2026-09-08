import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base is '/CardQuest/' in CI so the build works from a GitHub Pages project URL.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/CardQuest/' : '/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
