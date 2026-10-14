import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

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
