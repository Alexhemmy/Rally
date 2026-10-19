import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';

/**
 * P3 — Security middleware: rate limiting, cross-origin request guard,
 * input sanitization, password strength, TOTP (RFC 6238), recovery codes,
 * and public API key resolution. No third-party dependencies.
 */

// ── Client IP ────────────────────────────────────────────────────────────
export function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return String(fwd[0]).split(',')[0].trim();
  return req.ip || 'unknown';
}

// ── Rate limiting ─────────────────────────────────────────────────────────
const buckets = new Map<string, { count: number; reset: number }>();
let limiterSeq = 0;

export function rateLimit(opts: { windowMs?: number; max?: number; message?: string } = {}) {
  const windowMs = opts.windowMs ?? 5 * 60 * 1000;
  const max = opts.max ?? 100;
  const message = opts.message ?? 'Rate limit exceeded';
  const id = 'rl' + ++limiterSeq + ':';
  return (req: Request, res: Response, next: NextFunction) => {
    const key = id + clientIp(req);
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || now > entry.reset) {
      entry = { count: 1, reset: now + windowMs };
      buckets.set(key, entry);
    } else {
      entry.count++;
    }
    if (buckets.size > 20000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

/** Coarse per-IP cap across the whole API (webhooks excluded in app.ts). */
export const globalIpRateLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 600, message: 'Too many requests' });

// ── Cross-origin state-changing request guard ────────────────────────────
/**
 * Blocks cross-site POST/PUT/PATCH/DELETE from browsers (CSRF-style defense).
 * Non-browser clients (mobile apps, provider webhooks, curl) send no Origin
 * header and pass through; they are protected by Bearer auth + rate limits.
 */
export function enforceOrigin(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return next();
  const allowed = (process.env.APP_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return next(); // no allowlist configured (dev)
  try {
    const o = new URL(origin as string).origin;
    if (allowed.includes(o) || allowed.includes('*')) return next();
  } catch {
    /* fallthrough */
  }
  return res.status(403).json({ error: 'Cross-origin request blocked' });
}

// ── Input sanitization ────────────────────────────────────────────────────
/** Strips control characters, trims, caps length. Use on user-provided text. */
export function sanitizeText(input: string | null | undefined, maxLength = 2000): string | undefined {
  if (input === null || input === undefined) return undefined;
  const cleaned = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
  return cleaned || undefined;
}

// ── Password strength ─────────────────────────────────────────────────────
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'letmein', 'iloveyou',
  'admin', 'welcome', 'monkey', 'dragon', 'passw0rd', 'password1', 'password123',
  'rally123', 'qwerty123', '111111', '000000', 'admin123', 'p@ssw0rd',
];

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push('at least 8 characters');
  if (!/[a-z]/.test(password)) issues.push('a lowercase letter');
  if (!/[A-Z0-9]/.test(password)) issues.push('an uppercase letter or digit');
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.some((c) => lower.includes(c))) issues.push('to not be a common password');
  return issues;
}

// ── Timing-safe compare ───────────────────────────────────────────────────
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ── TOTP (RFC 6238) ───────────────────────────────────────────────────────
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    value = (value << 5) | B32_ALPHABET.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter % 0x100000000, 4);
  const h = crypto.createHmac('sha1', secret).update(buf).digest();
  const off = h[h.length - 1] & 0xf;
  const code = (((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3]) % 1000000;
  return code.toString().padStart(6, '0');
}

/** Verifies a 6-digit TOTP code with a +/- 1 step (30s) window. */
export function verifyTotp(secretB32: string, code: string, window = 1): boolean {
  const clean = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const secret = base32Decode(secretB32);
  const t = Math.floor(Date.now() / 30000);
  for (let i = -window; i <= window; i++) {
    if (timingSafeEqual(hotp(secret, t + i), clean)) return true;
  }
  return false;
}

export function totpUri(secret: string, handle: string): string {
  return 'otpauth://totp/' + encodeURIComponent('Rally:' + handle) + '?secret=' + secret + '&issuer=Rally&algorithm=SHA1&digits=6&period=30';
}

// ── 2FA recovery codes ─────────────────────────────────────────────────────
export function generateRecoveryCodes(count = 8): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const c = 'rly-' + crypto.randomBytes(4).toString('hex') + '-' + crypto.randomBytes(4).toString('hex');
    plain.push(c);
    hashes.push(crypto.createHash('sha256').update(c).digest('hex'));
  }
  return { plain, hashes };
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// ── Public API keys ───────────────────────────────────────────────────────
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const key = 'rly_live_' + crypto.randomBytes(24).toString('base64url');
  return { key, keyHash: sha256(key), keyPrefix: key.slice(0, 16) };
}

/** Resolves a 'Bearer rly_live_...' key, or null when absent/invalid. */
export async function resolveApiKey(req: Request): Promise<{ id: string; userId: string } | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer rly_live_')) return null;
  const key = header.slice(7);
  const record = await prisma.apiKey.findUnique({ where: { keyHash: sha256(key) } });
  if (!record || record.revokedAt) return null;
  await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  return { id: record.id, userId: record.userId };
}
