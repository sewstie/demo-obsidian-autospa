import { z } from 'zod';

const text = z.string().trim().min(1).max(1000);
const id = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const image = z.object({ src: z.string().regex(/^\/images\/[a-z0-9-]+\.(webp|jpg|svg)$/), alt: text });
const link = z.object({ label: text, href: z.string().regex(/^#[a-z-]+$/) });
const phone = z.string().regex(/^\+1\d{10}$/);
export const siteSchema = z.object({
  demo: z.boolean(),
  demoBanner: z.boolean(),
  banner: z.object({ text, shortText: text, href: z.url().refine(value => value.startsWith('https://')), dismissLabel: text }),
  business: z.object({
    name: text, shortName: text, descriptor: text, phone, phoneDisplay: text,
    email: z.email(), city: text, region: z.string().length(2), street: text, postalCode: z.string().regex(/^\d{5}$/),
    hours: text, hoursSchema: z.string().regex(/^[A-Za-z, -]+ \d{2}:\d{2}-\d{2}:\d{2}$/),
    url: z.url().refine(value => value.startsWith('https://')), serviceArea: text,
  }),
  seo: z.object({ title: text, description: text }),
  nav: z.array(link).min(1).max(6),
  hero: z.object({
    eyebrow: text, heading: text, description: text, primaryCta: text, secondaryCta: text,
    image, imageCaption: text, availability: text, note: text, specialties: z.array(text).min(1).max(8),
  }),
  intro: z.object({ label: text, heading: text, description: text, link: text }),
  pricing: z.object({ label: text, heading: text, description: text, note: text, vehicleLabel: text, cta: text }),
  vehicles: z.array(z.object({ id, name: text, description: text, coverage: text, multiplier: z.number().min(1).max(5), extraHours: z.number().min(0).max(48) })).min(1).max(5),
  packages: z.array(z.object({
    id, name: text, subtitle: text, price: z.number().int().min(1).max(50000),
    hours: z.number().min(0.5).max(100), duration: text, features: z.array(text).min(1).max(8),
    featured: z.boolean(), badge: text,
  })).min(1).max(6),
  comparison: z.object({ label: text, heading: text, description: text, before: image, after: image, beforeLabel: text, afterLabel: text, disclaimer: text, facts: z.array(z.object({ title: text, description: text })).max(4) }),
  gallery: z.object({ label: text, heading: text, description: text, items: z.array(z.object({ image, title: text, service: text })).min(1).max(8) }),
  reviews: z.object({ label: text, heading: text, disclaimer: text, items: z.array(z.object({ quote: text, name: text, vehicle: text, stars: z.number().int().min(1).max(5) })).max(8) }),
  faq: z.object({ heading: text, items: z.array(z.object({ question: text, answer: text })).max(10) }),
  booking: z.object({
    label: text, heading: text, description: text, cta: text, privacy: text, success: text, error: text,
    slots: z.array(z.object({ id, label: text, active: z.boolean() })).min(1).max(20),
  }),
  footer: z.object({ heading: text, description: text, copyright: text, demoNotice: text }),
}).superRefine((site, ctx) => {
  for (const key of ['vehicles', 'packages'] as const) {
    if (new Set(site[key].map(item => item.id)).size !== site[key].length) {
      ctx.addIssue({ code: 'custom', path: [key], message: 'IDs must be unique.' });
    }
  }
  if (new Set(site.booking.slots.map(slot => slot.id)).size !== site.booking.slots.length) {
    ctx.addIssue({ code: 'custom', path: ['booking', 'slots'], message: 'Slot IDs must be unique.' });
  }
});
export type Site = z.infer<typeof siteSchema>;
export type Package = Site['packages'][number];
export type Vehicle = Site['vehicles'][number];
