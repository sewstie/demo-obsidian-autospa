import { z } from 'zod';
import { siteSchema, type Site } from '../../schemas/site.ts';
import { HttpError } from './http.ts';

const GITHUB_API = 'https://api.github.com';
const githubResponseSchema = z.object({ content: z.string().min(1), sha: z.string().min(1) });
const githubWriteSchema = z.object({ content: z.object({ sha: z.string().min(1) }) });

function parseSiteJson(raw: string): Site {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new HttpError(500, 'Existing site data is corrupt.'); }
  const result = siteSchema.safeParse(parsed);
  if (!result.success) throw new HttpError(500, 'Existing site data does not match the required schema.');
  return result.data;
}

function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
    'User-Agent': 'Site-Admin/1.0', 'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function fetchGithub(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    return await fetch(url, { ...options, redirect: 'error', signal: controller.signal });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'GitHub API request failed or timed out.');
  } finally { clearTimeout(timer); }
}

export async function getFromGithub(): Promise<{ site: Site; version: string }> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !repo) throw new HttpError(503, 'GitHub storage is not configured.');

  const res = await fetchGithub(`${GITHUB_API}/repos/${repo}/contents/src/data/site.json?ref=${encodeURIComponent(branch)}`, {
    headers: githubHeaders(token),
  });
  if (res.status === 404) throw new HttpError(404, 'Remote site.json not found in repository.');
  if (!res.ok) throw new HttpError(502, 'Could not read site configuration from GitHub.');
  const jsonParsed = await res.json().catch(() => null);
  const validated = githubResponseSchema.safeParse(jsonParsed);
  if (!validated.success) throw new HttpError(502, 'Malformed GitHub contents response.');
  return { site: parseSiteJson(Buffer.from(validated.data.content, 'base64').toString('utf8')), version: validated.data.sha };
}

export async function saveToGithub(site: Site, expectedVersion: string): Promise<{ site: Site; version: string }> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !repo) throw new HttpError(503, 'GitHub storage is not configured.');

  const latest = await getFromGithub();
  if (latest.version !== expectedVersion) {
    throw new HttpError(409, 'Site configuration was updated by another user. Reload and try again.');
  }

  const serialized = JSON.stringify(site, null, 2) + '\n';
  const payload = {
    message: 'chore: update site content via admin panel',
    content: Buffer.from(serialized, 'utf8').toString('base64'),
    branch,
    sha: latest.version,
  };

  const res = await fetchGithub(`${GITHUB_API}/repos/${repo}/contents/src/data/site.json`, {
    method: 'PUT', headers: githubHeaders(token), body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new HttpError(409, 'Conflict writing to GitHub repository. Please reload and retry.');
  if (!res.ok) throw new HttpError(502, 'Failed to persist site configuration to GitHub.');
  const responseData = await res.json().catch(() => null);
  const validated = githubWriteSchema.safeParse(responseData);
  if (!validated.success) throw new HttpError(502, 'Malformed GitHub commit response.');
  return { site, version: validated.data.content.sha };
}
