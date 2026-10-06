import { describe, it, expect } from 'vitest';
import { createBush, createInitialBushes } from './bushes.js';

describe('bushes', () => {
  it('creates a bush with required fields', () => {
    const b = createBush(1, 5, 1, 'bush_flowers_red_01');
    expect(b.id).toBe(1);
    expect(b.tileX).toBe(5);
    expect(b.tileY).toBe(1);
    expect(b.spriteKey).toBe('bush_flowers_red_01');
  });

  it('initial set has 4 bushes', () => {
    expect(createInitialBushes()).toHaveLength(4);
  });

  it('positions match F2, G2, F3, G3', () => {
    const positions = createInitialBushes().map((b) => `${b.tileX},${b.tileY}`);
    expect(positions).toContain('5,1'); // F2
    expect(positions).toContain('6,1'); // G2
    expect(positions).toContain('5,2'); // F3
    expect(positions).toContain('6,2'); // G3
  });

  it('positions are in bounds', () => {
    for (const b of createInitialBushes()) {
      expect(b.tileX).toBeGreaterThanOrEqual(0);
      expect(b.tileX).toBeLessThan(8);
      expect(b.tileY).toBeGreaterThanOrEqual(0);
      expect(b.tileY).toBeLessThan(8);
    }
  });

  it('all bushes have sprite keys', () => {
    for (const b of createInitialBushes()) {
      expect(b.spriteKey).toBeTruthy();
    }
  });
});
