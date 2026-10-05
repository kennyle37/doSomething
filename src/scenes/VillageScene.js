import Phaser from 'phaser';
import { createGrid } from '../game/sim/grid.js';
import {
  createInitialVillagers,
  VILLAGER_SPRITES,
} from '../game/sim/villagers.js';
import { moveVillager } from '../game/sim/movement.js';

// Render concerns only. Tile size lives here, never in the grid model.
const TILE_SIZE = 48;
const TILE_COLOR = 0x7fbf5f; // placeholder grass green
const BACKGROUND_COLOR = '#141f14';
const SHOW_COORDS = true; // debug overlay, not game UI
const TAP_THRESHOLD = 10; // px, below this a drag counts as a tap

// Compact 2D cluster offsets (px from tile center). Keeps groups cozy and
// inside the tile instead of spreading into a row that overflows.
const CLUSTER_OFFSETS = [
  [[0, 0]],
  [
    [-10, 0],
    [10, 0],
  ],
  [
    [-10, -6],
    [10, -6],
    [0, 8],
  ],
  [
    [-10, -6],
    [10, -6],
    [-10, 8],
    [10, 8],
  ],
];

function getClusterOffsets(count) {
  if (count <= CLUSTER_OFFSETS.length) return CLUSTER_OFFSETS[count - 1];
  const offsets = [];
  for (let i = 0; i < count; i++) {
    offsets.push([(i - (count - 1) / 2) * 12, 0]);
  }
  return offsets;
}

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

    // No blocked tiles yet. Bushes/buildings fill this in later specs.
    this.blockedTiles = new Set();
    // villager id -> x-offset within tile at drop time. Orders clusters
    // left-to-right by where you actually dropped them.
    this.dropOffsets = new Map();
    // Active manual drag state, null when not dragging.
    this.dragging = null;

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
    this.villagerSprites = new Map(); // villager id -> sprite
    this.selectedVillager = null;
    this.selectionRing = this.add
      .circle(0, 0, 26)
      .setStrokeStyle(3, 0xffffff)
      .setVisible(false)
      .setDepth(10);

    this.drawVillagers();
    this.setupTileTap();

    // Manual drag handling (scene level) so we can pick the closest
    // villager in a cluster instead of just the topmost sprite.
    this.input.on('pointermove', (pointer) => {
      if (this.dragging && pointer.isDown) {
        const sprite = this.villagerSprites.get(this.dragging.villagerId);
        if (sprite) {
          sprite.x = pointer.x;
          sprite.y = pointer.y;
        }
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (!this.dragging) return;
      const { villagerId, downX, downY } = this.dragging;
      this.dragging = null;
      const sprite = this.villagerSprites.get(villagerId);
      if (sprite) sprite.setScale(1);
      const dist = Phaser.Math.Distance.Between(
        downX,
        downY,
        pointer.x,
        pointer.y
      );
      if (dist < TAP_THRESHOLD) {
        this.handleVillagerTap(villagerId);
      } else {
        const tileX = Math.floor((pointer.x - this.originX) / TILE_SIZE);
        const tileY = Math.floor((pointer.y - this.originY) / TILE_SIZE);
        const tileCenterX = this.originX + tileX * TILE_SIZE + TILE_SIZE / 2;
        this.dropOffsets.set(villagerId, pointer.x - tileCenterX);
        this.dropVillager(villagerId, tileX, tileY);
      }
    });
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
    for (const v of this.villagers) {
      if (!this.villagerSprites.has(v.id)) {
        this.villagerSprites.set(v.id, this.createVillagerSprite(v));
      }
    }
    this.layoutVillagers();
  }

  createVillagerSprite(villager) {
    const sprite = this.add.sprite(0, 0, villager.spriteKey);
    sprite.play(`${villager.spriteKey}_idle`);
    sprite.setOrigin(0.5, 1);
    sprite.setData('villagerId', villager.id);
    // Expanded touch target (1.5x sprite). Hit area is in frame space:
    // (0,0) is top-left of the 48x48 frame, so center a 72x72 rect on it.
    // useHandCursor gives the hover pointer. Manual drag (see create),
    // so no `draggable` here.
    sprite.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-12, -12, 72, 72),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    sprite.on('pointerdown', (pointer) => {
      const pickedId = this.pickVillagerAt(pointer);
      if (pickedId == null) return;
      this.dragging = {
        villagerId: pickedId,
        downX: pointer.downX,
        downY: pointer.downY,
      };
      const picked = this.villagerSprites.get(pickedId);
      picked.setScale(1.15);
      this.children.bringToTop(picked);
      this.children.bringToTop(this.selectionRing);
    });

    return sprite;
  }

  // Among villager sprites under the pointer, return the id of the one
  // whose center is closest. Lets you grab either villager in a cluster.
  pickVillagerAt(pointer) {
    const hits = this.input
      .hitTestPointer(pointer)
      .filter((obj) => obj.getData && obj.getData('villagerId') != null);
    if (hits.length === 0) return null;
    let best = hits[0];
    let bestDist = Infinity;
    for (const obj of hits) {
      const d = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        obj.x,
        obj.y - 24 // sprite center (origin is at feet)
      );
      if (d < bestDist) {
        bestDist = d;
        best = obj;
      }
    }
    return best.getData('villagerId');
  }

  // Reposition all sprites from current villager data. Clustered villagers
  // use compact 2D offsets so they stay cozy and inside the tile.
  // Ordered left-to-right by drop x-offset, so dropping left stays left.
  layoutVillagers() {
    const byTile = new Map();
    for (const v of this.villagers) {
      const k = `${v.tileX},${v.tileY}`;
      if (!byTile.has(k)) byTile.set(k, []);
      byTile.get(k).push(v);
    }
    for (const group of byTile.values()) {
      group.sort(
        (a, b) =>
          (this.dropOffsets.get(a.id) || 0) - (this.dropOffsets.get(b.id) || 0)
      );
      const offsets = getClusterOffsets(group.length);
      group.forEach((v, i) => {
        const sprite = this.villagerSprites.get(v.id);
        const [ox, oy] = offsets[i];
        const px = this.originX + v.tileX * TILE_SIZE + TILE_SIZE / 2 + ox;
        const py = this.originY + (v.tileY + 1) * TILE_SIZE + oy; // feet at tile bottom
        this.tweens.add({
          targets: sprite,
          x: px,
          y: py,
          duration: 150,
          ease: 'Power2',
        });
      });
    }
    this.updateSelectionRing();
  }

  dropVillager(villagerId, tileX, tileY) {
    const idx = this.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    const moved = moveVillager(
      this.villagers[idx],
      tileX,
      tileY,
      this.grid.width,
      this.grid.height,
      this.blockedTiles
    );
    this.villagers[idx] = moved;
    this.selectedVillager = null;
    this.layoutVillagers();
  }

  handleVillagerTap(villagerId) {
    // Tap selected villager again to deselect, tap another to switch.
    this.selectedVillager =
      this.selectedVillager === villagerId ? null : villagerId;
    this.updateSelectionRing();
  }

  updateSelectionRing() {
    if (this.selectedVillager == null) {
      this.selectionRing.setVisible(false);
      return;
    }
    const sprite = this.villagerSprites.get(this.selectedVillager);
    if (!sprite) {
      this.selectionRing.setVisible(false);
      return;
    }
    this.selectionRing.setPosition(sprite.x, sprite.y - 24).setVisible(true);
  }

  // Tap-tap fallback: tap a tile to move the selected villager there.
  setupTileTap() {
    const zone = this.add
      .zone(
        this.originX + (this.grid.width * TILE_SIZE) / 2,
        this.originY + (this.grid.height * TILE_SIZE) / 2,
        this.grid.width * TILE_SIZE,
        this.grid.height * TILE_SIZE
      )
      .setInteractive();
    // Below the villager sprites, or it eats their drag events.
    zone.setDepth(-1);
    zone.on('pointerdown', (pointer) => {
      if (this.selectedVillager == null) return;
      const tileX = Math.floor((pointer.x - this.originX) / TILE_SIZE);
      const tileY = Math.floor((pointer.y - this.originY) / TILE_SIZE);
      this.dropOffsets.set(this.selectedVillager, 0);
      this.dropVillager(this.selectedVillager, tileX, tileY);
    });
  }

  drawVillager(px, py, villager) {
    // Kept as the sprite swap point. Sprites are created in
    // createVillagerSprite(); this stays for API stability.
    const sprite = this.add.sprite(px, py, villager.spriteKey);
    sprite.play(`${villager.spriteKey}_idle`);
    sprite.setOrigin(0.5, 1);
    sprite.y += TILE_SIZE / 2;
  }
}
