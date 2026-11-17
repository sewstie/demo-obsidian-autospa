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

const lead = {
  vehicleId: 'fullsize-truck', packageId: 'correction', addOnIds: ['engine-bay'], vehicle: '2022 Ford F-150', conditionId: 'swirls',
  dropOffDate: '2030-01-07', timeWindowId: 'morning', notes: '', name: 'Alex Johnson', contact: 'alex@example.com',
};

test('buildLeadPayload rejects a demo-mode site', () => {
  assert.throws(() => buildLeadPayload(lead, { ...baseSite, demoMode: true }), (err: unknown) => {
    return err instanceof HttpError && err.status === 400 && err.message.includes('demo mode');
  });
});

test('buildLeadPayload rejects the honeypot website field', () => {
  assert.throws(() => buildLeadPayload({ ...lead, website: 'http://spam.example' }, { ...baseSite, demoMode: false }), (err: unknown) => {
    return err instanceof HttpError && err.status === 400;
  });
});

test('buildLeadPayload computes the estimate from site data, add-ons included', () => {
  const liveSite = { ...baseSite, demoMode: false };
  const payload = buildLeadPayload(lead, liveSite);
  assert.equal(payload.estimate, 895 + 75);
  assert.equal(payload.packageName, 'The Revival');
  assert.equal(payload.timeWindow, 'Morning');
  assert.equal('website' in payload, false);
  assert.equal(buildLeadPayload({ ...lead, packageId: 'recommend' }, liveSite).estimate, null);
});
