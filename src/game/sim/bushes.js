/**
 * Berry bush data model. Pure data, no rendering.
 * A bush is: { id, tileX, tileY, spriteKey }.
 */

export function createBush(id, tileX, tileY, spriteKey) {
  return { id, tileX, tileY, spriteKey };
}

/**
 * 4 bushes at fixed positions. F2, G2, F3, G3.
 * (F=5, G=6; row 2 = y1, row 3 = y2 in 0-indexed)
 */
export function createInitialBushes() {
  return [
    createBush(1, 5, 1, 'bush_flowers_red_01'),
    createBush(2, 6, 1, 'bush_flowers_white_01'),
    createBush(3, 5, 2, 'bush_flowers_yellow_01'),
    createBush(4, 6, 2, 'bush_round_01'),
  ];
}
