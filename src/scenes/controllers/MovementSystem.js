import { findPath } from '../../game/sim/pathfinding.js';
import { CONFIG } from '../../game/config.js';
import { TILE_SIZE } from '../scene-constants.js';

/**
 * Single authority for all villager movement.
 *
 * Problem it solves: WanderController, EatSystem, and VillagerRenderer each
 * created their own tweens, fighting over sprite position and causing jerks.
 * Now everything goes through here. No other system touches sprite x/y.
 *
 * API:
 *   moveTo(villagerId, tileX, tileY, opts) - pathfind and walk. opts:
 *     { onArrive, randomize=true, speed=CONFIG.wander.msPerTile }
 *   cancel(villagerId) - stop any active movement
 *   isMoving(villagerId) - true if a movement tween is active
 *   snapTo(villagerId, px, py) - instant reposition (drag drops, layout)
 */
export default class MovementSystem {
  constructor(scene) {
    this.scene = scene;
    /** villagerId -> active Phaser tween */
    this.activeTweens = new Map();
  }

  /**
   * Walk a villager to a tile via BFS pathfinding.
   * Cancels any existing movement first.
   */
  moveTo(villagerId, tileX, tileY, opts = {}) {
    const scene = this.scene;
    const { onArrive = null, randomize = true, speed = CONFIG.wander.msPerTile } = opts;

    this.cancel(villagerId);

    const v = scene.villagers.find((x) => x.id === villagerId);
    const sprite = scene.renderer.getSprite(villagerId);
    if (!v || !sprite) {
      if (onArrive) onArrive();
      return;
    }

    const path = findPath(
      v.tileX, v.tileY, tileX, tileY,
      scene.grid.width, scene.grid.height,
      scene.blockedTiles, randomize
    );
    if (!path || path.length === 0) {
      if (onArrive) onArrive();
      return;
    }

    const step = (i) => {
      if (i >= path.length) {
        this.activeTweens.delete(villagerId);
        // Update logical position to destination.
        const idx = scene.villagers.findIndex((x) => x.id === villagerId);
        if (idx !== -1) {
          scene.villagers[idx] = { ...scene.villagers[idx], tileX, tileY };
        }
        if (onArrive) onArrive();
        return;
      }
      const s = path[i];
      const prev = i === 0 ? v : path[i - 1];
      const dx = s.x - prev.x;
      const dy = s.y - prev.y;
      const dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      // Play walk anim if it exists, otherwise keep current.
      const walkKey = `${v.spriteKey}_walk_${dir}`;
      if (sprite.anims && scene.anims.exists(walkKey)) {
        sprite.play(walkKey);
      }
      const toX = scene.originX + s.x * TILE_SIZE + TILE_SIZE / 2;
      const toY = scene.originY + (s.y + 1) * TILE_SIZE;
      const tween = scene.tweens.add({
        targets: sprite,
        x: toX,
        y: toY,
        duration: speed,
        ease: 'Linear',
        onUpdate: () => sprite.setDepth(sprite.y),
        onComplete: () => step(i + 1),
      });
      this.activeTweens.set(villagerId, tween);
    };
    step(0);
  }

  /**
   * Stop any active movement for a villager.
   */
  cancel(villagerId) {
    const tween = this.activeTweens.get(villagerId);
    if (tween) {
      tween.stop();
      this.activeTweens.delete(villagerId);
    }
  }

  /**
   * Cancel all movement (e.g. on scene shutdown).
   */
  cancelAll() {
    for (const villagerId of this.activeTweens.keys()) {
      this.cancel(villagerId);
    }
  }

  /**
   * True if the villager has an active movement tween.
   */
  isMoving(villagerId) {
    return this.activeTweens.has(villagerId);
  }

  /**
   * Instantly reposition a sprite (no tween). For drag drops and layout.
   * Cancels any active movement first.
   */
  snapTo(villagerId, px, py) {
    const scene = this.scene;
    this.cancel(villagerId);
    const sprite = scene.renderer.getSprite(villagerId);
    if (sprite) {
      sprite.x = px;
      sprite.y = py;
      sprite.setDepth(py);
    }
  }
}
