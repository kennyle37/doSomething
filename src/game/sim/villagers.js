/**
 * Villager data model. Pure data, no rendering.
 * A villager is: { id, name, spriteKey, tileX, tileY, state }.
 * Multiple villagers may share a tile (stacking allowed); the renderer
 * offsets them so they read as a cluster, not a blob.
 * Pattern: Data-Driven/Type Object — villager defs are config.
 */

export const VILLAGER_SPRITES = [
  'villager_female_elf',
  'villager_male_elf_gray',
  'villager_male_horns',
];

export function createVillager(id, name, spriteKey, tileX, tileY) {
  return { id, name, spriteKey, tileX, tileY, state: 'idle' };
}

/**
 * The first three villagers. Spawn at random distinct tiles.
 * Accepts an rng for testability; defaults to Math.random.
 */
export function createInitialVillagers(rng = Math.random) {
  const tiles = new Set();
  while (tiles.size < 3) {
    const x = Math.floor(rng() * 8);
    const y = Math.floor(rng() * 8);
    tiles.add(`${x},${y}`);
  }
  const coords = [...tiles].map((s) => s.split(',').map(Number));
  return [
    createVillager(1, 'Villager 1', 'villager_female_elf', coords[0][0], coords[0][1]),
    createVillager(2, 'Villager 2', 'villager_male_elf_gray', coords[1][0], coords[1][1]),
    createVillager(3, 'Villager 3', 'villager_male_horns', coords[2][0], coords[2][1]),
  ];
}
