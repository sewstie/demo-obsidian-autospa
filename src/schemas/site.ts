import { z } from 'zod';
import { bookingSchema } from './booking.ts';
import { id, text } from './primitives.ts';

const image = z.object({ src: z.string().regex(/^\/images\/[a-z0-9-]+\.(webp|jpg|svg)$/), alt: text });
const link = z.object({ label: text, href: z.string().regex(/^#[a-z-]+$/) });
const phone = z.string().regex(/^\+1\d{10}$/);
export const siteSchema = z.object({
  demoMode: z.boolean(),
  demoBanner: z.boolean(),
  banner: z.object({ text, shortText: text, href: z.url().refine(value => value.startsWith('https://')), dismissLabel: text }),
  business: z.object({
    name: text, shortName: text, descriptor: text, phone, phoneDisplay: text,
    email: z.email(), city: text, region: z.string().length(2), street: text, postalCode: z.string().regex(/^\d{5}$/),
    hours: text, hoursSchema: z.string().regex(/^[A-Za-z, -]+ \d{2}:\d{2}-\d{2}:\d{2}$/),
    serviceArea: text, timeZone: text,
  }),
  seo: z.object({ title: text, description: text }),
  nav: z.array(link).min(1).max(6),
  hero: z.object({
    eyebrow: text, heading: text, description: text, primaryCta: text, secondaryCta: text,
    image, imageCaption: text, availability: text, note: text, specialties: z.array(text).min(1).max(8),
  }),
  intro: z.object({ label: text, heading: text, description: text, link: text }),
  pricing: z.object({ label: text, heading: text, description: text, note: text, vehicleLabel: text, coverageLabel: text, cta: text }),
  vehicles: z.array(z.object({ id, name: text, description: text, coverage: text, extraHours: z.number().min(0).max(48) })).min(1).max(5),
  packages: z.array(z.object({
    id, name: text, subtitle: text, prices: z.record(id, z.number().int().min(1).max(50000)), // one explicit price per vehicle size
    hours: z.number().min(0.5).max(100), duration: text, features: z.array(text).min(1).max(8),
    featured: z.boolean(), badge: text,
  })).min(1).max(6),
  comparison: z.object({ label: text, heading: text, description: text, before: image, after: image, beforeLabel: text, afterLabel: text, disclaimer: text, facts: z.array(z.object({ title: text, description: text })).max(4) }),
  gallery: z.object({ label: text, heading: text, description: text, items: z.array(z.object({ image, title: text, service: text })).min(1).max(8) }),
  reviews: z.object({ label: text, heading: text, disclaimer: text, items: z.array(z.object({ quote: text, name: text, vehicle: text, stars: z.number().int().min(1).max(5) })).max(8) }),
  faq: z.object({ heading: text, items: z.array(z.object({ question: text, answer: text })).max(10) }),
  booking: bookingSchema,
  footer: z.object({ heading: text, description: text, copyright: text, demoNotice: text }),
}).superRefine((site, ctx) => {
  const lists = { vehicles: site.vehicles, packages: site.packages, addOns: site.booking.addOns, conditions: site.booking.conditions, timeWindows: site.booking.timeWindows };
  for (const [key, items] of Object.entries(lists)) {
    if (new Set(items.map(item => item.id)).size !== items.length) ctx.addIssue({ code: 'custom', path: [key], message: 'IDs must be unique.' });
  }
  site.packages.forEach((item, index) => site.vehicles.forEach(vehicle => {
    if (!(vehicle.id in item.prices)) ctx.addIssue({ code: 'custom', path: ['packages', index, 'prices'], message: `Missing price for ${vehicle.id}.` });
  }));
});
export type Site = z.infer<typeof siteSchema>;
export type Package = Site['packages'][number];
export type Vehicle = Site['vehicles'][number];
