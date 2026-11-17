import { bookingSummary } from '../booking.ts';
import { HttpError } from './http.ts';
import type { Lead } from '../../schemas/lead.ts';
import type { Site } from '../../schemas/site.ts';

export interface LeadPayload extends Omit<Lead, 'website'> {
  packageName: string; vehicleName: string; timeWindow: string;
  estimate: number | null; // null when the visitor asked for a recommendation
  site: { business: string; phone: string };
  submittedAt: string;
}

// `lead` must already be parsed with leadSchema(site, ...), which checks the size, package, add-ons, date and window.
export function buildLeadPayload(lead: Lead, site: Site): LeadPayload {
  if (site.demoMode) {
    throw new HttpError(400, 'Appointment requests are not delivered while the site is in demo mode.');
  }
  const { website, ...fields } = lead;
  if (website) throw new HttpError(400, 'Invalid request submission.');
  const summary = bookingSummary(lead, site);
  return {
    ...fields,
    packageName: summary.packageName,
    vehicleName: summary.vehicle.name,
    timeWindow: summary.window?.label ?? '',
    estimate: summary.total,
    site: { business: site.business.name, phone: site.business.phoneDisplay },
    submittedAt: new Date().toISOString(),
  };
}

export async function forwardLead(payload: LeadPayload): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) throw new HttpError(503, 'Appointment request delivery is not configured on this server.');
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new HttpError(500, 'Lead webhook is improperly configured.'); }
  if (parsed.protocol !== 'https:') throw new HttpError(500, 'Lead webhook must use HTTPS.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(parsed, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Site-Admin/1.0',
        'x-lead-package': payload.packageId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new HttpError(502, 'The booking system could not accept your request at this time.');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'Could not deliver your appointment request. Please call us directly.');
  } finally {
    clearTimeout(timer);
  }
}
