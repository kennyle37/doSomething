import { pickWanderTarget } from '../../game/sim/wandering.js';
import { findPath, findReachable } from '../../game/sim/pathfinding.js';
import { CONFIG } from '../../game/config.js';
import { TILE_SIZE } from '../scene-constants.js';

/**
 * Owns wandering: scheduling, axis-aligned walk tweens, cancellation.
 * Only idle villagers wander; assigned villagers are skipped.
 */
export default class WanderController {
  constructor(scene) {
    this.scene = scene;
    this.tweens = new Map(); // villager id -> active walk tween
    this.timers = new Map(); // villager id -> scheduled wander timer
  }

  // Schedule a wander to start after `delay` ms.
  scheduleWander(villagerId, delay) {
    if (this.timers.has(villagerId)) return;
    const timer = this.scene.time.delayedCall(delay, () => {
      this.timers.delete(villagerId);
      this.startWander(villagerId);
    });
    this.timers.set(villagerId, timer);
  }

  // Pick a random reachable tile and walk the path there step by step,
  // routing around blocked tiles. On arrival, update the data model and
  // schedule the next wander. Cooldown scales with distance walked.
  startWander(villagerId) {
    const scene = this.scene;
    if (scene.drag.dragging) return;
    const villager = scene.villagers.find((v) => v.id === villagerId);
    if (!villager || villager.state !== 'idle') return; // assigned don't wander
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;

    // Only pick targets we can actually path to.
    const reachable = findReachable(
      villager.tileX,
      villager.tileY,
      scene.grid.width,
      scene.grid.height,
      scene.blockedTiles
    );
    const target = pickWanderTarget(
      villager.tileX,
      villager.tileY,
      scene.grid.width,
      scene.grid.height,
      // Block unreachable tiles too, so the pick is always valid.
      new Set(
        [...scene.blockedTiles].concat(
          [...this.allTiles(scene)].filter((k) => !reachable.has(k))
        )
      )
    );
    if (!target) return;

    const path = findPath(
      villager.tileX,
      villager.tileY,
      target.x,
      target.y,
      scene.grid.width,
      scene.grid.height,
      scene.blockedTiles
    );
    if (!path || path.length === 0) {
      // Nowhere to go (or already there); rest and try again later.
      this.scheduleWander(villagerId, 5000);
      return;
    }

    const finish = () => {
      this.tweens.delete(villagerId);
      const idx = scene.villagers.findIndex((v) => v.id === villagerId);
      if (idx !== -1) {
        scene.villagers[idx] = {
          ...scene.villagers[idx],
          tileX: target.x,
          tileY: target.y,
        };
      }
      sprite.play(`${villager.spriteKey}_idle`);
      scene.renderer.layoutVillagers();
      // Longer walks earn longer rests.
      this.scheduleWander(
        villagerId,
        CONFIG.wander.baseCooldownMs + path.length * CONFIG.wander.perTileCooldownMs
      );
    };

    const runStep = (i) => {
      if (i >= path.length) {
        finish();
        return;
      }
      const step = path[i];
      const prev = i === 0 ? villager : path[i - 1];
      const dx = step.x - prev.x;
      const dy = step.y - prev.y;
      const dir =
        dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      sprite.play(`${villager.spriteKey}_walk_${dir}`);
      const toX = scene.originX + step.x * TILE_SIZE + TILE_SIZE / 2;
      const toY = scene.originY + (step.y + 1) * TILE_SIZE;
      const tween = scene.tweens.add({
        targets: sprite,
        x: toX,
        y: toY,
        duration: CONFIG.wander.msPerTile,
        ease: 'Linear',
        onUpdate: () => sprite.setDepth(sprite.y), // Y-sort while walking
        onComplete: () => runStep(i + 1),
      });
      this.tweens.set(villagerId, tween);
    };

    runStep(0);
  }

  *allTiles(scene) {
    for (let x = 0; x < scene.grid.width; x++) {
      for (let y = 0; y < scene.grid.height; y++) {
        yield `${x},${y}`;
      }
    }
  }

  // Stop any in-progress wander (tween or scheduled) for a villager.
  cancelWander(villagerId) {
    const tween = this.tweens.get(villagerId);
    if (tween) {
      tween.stop();
      this.tweens.delete(villagerId);
    }
    const timer = this.timers.get(villagerId);
    if (timer) {
      timer.remove();
      this.timers.delete(villagerId);
    }
  }
}
