import { prisma } from '../utils/prisma';

/**
 * Notification delivery (NTF-1/NTF-2). Creates the in-app notification
 * row and dispatches to adapters. Adapters are pluggable: console in dev;
 * wire FCM (push) and SES/Resend (email) via env in production.
 */

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

async function dispatchPush(input: NotifyInput) {
  if (process.env.PUSH_ADAPTER === 'fcm') {
    // TODO: FCM send via device tokens
  } else {
    console.log('[push:dev]', input.type, input.title);
  }
}

async function dispatchEmail(input: NotifyInput, email: string | null) {
  if (process.env.EMAIL_ADAPTER === 'ses' || process.env.EMAIL_ADAPTER === 'resend') {
    // TODO: provider send
  } else if (email) {
    console.log('[email:dev]', email, input.title);
  }
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
      select: { email: true },
    });
    await Promise.allSettled([
      dispatchPush(input),
      dispatchEmail(input, user?.email ?? null),
    ]);
    return n;
  } catch (e) {
    console.error('notify_failed', e);
    return null;
  }
}
