import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, requireRole } from '../middleware/auth';
import {
  clientIp,
  passwordIssues,
  generateTotpSecret,
  totpUri,
  verifyTotp,
  generateRecoveryCodes,
  generateApiKey,
  sha256,
} from '../middleware/security';

/**
 * P3 — Account security endpoints: TOTP 2FA, recovery codes, password change,
 * session revocation, security event history, public API keys, admin
 * lockout controls, and the anti-phishing guide.
 */
export const securityRouter = Router();

const ANTI_PHISHING_NOTE =
  'Security note: Rally will never ask for your password, a Gift, a payment, or a code in a message. ' +
  'Messages asking for these are phishing — report them.';

function signToken(user: { id: string; handle: string; roles: string[]; tokenVersion: number }) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(
    { userId: user.id, handle: user.handle, roles: user.roles, tv: user.tokenVersion },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any }
  );
}

async function logEvent(userId: string, type: string, req: Request, meta?: Record<string, unknown>) {
  await prisma.securityEvent
    .create({
      data: {
        userId,
        type,
        ip: clientIp(req),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
        ...(meta ? { meta: meta as any } : {}),
      },
    })
    .catch(() => undefined);
}

// ── Overview ───────────────────────────────────────────────────────────────
securityRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        twoFactorEnabled: true,
        recoveryCodeHashes: true,
        lockedUntil: true,
        passwordChangedAt: true,
        failedLoginAttempts: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    const [events, apiKeys] = await Promise.all([
      prisma.securityEvent.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.apiKey.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
      }),
    ]);
    res.json({
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        recoveryCodesRemaining: user.recoveryCodeHashes.length,
        locked: !!user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now(),
        passwordChangedAt: user.passwordChangedAt,
      },
      events,
      apiKeys,
      phishingTips: ANTI_PHISHING_NOTE,
    });
  } catch (err) { next(err); }
});

securityRouter.get('/events', authenticate, async (req, res, next) => {
  try {
    const events = await prisma.securityEvent.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ events });
  } catch (err) { next(err); }
});

// ── Password change ────────────────────────────────────────────────────────
securityRouter.post('/password/change', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
      .parse(req.body);
    const issues = passwordIssues(newPassword);
    if (issues.length) throw new AppError('Password needs ' + issues.join(', '), 422);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.passwordHash) throw new AppError('This account signs in with Google or Apple', 400);
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new AppError('Current password is incorrect', 403);
    }

    const tokenVersion = user.tokenVersion + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        passwordChangedAt: new Date(),
        tokenVersion,
      },
    });
    await logEvent(user.id, 'password_changed', req);
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'system',
        title: 'Password changed',
        body: 'Your Rally password was changed and all other sessions were signed out. ' + ANTI_PHISHING_NOTE,
      },
    }).catch(() => undefined);
    // Return a fresh token so the current session survives the global revoke.
    res.json({ ok: true, token: signToken({ id: user.id, handle: user.handle, roles: user.roles as string[], tokenVersion }) });
  } catch (err) { next(err); }
});

// ── TOTP 2FA ───────────────────────────────────────────────────────────────
securityRouter.post('/2fa/setup', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.twoFactorEnabled) throw new AppError('Two-factor is already enabled', 409);
    const secret = generateTotpSecret();
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
    res.json({ secret, otpauthUri: totpUri(secret, user.handle) });
  } catch (err) { next(err); }
});

securityRouter.post('/2fa/enable', authenticate, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(6).max(11) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.twoFactorSecret) throw new AppError('Run 2FA setup first', 400);
    if (!verifyTotp(user.twoFactorSecret, code)) throw new AppError('Invalid code. Check your authenticator app.', 401);
    const codes = generateRecoveryCodes(8);
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, recoveryCodeHashes: codes.hashes },
    });
    await logEvent(user.id, '2fa_enabled', req);
    res.json({ ok: true, recoveryCodes: codes.plain });
  } catch (err) { next(err); }
});

securityRouter.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    const { password, code } = z.object({ password: z.string().optional(), code: z.string().min(6).max(11) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.twoFactorEnabled) throw new AppError('Two-factor is not enabled', 400);
    if (user.passwordHash) {
      if (!password) throw new AppError('Password required', 422);
      if (!(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Incorrect password', 403);
    }
    if (!verifyTotp(user.twoFactorSecret || '', code)) throw new AppError('Invalid code', 401);
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, recoveryCodeHashes: [] },
    });
    await logEvent(user.id, '2fa_disabled', req);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

securityRouter.post('/2fa/recovery-codes', authenticate, async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().optional() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.twoFactorEnabled) throw new AppError('Two-factor is not enabled', 400);
    if (user.passwordHash) {
      if (!password) throw new AppError('Password required', 422);
      if (!(await bcrypt.compare(password, user.passwordHash))) throw new AppError('Incorrect password', 403);
    }
    const codes = generateRecoveryCodes(8);
    await prisma.user.update({ where: { id: user.id }, data: { recoveryCodeHashes: codes.hashes } });
    await logEvent(user.id, '2fa_recovery_codes_regenerated', req);
    res.json({ recoveryCodes: codes.plain });
  } catch (err) { next(err); }
});

// ── Sessions ───────────────────────────────────────────────────────────────
securityRouter.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const logins = await prisma.securityEvent.findMany({
      where: { userId: req.user!.userId, type: { in: ['login', 'login_2fa', 'login_recovery_code', 'login_social'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ sessions: logins.map((l) => ({ at: l.createdAt, ip: l.ip, userAgent: l.userAgent, method: l.type })) });
  } catch (err) { next(err); }
});

/** Signs out every issued session, then returns a fresh token for this one. */
securityRouter.post('/sessions/revoke-all', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);
    const tokenVersion = user.tokenVersion + 1;
    await prisma.user.update({ where: { id: user.id }, data: { tokenVersion } });
    await logEvent(user.id, 'sessions_revoked', req);
    res.json({ ok: true, token: signToken({ id: user.id, handle: user.handle, roles: user.roles as string[], tokenVersion }) });
  } catch (err) { next(err); }
});

// ── Public API keys ────────────────────────────────────────────────────────
securityRouter.get('/api-keys', authenticate, async (req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    });
    res.json({ apiKeys: keys });
  } catch (err) { next(err); }
});

securityRouter.post('/api-keys', authenticate, async (req, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(80) }).parse(req.body);
    const active = await prisma.apiKey.count({
      where: { userId: req.user!.userId, revokedAt: null },
    });
    if (active >= 10) throw new AppError('Maximum of 10 active API keys', 409);
    const generated = generateApiKey();
    const record = await prisma.apiKey.create({
      data: { userId: req.user!.userId, name, keyHash: generated.keyHash, keyPrefix: generated.keyPrefix },
    });
    await logEvent(req.user!.userId, 'api_key_created', req, { apiKeyId: record.id, name });
    // The raw key is shown exactly once — only its SHA-256 hash is stored.
    res.status(201).json({ id: record.id, name: record.name, key: generated.key, warning: 'Store this key now. It will not be shown again.' });
  } catch (err) { next(err); }
});

securityRouter.post('/api-keys/:id/revoke', authenticate, async (req, res, next) => {
  try {
    const record = await prisma.apiKey.findUnique({ where: { id: req.params.id } });
    if (!record || record.userId !== req.user!.userId) throw new AppError('API key not found', 404);
    await prisma.apiKey.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    await logEvent(req.user!.userId, 'api_key_revoked', req, { apiKeyId: record.id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Admin controls ──────────────────────────────────────────────────────────
securityRouter.get('/admin/events', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const events = await prisma.securityEvent.findMany({
      where: type ? { type } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ events });
  } catch (err) { next(err); }
});

securityRouter.post('/admin/unlock/:userId', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.params.userId },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
    await logEvent(req.params.userId, 'admin_unlock', req, { by: req.user!.userId });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

securityRouter.post('/admin/lock/:userId', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { minutes } = z.object({ minutes: z.number().int().min(1).max(1440).default(30) }).parse(req.body ?? {});
    const until = new Date(Date.now() + minutes * 60000);
    await prisma.user.update({ where: { id: req.params.userId }, data: { lockedUntil: until } });
    await logEvent(req.params.userId, 'admin_lock', req, { by: req.user!.userId, minutes });
    res.json({ ok: true, lockedUntil: until });
  } catch (err) { next(err); }
});

// ── Anti-phishing guide (public) ───────────────────────────────────────────
securityRouter.get('/phishing-guide', (_req, res) => {
  res.json({
    title: 'How to spot phishing on Rally',
    rules: [
      'Rally staff never ask for your password, one-time code, or a Gift.',
      'Password reset links expire in 30 minutes and come only from official Rally channels.',
      'Check the address bar: real Rally pages are served from your Rally app or rally.app domains.',
      'Nobody needs your recovery codes to "verify" your account.',
      'Gifts are voluntary support. Never send a Gift to unlock a prize, job, or service.',
      'If a message pressures you to act fast, treat it as phishing and report it.',
    ],
  });
});
