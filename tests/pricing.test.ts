import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteSchema } from '../src/schemas/site.ts';
import { leadSchema } from '../src/schemas/lead.ts';
import { money, quote } from '../src/lib/pricing.ts';

const data = JSON.parse(readFileSync('src/data/site.json', 'utf8')) as unknown;
const site = siteSchema.parse(data);

test('every package updates price and duration for all vehicle sizes', () => {
  const expectedPrices = [[175, 215, 245], [650, 795, 895], [1495, 1795, 2095]];
  site.packages.forEach((treatment, row) => site.vehicles.forEach((vehicle, column) => {
    const result = quote(treatment, vehicle);
    assert.equal(result.price, expectedPrices[row][column]);
    assert.equal(result.hours, treatment.hours + vehicle.extraHours);
    assert.equal(money(result.price).startsWith('$'), true);
  }));
});

test('content rejects unsafe images, duplicate IDs and negative pricing', () => {
  assert.equal(siteSchema.safeParse({ ...site, hero: { ...site.hero, image: { src: 'javascript:alert(1)', alt: 'Invalid' } } }).success, false);
  assert.equal(siteSchema.safeParse({ ...site, vehicles: [site.vehicles[0], site.vehicles[0]] }).success, false);
  assert.equal(siteSchema.safeParse({ ...site, packages: [{ ...site.packages[0], prices: { ...site.packages[0].prices, [site.vehicles[0].id]: -1 } }] }).success, false);
});

test('every package needs a price for every vehicle size', () => {
  assert.equal(siteSchema.safeParse({ ...site, packages: [{ ...site.packages[0], prices: {} }] }).success, false);
});

test('lead validation requires consent and a complete US phone number', () => {
  const lead = { name: 'Test Owner', phone: '(512) 555-0100', email: 'test@example.com', vehicle: '2025 Test Sedan', vehicleId: site.vehicles[0].id, packageId: site.packages[0].id, slotId: site.booking.slots[0].id, consent: true, website: '' };
  assert.equal(leadSchema.safeParse(lead).success, true);
  assert.equal(leadSchema.safeParse({ ...lead, consent: false }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, phone: '123' }).success, false);
});
