import { quote } from '../pricing.ts';
import { HttpError } from './http.ts';
import type { Lead } from '../../schemas/lead.ts';
import type { Site } from '../../schemas/site.ts';

const MAX_PII = 254;

export interface LeadPayload {
  name: string; phone: string; email: string; vehicle: string;
  vehicleId: string; packageId: string; slotId: string;
  slotLabel: string; packageName: string; vehicleName: string;
  quote: { price: number; hours: number };
  site: { business: string; phone: string; url: string };
  submittedAt: string;
}

export function buildLeadPayload(lead: Lead, site: Site): LeadPayload {
  if (site.demo) {
    throw new HttpError(400, 'Appointment requests are disabled while the site is in demo mode.');
  }
  if (lead.website && lead.website.length > 0) {
    throw new HttpError(400, 'Invalid request submission.');
  }
  const pkg = site.packages.find(item => item.id === lead.packageId);
  const vehicle = site.vehicles.find(item => item.id === lead.vehicleId);
  const slot = site.booking.slots.find(item => item.id === lead.slotId);

  if (!pkg) throw new HttpError(400, 'The selected service package is no longer available.');
  if (!vehicle) throw new HttpError(400, 'The selected vehicle category is no longer available.');
  if (!slot || !slot.active) throw new HttpError(400, 'The selected time preference is currently inactive.');

  return {
    name: lead.name.slice(0, MAX_PII),
    phone: lead.phone.slice(0, MAX_PII),
    email: lead.email.slice(0, MAX_PII),
    vehicle: lead.vehicle.slice(0, MAX_PII),
    vehicleId: vehicle.id,
    packageId: pkg.id,
    slotId: slot.id,
    slotLabel: slot.label,
    packageName: pkg.name,
    vehicleName: vehicle.name,
    quote: quote(pkg, vehicle),
    site: {
      business: site.business.name,
      phone: site.business.phoneDisplay,
      url: site.business.url,
    },
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
