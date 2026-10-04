import Phaser from 'phaser';
import { createGrid } from '../game/sim/grid.js';

// Render concerns only. Tile size lives here, never in the grid model.
const TILE_SIZE = 48;
const TILE_COLOR = 0x7fbf5f; // placeholder grass green
const BACKGROUND_COLOR = '#141f14';

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super('Village');
  }

  create() {
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

    this.grid = createGrid(8, 8);
    const offsetX = (this.scale.width - this.grid.width * TILE_SIZE) / 2;
    const offsetY = (this.scale.height - this.grid.height * TILE_SIZE) / 2;

    for (const tile of this.grid.tiles) {
      const px = offsetX + tile.x * TILE_SIZE + TILE_SIZE / 2;
      const py = offsetY + tile.y * TILE_SIZE + TILE_SIZE / 2;
      this.drawTile(px, py, tile);
    }
  }

  // Swap this one function when the art arrives; everything else stays.
  drawTile(px, py, tile) {
    this.add.rectangle(px, py, TILE_SIZE - 2, TILE_SIZE - 2, TILE_COLOR);
  }
}
