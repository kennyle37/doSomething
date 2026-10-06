/**
 * Grid pathfinding. Pure functions, no rendering.
 *
 * The blockedTiles set is the single source of truth for "can't walk here".
 * Bushes fill it now; houses, flowers, buildings, decorations fill it later.
 * Anything that pathfinds just reads the set, so new blockers work with
 * zero changes to this code.
 */

/**
 * BFS from (fromX, fromY) to (toX, toY). Returns an array of {x, y} steps
 * (excluding the start, including the target), or null if unreachable.
 * Deterministic: neighbors are checked in a fixed order (right, left, down,
 * up), so ties resolve the same way every time.
 */
export function findPath(fromX, fromY, toX, toY, width, height, blockedTiles) {
  if (fromX === toX && fromY === toY) return [];
  const key = (x, y) => `${x},${y}`;
  if (blockedTiles.has(key(toX, toY))) return null;

  const visited = new Set([key(fromX, fromY)]);
  const queue = [{ x: fromX, y: fromY, path: [] }];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length > 0) {
    const { x, y, path } = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const k = key(nx, ny);
      if (blockedTiles.has(k) || visited.has(k)) continue;
      const newPath = [...path, { x: nx, y: ny }];
      if (nx === toX && ny === toY) return newPath;
      visited.add(k);
      queue.push({ x: nx, y: ny, path: newPath });
    }
  }
  return null;
}

/**
 * Returns a Set of "x,y" keys for every tile reachable from (fromX, fromY).
 * Useful for picking wander targets that a villager can actually get to.
 */
export function findReachable(fromX, fromY, width, height, blockedTiles) {
  const key = (x, y) => `${x},${y}`;
  const reached = new Set([key(fromX, fromY)]);
  const queue = [{ x: fromX, y: fromY }];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const k = key(nx, ny);
      if (blockedTiles.has(k) || reached.has(k)) continue;
      reached.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return reached;
}
