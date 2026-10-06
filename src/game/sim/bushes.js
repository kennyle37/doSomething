import { CONFIG } from '../config.js';

/**
 * Berry bush data model. Pure data, no rendering.
 * A bush is: { id, tileX, tileY, spriteKey }.
 */

export function createBush(id, tileX, tileY, spriteKey) {
  return { id, tileX, tileY, spriteKey };
}

/**
 * Bushes from config. Positions in chess notation in the config comments.
 */
export function createInitialBushes() {
  return CONFIG.bushes.map((b) => createBush(b.id, b.tileX, b.tileY, b.spriteKey));
}
