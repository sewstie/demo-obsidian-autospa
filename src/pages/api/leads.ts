import type { APIRoute } from 'astro';
import { failure, json, readJson, requireOrigin } from '../../lib/server/http.ts';
import { minDropOffDate } from '../../lib/booking.ts';
import { buildLeadPayload, forwardLead } from '../../lib/server/lead.ts';
import { readSiteConfig } from '../../lib/server/storage.ts';
import { leadSchema } from '../../schemas/lead.ts';

export const prerender = false;

const MAX_LEAD_PAYLOAD = 16_000;

export const GET: APIRoute = async () => {
  return new Response(null, { status: 404 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    requireOrigin(request);
    const body = await readJson(request, MAX_LEAD_PAYLOAD);
    const { site } = await readSiteConfig();
    const result = leadSchema(site, minDropOffDate(site.booking.leadDays, site.business.timeZone)).safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return json({ error: firstIssue?.message || 'Invalid lead submission.' }, 400);
    }
    const payload = buildLeadPayload(result.data, site);
    await forwardLead(payload);
    return json({ ok: true });
  } catch (error) {
    return failure(error);
  }
};
