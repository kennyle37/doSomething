/**
 * Villager movement. Pure functions, no rendering.
 * Drops are forgiving: out-of-bounds or blocked targets snap to the
 * nearest available tile instead of bouncing back.
 */

const key = (x, y) => `${x},${y}`;

function inBounds(x, y, w, h) {
  return x >= 0 && x < w && y >= 0 && y < h;
}

function isFree(x, y, w, h, blocked) {
  return inBounds(x, y, w, h) && !blocked.has(key(x, y));
}

/**
 * Find the nearest available tile to (x, y). Spiral outward by Chebyshev
 * distance; first free tile wins. Deterministic tiebreak: topmost row,
 * leftmost within row. Returns null if nothing is free.
 */
export function findDropTile(x, y, w, h, blocked = new Set()) {
  const cx = Math.max(0, Math.min(w - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(h - 1, Math.round(y)));

  if (isFree(cx, cy, w, h, blocked)) return { x: cx, y: cy };

  const maxDist = Math.max(w, h);
  for (let d = 1; d <= maxDist; d++) {
    for (let ty = cy - d; ty <= cy + d; ty++) {
      for (let tx = cx - d; tx <= cx + d; tx++) {
        if (Math.max(Math.abs(tx - cx), Math.abs(ty - cy)) !== d) continue;
        if (isFree(tx, ty, w, h, blocked)) return { x: tx, y: ty };
      }
    }
  }
  return null;
}

/**
 * Move a villager toward (tileX, tileY), snapping to the nearest available
 * tile. Returns a new villager object; no-op (same object) if already there
 * or nowhere free.
 */
export function moveVillager(
  villager,
  tileX,
  tileY,
  w = 8,
  h = 8,
  blocked = new Set()
) {
  const target = findDropTile(tileX, tileY, w, h, blocked);
  if (!target) return villager;
  if (target.x === villager.tileX && target.y === villager.tileY) {
    return villager;
  }
  return { ...villager, tileX: target.x, tileY: target.y };
}
