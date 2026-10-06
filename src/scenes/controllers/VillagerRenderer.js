import Phaser from 'phaser';
import { TILE_SIZE } from '../scene-constants.js';

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

/**
 * Owns villager sprites: creation, cluster layout, lookup.
 * Positioning reads scene.villagers; wandering tweens (owned by
 * WanderController) take precedence over layout.
 */
export default class VillagerRenderer {
  constructor(scene) {
    this.scene = scene;
    this.sprites = new Map(); // villager id -> sprite
  }

  getSprite(id) {
    return this.sprites.get(id);
  }

  drawVillagers() {
    for (const v of this.scene.villagers) {
      if (!this.sprites.has(v.id)) {
        this.sprites.set(v.id, this.createVillagerSprite(v));
      }
    }
    this.layoutVillagers();
  }

  createVillagerSprite(villager) {
    const scene = this.scene;
    const sprite = scene.add.sprite(0, 0, villager.spriteKey);
    sprite.play(`${villager.spriteKey}_idle`);
    sprite.setOrigin(0.5, 1);
    sprite.setData('villagerId', villager.id);
    // Expanded touch target (1.5x sprite). Hit area is in frame space:
    // Tight hitbox (48x48 sprite, not the oversized 72x72).
    // Prevents overlap with nearby click targets like the campfire.
    sprite.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, 48, 48),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });

    sprite.on('pointerdown', (pointer) => {
      const pickedId = scene.drag.pickVillagerAt(pointer);
      if (pickedId == null) return;
      scene.wander.cancelWander(pickedId);
      scene.drag.dragging = {
        villagerId: pickedId,
        downX: pointer.downX,
        downY: pointer.downY,
      };
      const picked = this.sprites.get(pickedId);
      picked.setScale(1.15);
      scene.children.bringToTop(picked);
    });

    // Hover: scale up slightly (easier to see it's draggable).
    // Skip while dragging (drag already scales to 1.15).
    sprite.on('pointerover', () => {
      if (!scene.drag.dragging) sprite.setScale(1.1);
    });
    sprite.on('pointerout', () => {
      if (!scene.drag.dragging) sprite.setScale(1);
    });

    return sprite;
  }

  // Reposition all sprites from current villager data. Clustered villagers
  // use compact 2D offsets so they stay cozy and inside the tile.
  // Ordered left-to-right by drop x-offset, so dropping left stays left.
  layoutVillagers() {
    const scene = this.scene;
    const byTile = new Map();
    for (const v of scene.villagers) {
      const k = `${v.tileX},${v.tileY}`;
      if (!byTile.has(k)) byTile.set(k, []);
      byTile.get(k).push(v);
    }
    for (const group of byTile.values()) {
      group.sort(
        (a, b) =>
          (scene.dropOffsets.get(a.id) || 0) - (scene.dropOffsets.get(b.id) || 0)
      );
      const offsets = getClusterOffsets(group.length);
      group.forEach((v, i) => {
        // Wandering villagers are positioned by their tween, not the layout.
        if (scene.wander.tweens.has(v.id)) return;
        const sprite = this.sprites.get(v.id);
        // Assigned workers use their work offset (from the drop position),
        // not the cluster layout.
        const [ox, oy] = v.workOffset
          ? [v.workOffset.x, v.workOffset.y]
          : offsets[i];
        const px = scene.originX + v.tileX * TILE_SIZE + TILE_SIZE / 2 + ox;
        const py = scene.originY + (v.tileY + 1) * TILE_SIZE + oy; // feet at tile bottom
        sprite.setDepth(py); // Y-sort
        scene.tweens.add({
          targets: sprite,
          x: px,
          y: py,
          duration: 150,
          ease: 'Power2',
          onUpdate: () => sprite.setDepth(sprite.y),
        });
      });
    }
    scene.drag.updateSelectionRing();
  }
}
