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

  // Save system.
  save: {
    autoSaveMs: 10000, // auto-save every 10 seconds
    maxOfflineMs: 8 * 3600 * 1000, // 8 hour offline cap
  },

  // Cooking (Phase 2).
  cooking: {
    campfire: { tileX: 2, tileY: 4, workOffsetScale: 1.5 }, // C5, cooks stand further out
    eatTickMs: 60000, // villagers seek food every 60s
    mealExpiryMs: 10 * 60 * 1000, // meals rot after 10 min
    rottenDespawnMs: 2 * 60 * 1000, // rotten meals despawn after 2 min
    berryCap: 100,
    mealCap: 50,
    recipes: [
      {
        id: 'berry-meal',
        name: 'Berry Meal',
        berriesCost: 2,
        cooksRequired: 1,
        cookTicks: 2, // 20s at 10s tick
        exp: 1,
      },
      {
        id: 'hearty-stew',
        name: 'Hearty Stew',
        berriesCost: 4,
        cooksRequired: 2,
        cookTicks: 3, // 30s at 10s tick
        exp: 2,
      },
    ],
  },
};
