import { describe, it, expect } from 'vitest';
import { findDropTile, moveVillager } from './movement.js';
import { createVillager } from './villagers.js';

describe('findDropTile', () => {
  it('returns the target when in bounds and free', () => {
    expect(findDropTile(3, 4, 8, 8)).toEqual({ x: 3, y: 4 });
  });

  it('snaps out-of-bounds to the nearest edge tile', () => {
    expect(findDropTile(10, 10, 8, 8)).toEqual({ x: 7, y: 7 });
    expect(findDropTile(-5, 3, 8, 8)).toEqual({ x: 0, y: 3 });
  });

  it('skips blocked tiles for the nearest free neighbor', () => {
    const blocked = new Set(['3,4']);
    const found = findDropTile(3, 4, 8, 8, blocked);
    expect(found).not.toEqual({ x: 3, y: 4 });
    expect(blocked.has(`${found.x},${found.y}`)).toBe(false);
    // Chebyshev distance 1 from (3,4)
    expect(Math.max(Math.abs(found.x - 3), Math.abs(found.y - 4))).toBe(1);
  });

  it('returns null when every tile is blocked', () => {
    const blocked = new Set();
    for (let x = 0; x < 2; x++)
      for (let y = 0; y < 2; y++) blocked.add(`${x},${y}`);
    expect(findDropTile(0, 0, 2, 2, blocked)).toBeNull();
  });
});

describe('moveVillager', () => {
  it('moves within bounds', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    const moved = moveVillager(v, 5, 6);
    expect(moved.tileX).toBe(5);
    expect(moved.tileY).toBe(6);
    expect(moved.id).toBe(1); // same villager
  });

  it('snaps out-of-bounds drops to the nearest tile', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    const moved = moveVillager(v, 20, 20);
    expect(moved.tileX).toBe(7);
    expect(moved.tileY).toBe(7);
  });

  it('is a no-op when already on the target tile', () => {
    const v = createVillager(1, 'Test', 'villager_female_elf', 2, 2);
    expect(moveVillager(v, 2, 2)).toBe(v);
  });

  it('stays put when nowhere is free', () => {
    const blocked = new Set();
    for (let x = 0; x < 2; x++)
      for (let y = 0; y < 2; y++) blocked.add(`${x},${y}`);
    const v = createVillager(1, 'Test', 'villager_female_elf', 0, 0);
    expect(moveVillager(v, 1, 1, 2, 2, blocked)).toBe(v);
  });
});
