/**
 * Villager data model. Pure data, no rendering.
 * A villager is: { id, name, spriteKey, tileX, tileY, state, stats }.
 * Multiple villagers may share a tile (stacking allowed); the renderer
 * offsets them so they read as a cluster, not a blob.
 * Pattern: Data-Driven/Type Object — villager defs are config.
 */

import { createStats } from './villagerStats.js';

export const VILLAGER_SPRITES = [
  'villager_female_elf',
  'villager_male_elf_gray',
  'villager_male_horns',
];

export function createVillager(id, name, spriteKey, tileX, tileY, rng = Math.random) {
  return { id, name, spriteKey, tileX, tileY, state: 'idle', stats: createStats(rng) };
}

/**
 * The first three villagers. Spawn at random distinct tiles,
 * avoiding blocked tiles (campfire, bushes, buildings).
 * Accepts an rng for testability; defaults to Math.random.
 */
export function createInitialVillagers(rng = Math.random, blockedTiles = new Set()) {
  const tiles = new Set();
  let guard = 0;
  while (tiles.size < 3 && guard < 200) {
    guard++;
    const x = Math.floor(rng() * 8);
    const y = Math.floor(rng() * 8);
    if (blockedTiles.has(`${x},${y}`)) continue;
    tiles.add(`${x},${y}`);
  }
  const coords = [...tiles].map((s) => s.split(',').map(Number));
  const defs = [
    [1, 'Villager 1', 'villager_female_elf'],
    [2, 'Villager 2', 'villager_male_elf_gray'],
    [3, 'Villager 3', 'villager_male_horns'],
  ];
  return defs.map(([id, name, spriteKey], i) => {
    const [x = 0, y = 0] = coords[i] || [];
    return createVillager(id, name, spriteKey, x, y, rng);
  });
}

