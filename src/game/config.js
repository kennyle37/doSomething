/**
 * Game tuning config. All balance numbers live here, not scattered in code.
 * Tweak these to tune the economy without touching logic.
 */
export const CONFIG = {
  // Production tick: how often the game checks for completed work.
  tickMs: 10000,

  // Foraging: berries per worker per tick interval of work.
  berriesPerWorker: 1,

  // Bushes: fixed positions (chess notation) and sprites.
  bushes: [
    { id: 1, tileX: 5, tileY: 1, spriteKey: 'bush_flowers_red_01' }, // F2
    { id: 2, tileX: 6, tileY: 1, spriteKey: 'bush_flowers_white_01' }, // G2
    { id: 3, tileX: 5, tileY: 2, spriteKey: 'bush_flowers_yellow_01' }, // F3
    { id: 4, tileX: 6, tileY: 2, spriteKey: 'bush_flowers_blue_01' }, // G3
  ],

  // Worker positioning around bushes (px offsets from bush center).
  workSides: [
    { offset: { x: -22, y: 2 }, dir: 'right' },
    { offset: { x: 22, y: 2 }, dir: 'left' },
    { offset: { x: 0, y: -14 }, dir: 'down' },
  ],

  // Wandering: ms per tile walked, base cooldown, per-tile cooldown.
  wander: {
    msPerTile: 1000,
    baseCooldownMs: 5000,
    perTileCooldownMs: 3000,
    initialDelayMinMs: 2000,
    initialDelayMaxMs: 8000,
  },
};
