import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { resolveApiKey } from '../middleware/security';

/**
 * Phase 3 — Public API (trust data, embeds, platform trends).
 * Read-only and rate-limited. Anonymous callers: 120 req / 5 min / IP.
 * Partners with an API key (Bearer rly_live_...): 1000 req / 5 min.
 */
export const publicApiRouter = Router();

const hits = new Map<string, { count: number; reset: number }>();
publicApiRouter.use(async (req, res, next) => {
  try {
    const apiKey = await resolveApiKey(req);
    const now = Date.now();
    const bucketKey = (apiKey ? 'key:' + apiKey.id : 'ip:' + (req.ip || 'unknown'));
    const max = apiKey ? 1000 : 120;
    const entry = hits.get(bucketKey);
    if (!entry || now > entry.reset) {
      hits.set(bucketKey, { count: 1, reset: now + 5 * 60 * 1000 });
    } else {
      entry.count++;
      if (entry.count > max) {
        res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
    }
    if (hits.size > 20000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    next();
  } catch {
    next();
  }
});

publicApiRouter.get('/v1/embed/favorite/:handle', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { handle: req.params.handle } });
    if (!user) return res.status(404).json({ error: 'Favorite not found' });
    const fav = await prisma.favoriteProfile.findUnique({ where: { userId: user.id } });
    if (!fav || !fav.isPublished) return res.status(404).json({ error: 'Favorite not found' });
    const badgeCount = await prisma.userBadge.count({ where: { userId: user.id } });
    const card = {
      type: 'rally.favorite',
      version: 1,
      name: user.displayName,
      handle: user.handle,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      supporterCount: fav.supporterCount,
      verification: fav.verificationStatus,
      cohort: fav.cohort,
      badgeCount,
      url: fav.shortUrl || 'https://rally.app/' + user.handle,
    };
    if (req.query.format === 'html') {
      const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
      const html = '<div style="font-family:sans-serif;max-width:340px;border:1px solid #eee;border-radius:12px;padding:16px">' +
        '<div style="font-weight:700;font-size:18px">' + esc(card.name) + '</div>' +
        '<div style="color:#666">@' + esc(card.handle) + '</div>' +
        (card.bio ? '<p style="font-size:13px;color:#333">' + esc(card.bio.slice(0, 140)) + '</p>' : '') +
        '<div style="font-size:12px;color:#888">' + card.supporterCount + ' supporters · rally.app</div></div>';
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
    res.json(card);
  } catch (err) { next(err); }
});

publicApiRouter.get('/v1/rankings', async (req, res, next) => {
  try {
    const favorites = await prisma.favoriteProfile.findMany({
      where: { isPublished: true, showInRankings: true },
      orderBy: { supporterCount: 'desc' },
      take: 25,
      select: { id: true, supporterCount: true, cohort: true, userId: true },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: favorites.map((f) => f.userId) } },
      select: { id: true, displayName: true, handle: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    res.json({
      type: 'rally.rankings',
      window: 'all-time',
      entries: favorites.map((f, i) => ({
        rank: i + 1,
        name: byId.get(f.userId)?.displayName ?? 'Favorite',
        handle: byId.get(f.userId)?.handle,
        supporterCount: f.supporterCount,
        cohort: f.cohort,
      })),
    });
  } catch (err) { next(err); }
});

publicApiRouter.get('/v1/giveaways/:id/results', async (req, res, next) => {
  try {
    const giveaway = await prisma.giveaway.findUnique({ where: { id: req.params.id } });
    if (!giveaway) return res.status(404).json({ error: 'Giveaway not found' });
    if (!['drawn', 'paid'].includes(giveaway.status)) {
      return res.json({ status: giveaway.status, results: null });
    }
    const winners = await prisma.giveawayEntry.findMany({
      where: { giveawayId: giveaway.id, isWinner: true },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: winners.map((w) => w.userId) } },
      select: { id: true, displayName: true, anonymityDefault: true },
    });
    res.json({
      status: giveaway.status,
      method: 'Weighted random draw from activeness, dedication and passion scores (never spending).',
      seedHash: giveaway.seedHash,
      seedRevealed: giveaway.seedRevealed,
      sponsorLabel: giveaway.sponsorLabel,
      prizeKind: giveaway.prizeKind,
      winners: winners.map((w) => {
        const u = users.find((x) => x.id === w.userId);
        return { rank: w.rank, name: u?.anonymityDefault ? 'Anonymous Fan' : u?.displayName ?? 'Fan' };
      }),
    });
  } catch (err) { next(err); }
});

publicApiRouter.get('/v1/trust', async (req, res, next) => {
  try {
    const [open, resolved, hidden, juniorCount] = await Promise.all([
      prisma.report.count({ where: { status: { in: ['open', 'reviewing'] } } }),
      prisma.report.count({ where: { status: { in: ['resolved', 'dismissed'] } } }),
      prisma.comment.count({ where: { isHidden: true } }),
      prisma.juniorFavorite.count({ where: { status: 'approved' } }),
    ]);
    res.json({
      type: 'rally.trust',
      reports: { open, resolved },
      hiddenComments: hidden,
      juniorFavorites: juniorCount,
      note: 'Reports resolved within 24h is tracked in the ops dashboard; this endpoint exposes aggregate counts only.',
    });
  } catch (err) { next(err); }
});

publicApiRouter.get('/v1/trends', async (req, res, next) => {
  try {
    const week = new Date(Date.now() - 7 * 86400000);
    const [topMoments, risingFavs] = await Promise.all([
      prisma.moment.findMany({
        where: { createdAt: { gte: week }, isApproved: true },
        orderBy: { supportCount: 'desc' },
        take: 10,
        select: { id: true, title: true, supportCount: true, favoriteId: true, createdAt: true },
      }),
      prisma.favoriteProfile.findMany({
        where: { isPublished: true, showInRankings: true, cohort: 'rising' },
        orderBy: { supporterCount: 'desc' },
        take: 10,
        select: { id: true, supporterCount: true, userId: true },
      }),
    ]);
    const favUsers = await prisma.user.findMany({
      where: { id: { in: risingFavs.map((f) => f.userId) } },
      select: { id: true, displayName: true, handle: true },
    });
    res.json({
      type: 'rally.trends',
      window: '7d',
      topMoments,
      risingFavorites: risingFavs.map((f, i) => ({
        rank: i + 1,
        name: favUsers.find((u) => u.id === f.userId)?.displayName ?? 'Favorite',
        handle: favUsers.find((u) => u.id === f.userId)?.handle,
        supporterCount: f.supporterCount,
      })),
    });
  } catch (err) { next(err); }
});

publicApiRouter.get('/v1', (_req, res) => {
  res.json({
    name: 'Rally Public API',
    version: 'v1 (Phase 3)',
    endpoints: [
      'GET /api/public/v1/embed/favorite/:handle[?format=html]',
      'GET /api/public/v1/rankings',
      'GET /api/public/v1/giveaways/:id/results',
      'GET /api/public/v1/trust',
      'GET /api/public/v1/trends',
    ],
    auth: 'Optional: pass an API key (Authorization: Bearer rly_live_...) for a higher rate limit. Create keys in Settings → Security.',
    rateLimit: '120 req / 5 min / IP anonymous · 1000 req / 5 min per API key',
  });
});
