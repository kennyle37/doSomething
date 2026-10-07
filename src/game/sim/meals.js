/**
 * Meals sim: meal objects on the ground, expiration, dispatcher, EXP.
 */

let mealIdCounter = 1;

/**
 * Create a meal object dropped on the ground.
 */
export function createMeal(recipeId, tileX, tileY, offsetX, offsetY, now = Date.now()) {
  return {
    id: mealIdCounter++,
    recipeId,
    tileX,
    tileY,
    offsetX,
    offsetY,
    droppedAt: now,
    rotten: false,
    rottenAt: null,
    reservedBy: null, // villager id currently walking to eat this, or null
  };
}

/**
 * Reserve a meal for a villager. Returns the reserved meal, or null if
 * it can't be reserved (rotten or already claimed).
 */
export function reserveMeal(meal, villagerId) {
  if (meal.rotten || meal.reservedBy != null) return null;
  return { ...meal, reservedBy: villagerId };
}

/**
 * Release a meal reservation (villager interrupted, died, or arrived).
 */
export function releaseMeal(meal) {
  return { ...meal, reservedBy: null };
}

/**
 * Update meals: rot expired ones, return despawn IDs.
 * @param {Array} meals - meal objects
 * @param {number} now - timestamp
 * @param {number} expiryMs - ms until rot
 * @param {number} rottenDespawnMs - ms until rotten despawns
 * @returns {{ meals: Array, despawned: Array<number> }}
 */
export function updateMeals(meals, now, expiryMs, rottenDespawnMs) {
  const despawned = [];
  const updated = [];

  for (const m of meals) {
    if (!m.rotten && now - m.droppedAt >= expiryMs) {
      updated.push({ ...m, rotten: true, rottenAt: now });
    } else if (m.rotten && now - m.rottenAt >= rottenDespawnMs) {
      despawned.push(m.id);
    } else {
      updated.push(m);
    }
  }

  return { meals: updated, despawned };
}

/**
 * Assign meals to hungry villagers. Each villager gets nearest available meal.
 * @param {Array} villagers - villager objects (need id, tileX, tileY)
 * @param {Array} meals - meal objects (only non-rotten considered)
 * @returns {Map} villagerId -> mealId
 */
export function assignMeals(villagers, meals) {
  const available = meals.filter((m) => !m.rotten);
  const claimed = new Set();
  const assignments = new Map();

  for (const v of villagers) {
    let best = null;
    let bestDist = Infinity;
    for (const m of available) {
      if (claimed.has(m.id)) continue;
      const d = Math.abs(m.tileX - v.tileX) + Math.abs(m.tileY - v.tileY);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    if (best) {
      claimed.add(best.id);
      assignments.set(v.id, best.id);
    }
  }

  return assignments;
}

/**
 * EXP gain for eating a meal.
 * @param {string} recipeId
 * @param {Object} recipes - map of recipeId -> recipe def
 * @param {boolean} isBreakfast - first meal of the day
 */
export function expForMeal(recipeId, recipes, isBreakfast = false) {
  const recipe = recipes[recipeId];
  if (!recipe) return 0;
  return recipe.exp + (isBreakfast ? 1 : 0);
}

