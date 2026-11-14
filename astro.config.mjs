import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';

export default defineConfig({
  output: 'static',
  adapter: isGitHubPages ? undefined : vercel(),
  site: isGitHubPages
    ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io`
    : 'http://localhost:4321',
  base: isGitHubPages && repoName ? `/${repoName}` : '/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});