import { prisma } from '../utils/prisma';
import { sendMail, mailConfigured, securityAlertEmail } from './mailer';

/**
 * Notification delivery (NTF-1/NTF-2). Creates the in-app notification
 * row and dispatches to adapters. Email: Gmail SMTP via nodemailer
 * (P3) — set SMTP_USER/SMTP_PASS; push: FCM adapter remains a TODO.
 */

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

const SECURITY_TYPES = new Set([
  'password_changed',
  'password_reset_completed',
  'account_locked',
  'lockout',
  '2fa_enabled',
  '2fa_disabled',
  'sessions_revoked',
]);

async function dispatchPush(input: NotifyInput) {
  if (process.env.PUSH_ADAPTER === 'fcm') {
    // TODO: FCM send via device tokens
  } else {
    console.log('[push:dev]', input.type, input.title);
  }
}

async function dispatchEmail(input: NotifyInput, user: { email: string | null; displayName: string } | null) {
  if (!user?.email) return;
  if (!mailConfigured()) {
    console.log('[email:dev]', user.email, input.title);
    return;
  }
  const isSecurity = SECURITY_TYPES.has(input.type);
  const html = isSecurity
    ? securityAlertEmail(user.displayName, input.title, input.body || '')
    : undefined;
  await sendMail({
    to: user.email,
    subject: isSecurity ? 'Rally security alert: ' + input.title : 'Rally: ' + input.title,
    ...(html ? { html } : {}),
    ...(!html
      ? {
          html:
            '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">' +
            '<div style="font-weight:800;font-size:20px;color:#0ea5e9;margin-bottom:16px">Rally</div>' +
            '<h2 style="font-size:17px;margin:0 0 12px">' + input.title.replace(/[&<>]/g, '') + '</h2>' +
            '<p style="margin:0">' + (input.body || '').replace(/[&<>]/g, '') + '</p>' +
            '</div>',
        }
      : {}),
    category: isSecurity ? 'security' : 'notification',
  });
}

/** Create an in-app notification and fan out to delivery adapters (never throws). */
export async function notify(input: NotifyInput) {
  try {
    const n = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? {}) as any,
      },
    });
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, displayName: true },
    });
    await Promise.allSettled([
      dispatchPush(input),
      dispatchEmail(input, user),
    ]);
    return n;
  } catch (e) {
    console.error('notify_failed', e);
    return null;
  }
}
