/**
 * Save system: pure functions for creating, serializing, and restoring saves.
 * Versioned schema so old saves can be migrated or rejected gracefully.
 */

import { createStats } from './villagerStats.js';

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'idle-save-1';

/**
 * Create a save object from current game state.
 * @param {Array} villagers - villager sim objects
 * @param {number} berries - current berry count
 * @param {number} now - timestamp (Date.now())
 */
export function createSave(villagers, berries, now = Date.now(), cooking = null, buildings = null) {
  return {
    version: SAVE_VERSION,
    savedAt: now,
    berries,
    villagers: villagers.map((v) => ({
      id: v.id,
      name: v.name,
      spriteKey: v.spriteKey,
      tileX: v.tileX,
      tileY: v.tileY,
      state: v.state === 'eating' ? 'idle' : v.state, // never persist mid-meal
      assignedTo: v.assignedTo,
      workOffset: v.workOffset,
      workDir: v.workDir,
      assignedAt: v.assignedAt,
      exp: v.exp || 0,
      stats: v.stats ? { ...v.stats, traits: [...(v.stats.traits || [])] } : null,
    })),
    cooking: cooking || { queue: [], activeJob: null, meals: [] },
    buildings: buildings || [],
  };
}

/**
 * Serialize a save to a base64 string for export/sharing.
 */
export function serialize(save) {
  return btoa(JSON.stringify(save));
}

/**
 * Deserialize a base64 string back to a save object.
 * Returns null if the string is invalid or version is unsupported.
 */
export function deserialize(str) {
  try {
    const save = JSON.parse(atob(str));
    if (typeof save !== 'object' || save === null) return null;
    if (save.version !== SAVE_VERSION) return null;
    if (typeof save.savedAt !== 'number') return null;
    if (typeof save.berries !== 'number') return null;
    if (!Array.isArray(save.villagers)) return null;
    return save;
  } catch {
    return null;
  }
}

/**
 * Calculate offline berries earned while away.
 * For each assigned villager, award floor(elapsed / tickMs) berries.
 * Caps elapsed time at maxOfflineMs.
 *
 * @param {Object} save - save object from deserialize()
 * @param {number} now - current timestamp
 * @param {number} tickMs - production tick interval
 * @param {number} maxOfflineMs - max offline window (default 8h)
 * @returns {number} total berries earned offline
 */
export function calculateOfflineBerries(save, now, tickMs, maxOfflineMs = 8 * 3600 * 1000) {
  const elapsed = Math.min(now - save.savedAt, maxOfflineMs);
  if (elapsed <= 0) return 0;

  const intervals = Math.floor(elapsed / tickMs);
  if (intervals <= 0) return 0;

  let total = 0;
  for (const v of save.villagers) {
    if (v.assignedTo != null) {
      total += intervals;
    }
  }
  return total;
}

/**
 * Apply a save to villager objects (restore positions, assignments).
 * Mutates the passed villagers array in place, matching by id.
 */
export function applySave(villagers, save) {
  const byId = new Map(save.villagers.map((v) => [v.id, v]));
  for (const v of villagers) {
    const s = byId.get(v.id);
    if (!s) continue;
    v.tileX = s.tileX;
    v.tileY = s.tileY;
    v.state = s.state;
    v.assignedTo = s.assignedTo;
    v.workOffset = s.workOffset;
    v.workDir = s.workDir;
    v.assignedAt = s.assignedAt;
    v.exp = s.exp || 0;
    // Stats: restore or mint fresh for old saves. Never restore mid-meal.
    v.stats = s.stats
      ? { ...createStats(), ...s.stats, traits: [...(s.stats.traits || [])] }
      : createStats();
    delete v.eatingMealId;
    delete v.previousAssignment;
  }
}
