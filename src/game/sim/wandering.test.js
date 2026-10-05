import { describe, it, expect } from 'vitest';
import { pickWanderTarget } from './wandering.js';

describe('pickWanderTarget', () => {
  it('returns a tile within bounds', () => {
    const t = pickWanderTarget(4, 4, 8, 8);
    expect(t.x).toBeGreaterThanOrEqual(0);
    expect(t.x).toBeLessThan(8);
    expect(t.y).toBeGreaterThanOrEqual(0);
    expect(t.y).toBeLessThan(8);
  });

  it('never picks the current tile', () => {
    for (let i = 0; i < 50; i++) {
      const t = pickWanderTarget(3, 3, 8, 8);
      expect(t).not.toEqual({ x: 3, y: 3 });
    }
  });

  it('never picks a blocked tile', () => {
    const blocked = new Set(['0,0', '7,7', '3,4']);
    for (let i = 0; i < 50; i++) {
      const t = pickWanderTarget(4, 4, 8, 8, blocked);
      expect(blocked.has(`${t.x},${t.y}`)).toBe(false);
    }
  });

  it('returns null when only the current tile is free', () => {
    const blocked = new Set();
    for (let x = 0; x < 3; x++)
      for (let y = 0; y < 3; y++)
        if (!(x === 1 && y === 1)) blocked.add(`${x},${y}`);
    expect(pickWanderTarget(1, 1, 3, 3, blocked)).toBeNull();
  });

  it('works at corners', () => {
    const t = pickWanderTarget(0, 0, 8, 8);
    expect(t).not.toEqual({ x: 0, y: 0 });
    expect(t.x).toBeGreaterThanOrEqual(0);
    expect(t.y).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic with a seeded rng', () => {
    const rng = () => 0; // always picks first candidate
    const t = pickWanderTarget(4, 4, 8, 8, new Set(), rng);
    // First candidate in scan order (x=0,y=0) since (4,4) isn't first
    expect(t).toEqual({ x: 0, y: 0 });
  });
});
