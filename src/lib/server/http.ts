import { createHash, timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Vary': 'Authorization, Origin',
  } });
}

export function failure(error: unknown): Response {
  return error instanceof HttpError
    ? json({ error: error.message }, error.status)
    : json({ error: 'Service unavailable. Please try again later.' }, 503);
}

export function authenticate(request: Request): void {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new HttpError(503, 'Admin access is not configured.');
  const authorization = request.headers.get('authorization') ?? '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const hash = (value: string) => createHash('sha256').update(value).digest();
  if (provided.length > 512 || !timingSafeEqual(hash(provided), hash(expected))) {
    throw new HttpError(401, 'Incorrect password.');
  }
}

export function requireOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'Same-origin requests are required.');
  }
}

export async function readJson(request: Request, limit: number): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    throw new HttpError(415, 'Send application/json.');
  }
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > limit)) {
    throw new HttpError(413, 'Request body is too large.');
  }
  if (!request.body) throw new HttpError(400, 'A JSON body is required.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        void reader.cancel().catch(() => undefined);
        throw new HttpError(413, 'Request body is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown; }
  catch { throw new HttpError(400, 'Invalid JSON.'); }
}
