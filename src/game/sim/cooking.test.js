import { describe, it, expect } from 'vitest';
import {
  canStartRecipe,
  startCooking,
  cookingTick,
  queueAdd,
  queueRemove,
  queueNext,
} from './cooking.js';

const berryMeal = {
  id: 'berry-meal', berriesCost: 2, cooksRequired: 1, cookTicks: 2, exp: 1,
};
const heartyStew = {
  id: 'hearty-stew', berriesCost: 4, cooksRequired: 2, cookTicks: 3, exp: 2,
};

describe('canStartRecipe', () => {
  it('allows when cooks and berries sufficient', () => {
    expect(canStartRecipe(berryMeal, 1, 2)).toEqual({ ok: true });
    expect(canStartRecipe(heartyStew, 2, 4)).toEqual({ ok: true });
  });

  it('rejects when not enough cooks', () => {
    const r = canStartRecipe(heartyStew, 1, 10);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('2 cooks');
  });

  it('rejects when not enough berries', () => {
    const r = canStartRecipe(berryMeal, 1, 1);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('2 berries');
  });
});

describe('startCooking', () => {
  it('consumes berries and creates job', () => {
    const { job, berriesLeft } = startCooking(berryMeal, 10);
    expect(berriesLeft).toBe(8);
    expect(job.recipeId).toBe('berry-meal');
    expect(job.ticksLeft).toBe(2);
  });
});

describe('cookingTick', () => {
  it('decrements and completes', () => {
    const { job } = startCooking(berryMeal, 10);
    let r = cookingTick(job, 1, 1);
    expect(r.done).toBe(false);
    expect(r.job.ticksLeft).toBe(1);
    r = cookingTick(r.job, 1, 1);
    expect(r.done).toBe(true);
  });

  it('pauses when cooks drop below requirement', () => {
    const { job } = startCooking(heartyStew, 10);
    const r = cookingTick(job, 1, 2); // only 1 cook, need 2
    expect(r.done).toBe(false);
    expect(r.job.ticksLeft).toBe(3); // unchanged
  });
});

describe('queue', () => {
  it('adds and removes', () => {
    let q = [];
    q = queueAdd(q, 'berry-meal');
    q = queueAdd(q, 'hearty-stew');
    expect(q).toEqual(['berry-meal', 'hearty-stew']);
    q = queueRemove(q, 0);
    expect(q).toEqual(['hearty-stew']);
  });

  it('queueNext returns head and rest', () => {
    const { recipeId, rest } = queueNext(['a', 'b']);
    expect(recipeId).toBe('a');
    expect(rest).toEqual(['b']);
  });

  it('queueNext on empty returns null', () => {
    const { recipeId } = queueNext([]);
    expect(recipeId).toBeNull();
  });
});
