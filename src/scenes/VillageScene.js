import Phaser from 'phaser';
import { createGrid } from '../game/sim/grid.js';
import { createInitialVillagers, VILLAGER_SPRITES } from '../game/sim/villagers.js';
import { CONFIG } from '../game/config.js';
import VillagerRenderer from './controllers/VillagerRenderer.js';
import MovementSystem from './controllers/MovementSystem.js';
import DragManager from './controllers/DragManager.js';
import WanderController from './controllers/WanderController.js';
import BushSystem from './controllers/BushSystem.js';
import SaveSystem from './controllers/SaveSystem.js';
import CookSystem from './controllers/CookSystem.js';
import EatSystem from './controllers/EatSystem.js';
import WorkSystem from './controllers/WorkSystem.js';
import DebugConsole from './controllers/DebugConsole.js';
import {
  TILE_SIZE,
  TILE_COLOR,
  BACKGROUND_COLOR,
  SHOW_COORDS,
  WALK_DIRS,
  WORK_DIRS,
} from './scene-constants.js';

/**
 * Thin coordinator. Owns shared state (grid, villagers, blockedTiles) and
 * wires up controllers. Each controller owns one slice of behavior:
 * rendering, input, wandering, bushes.
 */
export default class VillageScene extends Phaser.Scene {
  constructor() {
    super('Village');
  }

  preload() {
    for (const spriteKey of VILLAGER_SPRITES) {
      this.load.spritesheet(spriteKey, `memao/${spriteKey}/idle_down.png`, {
        frameWidth: 48,
        frameHeight: 48,
      });
      for (const dir of ['left', 'right', 'up']) {
        this.load.spritesheet(
          `${spriteKey}_idle_${dir}`,
          `memao/${spriteKey}/idle_${dir}.png`,
          { frameWidth: 48, frameHeight: 48 }
        );
      }
      for (const dir of WALK_DIRS) {
        this.load.spritesheet(
          `${spriteKey}_walk_${dir}`,
          `memao/${spriteKey}/walk_${dir}.png`,
          { frameWidth: 48, frameHeight: 48 }
        );
      }
      for (const dir of WORK_DIRS) {
        this.load.spritesheet(
          `${spriteKey}_work_${dir}`,
          `memao/${spriteKey}/work_${dir}.png`,
          { frameWidth: 48, frameHeight: 48 }
        );
      }
    }
    for (const key of [
      'bush_flowers_red_01',
      'bush_flowers_white_01',
      'bush_flowers_yellow_01',
      'bush_flowers_blue_01',
      'planter_green_01',
    ]) {
      this.load.image(key, `serene_village/objects/${key}.png`);
    }
    // Rotten meal (mushroom, in pickups folder).
    this.load.image('mushroom_orange_02', 'serene_village/pickups/mushroom_orange_02.png');
    // Campfire (animated spritesheet).
    this.load.spritesheet('campfire', 'serene_village/animated/campfire_48x48.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor(BACKGROUND_COLOR);

    this.grid = createGrid(8, 8);
    this.originX = (this.scale.width - this.grid.width * TILE_SIZE) / 2;
    this.originY = (this.scale.height - this.grid.height * TILE_SIZE) / 2;

    this.blockedTiles = new Set();
    // Pre-block known asset tiles so villagers never spawn on them.
    // (BushSystem/CookSystem setup re-add these; Set dedupes.)
    this.blockedTiles.add(
      `${CONFIG.cooking.campfire.tileX},${CONFIG.cooking.campfire.tileY}`
    );
    for (const b of CONFIG.bushes) {
      this.blockedTiles.add(`${b.tileX},${b.tileY}`);
    }
    // villager id -> x-offset within tile at drop time. Orders clusters
    // left-to-right by where you actually dropped them.
    this.dropOffsets = new Map();
    this.villagers = createInitialVillagers(Math.random, this.blockedTiles);

    for (const tile of this.grid.tiles) {
      const px = this.originX + tile.x * TILE_SIZE + TILE_SIZE / 2;
      const py = this.originY + tile.y * TILE_SIZE + TILE_SIZE / 2;
      this.drawTile(px, py, tile);
    }

    for (const spriteKey of VILLAGER_SPRITES) {
      this.anims.create({
        key: `${spriteKey}_idle`,
        frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
      for (const dir of ['left', 'right', 'up']) {
        this.anims.create({
          key: `${spriteKey}_idle_${dir}`,
          frames: this.anims.generateFrameNumbers(`${spriteKey}_idle_${dir}`, {
            start: 0,
            end: 3,
          }),
          frameRate: 4,
          repeat: -1,
        });
      }
      for (const dir of WALK_DIRS) {
        this.anims.create({
          key: `${spriteKey}_walk_${dir}`,
          frames: this.anims.generateFrameNumbers(`${spriteKey}_walk_${dir}`, {
            start: 0,
            end: 3,
          }),
          frameRate: 6,
          repeat: -1,
        });
      }
      for (const dir of WORK_DIRS) {
        this.anims.create({
          key: `${spriteKey}_work_${dir}`,
          frames: this.anims.generateFrameNumbers(`${spriteKey}_work_${dir}`, {
            start: 0,
            end: 3,
          }),
          frameRate: 4,
          repeat: -1,
        });
      }
    }

    // Campfire animation.
    this.anims.create({
      key: 'campfire_burn',
      frames: this.anims.generateFrameNumbers('campfire', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });

    // Controllers, in dependency order.
    this.renderer = new VillagerRenderer(this);
    this.movement = new MovementSystem(this);
    this.wander = new WanderController(this);
    this.work = new WorkSystem(this);
    this.bushes = new BushSystem(this);
    this.cook = new CookSystem(this);
    this.eat = new EatSystem(this);
    this.drag = new DragManager(this);
    this.save = new SaveSystem(this);
    this.debug = new DebugConsole(this);

    this.bushes.setup();
    this.cook.setup();
    this.eat.setup();
    this.renderer.drawVillagers();
    this.drag.setupInput();
    this.drag.setupTileTap();

    // Kick off wandering with natural-feeling random delays.
    for (const v of this.villagers) {
      const { initialDelayMinMs, initialDelayMaxMs } = CONFIG.wander;
      this.wander.scheduleWander(
        v.id,
        initialDelayMinMs + Math.random() * (initialDelayMaxMs - initialDelayMinMs)
      );
    }

    // Load save last: restores assignments and cancels wandering for workers.
    this.save.setup();
    this.debug.setup();

    // Sync cook animations after save restores (sprites exist now).
    this.cook.syncCookAnims();
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
}
