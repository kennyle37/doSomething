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
 * The first three villagers. Two share a tile (cluster rendering test),
 * one on its own. Fixed tiles, deterministic.
 */
export function createInitialVillagers() {
  return [
    createVillager(1, 'Villager 1', 'villager_female_elf', 2, 2),
    createVillager(2, 'Villager 2', 'villager_male_elf_gray', 2, 2),
    createVillager(3, 'Villager 3', 'villager_male_horns', 5, 5),
  ];
}
