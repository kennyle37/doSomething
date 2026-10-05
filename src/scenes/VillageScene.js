import Phaser from 'phaser';
import { createGrid } from '../game/sim/grid.js';
import {
  createInitialVillagers,
  VILLAGER_SPRITES,
} from '../game/sim/villagers.js';

// Render concerns only. Tile size lives here, never in the grid model.
const TILE_SIZE = 48;
const TILE_COLOR = 0x7fbf5f; // placeholder grass green
const CLUSTER_SPREAD = 12;
const BACKGROUND_COLOR = '#141f14';
const SHOW_COORDS = true; // debug overlay, not game UI

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super('Village');
  }

  preload() {
    for (const spriteKey of VILLAGER_SPRITES) {
      this.load.spritesheet(
        spriteKey,
        `memao/${spriteKey}/idle_down.png`,
        { frameWidth: 48, frameHeight: 48 }
      );
    }
  }

  create() {
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

    this.grid = createGrid(8, 8);
    const offsetX = (this.scale.width - this.grid.width * TILE_SIZE) / 2;
    const offsetY = (this.scale.height - this.grid.height * TILE_SIZE) / 2;
    this.originX = offsetX;
    this.originY = offsetY;

    for (const tile of this.grid.tiles) {
      const px = offsetX + tile.x * TILE_SIZE + TILE_SIZE / 2;
      const py = offsetY + tile.y * TILE_SIZE + TILE_SIZE / 2;
      this.drawTile(px, py, tile);
    }

    for (const spriteKey of VILLAGER_SPRITES) {
      this.anims.create({
        key: `${spriteKey}_idle`,
        frames: this.anims.generateFrameNumbers(spriteKey, {
          start: 0,
          end: 3,
        }),
        frameRate: 4,
        repeat: -1,
      });
    }

    this.villagers = createInitialVillagers();
    this.drawVillagers();
  }

  // Swap this one function when the art arrives; everything else stays.
  drawTile(px, py, tile) {
    this.add.rectangle(px, py, TILE_SIZE - 2, TILE_SIZE - 2, TILE_COLOR);
    if (SHOW_COORDS) {
      const label = `${String.fromCharCode(65 + tile.x)}${tile.y + 1}`;
      this.add
        .text(px - TILE_SIZE / 2 + 4, py - TILE_SIZE / 2 + 2, label, {
          fontSize: '10px',
          color: '#2a4a2a',
        })
        .setOrigin(0, 0);
    }
  }

  drawVillagers() {
    // Group by tile so clustered villagers get spread out.
    const byTile = new Map();
    for (const v of this.villagers) {
      const key = `${v.tileX},${v.tileY}`;
      if (!byTile.has(key)) byTile.set(key, []);
      byTile.get(key).push(v);
    }
    for (const group of byTile.values()) {
      group.forEach((v, i) => {
        const px =
          this.originX +
          v.tileX * TILE_SIZE +
          TILE_SIZE / 2 +
          (i - (group.length - 1) / 2) * CLUSTER_SPREAD;
        const py = this.originY + v.tileY * TILE_SIZE + TILE_SIZE / 2;
        this.drawVillager(px, py, v);
      });
    }
  }

  drawVillager(px, py, villager) {
    const sprite = this.add.sprite(px, py, villager.spriteKey);
    sprite.play(`${villager.spriteKey}_idle`);
    // Anchor at feet so the sprite sits on the tile, not centered in it.
    sprite.setOrigin(0.5, 1);
    sprite.y += TILE_SIZE / 2;
  }
}
