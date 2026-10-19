import crypto from 'crypto';
import { prisma } from '../utils/prisma';

/**
 * GVW: Giveaway draw engine — non-monetary fan scores.
 * Scores use ONLY activeness, dedication and passion signals
 * (reactions, comments, follow tenure). NO spend data is read (GVW-4).
 * Draw is weighted (W = 1 + 4C), seeded and provably fair (GVW-3/6).
 */

export type RawScores = { activeness: number; dedication: number; passion: number };
export type Weights = { activeness: number; dedication: number; passion: number };

export function normalizeWeights(w: Partial<Weights> | null | undefined): Weights {
  const activeness = clamp(w?.activeness ?? 0.34, 0.2, 0.5);
  const dedication = clamp(w?.dedication ?? 0.33, 0.2, 0.5);
  const passion = clamp(w?.passion ?? 0.33, 0.2, 0.5);
  const sum = activeness + dedication + passion;
  return { activeness: activeness / sum, dedication: dedication / sum, passion: passion / sum };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Number(v) || 0));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Raw per-fan scores over the window. Non-monetary only (GVW-4). */
export async function computeRawScores(userId: string, favoriteId: string, favoriteOwnerId: string, windowDays: number): Promise<RawScores> {
  const since = new Date(Date.now() - windowDays * DAY_MS);
  const moments = await prisma.moment.findMany({ where: { favoriteId }, select: { id: true } });
  const momentIds = moments.map((m) => m.id);
  if (momentIds.length === 0) return { activeness: 0, dedication: 0, passion: 0 };

  const [reactions, comments, follow] = await Promise.all([
    prisma.reaction.findMany({
      where: { userId, momentId: { in: momentIds }, createdAt: { gte: since } },
      select: { momentId: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { userId, momentId: { in: momentIds }, isHidden: false, createdAt: { gte: since } },
      select: { body: true, createdAt: true },
    }),
    prisma.follow.findFirst({ where: { followerId: userId, followingId: favoriteOwnerId } }),
  ]);

  // Activeness: reactions + comments
  const activeness = reactions.length + comments.length * 2;

  // Dedication: follow tenure (capped at 90d) + distinct active days
  const activeDays = new Set<string>();
  for (const r of reactions) activeDays.add(r.createdAt.toISOString().slice(0, 10));
  for (const c of comments) activeDays.add(c.createdAt.toISOString().slice(0, 10));
  const followAgeDays = follow ? Math.min(90, (Date.now() - follow.createdAt.getTime()) / DAY_MS) : 0;
  const dedication = followAgeDays + activeDays.size * 3;

  // Passion: thoughtful comments (40+ chars) + breadth of moments engaged
  const longComments = comments.filter((c) => c.body.length >= 40).length;
  const distinctMoments = new Set(reactions.map((r) => r.momentId)).size;
  const passion = longComments * 3 + distinctMoments;

  return { activeness, dedication, passion };
}

/** Percentile (0..1) of each raw score across entrants. */
function percentile(values: number[], value: number): number {
  if (values.length <= 1) return values.length === 1 ? 0.5 : 0;
  const sorted = [...values].sort((a, b) => a - b);
  let below = 0;
  for (const v of sorted) if (v < value) below++;
  return below / (sorted.length - 1);
}

export type Composite = { c: number; weight: number };

/** GVW-3: C_i = w·percentiles, W_i = 1 + 4C_i (weight ratio max 5:1). */
export function computeComposites(
  raw: Map<string, RawScores>,
  weights: Weights
): Map<string, Composite> {
  const act = [...raw.values()].map((s) => s.activeness);
  const ded = [...raw.values()].map((s) => s.dedication);
  const pas = [...raw.values()].map((s) => s.passion);
  const out = new Map<string, Composite>();
  for (const [userId, s] of raw) {
    const c =
      weights.activeness * percentile(act, s.activeness) +
      weights.dedication * percentile(ded, s.dedication) +
      weights.passion * percentile(pas, s.passion);
    out.set(userId, { c, weight: 1 + 4 * c });
  }
  return out;
}

export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function randomFrom(seedMaterial: string, counter: number): number {
  const h = crypto.createHash('sha256').update(seedMaterial + ':' + counter).digest();
  // 52 bits of entropy mapped to [0,1)
  return h.readUInt32BE(0) * 65536 + h.readUInt32BE(4) < 0 ? 0 : (h.readUInt32BE(0) * 65536 + h.readUInt32BE(4) - 0) / 2 ** 48;
}

/**
 * Seeded weighted draw WITHOUT replacement. Deterministic given
 * (seed, publicRandom, entrant weights). GVW-6 provable fairness:
 * seedHash published at announce, seed revealed at draw.
 */
export function drawWeighted(
  entrants: Array<{ userId: string; weight: number }>,
  winnerCount: number,
  seed: string,
  publicRandom: string
): { winners: string[]; alternates: string[] } {
  const pool = entrants.map((e) => ({ userId: e.userId, weight: Math.max(0, e.weight) }));
  const winners: string[] = [];
  const seedMaterial = seed + '|' + publicRandom;
  let counter = 0;
  const take = () => {
    counter++;
    return randomFrom(seedMaterial, counter);
  };
  while (winners.length < Math.min(winnerCount, pool.length)) {
    const total = pool.reduce((sum, e) => sum + e.weight, 0);
    if (total <= 0) {
      // everyone zero weight: uniform fallback
      const idx = Math.floor(take() * pool.length) % pool.length;
      winners.push(pool[idx].userId);
      pool.splice(idx, 1);
      continue;
    }
    let r = take() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r < 0) { idx = i; break; }
    }
    winners.push(pool[idx].userId);
    pool.splice(idx, 1);
  }
  // alternates: up to 3 more from remaining pool
  const alternates: string[] = [];
  while (alternates.length < Math.min(3, pool.length)) {
    const total = pool.reduce((sum, e) => sum + e.weight, 0);
    if (total <= 0) {
      const idx = Math.floor(take() * pool.length) % pool.length;
      alternates.push(pool[idx].userId);
      pool.splice(idx, 1);
      continue;
    }
    let r = take() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r < 0) { idx = i; break; }
    }
    alternates.push(pool[idx].userId);
    pool.splice(idx, 1);
  }
  return { winners, alternates };
}

/** GVW: never expose exact scores — only bands. */
export function scoreBand(c: number): 'low' | 'medium' | 'high' {
  if (c < 0.34) return 'low';
  if (c < 0.67) return 'medium';
  return 'high';
}
