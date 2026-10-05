/**
 * Foraging production. Pure function.
 * Each assigned villager produces 1 berry per tick.
 * (Will use the spec-00 labor formula when bush configs get complex.)
 */

/**
 * Returns the number of berries produced this tick.
 */
export function forageTick(villagers) {
  return villagers.filter((v) => v.state === 'assigned').length;
}
