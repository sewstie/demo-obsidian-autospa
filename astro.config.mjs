import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
if (isGitHubPages) process.env.PUBLIC_STATIC_DEMO = 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';

export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  adapter: isGitHubPages ? undefined : vercel(),
  site: isGitHubPages
    ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io`
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://sewstie.github.io', // local builds point at the deployed demo, never localhost
  base: isGitHubPages && repoName ? `/${repoName}` : '/',
  integrations: [react(), ...(isGitHubPages ? [{
    name: 'static-demo',
    hooks: { 'astro:route:setup': ({ route }) => {
      if (route.component.startsWith('src/pages/api/')) route.prerender = true;
    } },
  }] : [])],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/src/data/site.json'],
      },
    },
  },
});