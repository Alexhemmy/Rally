import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { requestOtp, verifyOtp } from '../services/otp';
import { rateLimit, clientIp, passwordIssues, verifyTotp } from '../middleware/security';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(8),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(80),
  role: z.enum(['FAN', 'FAVORITE']).default('FAN'),
  locale: z.string().default('en'),
  countryCode: z.string().length(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
});

const otpRequestSchema = z.object({ phone: z.string().min(8) });
const otpVerifySchema = z.object({ phone: z.string().min(8), code: z.string().length(6) });
const socialSchema = z.object({
  provider: z.enum(['google', 'apple']),
  token: z.string().min(1),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  displayName: z.string().min(1).max(80).optional(),
});

// P3 security parameters
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const RESET_TOKEN_MINUTES = 30;

// P3 rate limits (per IP)
const attemptLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Please wait a few minutes.' });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many reset requests. Please wait a few minutes.' });
const socialLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many attempts. Please wait a few minutes.' });

function signToken(user: { id: string; handle: string; roles: string[]; tokenVersion?: number }) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(
    { userId: user.id, handle: user.handle, roles: user.roles, tv: user.tokenVersion ?? 0 },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

/** Short-lived token scoped to the 2FA step only. */
function sign2faChallenge(userId: string) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ userId, scope: '2fa' }, secret, { expiresIn: '5m' });
}

async function logSecurityEvent(userId: string, type: string, req: Request, meta?: Record<string, unknown>) {
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

/** Constant-ish delay on failed credential checks to blunt timing/enumeration. */
async function antiEnumerateDelay() {
  await new Promise((r) => setTimeout(r, 350));
}

authRouter.post('/register', attemptLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (!data.email && !data.phone) {
      throw new AppError('Email or phone is required');
    }
    const issues = passwordIssues(data.password);
    if (issues.length) throw new AppError('Password needs ' + issues.join(', '), 422);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          data.email ? { email: data.email } : {},
          data.phone ? { phone: data.phone } : {},
          { handle: data.handle.toLowerCase() },
        ].filter((c) => Object.keys(c).length > 0),
      },
    });
    if (existing) throw new AppError('Email, phone, or handle already in use', 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const roles = data.role === 'FAVORITE' ? ['FAN', 'FAVORITE'] : ['FAN'];

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        handle: data.handle.toLowerCase(),
        displayName: data.displayName,
        roles: roles as any,
        locale: data.locale,
        countryCode: data.countryCode,
        fanProfile: { create: {} },
        tokenWallet: { create: {} },
        ...(data.role === 'FAVORITE'
          ? { favoriteProfile: { create: { isPublished: false } } }
          : {}),
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        roles: true,
        locale: true,
      },
    });

    await logSecurityEvent(user.id, 'account_created', req);
    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', attemptLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    if (!data.email && !data.phone) {
      throw new AppError('Email or phone is required');
    }

    const user = await prisma.user.findFirst({
      where: data.email ? { email: data.email } : { phone: data.phone },
    });

    if (!user?.passwordHash) {
      await antiEnumerateDelay();
      throw new AppError('Invalid credentials', 401);
    }

    // P3: brute-force lockout (423 so honest users see the wait)
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      throw new AppError('Account temporarily locked. Try again in ' + minutes + ' minute' + (minutes === 1 ? '' : 's') + '.', 423);
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      const failed = (user.failedLoginAttempts || 0) + 1;
      const update: any = { failedLoginAttempts: failed };
      let locked = false;
      if (failed >= MAX_FAILED_LOGINS) {
        update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
        update.failedLoginAttempts = 0;
        locked = true;
      }
      await prisma.user.update({ where: { id: user.id }, data: update });
      await logSecurityEvent(user.id, locked ? 'lockout' : 'login_failed', req, { attempts: failed });
      if (locked) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'system',
            title: 'Account locked',
            body:
              'Too many failed sign-in attempts. Your account is locked for ' + LOCK_MINUTES +
              ' minutes. If this was not you, change your password once unlocked. Rally will never ask for your password in a message.',
          },
        }).catch(() => undefined);
      }
      await antiEnumerateDelay();
      throw new AppError('Invalid credentials', 401);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date(), failedLoginAttempts: 0, ...(user.lockedUntil ? { lockedUntil: null } : {}) },
    });
    await logSecurityEvent(user.id, user.twoFactorEnabled ? 'login_pending_2fa' : 'login', req);

    if (user.twoFactorEnabled) {
      // Password verified — now demand the second factor.
      return res.json({ twoFactorRequired: true, challengeToken: sign2faChallenge(user.id) });
    }

    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles, tokenVersion: user.tokenVersion });
    res.json({
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        email: user.email,
        roles: user.roles,
        locale: user.locale,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// P3: complete login with a TOTP or recovery code
authRouter.post('/login/2fa', attemptLimiter, async (req, res, next) => {
  try {
    const { challengeToken, code } = z
      .object({ challengeToken: z.string().min(1), code: z.string().min(6).max(11) })
      .parse(req.body);

    let payload: any;
    try {
      payload = jwt.verify(challengeToken, process.env.JWT_SECRET || 'dev-secret');
    } catch {
      throw new AppError('Challenge expired. Please log in again.', 401);
    }
    if (payload.scope !== '2fa' || !payload.userId) throw new AppError('Invalid challenge', 401);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) throw new AppError('Invalid challenge', 401);

    const clean = code.replace(/[^A-Za-z0-9-]/g, '');
    let ok = verifyTotp(user.twoFactorSecret, clean);
    let usedRecovery = false;
    if (!ok) {
      const hash = crypto.createHash('sha256').update(clean.toLowerCase()).digest('hex');
      const remaining = user.recoveryCodeHashes.filter((h) => h !== hash);
      if (remaining.length !== user.recoveryCodeHashes.length) {
        ok = true;
        usedRecovery = true;
        await prisma.user.update({ where: { id: user.id }, data: { recoveryCodeHashes: remaining } });
      }
    }
    if (!ok) {
      await logSecurityEvent(user.id, 'login_failed', req, { reason: 'bad_2fa_code' });
      await antiEnumerateDelay();
      throw new AppError('Invalid code', 401);
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    await logSecurityEvent(user.id, usedRecovery ? 'login_recovery_code' : 'login_2fa', req);
    res.json({
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        email: user.email,
        roles: user.roles,
        locale: user.locale,
      },
      token: signToken({ id: user.id, handle: user.handle, roles: user.roles, tokenVersion: user.tokenVersion }),
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        roles: true,
        locale: true,
        contentLanguages: true,
        countryCode: true,
        verificationStatus: true,
        phoneVerifiedAt: true,
        socialVerifiedAt: true,
        twoFactorEnabled: true,
        fanProfile: true,
        favoriteProfile: {
          select: {
            id: true,
            isPublished: true,
            supporterCount: true,
            verificationStatus: true,
            giftPointsBalance: true,
            shortUrl: true,
          },
        },
        tokenWallet: { select: { balance: true, giftedBalance: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Refresh session — issues new JWT if user still valid
authRouter.post('/refresh', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) throw new AppError('User not found', 404);
    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles as string[], tokenVersion: user.tokenVersion });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// P3: real one-time reset tokens — hashed at rest, 30-minute expiry.
authRouter.post('/password-reset/request', resetLimiter, async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    // Always 200 — do not leak whether email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const raw = crypto.randomBytes(32).toString('base64url');
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: crypto.createHash('sha256').update(raw).digest('hex'),
          expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60000),
        },
      });
      const base = process.env.WEB_URL || 'http://localhost:3000';
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'system',
          title: 'Password reset requested',
          body:
            'A password reset was requested for your Rally account. Open ' + base + '/forgot-password?token=' + raw +
            ' within ' + RESET_TOKEN_MINUTES + ' minutes to choose a new password. ' +
            'Rally will NEVER ask for your password, a code, or a Gift in a message. ' +
            'If you did not request this, ignore it — your password stays unchanged.',
        },
      }).catch(() => undefined);
      await logSecurityEvent(user.id, 'password_reset_requested', req);
    }
    res.json({ ok: true, message: 'If the email exists, reset instructions were sent' });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/password-reset/confirm', resetLimiter, async (req, res, next) => {
  try {
    const { token, newPassword } = z
      .object({ token: z.string().min(10), newPassword: z.string().min(8) })
      .parse(req.body);
    const issues = passwordIssues(newPassword);
    if (issues.length) throw new AppError('Password needs ' + issues.join(', '), 422);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.consumedAt || record.expiresAt < new Date()) {
      await antiEnumerateDelay();
      throw new AppError('Invalid or expired reset link', 400);
    }
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) throw new AppError('Invalid or expired reset link', 400);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(newPassword, 12),
          passwordChangedAt: new Date(),
          tokenVersion: { increment: 1 }, // sign out every old session
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    ]);
    await logSecurityEvent(user.id, 'password_reset_completed', req);
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'system',
        title: 'Password changed',
        body: 'Your Rally password was changed and all other sessions were signed out. Rally will never ask for your password in a message.',
      },
    }).catch(() => undefined);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── Phone OTP (ACC-1) ────────────────────────────────────────────────────

authRouter.post('/otp/request', authenticate, async (req, res, next) => {
  try {
    const { phone } = otpRequestSchema.parse(req.body);
    const result = await requestOtp(req.user!.userId, phone);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/otp/verify', authenticate, async (req, res, next) => {
  try {
    const { phone, code } = otpVerifySchema.parse(req.body);
    const result = await verifyOtp(req.user!.userId, phone, code);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── Social login (ACC-1) ─────────────────────────────────────────────────

type SocialProfile = { providerId: string; email?: string; displayName?: string };

async function verifyGoogleToken(token: string): Promise<SocialProfile> {
  if (process.env.NODE_ENV !== 'production' && process.env.GOOGLE_CLIENT_ID === undefined) {
    // Dev mode: accept a dev token of the form "dev:<sub>:<name>"
    const [, sub, name] = token.split(':');
    return { providerId: sub || 'dev-user', displayName: name || 'Dev User' };
  }
  const res = await fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token)
  );
  if (!res.ok) throw new AppError('Invalid Google token', 401);
  const data: any = await res.json();
  if (process.env.GOOGLE_CLIENT_ID && data.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Token audience mismatch', 401);
  }
  if (!data.sub) throw new AppError('Invalid Google token', 401);
  return { providerId: data.sub, email: data.email, displayName: data.name };
}

async function verifyAppleToken(token: string): Promise<SocialProfile> {
  // Apple: verify the identity token's signature against Apple's JWKS in
  // production. Dev mode accepts "dev:<sub>:<name>" like Google.
  if (process.env.NODE_ENV !== 'production') {
    const [, sub, name] = token.split(':');
    return { providerId: sub || 'dev-user', displayName: name || 'Dev User' };
  }
  // TODO: JWKS verification (apple-auth / jose)
  throw new AppError('Apple login production wiring pending', 501);
}

authRouter.post('/social', socialLimiter, async (req, res, next) => {
  try {
    const data = socialSchema.parse(req.body);
    const profile =
      data.provider === 'google'
        ? await verifyGoogleToken(data.token)
        : await verifyAppleToken(data.token);

    const providerField = data.provider === 'google' ? 'googleId' : 'appleId';
    let user = await prisma.user.findUnique({
      where: { [providerField]: profile.providerId } as any,
    });

    if (!user && profile.email) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (byEmail) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: { [providerField]: profile.providerId, socialVerifiedAt: new Date() },
        });
      }
    }

    if (!user) {
      if (!data.handle) {
        throw new AppError('Handle required for new accounts', 422);
      }
      const handleTaken = await prisma.user.findUnique({
        where: { handle: data.handle.toLowerCase() },
      });
      if (handleTaken) throw new AppError('Handle already taken', 409);

      user = await prisma.user.create({
        data: {
          [providerField]: profile.providerId,
          email: profile.email,
          handle: data.handle!.toLowerCase(),
          displayName: data.displayName || profile.displayName || 'New Fan',
          socialVerifiedAt: new Date(),
          fanProfile: { create: {} },
          tokenWallet: { create: {} },
        } as any,
      });
    } else if (!user.socialVerifiedAt) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { socialVerifiedAt: new Date() },
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
    await logSecurityEvent(user.id, 'login_social', req, { provider: data.provider });
    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles as string[], tokenVersion: user.tokenVersion });
    res.json({
      user: { id: user.id, handle: user.handle, displayName: user.displayName, roles: user.roles },
      token,
    });
  } catch (err) {
    next(err);
  }
});
