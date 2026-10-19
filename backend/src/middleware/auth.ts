import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../utils/prisma';

export interface AuthPayload {
  userId: string;
  handle: string;
  roles: string[];
  tv?: number; // P3: tokenVersion at issue time — mismatch means the session was revoked
}

/** 7 days of inactivity → must log in again */
export const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      apiKey?: { id: string; userId: string };
    }
  }
}

async function assertActiveSession(userId: string, tokenVersion?: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, lastActiveAt: true, handle: true, roles: true, tokenVersion: true, lockedUntil: true },
  });
  if (!user) throw new AppError('Authentication required', 401);

  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    throw new AppError('Account temporarily locked. Try again shortly.', 423);
  }

  const last = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
  if (Date.now() - last > INACTIVITY_MS) {
    throw new AppError('Session expired after 7 days of inactivity. Please log in again.', 401);
  }

  // P3: reject tokens issued before a global session revoke / password change
  if ((tokenVersion ?? 0) !== user.tokenVersion) {
    throw new AppError('Session revoked. Please log in again.', 401);
  }

  // Sliding activity window
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });

  return user;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as AuthPayload;
    assertActiveSession(payload.userId, payload.tv)
      .then((user) => {
        req.user = {
          userId: user.id,
          handle: user.handle,
          roles: user.roles as string[],
        };
        next();
      })
      .catch(next);
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(header.slice(7), secret) as AuthPayload;
    assertActiveSession(payload.userId, payload.tv)
      .then((user) => {
        req.user = {
          userId: user.id,
          handle: user.handle,
          roles: user.roles as string[],
        };
        next();
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    const has = roles.some((r) => req.user!.roles.includes(r));
    if (!has) return next(new AppError('Insufficient permissions', 403));
    next();
  };
}
