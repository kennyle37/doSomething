import { describe, it, expect } from 'vitest';
import { forageTick } from './foraging.js';
import { createVillager } from './villagers.js';
import { assignVillager } from './assignment.js';

const TICK = 10000;

function assignedVillager(id, assignedAt) {
  const v = assignVillager(createVillager(id, 'V' + id, 'villager_female_elf', 2, 2), 1);
  return { ...v, assignedAt };
}

describe('foraging', () => {
  it('produces nothing with no assigned villagers', () => {
    const villagers = [
      createVillager(1, 'A', 'villager_female_elf', 2, 2),
      createVillager(2, 'B', 'villager_male_elf_gray', 3, 3),
    ];
    expect(forageTick(villagers, 20000, TICK)).toEqual([]);
  });

  it('produces after a full interval of work', () => {
    const v1 = assignedVillager(1, 0);
    expect(forageTick([v1], 10000, TICK)).toEqual([v1]);
  });

  it('does not produce if assigned just before the tick', () => {
    const v1 = assignedVillager(1, 9000);
    expect(forageTick([v1], 10000, TICK)).toEqual([]);
    expect(forageTick([v1], 19000, TICK)).toEqual([v1]);
  });

  it('idle villagers do not produce', () => {
    const v1 = assignedVillager(1, 0);
    const v2 = createVillager(2, 'B', 'villager_male_elf_gray', 3, 3);
    expect(forageTick([v1, v2], 20000, TICK)).toEqual([v1]);
  });
});
