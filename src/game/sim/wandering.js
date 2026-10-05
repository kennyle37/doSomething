/**
 * Wandering target picker. Pure function, no rendering.
 * Picks a random free tile anywhere on the grid, excluding the current
 * tile and blocked tiles. Returns null if nothing is free.
 */
export function pickWanderTarget(
  tileX,
  tileY,
  w,
  h,
  blocked = new Set(),
  rng = Math.random
) {
  const candidates = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      if (x === tileX && y === tileY) continue;
      if (blocked.has(`${x},${y}`)) continue;
      candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}
