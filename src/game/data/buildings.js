/**
 * Building definitions. Data-driven: adding a building = one entry here,
 * no code changes. Balancing = editing numbers, not code.
 *
 * Each entry:
 * {
 *   produces: { resource: 'food', baseRate: 1 }, // per tick (10s)
 *   sweetSpot: 4,        // ideal crew size; teamwork boost applies up to here
 *   teamBoost: 0.10,     // +10% to whole output per extra worker within sweetSpot
 *   overstaffDrag: 0.10, // each worker past sweetSpot multiplies output by 0.9
 *   cost: { lumber: 10 },
 *   sprite: 'farm',      // sprite key only — never a file path in logic
 *   size: 1,
 * }
 *
 * No entries yet. "Add farm" lands here.
 */
export const BUILDINGS = {};
