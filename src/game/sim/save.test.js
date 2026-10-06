import { describe, it, expect } from 'vitest';
import {
  SAVE_VERSION,
  createSave,
  serialize,
  deserialize,
  calculateOfflineBerries,
  applySave,
} from './save.js';

const makeVillagers = () => [
  {
    id: 1, name: 'A', spriteKey: 's1', tileX: 2, tileY: 3,
    state: 'working', assignedTo: 1,
    workOffset: { x: -22, y: 2 }, workDir: 'right',
    assignedAt: 1000,
  },
  {
    id: 2, name: 'B', spriteKey: 's2', tileX: 4, tileY: 5,
    state: 'idle', assignedTo: null,
    workOffset: null, workDir: null,
    assignedAt: null,
  },
];

describe('createSave', () => {
  it('captures version, timestamp, berries, and villagers', () => {
    const save = createSave(makeVillagers(), 42, 9999);
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.savedAt).toBe(9999);
    expect(save.berries).toBe(42);
    expect(save.villagers).toHaveLength(2);
    expect(save.villagers[0].assignedTo).toBe(1);
    expect(save.villagers[1].assignedTo).toBeNull();
  });
});

describe('serialize/deserialize round-trip', () => {
  it('restores the exact save', () => {
    const save = createSave(makeVillagers(), 42, 9999);
    const str = serialize(save);
    expect(typeof str).toBe('string');
    const restored = deserialize(str);
    expect(restored).toEqual(save);
  });

  it('returns null for garbage input', () => {
    expect(deserialize('not-valid-base64!!!')).toBeNull();
    expect(deserialize('')).toBeNull();
  });

  it('returns null for wrong version', () => {
    const save = createSave(makeVillagers(), 0);
    save.version = 999;
    expect(deserialize(serialize(save))).toBeNull();
  });

  it('returns null for missing fields', () => {
    const bad = btoa(JSON.stringify({ version: 1 }));
    expect(deserialize(bad)).toBeNull();
  });
});

describe('calculateOfflineBerries', () => {
  const tickMs = 10000;

  it('awards 1 berry per assigned worker per interval', () => {
    const save = createSave(makeVillagers(), 0, 0);
    // 1 hour = 360 intervals. Only villager 1 is assigned.
    const berries = calculateOfflineBerries(save, 3600 * 1000, tickMs);
    expect(berries).toBe(360);
  });

  it('awards nothing if no villagers assigned', () => {
    const villagers = makeVillagers().map((v) => ({ ...v, assignedTo: null }));
    const save = createSave(villagers, 0, 0);
    expect(calculateOfflineBerries(save, 3600 * 1000, tickMs)).toBe(0);
  });

  it('caps offline time at maxOfflineMs', () => {
    const save = createSave(makeVillagers(), 0, 0);
    // 24 hours away, but cap at 8 hours = 2880 intervals for 1 worker.
    const berries = calculateOfflineBerries(save, 24 * 3600 * 1000, tickMs);
    expect(berries).toBe(2880);
  });

  it('returns 0 for zero or negative elapsed', () => {
    const save = createSave(makeVillagers(), 0, 1000);
    expect(calculateOfflineBerries(save, 1000, tickMs)).toBe(0);
    expect(calculateOfflineBerries(save, 500, tickMs)).toBe(0);
  });

  it('returns 0 if less than one interval elapsed', () => {
    const save = createSave(makeVillagers(), 0, 0);
    expect(calculateOfflineBerries(save, 5000, tickMs)).toBe(0);
  });
});

describe('applySave', () => {
  it('restores villager positions and assignments by id', () => {
    const villagers = makeVillagers();
    // Mess them up
    villagers[0].tileX = 0;
    villagers[0].assignedTo = null;

    const save = createSave(makeVillagers(), 0);
    applySave(villagers, save);

    expect(villagers[0].tileX).toBe(2);
    expect(villagers[0].assignedTo).toBe(1);
  });

  it('ignores save entries with no matching villager', () => {
    const villagers = makeVillagers();
    const save = createSave([...makeVillagers(), { id: 99, tileX: 7, tileY: 7 }], 0);
    expect(() => applySave(villagers, save)).not.toThrow();
  });
});
