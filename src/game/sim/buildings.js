/**
 * Building data model. Pure functions, no rendering.
 *
 * Buildings are 2D footprints on the grid. They block tiles
 * (can't walk on, can't spawn on). No interiors, no functionality yet.
 */

let buildingIdCounter = 1;

export function resetBuildingIds() {
  buildingIdCounter = 1;
}

/**
 * Building type definitions. Sizes in tiles.
 */
export const BUILDING_TYPES = {
  house: {
    id: 'house',
    name: 'House',
    width: 2,
    height: 2,
    spriteKey: 'house_blue_01',
  },
};

/**
 * Create a building at a tile position (top-left of footprint).
 */
export function createBuilding(typeId, tileX, tileY) {
  const type = BUILDING_TYPES[typeId];
  if (!type) throw new Error(`Unknown building type: ${typeId}`);
  return {
    id: buildingIdCounter++,
    type: typeId,
    tileX,
    tileY,
    width: type.width,
    height: type.height,
  };
}

/**
 * Get all tiles occupied by a building.
 * @returns {Array<{x, y}>}
 */
export function getBuildingTiles(building) {
  const tiles = [];
  for (let dx = 0; dx < building.width; dx++) {
    for (let dy = 0; dy < building.height; dy++) {
      tiles.push({ x: building.tileX + dx, y: building.tileY + dy });
    }
  }
  return tiles;
}

/**
 * Check if a building can be placed at a position.
 * @param {string} typeId
 * @param {number} tileX - top-left X
 * @param {number} tileY - top-left Y
 * @param {number} gridWidth
 * @param {number} gridHeight
 * @param {Set<string>} blockedTiles - "x,y" keys
 * @param {Array} villagers - to check for occupants
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canPlaceBuilding(typeId, tileX, tileY, gridWidth, gridHeight, blockedTiles, villagers = []) {
  const type = BUILDING_TYPES[typeId];
  if (!type) return { ok: false, reason: `Unknown type: ${typeId}` };

  for (let dx = 0; dx < type.width; dx++) {
    for (let dy = 0; dy < type.height; dy++) {
      const x = tileX + dx;
      const y = tileY + dy;
      if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
        return { ok: false, reason: 'Out of bounds' };
      }
      if (blockedTiles.has(`${x},${y}`)) {
        return { ok: false, reason: 'Tile blocked' };
      }
      const occupant = villagers.find((v) => v.tileX === x && v.tileY === y);
      if (occupant) {
        return { ok: false, reason: 'Villager in the way' };
      }
    }
  }
  return { ok: true };
}
