import type { Lead } from '../schemas/lead.ts';
import type { Site } from '../schemas/site.ts';
import { quote } from './pricing.ts';

export type Row = [label: string, value: string];
export type Catalog = Pick<Site, 'vehicles' | 'packages' | 'booking'>;
export const RECOMMEND = 'recommend'; // packageId when the visitor wants the studio to pick

// Earliest drop-off date (YYYY-MM-DD) on the studio's calendar, not the visitor's.
export const minDropOffDate = (leadDays: number, timeZone: string, now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now.getTime() + leadDays * 86_400_000));
export const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();
const longDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const filled = (rows: Row[]) => rows.filter(([, value]) => value);

export function bookingSummary(lead: Lead, { vehicles, packages, booking }: Catalog) {
  const { fields, success } = booking;
  const vehicle = vehicles.find(item => item.id === lead.vehicleId) ?? vehicles[0];
  const treatment = packages.find(item => item.id === lead.packageId);
  const addOns = booking.addOns.filter(item => lead.addOnIds.includes(item.id));
  const window = booking.timeWindows.find(item => item.id === lead.timeWindowId);
  const condition = booking.conditions.find(item => item.id === lead.conditionId)?.label ?? '';
  const packageName = treatment?.name ?? booking.recommend;
  const extras = addOns.map(item => item.name).join(', ');
  const date = lead.dropOffDate && longDate(lead.dropOffDate);
  const when = [date, window?.label].filter(Boolean).join(', ');
  return {
    vehicle, window, packageName, line: `${packageName}, ${vehicle.name}`,
    // No package chosen yet means no number to show: the studio quotes after inspection.
    total: treatment ? quote(treatment, vehicle).price + addOns.reduce((sum, item) => sum + item.price, 0) : null,
    groups: [
      filled([[fields.size, vehicle.name], [fields.package, packageName], [fields.addOns, extras], [fields.vehicle, lead.vehicle], [fields.condition, condition]]),
      filled([[fields.date, date], [fields.time, window?.label ?? ''], [fields.notes, lead.notes]]),
      filled([[fields.name, lead.name], [fields.contact, lead.contact]]),
    ],
    // The owner's copy uses owner-facing labels ("Name", not "Your name").
    owner: filled([
      [success.emailName, lead.name], [success.emailContact, lead.contact], [success.emailVehicle, [lead.vehicle, vehicle.name, condition].filter(Boolean).join(', ')],
      [success.emailPackage, [packageName, extras].filter(Boolean).join(' + ')], [success.emailDate, when], [fields.notes, lead.notes],
    ]),
  };
}

const escape = (value: string) => value.replace(/[\;,]/g, '\\$&').replace(/\r?\n/g, '\\n');
const compact = (value: string) => value.replace(/[-:]/g, '');

export function calendarFile(lead: Lead, site: Catalog, businessName: string, location: string, now = new Date()) {
  const summary = bookingSummary(lead, site);
  const day = compact(lead.dropOffDate);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${escape(businessName)}//Booking//EN`, 'BEGIN:VEVENT',
    `UID:${now.getTime()}-${day}@booking`, `DTSTAMP:${compact(now.toISOString().slice(0, 19))}Z`,
    // shortcut: floating local times (no VTIMEZONE) and no 75-octet line folding; upgrade if customers book from other time zones.
    `DTSTART:${day}T${compact(summary.window?.open ?? '09:00')}00`, `DTEND:${day}T${compact(summary.window?.close ?? '10:00')}00`,
    `SUMMARY:${escape(`${site.booking.success.calendarTitle}: ${summary.line}`)}`, `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(summary.groups.flat().map(row => row.join(': ')).join('\n'))}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
