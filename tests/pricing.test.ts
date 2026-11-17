import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteSchema } from '../src/schemas/site.ts';
import { leadSchema } from '../src/schemas/lead.ts';
import { money, quote } from '../src/lib/pricing.ts';
import { RECOMMEND, calendarFile, minDropOffDate } from '../src/lib/booking.ts';

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

test('lead validation needs one contact method and an open drop-off day', () => {
  const schema = leadSchema(site, '2030-01-01');
  const lead = { vehicleId: site.vehicles[0].id, packageId: site.packages[0].id, addOnIds: [], vehicle: '2025 Test Sedan', conditionId: 'good', dropOffDate: '2030-01-07', timeWindowId: 'morning', notes: '', name: 'Test Owner', contact: '(508) 555-0100', website: '' };
  assert.equal(schema.safeParse(lead).success, true);
  assert.equal(schema.safeParse({ ...lead, contact: 'test@example.com', packageId: RECOMMEND }).success, true);
  assert.equal(schema.safeParse({ ...lead, contact: '123' }).success, false);
  assert.equal(schema.safeParse({ ...lead, dropOffDate: '2030-01-06' }).success, false); // a Sunday
  assert.equal(schema.safeParse({ ...lead, dropOffDate: '2029-12-31' }).success, false); // before the minimum
  assert.equal(schema.safeParse({ ...lead, addOnIds: ['nope'] }).success, false);
});

test('calendar file and earliest date follow the studio clock', () => {
  assert.equal(minDropOffDate(1, 'America/New_York', new Date('2030-01-01T03:00:00Z')), '2030-01-01'); // still Dec 31 in Worcester
  const lead = { vehicleId: site.vehicles[0].id, packageId: RECOMMEND, addOnIds: [], vehicle: '2025 Test Sedan', conditionId: 'good', dropOffDate: '2030-01-07', timeWindowId: 'afternoon', notes: '', name: 'Test Owner', contact: 'a@b.co' };
  const file = calendarFile(lead, site, 'Studio', '1 Main St, Worcester');
  assert.equal(file.includes('DTSTART:20300107T120000'), true);
  assert.equal(file.includes('LOCATION:1 Main St\\, Worcester'), true);
});
