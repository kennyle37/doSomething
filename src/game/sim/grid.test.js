import { describe, it, expect } from 'vitest';
import { createGrid, tileAt } from './grid.js';

describe('createGrid', () => {
  it('creates 64 tiles for an 8x8 grid', () => {
    const grid = createGrid(8, 8);
    expect(grid.width).toBe(8);
    expect(grid.height).toBe(8);
    expect(grid.tiles).toHaveLength(64);
  });

  it('tiles carry their x, y coordinates', () => {
    const grid = createGrid(8, 8);
    expect(grid.tiles[0]).toMatchObject({ x: 0, y: 0 });
    expect(grid.tiles[9]).toMatchObject({ x: 1, y: 1 });
    expect(grid.tiles[63]).toMatchObject({ x: 7, y: 7 });
  });
});

describe('tileAt', () => {
  it('returns the correct tile in bounds', () => {
    const grid = createGrid(8, 8);
    expect(tileAt(grid, 3, 5)).toMatchObject({ x: 3, y: 5 });
    expect(tileAt(grid, 0, 0)).toMatchObject({ x: 0, y: 0 });
  });

  it('returns null out of bounds', () => {
    const grid = createGrid(8, 8);
    expect(tileAt(grid, -1, 0)).toBeNull();
    expect(tileAt(grid, 0, -1)).toBeNull();
    expect(tileAt(grid, 8, 0)).toBeNull();
    expect(tileAt(grid, 0, 8)).toBeNull();
    expect(tileAt(grid, 99, 99)).toBeNull();
  });
});
