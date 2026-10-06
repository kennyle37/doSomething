import { assignVillager } from '../../game/sim/assignment.js';
import { CONFIG } from '../../game/config.js';
import { TILE_SIZE } from '../scene-constants.js';

/**
 * Shared "work assignment" behavior for bushes, campfire, and future work targets.
 * Handles: cancel wander, pick side, nudge for clusters, position villager,
 * play animation, layout, save.
 */
export default class WorkSystem {
  constructor(scene) {
    this.scene = scene;
    // Highlightable work targets: id -> { tileX, tileY, sprite }
    this.targets = new Map();
  }

  /**
   * Register a work target for drag-highlight.
   * @param {string} id - unique target id
   * @param {number} tileX, tileY
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} baseScale - normal scale (for highlight reset)
   */
  registerTarget(id, tileX, tileY, sprite, baseScale = 0.75) {
    this.targets.set(id, { tileX, tileY, sprite, baseScale });
  }

  /**
   * Highlight the target at the given tile (green tint + slight scale up).
   * Clears highlight from all others.
   */
  highlightAt(tileX, tileY) {
    for (const [, t] of this.targets) {
      const isHover = t.tileX === tileX && t.tileY === tileY;
      if (t.sprite) {
        t.sprite.setTint(isHover ? 0xaaffaa : 0xffffff);
        // Scale up when highlighted (easier to see and click).
        const baseScale = t.baseScale || 0.75;
        t.sprite.setScale(isHover ? baseScale * 1.15 : baseScale);
      }
    }
  }

  /**
   * Clear all highlights.
   */
  clearHighlight() {
    for (const [, t] of this.targets) {
      if (t.sprite) {
        t.sprite.clearTint();
        t.sprite.setScale(t.baseScale || 0.75);
      }
    }
  }

  /**
   * Assign a villager to a work target.
   * @param {number} villagerId
   * @param {Object} target - { tileX, tileY, assignedTo }
   *   assignedTo: value for villager.assignedTo (e.g. bush ID or 'campfire')
   */
  assignToTarget(villagerId, target) {
    const scene = this.scene;
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    scene.wander.cancelWander(villagerId);

    // Pick a random side.
    const sides = CONFIG.workSides.map((s) => ({
      workOffset: { ...s.offset },
      workDir: s.dir,
    }));
    const { workOffset, workDir } =
      sides[Math.floor(Math.random() * sides.length)];
    // Scale offset for targets that need more clearance (e.g. campfire).
    const scale = target.workOffsetScale || 1;
    workOffset.x *= scale;
    workOffset.y *= scale;

    // Nudge for multiple workers on same target.
    const existingWorkers = scene.villagers.filter(
      (v) => v.assignedTo === target.assignedTo
    ).length;
    const nudge = (existingWorkers % 3 - 1) * 6;
    if (workDir === 'left' || workDir === 'right') {
      workOffset.y += nudge;
    } else {
      workOffset.x += nudge;
    }

    scene.villagers[idx] = {
      ...assignVillager(scene.villagers[idx], target.assignedTo),
      tileX: target.tileX,
      tileY: target.tileY,
      workOffset,
      workDir,
      assignedAt: Date.now(),
    };
    scene.drag.selectedVillager = null;

    const sprite = scene.renderer.getSprite(villagerId);
    const villager = scene.villagers[idx];
    // Play directional work animation (facing the target).
    sprite.play(`${villager.spriteKey}_work_${workDir}`);
    scene.renderer.layoutVillagers();
    scene.drag.updateSelectionRing();

    if (scene.save) scene.save.saveToStorage();
  }

  /**
   * Play the work animation for a villager (directional, facing their target).
   * Reusable for any work state change.
   */
  playWorkAnim(villagerId) {
    const scene = this.scene;
    const v = scene.villagers.find((x) => x.id === villagerId);
    if (!v || !v.workDir) return;
    const sprite = scene.renderer.getSprite(villagerId);
    if (sprite) sprite.play(`${v.spriteKey}_work_${v.workDir}`);
  }

  /**
   * Play idle animation for a villager (directional, matching workDir).
   */
  playIdleAnim(villagerId) {
    const scene = this.scene;
    const v = scene.villagers.find((x) => x.id === villagerId);
    if (!v) return;
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;
    // Use directional idle if available, else fall back to base idle.
    const dirKey = v.workDir ? `${v.spriteKey}_idle_${v.workDir}` : null;
    const baseKey = `${v.spriteKey}_idle`;
    if (dirKey && scene.anims.exists(dirKey)) {
      sprite.play(dirKey);
    } else {
      sprite.play(baseKey);
    }
  }

  // --- Y-sort helpers (shared depth convention) ---
  // All world sprites use bottom-origin (0.5, 1) with feet at tile bottom.
  // Depth = feet Y. This gives correct overlap for villagers, bushes,
  // campfire, and future buildings.

  /**
   * Get the Y position (feet) for a tile.
   */
  static feetY(scene, tileY, yOffset = 0) {
    return scene.originY + (tileY + 1) * TILE_SIZE + yOffset;
  }

  /**
   * Get the X position (center) for a tile.
   */
  static centerX(scene, tileX, xOffset = 0) {
    return scene.originX + tileX * TILE_SIZE + TILE_SIZE / 2 + xOffset;
  }

  /**
   * Place a sprite with Y-sort depth. Sets bottom-origin and depth.
   * @param {Phaser.GameObjects.Sprite} sprite
   * @param {number} px, py - position (py = feet Y)
   */
  static placeYSorted(sprite, px, py) {
    sprite.setOrigin(0.5, 1);
    sprite.setPosition(px, py);
    sprite.setDepth(py);
    return sprite;
  }
}
