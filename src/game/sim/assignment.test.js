import { describe, it, expect } from 'vitest';
import { assignVillager, unassignVillager } from './assignment.js';
import { createVillager } from './villagers.js';

describe('assignment', () => {
  it('assign sets state and bushId', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    const assigned = assignVillager(v, 3);
    expect(assigned.state).toBe('assigned');
    expect(assigned.assignedTo).toBe(3);
    expect(assigned.id).toBe(1);
  });

  it('assign is idempotent', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    const a1 = assignVillager(v, 3);
    const a2 = assignVillager(a1, 3);
    expect(a2).toBe(a1);
  });

  it('reassign updates bushId', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    const a1 = assignVillager(v, 3);
    const a2 = assignVillager(a1, 5);
    expect(a2.assignedTo).toBe(5);
    expect(a2.state).toBe('assigned');
  });

  it('unassign clears state and bushId', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    const assigned = assignVillager(v, 3);
    const unassigned = unassignVillager(assigned);
    expect(unassigned.state).toBe('idle');
    expect(unassigned.assignedTo).toBeNull();
  });

  it('unassign is a no-op when already idle', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    expect(unassignVillager(v)).toBe(v);
  });
});
