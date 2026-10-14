import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Industries & categories (sample from PRD taxonomy)
  const music = await prisma.industry.upsert({
    where: { slug: 'music' },
    update: {},
    create: { slug: 'music', name: 'Music', sortOrder: 1 },
  });

  const sports = await prisma.industry.upsert({
    where: { slug: 'sports' },
    update: {},
    create: { slug: 'sports', name: 'Sports', sortOrder: 2 },
  });

  const comedy = await prisma.industry.upsert({
    where: { slug: 'comedy' },
    update: {},
    create: { slug: 'comedy', name: 'Comedy', sortOrder: 3 },
  });

  const afrobeats = await prisma.category.upsert({
    where: { slug: 'afrobeats' },
    update: {},
    create: {
      industryId: music.id,
      slug: 'afrobeats',
      name: 'Afrobeats & Afrobeat',
    },
  });

  await prisma.specialty.upsert({
    where: { slug: 'afrobeats-singer' },
    update: {},
    create: {
      categoryId: afrobeats.id,
      slug: 'afrobeats-singer',
      name: 'Afrobeats Singer',
    },
  });

  // Token packs
  const packs = [
    { name: 'Starter', tokens: 50, bonusTokens: 0, priceCents: 99, sortOrder: 1 },
    { name: 'Fan Pack', tokens: 200, bonusTokens: 20, priceCents: 399, sortOrder: 2 },
    { name: 'Superfan', tokens: 500, bonusTokens: 75, priceCents: 899, sortOrder: 3 },
    { name: 'Legend', tokens: 1200, bonusTokens: 200, priceCents: 1999, sortOrder: 4 },
  ];
  for (const p of packs) {
    await prisma.tokenPack.upsert({
      where: { id: `pack-${p.sortOrder}` },
      update: p,
      create: { id: `pack-${p.sortOrder}`, ...p, currency: 'USD', isActive: true },
    });
  }

  // Gift catalog
  const gifts = [
    { slug: 'heart', name: 'Heart', tokenCost: 5, type: 'standard', sortOrder: 1 },
    { slug: 'clap', name: 'Clap', tokenCost: 10, type: 'standard', sortOrder: 2 },
    { slug: 'flame', name: 'Flame', tokenCost: 25, type: 'standard', sortOrder: 3 },
    { slug: 'drum', name: 'Drum', tokenCost: 50, type: 'category', sortOrder: 4 },
    { slug: 'mic', name: 'Microphone', tokenCost: 100, type: 'category', sortOrder: 5 },
    { slug: 'trophy', name: 'Trophy', tokenCost: 200, type: 'category', sortOrder: 6 },
  ];
  for (const g of gifts) {
    await prisma.giftCatalogItem.upsert({
      where: { slug: g.slug },
      update: g,
      create: { ...g, isActive: true },
    });
  }

  // Demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const fan = await prisma.user.upsert({
    where: { handle: 'ada' },
    update: {},
    create: {
      email: 'ada@rally.demo',
      handle: 'ada',
      displayName: 'Ada the Devoted',
      passwordHash,
      roles: ['FAN'],
      locale: 'en',
      countryCode: 'NG',
      fanProfile: { create: {} },
      tokenWallet: { create: { balance: 500, totalPurchased: 500 } },
    },
  });

  const favorite = await prisma.user.upsert({
    where: { handle: 'mia' },
    update: {},
    create: {
      email: 'mia@rally.demo',
      handle: 'mia',
      displayName: 'Mia the Emerging Artist',
      passwordHash,
      roles: ['FAN', 'FAVORITE'],
      locale: 'en',
      countryCode: 'NG',
      bio: 'Afrobeats artist. New album coming soon 🎵',
      fanProfile: { create: {} },
      tokenWallet: { create: {} },
      favoriteProfile: {
        create: {
          isPublished: true,
          verificationStatus: 'VERIFIED',
          categoryId: afrobeats.id,
          specialtyIds: [],
          shortUrl: 'r/mia',
          supporterCount: 0,
        },
      },
    },
  });

  console.log('Seed complete');
  console.log('Demo fan: ada / password123');
  console.log('Demo favorite: mia / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
