import { pickWanderTarget } from '../../game/sim/wandering.js';
import { TILE_SIZE, WALK_MS_PER_TILE } from '../scene-constants.js';

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

  // Pick a random free tile and walk there axis-aligned (longer axis first),
  // like classic RPG movement. On arrival, update the data model and
  // schedule the next wander. Cooldown scales with distance walked.
  startWander(villagerId) {
    const scene = this.scene;
    if (scene.drag.dragging) return;
    const villager = scene.villagers.find((v) => v.id === villagerId);
    if (!villager || villager.state !== 'idle') return; // assigned don't wander
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;

    const target = pickWanderTarget(
      villager.tileX,
      villager.tileY,
      scene.grid.width,
      scene.grid.height,
      scene.blockedTiles
    );
    if (!target) return;

    const toX = scene.originX + target.x * TILE_SIZE + TILE_SIZE / 2;
    const toY = scene.originY + (target.y + 1) * TILE_SIZE;
    const dx = toX - sprite.x;
    const dy = toY - sprite.y;
    const totalDistTiles = Math.sqrt(dx * dx + dy * dy) / TILE_SIZE;

    // Build axis-aligned phases, longer axis first.
    const phases = [];
    const xPhase =
      Math.abs(dx) >= 1
        ? { axis: 'x', to: toX, dir: dx > 0 ? 'right' : 'left' }
        : null;
    const yPhase =
      Math.abs(dy) >= 1
        ? { axis: 'y', to: toY, dir: dy > 0 ? 'down' : 'up' }
        : null;
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (xPhase) phases.push(xPhase);
      if (yPhase) phases.push(yPhase);
    } else {
      if (yPhase) phases.push(yPhase);
      if (xPhase) phases.push(xPhase);
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
      this.scheduleWander(villagerId, 5000 + totalDistTiles * 3000);
    };

    if (phases.length === 0) {
      finish();
      return;
    }

    const runPhase = (i) => {
      if (i >= phases.length) {
        finish();
        return;
      }
      const phase = phases[i];
      sprite.play(`${villager.spriteKey}_walk_${phase.dir}`);
      const dist = Math.abs(
        phase.to - (phase.axis === 'x' ? sprite.x : sprite.y)
      );
      const tween = scene.tweens.add({
        targets: sprite,
        [phase.axis]: phase.to,
        duration: Math.max(200, (dist / TILE_SIZE) * WALK_MS_PER_TILE),
        ease: 'Linear',
        onComplete: () => runPhase(i + 1),
      });
      this.tweens.set(villagerId, tween);
    };

    runPhase(0);
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
