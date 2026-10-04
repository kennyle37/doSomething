import { BUILDINGS } from '../data/buildings.js';

/**
 * Advance the simulation by one tick (10 game-seconds).
 * Pure function of (state, buildings): same input, same output.
 * Pattern: Update Method — the world updates on a fixed clock,
 * independent of frame rate.
 *
 * Labor model (per producer):
 *   output = baseRate × boosted × (1 + teamBoost × (boosted−1))
 *            × (1 − overstaffDrag)^extra
 * where boosted = min(workers, sweetSpot), extra = max(0, workers − sweetSpot).
 *
 * Callers own the clock: run tick N times for N elapsed ticks (offline
 * progress is just more ticks), then set state.timestamp themselves.
 */
export function tick(state, buildings = BUILDINGS) {
  for (const b of state.buildings) {
    const def = buildings[b.type];
    if (!def) continue;
    const n = b.workers.length;
    if (n === 0) continue;
    const boosted = Math.min(n, def.sweetSpot);
    const extra = Math.max(0, n - def.sweetSpot);
    const crewOutput =
      def.produces.baseRate * boosted * (1 + def.teamBoost * (boosted - 1));
    const output = crewOutput * Math.pow(1 - def.overstaffDrag, extra);
    state.resources[def.produces.resource] =
      (state.resources[def.produces.resource] || 0) + output;
  }
}
