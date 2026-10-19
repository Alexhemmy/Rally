import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

/**
 * Phone OTP for ACC-1: a verified phone (or social login) is required
 * before the first Token purchase. Provider is abstracted: in dev the
 * code is logged; in production set SMS_PROVIDER env and wire the
 * provider call in sendSms().
 */

const OTP_TTL_MIN = 10;
const RESEND_COOLDOWN_SEC = 60;
const MAX_ATTEMPTS = 3;

function hashCode(phone: string, code: string): string {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'dev-secret').update(`${phone}:${code}`).digest('hex');
}

async function sendSms(phone: string, body: string) {
  // Provider abstraction — wire Twilio/Termii here in production.
  if (process.env.NODE_ENV !== 'production' || !process.env.SMS_PROVIDER) {
    console.log('[otp:dev]', phone, body);
    return;
  }
  // TODO: real provider call (SMS_PROVIDER=twilio|termii)
  console.log('[otp:provider-unimplemented]', phone);
}

export async function requestOtp(userId: string, phone: string) {
  const normalized = phone.replace(/[\s()-]/g, '');
  if (!/^\+?[0-9]{8,15}$/.test(normalized)) {
    throw new AppError('Invalid phone number');
  }

  const existing = await prisma.user.findFirst({
    where: { phone: normalized, NOT: { id: userId } },
    select: { id: true },
  });
  if (existing) throw new AppError('Phone number already in use', 409);

  // Resend cooldown
  const recent = await prisma.oTPCode.findFirst({
    where: { userId, phone: normalized, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_SEC * 1000) } },
  });
  if (recent) throw new AppError('Please wait before requesting another code', 429);

  const code = String(crypto.randomInt(100000, 999999));
  await prisma.oTPCode.create({
    data: {
      userId,
      phone: normalized,
      codeHash: hashCode(normalized, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
    },
  });
  await sendSms(normalized, `Your Rally verification code is ${code}. It expires in ${OTP_TTL_MIN} minutes.`);
  return { phone: normalized, expiresInSeconds: OTP_TTL_MIN * 60 };
}

export async function verifyOtp(userId: string, phone: string, code: string) {
  const normalized = phone.replace(/[\s()-]/g, '');
  const otp = await prisma.oTPCode.findFirst({
    where: { userId, phone: normalized, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw new AppError('No pending code. Request a new one.', 404);
  if (otp.expiresAt.getTime() < Date.now()) throw new AppError('Code expired. Request a new one.', 410);
  if (otp.attempts >= MAX_ATTEMPTS) throw new AppError('Too many attempts. Request a new code.', 429);

  if (otp.codeHash !== hashCode(normalized, code)) {
    await prisma.oTPCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError('Incorrect code', 401);
  }

  await prisma.$transaction([
    prisma.oTPCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { phone: normalized, phoneVerifiedAt: new Date() } }),
  ]);
  return { verified: true };
}

export function isPurchaseVerified(user: { phoneVerifiedAt: Date | null; googleId: string | null; appleId: string | null }) {
  return Boolean(user.phoneVerifiedAt || user.googleId || user.appleId);
}
