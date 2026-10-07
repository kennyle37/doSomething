import { describe, it, expect } from 'vitest';
import {
  createStats,
  drainHunger,
  expForLevel,
  gainExp,
  titleForLevel,
  outputMultiplier,
  MAX_LEVEL,
} from './villagerStats.js';
import { reserveMeal, releaseMeal, createMeal } from './meals.js';

describe('createStats', () => {
  it('creates a full stats block with randomized metabolism', () => {
    const s = createStats(() => 0.5);
    expect(s.metabolism).toBe(1.0); // 0.8 + 0.5*0.4
    expect(s.hunger).toBe(100);
    expect(s.exp).toBe(0);
    expect(s.level).toBe(1);
    expect(s.traits).toEqual([]);
  });

  it('clamps metabolism to 0.8-1.2', () => {
    expect(createStats(() => 0).metabolism).toBe(0.8);
    expect(createStats(() => 1).metabolism).toBeCloseTo(1.2);
  });
});

describe('drainHunger', () => {
  it('drains by baseDrain * metabolism', () => {
    const s = { ...createStats(() => 0.5), hunger: 100 }; // metabolism 1.0
    expect(drainHunger(s, 0.5).hunger).toBe(99.5);
  });

  it('scales with metabolism', () => {
    const fast = { ...createStats(() => 1), hunger: 100 }; // 1.2
    const slow = { ...createStats(() => 0), hunger: 100 }; // 0.8
    expect(drainHunger(fast, 1).hunger).toBeCloseTo(98.8);
    expect(drainHunger(slow, 1).hunger).toBeCloseTo(99.2);
  });

  it('clamps at 0', () => {
    const s = { ...createStats(() => 1), hunger: 1 };
    expect(drainHunger(s, 10).hunger).toBe(0);
  });
});

describe('expForLevel', () => {
  it('matches the spec curve', () => {
    expect(expForLevel(1)).toBe(1); // ceil(0.8 * 1.06)
    expect(expForLevel(10)).toBe(2); // ceil(0.8 * 1.06^10)
    expect(expForLevel(20)).toBe(3);
    expect(expForLevel(29)).toBe(5);
  });

  it('is monotonically increasing', () => {
    let prev = 0;
    for (let n = 1; n <= 29; n++) {
      const cur = expForLevel(n);
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
  });
});

describe('gainExp', () => {
  it('adds exp without leveling', () => {
    const s = createStats(() => 0);
    const { stats, leveledUp } = gainExp(s, 0);
    expect(stats.exp).toBe(0);
    expect(leveledUp).toBe(false);
  });

  it('levels up with carryover', () => {
    const s = createStats(() => 0);
    // Level 1->2 needs 1 EXP; give 3.
    const { stats, leveledUp, newLevel } = gainExp(s, 3);
    expect(leveledUp).toBe(true);
    expect(newLevel).toBeGreaterThan(1);
    expect(stats.level).toBe(newLevel);
  });

  it('chains multiple level-ups', () => {
    const s = createStats(() => 0);
    const { stats, newLevel } = gainExp(s, 1000);
    expect(newLevel).toBe(MAX_LEVEL);
    expect(stats.level).toBe(MAX_LEVEL);
  });

  it('caps at MAX_LEVEL', () => {
    const s = { ...createStats(() => 0), level: MAX_LEVEL, exp: 0 };
    const { stats, leveledUp, newLevel } = gainExp(s, 999);
    expect(newLevel).toBe(MAX_LEVEL);
    expect(leveledUp).toBe(false);
    expect(stats.level).toBe(MAX_LEVEL);
  });
});

describe('titleForLevel', () => {
  it('returns Villager for 1-9', () => {
    expect(titleForLevel(1)).toBe('Villager');
    expect(titleForLevel(9)).toBe('Villager');
  });
  it('returns Adventurer for 10-19', () => {
    expect(titleForLevel(10)).toBe('Adventurer');
    expect(titleForLevel(19)).toBe('Adventurer');
  });
  it('returns Hero for 20-30', () => {
    expect(titleForLevel(20)).toBe('Hero');
    expect(titleForLevel(30)).toBe('Hero');
  });
});

describe('outputMultiplier', () => {
  it('is 1.0 at level 1', () => {
    expect(outputMultiplier(1)).toBe(1.0);
  });
  it('adds 2% per level', () => {
    expect(outputMultiplier(2)).toBeCloseTo(1.02);
    expect(outputMultiplier(30)).toBeCloseTo(1.58);
  });
});

describe('meal reservation', () => {
  it('reserveMeal claims a fresh unreserved meal', () => {
    const meal = createMeal('berry-meal', 1, 1, 0, 0);
    const reserved = reserveMeal(meal, 7);
    expect(reserved.reservedBy).toBe(7);
  });

  it('reserveMeal refuses rotten meals', () => {
    const meal = { ...createMeal('berry-meal', 1, 1, 0, 0), rotten: true };
    expect(reserveMeal(meal, 7)).toBeNull();
  });

  it('reserveMeal refuses already-reserved meals', () => {
    const meal = { ...createMeal('berry-meal', 1, 1, 0, 0), reservedBy: 3 };
    expect(reserveMeal(meal, 7)).toBeNull();
  });

  it('releaseMeal clears the reservation', () => {
    const meal = { ...createMeal('berry-meal', 1, 1, 0, 0), reservedBy: 3 };
    expect(releaseMeal(meal).reservedBy).toBeNull();
  });
});

