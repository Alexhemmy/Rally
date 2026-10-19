import { describe, it, expect } from 'vitest';
import {
  normalizeWeights,
  computeComposites,
  drawWeighted,
  hashSeed,
  scoreBand,
  type RawScores,
} from '../src/services/giveaway-engine';

describe('GVW giveaway engine (unit)', () => {
  it('normalizes weights into range and sum 1', () => {
    const w = normalizeWeights({ activeness: 0.5, dedication: 0.5, passion: 0.5 });
    expect(w.activeness + w.dedication + w.passion).toBeCloseTo(1);
  });

  it('defaults each weight to >= 0.2 (max 5:1 odds advantage)', () => {
    const w = normalizeWeights({ activeness: 0.5, dedication: 0.2, passion: 0.2 });
    expect(w.activeness).toBeGreaterThanOrEqual(0.2);
    expect(w.dedication).toBeGreaterThanOrEqual(0.2);
    expect(w.passion).toBeGreaterThanOrEqual(0.2);
  });

  it('W = 1 + 4C, so weights stay in [1, 5]', () => {
    const raw = new Map<string, RawScores>([
      ['a', { activeness: 10, dedication: 20, passion: 5 }],
      ['b', { activeness: 0, dedication: 0, passion: 0 }],
      ['c', { activeness: 5, dedication: 10, passion: 2 }],
    ]);
    const comp = computeComposites(raw, normalizeWeights(null));
    for (const { weight } of comp.values()) {
      expect(weight).toBeGreaterThanOrEqual(1);
      expect(weight).toBeLessThanOrEqual(5);
    }
    // top scorer must outweigh bottom scorer
    expect(comp.get('a')!.weight).toBeGreaterThan(comp.get('b')!.weight);
  });

  it('draw is deterministic for the same seed and weights', () => {
    const entrants = ['a','b','c','d','e','f'].map((userId) => ({ userId, weight: 1 + Math.random() * 4 }));
    const d1 = drawWeighted(entrants, 2, 'seed123', 'pub456');
    const d2 = drawWeighted(entrants, 2, 'seed123', 'pub456');
    expect(d1.winners).toEqual(d2.winners);
    expect(d1.alternates).toEqual(d2.alternates);
  });

  it('draws without replacement (no duplicate winners)', () => {
    const entrants = Array.from({ length: 20 }, (_, i) => ({ userId: `u${i}`, weight: 1 + i * 0.2 }));
    const { winners, alternates } = drawWeighted(entrants, 5, 's', 'p');
    expect(new Set(winners).size).toBe(5);
    expect(winners).toHaveLength(5);
    expect(new Set(alternates).size).toBe(alternates.length);
    expect(winners.some((w) => alternates.includes(w))).toBe(false);
  });

  it('zero-weight pools fall back to uniform draw', () => {
    const entrants = ['a','b','c'].map((userId) => ({ userId, weight: 0 }));
    const { winners } = drawWeighted(entrants, 3, 's', 'p');
    expect(winners.sort()).toEqual(['a','b','c']);
  });

  it('seed hash is stable (provable fairness commitment)', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });

  it('score bands never leak exact values', () => {
    expect(scoreBand(0)).toBe('low');
    expect(scoreBand(0.5)).toBe('medium');
    expect(scoreBand(0.9)).toBe('high');
  });
});
