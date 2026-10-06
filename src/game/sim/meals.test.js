import { describe, it, expect } from 'vitest';
import { createMeal, updateMeals, assignMeals, expForMeal } from './meals.js';

const recipes = {
  'berry-meal': { exp: 1 },
  'hearty-stew': { exp: 2 },
};

describe('updateMeals', () => {
  it('rots meals after expiry', () => {
    const meals = [createMeal('berry-meal', 2, 3, 0, 0, 0)];
    const { meals: updated } = updateMeals(meals, 11 * 60 * 1000, 10 * 60 * 1000, 2 * 60 * 1000);
    expect(updated[0].rotten).toBe(true);
  });

  it('does not rot before expiry', () => {
    const meals = [createMeal('berry-meal', 2, 3, 0, 0, 0)];
    const { meals: updated } = updateMeals(meals, 5 * 60 * 1000, 10 * 60 * 1000, 2 * 60 * 1000);
    expect(updated[0].rotten).toBe(false);
  });

  it('despawns rotten meals after despawn time', () => {
    const m = { ...createMeal('berry-meal', 2, 3, 0, 0, 0), rotten: true, rottenAt: 0 };
    const { meals: updated, despawned } = updateMeals([m], 3 * 60 * 1000, 10 * 60 * 1000, 2 * 60 * 1000);
    expect(despawned).toEqual([m.id]);
    expect(updated).toHaveLength(0);
  });
});

describe('assignMeals', () => {
  it('assigns nearest meal to each villager', () => {
    const villagers = [
      { id: 1, tileX: 0, tileY: 0 },
      { id: 2, tileX: 7, tileY: 7 },
    ];
    const meals = [
      createMeal('berry-meal', 1, 0, 0, 0),
      createMeal('berry-meal', 6, 7, 0, 0),
    ];
    const map = assignMeals(villagers, meals);
    expect(map.get(1)).toBe(meals[0].id);
    expect(map.get(2)).toBe(meals[1].id);
  });

  it('skips rotten meals', () => {
    const villagers = [{ id: 1, tileX: 0, tileY: 0 }];
    const meals = [{ ...createMeal('berry-meal', 1, 0, 0, 0), rotten: true }];
    const map = assignMeals(villagers, meals);
    expect(map.size).toBe(0);
  });

  it('one meal per villager', () => {
    const villagers = [
      { id: 1, tileX: 0, tileY: 0 },
      { id: 2, tileX: 0, tileY: 1 },
    ];
    const meals = [createMeal('berry-meal', 0, 0, 0, 0)];
    const map = assignMeals(villagers, meals);
    expect(map.size).toBe(1);
  });
});

describe('expForMeal', () => {
  it('returns recipe EXP', () => {
    expect(expForMeal('berry-meal', recipes)).toBe(1);
    expect(expForMeal('hearty-stew', recipes)).toBe(2);
  });

  it('adds breakfast bonus', () => {
    expect(expForMeal('berry-meal', recipes, true)).toBe(2);
  });
});
