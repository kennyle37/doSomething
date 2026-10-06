import { describe, it, expect } from 'vitest';
import { findPath, findReachable } from './pathfinding.js';

describe('pathfinding', () => {
  it('returns empty path when already there', () => {
    expect(findPath(2, 2, 2, 2, 8, 8, new Set())).toEqual([]);
  });

  it('finds a straight path with no blockers', () => {
    expect(findPath(0, 0, 2, 0, 8, 8, new Set())).toEqual([
      { x: 1, y: 0 }, { x: 2, y: 0 },
    ]);
  });

  it('routes around a blocked tile', () => {
    const blocked = new Set(['1,0']);
    const path = findPath(0, 0, 2, 0, 8, 8, blocked);
    expect(path).not.toBeNull();
    expect(path[path.length - 1]).toEqual({ x: 2, y: 0 });
    for (const s of path) expect(blocked.has(`${s.x},${s.y}`)).toBe(false);
    expect(path).toHaveLength(4);
  });

  it('routes around the bush block (E2 to H2)', () => {
    const blocked = new Set(['5,1', '6,1', '5,2', '6,2']);
    const path = findPath(4, 1, 7, 1, 8, 8, blocked);
    expect(path).not.toBeNull();
    expect(path[path.length - 1]).toEqual({ x: 7, y: 1 });
    for (const s of path) expect(blocked.has(`${s.x},${s.y}`)).toBe(false);
  });

  it('returns null when target is unreachable', () => {
    const blocked = new Set();
    for (let x = 0; x < 8; x++) blocked.add(`${x},3`);
    expect(findPath(2, 0, 2, 5, 8, 8, blocked)).toBeNull();
  });

  it('returns null when target itself is blocked', () => {
    expect(findPath(0, 0, 2, 0, 8, 8, new Set(['2,0']))).toBeNull();
  });

  it('is deterministic', () => {
    const blocked = new Set(['5,1', '6,1', '5,2', '6,2']);
    expect(findPath(4, 1, 7, 1, 8, 8, blocked))
      .toEqual(findPath(4, 1, 7, 1, 8, 8, blocked));
  });
});

describe('findReachable', () => {
  it('finds all tiles in an open grid', () => {
    expect(findReachable(0, 0, 2, 2, new Set()).size).toBe(4);
  });

  it('excludes blocked tiles and isolated regions', () => {
    const blocked = new Set();
    for (let x = 0; x < 8; x++) blocked.add(`${x},3`);
    const reached = findReachable(2, 0, 8, 8, blocked);
    expect(reached.size).toBe(24);
    expect(reached.has('2,5')).toBe(false);
  });
});
