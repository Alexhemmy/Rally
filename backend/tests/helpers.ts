import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../src/utils/prisma';

/**
 * Integration test helpers. Tests run against the DATABASE_URL in .env
 * and clean up every row they create (handle prefix p1t_).
 */

export const PREFIX = 'p1t_';
let seq = 0;
export function uniq(prefix = 'user') {
  return `${PREFIX}${prefix}_${Date.now()}_${++seq}`;
}

export function tokenFor(user: { id: string; handle: string; roles: string[] }) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign({ userId: user.id, handle: user.handle, roles: user.roles }, secret);

}

export async function createUser(opts: {
  roles?: string[];
  isMinor?: boolean;
  phone?: string;
  verified?: boolean;
  createdAtDaysAgo?: number;
} = {}) {
  const handle = uniq();
  const email = `${handle}@test.rally.local`;
  const created = new Date(Date.now() - (opts.createdAtDaysAgo ?? 0) * 86400000);
  const user = await prisma.user.create({
    data: {
      handle,
      email,
      displayName: handle,
      passwordHash: 'test',
      roles: (opts.roles ?? ['USER']) as any,
      isMinor: opts.isMinor ?? false,
      phone: opts.phone ?? null,
      phoneVerifiedAt: opts.verified ? new Date() : null,
      createdAt: created,
      lastActiveAt: new Date(),
    },
  });
  await prisma.tokenWallet.create({ data: { userId: user.id, balance: 0, giftedBalance: 0 } });
  return { ...user, token: tokenFor({ id: user.id, handle: user.handle, roles: user.roles as string[] }) };
}

export async function createFavorite(userId: string, opts: { giftPoints?: number } = {}) {
  const fav = await prisma.favoriteProfile.create({
    data: {
      userId,
      displayName: uniq('fav'),
      verificationStatus: 'VERIFIED',
      isPublished: true,
      giftPointsBalance: opts.giftPoints ?? 0,
    },
  });
  return fav;
}

export async function follow(followerId: string, followingId: string, daysAgo = 30) {
  return prisma.follow.create({
    data: {
      followerId,
      followingId,
      createdAt: new Date(Date.now() - daysAgo * 86400000),
    },
  });
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function cleanup() {
  // Delete only rows created by this test run (handle prefix + email suffix).
  const users = await prisma.user.findMany({
    where: { OR: [{ handle: { startsWith: PREFIX } }, { email: { endsWith: '@test.rally.local' } }] },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  const favs = await prisma.favoriteProfile.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const favIds = favs.map((f) => f.id);

  await prisma.giveawayEntry.deleteMany({ where: { userId: { in: ids } } });
  await prisma.giveaway.deleteMany({ where: { favoriteId: { in: favIds } } });
  await prisma.fanGift.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { recipientId: { in: ids } }] } });
  await prisma.upgradeRequest.deleteMany({ where: { userId: { in: ids } } });
  await prisma.subscription.deleteMany({ where: { userId: { in: ids } } });
  await prisma.subscriptionTier.deleteMany({ where: { favoriteId: { in: favIds } } });
  await prisma.storeOrder.deleteMany({ where: { buyerId: { in: ids } } });
  await prisma.storeItem.deleteMany({ where: { favoriteId: { in: favIds } } });
  await prisma.earning.deleteMany({ where: { favoriteId: { in: favIds } } });
  await prisma.collection.deleteMany({ where: { userId: { in: ids } } });
  await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } });
  await prisma.faceOff.deleteMany({ where: { OR: [{ favoriteAId: { in: favIds } }, { favoriteBId: { in: favIds } }] } });
  await prisma.rivalry.deleteMany({ where: { OR: [{ favoriteAId: { in: favIds } }, { favoriteBId: { in: favIds } }] } });
  await prisma.supporterLevel.deleteMany({ where: { userId: { in: ids } } });
  await prisma.gift.deleteMany({ where: { senderId: { in: ids } } });
  await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
  await prisma.moment.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.reaction.deleteMany({ where: { userId: { in: ids } } });
  await prisma.comment.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.follow.deleteMany({ where: { OR: [{ followerId: { in: ids } }, { followingId: { in: ids } }] } });
  await prisma.tokenWallet.deleteMany({ where: { userId: { in: ids } } });
  await prisma.favoriteProfile.deleteMany({ where: { userId: { in: ids } } });
  await prisma.oTPCode.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

export function fakeUuid() {
  return crypto.randomUUID();
}
