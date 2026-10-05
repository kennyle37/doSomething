import { describe, it, expect } from 'vitest';
import {
  createVillager,
  createInitialVillagers,
  VILLAGER_SPRITES,
} from './villagers.js';

describe('villagers', () => {
  it('creates a villager with required fields', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 3, 4);
    expect(v.id).toBe(1);
    expect(v.name).toBe('Test');
    expect(v.spriteKey).toBe('villager_female_elf');
    expect(v.tileX).toBe(3);
    expect(v.tileY).toBe(4);
    expect(v.state).toBe('idle');
  });

  it('initial set has 3 villagers', () => {
    expect(createInitialVillagers()).toHaveLength(3);
  });

  it('spawn tiles are within grid bounds', () => {
    for (const v of createInitialVillagers()) {
      expect(v.tileX).toBeGreaterThanOrEqual(0);
      expect(v.tileX).toBeLessThan(8);
      expect(v.tileY).toBeGreaterThanOrEqual(0);
      expect(v.tileY).toBeLessThan(8);
    }
  });

  it('spriteKeys match the locked set', () => {
    for (const v of createInitialVillagers()) {
      expect(VILLAGER_SPRITES).toContain(v.spriteKey);
    }
  });

  it('two villagers share a tile (cluster test), one solo', () => {
    const tiles = createInitialVillagers().map((v) => `${v.tileX},${v.tileY}`);
    expect(new Set(tiles).size).toBe(2);
  });
});
