/**
 * Cooking sim: pure functions for recipes, queue, and cooking progress.
 * Recipes are data (Type Object pattern), not classes.
 */

/**
 * Check if a recipe can start: enough cooks assigned and enough berries.
 * @param {Object} recipe - recipe def from CONFIG.cooking.recipes
 * @param {number} cookCount - number of villagers assigned to campfire
 * @param {number} berries - available berries
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canStartRecipe(recipe, cookCount, berries) {
  if (cookCount < recipe.cooksRequired) {
    return { ok: false, reason: `Need ${recipe.cooksRequired} cooks` };
  }
  if (berries < recipe.berriesCost) {
    return { ok: false, reason: `Need ${recipe.berriesCost} berries` };
  }
  return { ok: true };
}

/**
 * Create a cooking job. Consumes berries immediately.
 * @returns {{ job: Object, berriesLeft: number }}
 */
export function startCooking(recipe, berries) {
  return {
    job: {
      recipeId: recipe.id,
      progressSec: 0,
      totalSec: recipe.cookTimeSec,
      startedAt: Date.now(),
    },
    berriesLeft: berries - recipe.berriesCost,
  };
}

/**
 * Advance cooking by delta seconds. Returns completion status.
 * Pauses (no progress) if not enough cooks, does NOT cancel.
 * @param {Object} job - active cooking job
 * @param {number} deltaSec - seconds to advance
 * @param {number} cookCount - current cooks assigned
 * @param {number} cooksRequired - cooks needed for this recipe
 * @param {number} totalSec - total seconds needed
 * @returns {{ done: boolean, job: Object, paused: boolean }}
 */
export function cookingProgress(job, deltaSec, cookCount, cooksRequired, totalSec) {
  // Paused if not enough cooks (resume when restaffed).
  if (cookCount < cooksRequired) {
    return { done: false, job, paused: true };
  }
  const progressSec = job.progressSec + deltaSec;
  if (progressSec >= totalSec) {
    return { done: true, job: { ...job, progressSec: totalSec }, paused: false };
  }
  return { done: false, job: { ...job, progressSec }, paused: false };
}

/**
 * Advance cooking by one tick. Returns completed recipe or null.
 * @param {Object} job - active cooking job
 * @param {number} cookCount - current cooks assigned
 * @param {number} cooksRequired - cooks needed for this recipe
 * @returns {{ done: boolean, job: Object }} - job with decremented ticksLeft
 * @deprecated Use cookingProgress for real-time cooking.
 */
export function cookingTick(job, cookCount, cooksRequired) {
  // Paused if not enough cooks.
  if (cookCount < cooksRequired) {
    return { done: false, job };
  }
  const ticksLeft = job.ticksLeft - 1;
  if (ticksLeft <= 0) {
    return { done: true, job: { ...job, ticksLeft: 0 } };
  }
  return { done: false, job: { ...job, ticksLeft } };
}

/**
 * Queue operations (pure, return new arrays).
 */
export function queueAdd(queue, recipeId) {
  return [...queue, recipeId];
}

export function queueRemove(queue, index) {
  return queue.filter((_, i) => i !== index);
}

export function queueNext(queue) {
  if (queue.length === 0) return { recipeId: null, rest: [] };
  return { recipeId: queue[0], rest: queue.slice(1) };
}
