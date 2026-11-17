import type { APIRoute } from 'astro';
import { authenticate, failure, json, readJson, requireOrigin } from '../../lib/server/http.ts';
import { readSiteConfig, validateSiteInput, writeSiteConfig } from '../../lib/server/storage.ts';

export const prerender = false;

const MAX_SITE_PAYLOAD = 250_000;

export const GET: APIRoute = async ({ request }) => {
  if (import.meta.env.PUBLIC_STATIC_DEMO === 'true') {
    return new Response(null, { status: 404 });
  }
  try {
    authenticate(request);
    const record = await readSiteConfig();
    return json(record);
  } catch (error) {
    return failure(error);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    authenticate(request);
    requireOrigin(request);
    const body = (await readJson(request, MAX_SITE_PAYLOAD)) as { site?: unknown; version?: unknown };
    if (!body || typeof body !== 'object') {
      return json({ error: 'Malformed request body.' }, 400);
    }
    const version = typeof body.version === 'string' ? body.version.trim() : '';
    if (!version) {
      return json({ error: 'Version token is required to save changes.' }, 409);
    }
    const validatedSite = validateSiteInput(body.site);
    const updated = await writeSiteConfig(validatedSite, version);
    return json(updated);
  } catch (error) {
    return failure(error);
  }
};
