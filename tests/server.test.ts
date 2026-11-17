import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { authenticate, requireOrigin, readJson, HttpError } from '../src/lib/server/http.ts';
import { buildLeadPayload } from '../src/lib/server/lead.ts';
import { validateSiteInput, writeSiteConfig, readSiteConfig, parseSiteJson } from '../src/lib/server/storage.ts';

const siteRaw = readFileSync(resolve(process.cwd(), 'src/data/site.json'), 'utf8');
const baseSite = parseSiteJson(siteRaw);

test('authenticate validates Bearer header with ADMIN_PASSWORD in constant time', () => {
  process.env.ADMIN_PASSWORD = 'super-secret-password-123';
  const reqValid = new Request('http://localhost:4321/api/site', {
    headers: { Authorization: 'Bearer super-secret-password-123' },
  });
  assert.doesNotThrow(() => authenticate(reqValid));

  const reqInvalid = new Request('http://localhost:4321/api/site', {
    headers: { Authorization: 'Bearer wrong-password' },
  });
  assert.throws(() => authenticate(reqInvalid), (err: unknown) => {
    return err instanceof HttpError && err.status === 401;
  });
});

test('requireOrigin blocks cross-origin requests and mismatched origin', () => {
  const reqCross = new Request('http://localhost:4321/api/site', {
    headers: { origin: 'http://malicious.example' },
  });
  assert.throws(() => requireOrigin(reqCross), (err: unknown) => {
    return err instanceof HttpError && err.status === 403;
  });

  const reqGood = new Request('http://localhost:4321/api/site', {
    headers: { origin: 'http://localhost:4321' },
  });
  assert.doesNotThrow(() => requireOrigin(reqGood));
});

test('readJson rejects payloads exceeding size limit', async () => {
  const bigBody = JSON.stringify({ note: 'x'.repeat(200) });
  const req = new Request('http://localhost:4321/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: bigBody,
  });
  await assert.rejects(async () => readJson(req, 50), (err: unknown) => {
    return err instanceof HttpError && err.status === 413;
  });
});

test('writeSiteConfig rejects empty version and optimistic conflicts', async () => {
  const validSite = validateSiteInput(baseSite);
  await assert.rejects(
    async () => writeSiteConfig(validSite, ''),
    (err: unknown) => err instanceof HttpError && err.status === 409,
  );
  await assert.rejects(
    async () => writeSiteConfig(validSite, 'outdated-token-abc'),
    (err: unknown) => err instanceof HttpError && err.status === 409,
  );
});

test('storage fails closed in production when GitHub is unconfigured', async () => {
  const origEnv = process.env.NODE_ENV;
  const origToken = process.env.GITHUB_TOKEN;
  const origRepo = process.env.GITHUB_REPO;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
    await assert.rejects(
      async () => readSiteConfig(),
      (err: unknown) => err instanceof HttpError && err.status === 503,
    );
    await assert.rejects(
      async () => writeSiteConfig(validateSiteInput(baseSite), 'token'),
      (err: unknown) => err instanceof HttpError && err.status === 503,
    );
  } finally {
    process.env.NODE_ENV = origEnv;
    if (origToken) process.env.GITHUB_TOKEN = origToken;
    if (origRepo) process.env.GITHUB_REPO = origRepo;
  }
});

test('buildLeadPayload rejects demo=true site', () => {
  const demoSite = { ...baseSite, demo: true };
  const lead = {
    name: 'Jane Doe',
    phone: '+15125550199',
    email: 'jane@example.com',
    vehicle: '2024 Porsche 911',
    vehicleId: 'coupe-sedan',
    packageId: 'ceramic',
    slotId: 'weekday-am',
    consent: true,
  };
  assert.throws(() => buildLeadPayload(lead, demoSite), (err: unknown) => {
    return err instanceof HttpError && err.status === 400 && err.message.includes('demo mode');
  });
});

test('buildLeadPayload rejects honeypot website field and inactive slot', () => {
  const activeSite = {
    ...baseSite,
    demo: false,
    booking: {
      ...baseSite.booking,
      slots: baseSite.booking.slots.map(s => s.id === 'weekday-am' ? { ...s, active: false } : s),
    },
  };
  const botLead = {
    name: 'Bot Spammer',
    phone: '+15125550199',
    email: 'bot@example.com',
    vehicle: '2020 Honda Civic',
    vehicleId: 'coupe-sedan',
    packageId: 'express',
    slotId: 'saturday',
    consent: true,
    website: 'http://spam.example',
  };
  assert.throws(() => buildLeadPayload(botLead, activeSite), (err: unknown) => {
    return err instanceof HttpError && err.status === 400;
  });

  const inactiveSlotLead = { ...botLead, website: '' };
  inactiveSlotLead.slotId = 'weekday-am';
  assert.throws(() => buildLeadPayload(inactiveSlotLead, activeSite), (err: unknown) => {
    return err instanceof HttpError && err.status === 400 && err.message.includes('inactive');
  });
});

test('buildLeadPayload computes authoritative quote using imported quote formula', () => {
  const liveSite = { ...baseSite, demo: false };
  const lead = {
    name: 'Alex Johnson',
    phone: '+15125550199',
    email: 'alex@example.com',
    vehicle: '2022 Ford F-150',
    vehicleId: 'fullsize-truck',
    packageId: 'correction',
    slotId: 'saturday',
    consent: true,
  };
  const payload = buildLeadPayload(lead, liveSite);
  assert.equal(payload.quote.price, 910);
  assert.equal(payload.quote.hours, 10);
  assert.equal(payload.packageName, 'The Revival');
});
