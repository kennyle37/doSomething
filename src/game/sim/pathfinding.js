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
 * By default deterministic: neighbors are checked in a fixed order (right,
 * left, down, up), so ties resolve the same way every time. Pass
 * randomize=true for varied paths (villagers don't all take the same route).
 */
export function findPath(fromX, fromY, toX, toY, width, height, blockedTiles, randomize = false) {
  if (fromX === toX && fromY === toY) return [];
  const key = (x, y) => `${x},${y}`;
  if (blockedTiles.has(key(toX, toY))) return null;

  const visited = new Set([key(fromX, fromY)]);
  // queue of {x, y, path}
  const queue = [{ x: fromX, y: fromY, path: [] }];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  // Shuffle for varied paths (Fisher-Yates).
  if (randomize) {
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
  }

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
  return null; // unreachable
}

/**
 * Returns a Set of "x,y" keys for every tile reachable from (fromX, fromY).
 * Useful for picking wander targets that a villager can actually get to.
 */
export function findReachable(fromX, fromY, width, height, blockedTiles) {
  const key = (x, y) => `${x},${y}`;
  const reached = new Set([key(fromX, fromY)]);
  const queue = [{ x: fromX, y: fromY }];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

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
