import { pickWanderTarget } from '../../game/sim/wandering.js';
import { findReachable } from '../../game/sim/pathfinding.js';
import { CONFIG } from '../../game/config.js';

/**
 * Owns wandering: scheduling and target picking.
 * Actual movement goes through MovementSystem (single authority).
 * Only idle villagers wander; assigned villagers are skipped.
 */
export default class WanderController {
  constructor(scene) {
    this.scene = scene;
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

  // Pick a random reachable tile and walk there via MovementSystem.
  // On arrival, update the data model and schedule the next wander.
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
    // Defensive: never land on a blocked tile even if the picker changes.
    let picked = target;
    let guard = 0;
    while (picked && scene.blockedTiles.has(`${picked.x},${picked.y}`) && guard < 10) {
      guard++;
      picked = pickWanderTarget(
        villager.tileX,
        villager.tileY,
        scene.grid.width,
        scene.grid.height,
        new Set(
          [...scene.blockedTiles].concat(
            [...this.allTiles(scene)].filter((k) => !reachable.has(k))
          )
        )
      );
    }
    if (!picked) return;

    // Walk via MovementSystem (single authority, randomized path).
    scene.movement.moveTo(villagerId, picked.x, picked.y, {
      onArrive: () => {
        const sprite = scene.renderer.getSprite(villagerId);
        if (sprite) sprite.play(`${villager.spriteKey}_idle`);
        // Longer walks earn longer rests. Estimate via Manhattan distance.
        const dist = Math.abs(picked.x - villager.tileX) + Math.abs(picked.y - villager.tileY);
        this.scheduleWander(
          villagerId,
          CONFIG.wander.baseCooldownMs + dist * CONFIG.wander.perTileCooldownMs
        );
      },
    });
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
    // Cancel via MovementSystem (single authority).
    if (this.scene.movement) this.scene.movement.cancel(villagerId);
    const timer = this.timers.get(villagerId);
    if (timer) {
      timer.remove();
      this.timers.delete(villagerId);
    }
  }
}
