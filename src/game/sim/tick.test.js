import { describe, it, expect } from 'vitest';
import { tick } from './tick.js';

// Fixture: mirrors the farm numbers from tasks.md. Lives here, not in
// data/buildings.js, because this spec ships no building entries.
const FARM = {
  produces: { resource: 'food', baseRate: 1 },
  sweetSpot: 4,
  teamBoost: 0.1,
  overstaffDrag: 0.1,
};

const BUILDINGS = { farm: FARM };

function stateWith(workers, type = 'farm') {
  return {
    resources: { food: 0 },
    buildings: [{ type, workers: Array.from({ length: workers }, (_, i) => `v${i}`) }],
  };
}

describe('tick', () => {
  it('produces nothing with zero workers', () => {
    const s = stateWith(0);
    tick(s, BUILDINGS);
    expect(s.resources.food).toBe(0);
  });

  it('one worker produces baseRate', () => {
    const s = stateWith(1);
    tick(s, BUILDINGS);
    expect(s.resources.food).toBeCloseTo(1.0, 10);
  });

  it('two workers get the teamwork bump (2.2)', () => {
    const s = stateWith(2);
    tick(s, BUILDINGS);
    expect(s.resources.food).toBeCloseTo(2.2, 10);
  });

  it('sweetSpot crew hits peak efficiency (5.2)', () => {
    const s = stateWith(4);
    tick(s, BUILDINGS);
    expect(s.resources.food).toBeCloseTo(5.2, 10);
  });

  it('overstaffing drags output down (5 workers → 4.68)', () => {
    const s = stateWith(5);
    tick(s, BUILDINGS);
    expect(s.resources.food).toBeCloseTo(4.68, 10);
  });

  it('is deterministic: same input, same output', () => {
    const a = stateWith(3);
    const b = stateWith(3);
    tick(a, BUILDINGS);
    tick(b, BUILDINGS);
    expect(a.resources.food).toBe(b.resources.food);
  });

  it('accumulates across multiple producers', () => {
    const s = {
      resources: { food: 0 },
      buildings: [
        { type: 'farm', workers: ['v1'] },
        { type: 'farm', workers: ['v2', 'v3'] },
      ],
    };
    tick(s, BUILDINGS);
    expect(s.resources.food).toBeCloseTo(1.0 + 2.2, 10);
  });

  it('skips buildings with no def', () => {
    const s = {
      resources: { food: 0 },
      buildings: [{ type: 'nope', workers: ['v1'] }],
    };
    expect(() => tick(s, BUILDINGS)).not.toThrow();
    expect(s.resources.food).toBe(0);
  });
});
