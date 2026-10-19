import { Router } from 'express';
import { prisma } from '../utils/prisma';

export const discoverRouter = Router();

/**
 * DSC-2 / CAT: full taxonomy tree (Industry → Category → Specialty).
 * The taxonomy sits in admin-managed tables so categories can be added
 * without a release (PRD 7.2).
 */
discoverRouter.get('/taxonomy', async (_req, res, next) => {
  try {
    const industries = await prisma.industry.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        categories: {
          orderBy: { name: 'asc' },
          include: {
            specialties: {
              orderBy: { name: 'asc' },
              select: { id: true, slug: true, name: true, nameI18n: true },
            },
          },
        },
      },
    });
    res.json({ industries });
  } catch (e) {
    next(e);
  }
});

/**
 * DSC-1: search by name, handle, specialty, and location, across
 * languages and scripts. Matches published Favorites and specialties.
 */
discoverRouter.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json({ favorites: [], specialties: [] });

    const term = q.toLowerCase();
    const like = `%${term}%`;

    const [users, specialties] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { handle: { contains: term, mode: 'insensitive' } },
            { displayName: { contains: term, mode: 'insensitive' } },
            { bio: { contains: term, mode: 'insensitive' } },
          ],
          favoriteProfile: { isPublished: true },
        },
        take: 20,
        select: {
          handle: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          countryCode: true,
          favoriteProfile: {
            select: {
              supporterCount: true,
              verificationStatus: true,
              coverUrl: true,
              accentColor: true,
              category: { select: { name: true, industry: { select: { name: true } } } },
              specialtyIds: true,
            },
          },
        },
      }),
      prisma.specialty.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term } },
          ],
        },
        take: 15,
        include: { category: { select: { name: true, industry: { select: { name: true } } } } },
      }),
    ]);

    // Location filter (LNG/DSC-1: search by location)
    const country = (req.query.country as string | undefined)?.toUpperCase();
    const favorites = country
      ? users.filter((u: any) => u.favoriteProfile && (!country || u.countryCode === country))
      : users;

    res.json({
      favorites,
      specialties: specialties.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        nameI18n: s.nameI18n,
        category: s.category?.name,
        industry: s.category?.industry?.name,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * DSC-2: browse trending Favorites (ranked by unique supporters, not
 * spending — PRD design principle "money buys expression, not standing").
 */
discoverRouter.get('/trending', async (_req, res, next) => {
  try {
    const favorites = await prisma.favoriteProfile.findMany({
      where: { isPublished: true },
      orderBy: { supporterCount: 'desc' },
      take: 20,
      include: {
        user: {
          select: { handle: true, displayName: true, avatarUrl: true },
        },
        category: { select: { name: true, industry: { select: { name: true } } } },
      },
    });
    res.json({
      trending: favorites.map((f: any) => ({
        handle: f.user.handle,
        displayName: f.user.displayName,
        avatarUrl: f.user.avatarUrl,
        supporterCount: f.supporterCount,
        verificationStatus: f.verificationStatus,
        category: f.category?.name,
        industry: f.category?.industry?.name,
        accentColor: f.accentColor,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * DSC-2 / CAT-8: Favorites in a category. Small categories (fewer than
 * 10 published Favorites) render as a Spotlight list instead of a ranking.
 */
discoverRouter.get('/categories/:categoryId', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.categoryId },
      include: { industry: { select: { name: true } } },
    });
    if (!category) return res.status(404).json({ error: { message: 'Category not found' } });

    const favorites = await prisma.favoriteProfile.findMany({
      where: { categoryId: category.id, isPublished: true },
      orderBy: { supporterCount: 'desc' },
      take: 50,
      include: {
        user: { select: { handle: true, displayName: true, avatarUrl: true } },
      },
    });

    const isSpotlight = favorites.length < 10; // CAT-8 Spotlight threshold

    res.json({
      category: { id: category.id, name: category.name, industry: category.industry.name },
      mode: isSpotlight ? 'spotlight' : 'ranked',
      favorites: favorites.map((f: any) => ({
        handle: f.user.handle,
        displayName: f.user.displayName,
        avatarUrl: f.user.avatarUrl,
        supporterCount: f.supporterCount,
        verificationStatus: f.verificationStatus,
        specialtyIds: f.specialtyIds,
      })),
    });
  } catch (e) {
    next(e);
  }
});
