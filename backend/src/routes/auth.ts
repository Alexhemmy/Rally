import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { requestOtp, verifyOtp } from '../services/otp';

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

function signToken(user: { id: string; handle: string; roles: string[] }) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(
    { userId: user.id, handle: user.handle, roles: user.roles },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    if (!data.email && !data.phone) {
      throw new AppError('Email or phone is required');
    }

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

    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles });
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    if (!data.email && !data.phone) {
      throw new AppError('Email or phone is required');
    }

    const user = await prisma.user.findFirst({
      where: data.email ? { email: data.email } : { phone: data.phone },
    });
    if (!user?.passwordHash) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles });
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
    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles as string[] });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/password-reset/request', async (req, res, next) => {
  try {
    const email = z.string().email().parse(req.body.email);
    // Always 200 — do not leak whether email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'system',
          title: 'Password reset requested',
          body: 'Reset link would be emailed in production',
        },
      });
    }
    res.json({ ok: true, message: 'If the email exists, reset instructions were sent' });
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
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
  );
  if (!res.ok) throw new AppError('Invalid Google token', 401);
  const data: any = await res.json();
  if (process.env.GOOGLE_CLIENT_ID && data.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Token audience mismatch', 401);
  }
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

authRouter.post('/social', async (req, res, next) => {
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
    const token = signToken({ id: user.id, handle: user.handle, roles: user.roles as string[] });
    res.json({
      user: { id: user.id, handle: user.handle, displayName: user.displayName, roles: user.roles },
      token,
    });
  } catch (err) {
    next(err);
  }
});
