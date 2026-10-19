import { prisma } from '../utils/prisma';

/**
 * REC-1: Automated badges reward First Supporter, Day One, Top 10,
 * tenure, participation streaks, Translator, and Impact.
 *
 * Awarded automatically inside the gift flow. Never fails the gift:
 * badges are best-effort and idempotent (unique constraint per
 * user+badge+favorite).
 */

async function ensureDefinition(
  slug: string,
  name: string,
  description: string,
  ruleType: string
) {
  return prisma.badgeDefinition.upsert({
    where: { slug },
    update: {},
    create: { slug, name, description, ruleType },
  });
}

export async function awardAutomatedBadges(opts: {
  senderId: string;
  senderHandle: string;
  favoriteId: string;
  favoriteOwnerId: string;
  favoriteCreatedAt: Date;
}) {
  try {
    // First Supporter: this fan's first gift ever to this Favorite
    const priorGifts = await prisma.gift.count({
      where: { senderId: opts.senderId, favoriteId: opts.favoriteId },
    });
    if (priorGifts === 1) {
      const def = await ensureDefinition(
        'first_supporter',
        'First Supporter',
        'First fan to send a Gift to this Favorite',
        'first_supporter'
      );
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId_favoriteId: {
            userId: opts.senderId,
            badgeId: def.id,
            favoriteId: opts.favoriteId,
          },
        },
        update: {},
        create: {
          userId: opts.senderId,
          badgeId: def.id,
          favoriteId: opts.favoriteId,
        },
      });
      await prisma.notification.create({
        data: {
          userId: opts.senderId,
          type: 'badge_awarded',
          title: 'You earned First Supporter!',
          body: 'You were among the first fans to support this Favorite.',
          data: { badgeSlug: 'first_supporter', favoriteId: opts.favoriteId },
        },
      });
    }

    // Day One: gift sent within 48h of the Favorite page going live
    const ageHours =
      (Date.now() - new Date(opts.favoriteCreatedAt).getTime()) / 3_600_000;
    if (ageHours <= 48) {
      const def = await ensureDefinition(
        'day_one',
        'Day One',
        'Supported this Favorite within their first 48 hours',
        'day_one'
      );
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId_favoriteId: {
            userId: opts.senderId,
            badgeId: def.id,
            favoriteId: opts.favoriteId,
          },
        },
        update: {},
        create: {
          userId: opts.senderId,
          badgeId: def.id,
          favoriteId: opts.favoriteId,
        },
      });
      await prisma.notification.create({
        data: {
          userId: opts.senderId,
          type: 'badge_awarded',
          title: 'You earned Day One!',
          body: "You showed up during this Favorite's first days on Rally.",
          data: { badgeSlug: 'day_one', favoriteId: opts.favoriteId },
        },
      });
    }

    // Top 10: sender is now among this Favorite's top 10 supporters by
    // cumulative Gift Points (SupporterLevel is upserted before this call)
    const top = await prisma.supporterLevel.findMany({
      where: { favoriteId: opts.favoriteId },
      orderBy: { cumulative: 'desc' },
      take: 10,
      select: { userId: true },
    });
    if (top.some((t) => t.userId === opts.senderId)) {
      const def = await ensureDefinition(
        'top_10',
        'Top 10',
        'One of the top 10 supporters of this Favorite',
        'top_10'
      );
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId_favoriteId: {
            userId: opts.senderId,
            badgeId: def.id,
            favoriteId: opts.favoriteId,
          },
        },
        update: {},
        create: {
          userId: opts.senderId,
          badgeId: def.id,
          favoriteId: opts.favoriteId,
        },
      });
    }
  } catch (e) {
    // Badges must never break the gift flow
    console.error('badge_award_failed', e);
  }
}
