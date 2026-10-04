// Grid model: pure data, no rendering and no Phaser dependency.
// The scene draws tiles from this. Art swaps in later without touching the model.

export function createGrid(width, height) {
  const tiles = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({ x, y });
    }
  }
  return { width, height, tiles };
}

export function tileAt(grid, x, y) {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return null;
  return grid.tiles[y * grid.width + x];
}
