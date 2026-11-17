import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { siteSchema, type Site } from '../../schemas/site.ts';
import { HttpError } from './http.ts';
import { getFromGithub, saveToGithub } from './github.ts';

const SITE_PATH = resolve(process.cwd(), 'src/data/site.json');
let writeQueue = Promise.resolve();

export interface SiteRecord { site: Site; version: string; }

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

export function hashSite(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function parseSiteJson(raw: string): Site {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new HttpError(500, 'Existing site data is corrupt.'); }
  const result = siteSchema.safeParse(parsed);
  if (!result.success) throw new HttpError(500, 'Existing site data does not match the required schema.');
  return result.data;
}

export function validateSiteInput(input: unknown): Site {
  const result = siteSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join('.') || 'root';
    const message = issue?.message || 'Invalid site content.';
    throw new HttpError(400, `Validation failed at ${path}: ${message}`);
  }
  return result.data;
}

async function getFromFs(): Promise<SiteRecord> {
  const raw = await fs.readFile(SITE_PATH, 'utf8');
  return { site: parseSiteJson(raw), version: hashSite(raw) };
}

async function saveToFs(site: Site, expectedVersion: string): Promise<SiteRecord> {
  if (!expectedVersion) throw new HttpError(409, 'Version token is required to save changes.');
  return new Promise<SiteRecord>((resolvePromise, rejectPromise) => {
    writeQueue = writeQueue.then(async () => {
      const current = await getFromFs();
      if (current.version !== expectedVersion) {
        throw new HttpError(409, 'Site configuration was updated elsewhere. Reload the page before saving.');
      }
      const serialized = JSON.stringify(site, null, 2) + '\n';
      const tempPath = `${SITE_PATH}.${randomBytes(6).toString('hex')}.tmp`;
      try {
        await fs.writeFile(tempPath, serialized, 'utf8');
        await fs.rename(tempPath, SITE_PATH);
        resolvePromise({ site, version: hashSite(serialized) });
      } catch (err) {
        await fs.unlink(tempPath).catch(() => undefined);
        rejectPromise(err);
      }
    }).catch(rejectPromise);
  });
}

export async function readSiteConfig(): Promise<SiteRecord> {
  if (isProduction()) {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
      throw new HttpError(503, 'GitHub storage is not configured in production.');
    }
    return getFromGithub();
  }
  return getFromFs();
}

export async function writeSiteConfig(site: Site, expectedVersion: string): Promise<SiteRecord> {
  if (!expectedVersion) throw new HttpError(409, 'Version token is required to save changes.');
  if (isProduction()) {
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
      throw new HttpError(503, 'GitHub storage is not configured in production.');
    }
    return saveToGithub(site, expectedVersion);
  }
  return saveToFs(site, expectedVersion);
}
