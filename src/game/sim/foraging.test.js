import { describe, it, expect } from 'vitest';
import { forageTick } from './foraging.js';
import { createVillager } from './villagers.js';
import { assignVillager } from './assignment.js';

describe('foraging', () => {
  it('produces 0 with no assigned villagers', () => {
    const villagers = [
      createVillager(1, 'A', 'villager_female_elf', 2, 2),
      createVillager(2, 'B', 'villager_male_elf_gray', 3, 3),
    ];
    expect(forageTick(villagers)).toBe(0);
  });

  it('produces 1 per assigned villager', () => {
    const v1 = assignVillager(createVillager(1, 'A', 'villager_female_elf', 2, 2), 1);
    expect(forageTick([v1])).toBe(1);
  });

  it('multiple villagers on the same bush all produce', () => {
    const v1 = assignVillager(createVillager(1, 'A', 'villager_female_elf', 2, 2), 1);
    const v2 = assignVillager(createVillager(2, 'B', 'villager_male_elf_gray', 2, 3), 1);
    const v3 = assignVillager(createVillager(3, 'C', 'villager_male_horns', 3, 3), 1);
    expect(forageTick([v1, v2, v3])).toBe(3);
  });

  it('idle villagers do not produce', () => {
    const v1 = assignVillager(createVillager(1, 'A', 'villager_female_elf', 2, 2), 1);
    const v2 = createVillager(2, 'B', 'villager_male_elf_gray', 3, 3);
    expect(forageTick([v1, v2])).toBe(1);
  });
});
