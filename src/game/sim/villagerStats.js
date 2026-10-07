/**
 * Villager stats sim: hunger, EXP, levels. Pure functions.
 * Each villager owns a stats object:
 *   { metabolism, hunger, exp, level, traits }
 * Pattern: Type Object — thresholds and curve live in CONFIG-adjacent
 * constants here so tests pin them down.
 */

export const MAX_LEVEL = 30;
export const EXP_BASE = 0.8;
export const EXP_GROWTH = 1.06;

/**
 * Create a fresh stats block. Metabolism is randomized so villagers
 * get hungry (and level) at different rates.
 * @param {Function} rng - random source, defaults to Math.random
 */
export function createStats(rng = Math.random) {
  return {
    metabolism: 0.8 + rng() * 0.4, // 0.8 - 1.2
    hunger: 100,
    exp: 0,
    level: 1,
    traits: [],
  };
}

/**
 * Drain hunger by baseDrain * metabolism. Clamped at 0.
 * Returns a new stats object.
 */
export function drainHunger(stats, baseDrain) {
  const hunger = Math.max(0, stats.hunger - baseDrain * stats.metabolism);
  return { ...stats, hunger };
}

/**
 * EXP needed to go from level n to n+1.
 * Exponential curve: early levels fly, late levels feel earned.
 * Tuned so 1->30 takes ~3 weeks at ~3 EXP/day.
 */
export function expForLevel(n) {
  return Math.ceil(EXP_BASE * Math.pow(EXP_GROWTH, n));
}

/**
 * Add EXP, handling level-ups with carryover. Caps at MAX_LEVEL.
 * @returns {{ stats: Object, leveledUp: boolean, newLevel: number }}
 */
export function gainExp(stats, amount) {
  let { exp, level } = stats;
  exp += amount;
  let leveledUp = false;
  while (level < MAX_LEVEL && exp >= expForLevel(level)) {
    exp -= expForLevel(level);
    level += 1;
    leveledUp = true;
  }
  // At cap, bank leftover exp but never exceed one level's worth.
  if (level >= MAX_LEVEL) {
    exp = Math.min(exp, expForLevel(MAX_LEVEL));
  }
  return { stats: { ...stats, exp, level }, leveledUp, newLevel: level };
}

/**
 * Flavor title for a numeric level.
 */
export function titleForLevel(level) {
  if (level >= 20) return 'Hero';
  if (level >= 10) return 'Adventurer';
  return 'Villager';
}

/**
 * Output multiplier: +2% per level, additive. Level 30 = 1.58x.
 */
export function outputMultiplier(level) {
  return 1 + (level - 1) * 0.02;
}

