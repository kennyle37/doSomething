import { createStats, drainHunger, gainExp } from '../../game/sim/villagerStats.js';
import { reserveMeal, releaseMeal } from '../../game/sim/meals.js';
import { CONFIG } from '../../game/config.js';

/**
 * Owns eating: hunger drain, hungry villagers seeking meals, meal
 * reservation, walk-to-eat, EXP gain, level-ups, and manual feeding
 * (drag a meal onto a villager).
 *
 * Eating interrupts work: the villager's assignment is remembered and
 * restored after the meal. No hunger penalties (barebone).
 */
export default class EatSystem {
  constructor(scene) {
    this.scene = scene;
    this.mealDrag = null; // { mealId, origX, origY } while dragging a meal
  }

  setup() {
    const scene = this.scene;

    // Clean slate: never resume mid-meal from a save, and make sure
    // every villager has a stats block (old saves won't).
    for (const v of scene.villagers) {
      if (!v.stats) v.stats = createStats();
      if (v.state === 'eating') {
        v.state = 'idle';
        delete v.eatingMealId;
        delete v.previousAssignment;
      }
    }
    // Drop stale reservations (a save never persists them mid-walk).
    for (const m of scene.cook.meals) {
      if (m.reservedBy != null) m.reservedBy = null;
    }

    // Hunger tick (same 10s as the rest of the game).
    scene.time.addEvent({
      delay: CONFIG.tickMs,
      loop: true,
      callback: () => this.onHungerTick(),
    });

    // Drag-to-feed: meals are Phaser-draggable; dropping one on a
    // villager force-feeds them.
    scene.input.on('dragstart', (pointer, gameObject) => {
      if (gameObject.getData && gameObject.getData('mealId') != null) {
        this.mealDrag = {
          mealId: gameObject.getData('mealId'),
          origX: gameObject.x,
          origY: gameObject.y,
        };
        gameObject.setDepth(2000);
      }
    });
    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (this.mealDrag && gameObject.getData('mealId') === this.mealDrag.mealId) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    });
    scene.input.on('dragend', (pointer, gameObject) => {
      if (!this.mealDrag || gameObject.getData('mealId') !== this.mealDrag.mealId) return;
      const { mealId, origX, origY } = this.mealDrag;
      this.mealDrag = null;
      const villagerId = scene.drag.pickVillagerAt(pointer);
      if (villagerId != null) {
        if (this.feedVillager(villagerId, mealId)) {
          // Feed succeeded: ensure the dragged sprite is gone
          // (removeMeal should have destroyed it, but be safe).
          if (gameObject.active) gameObject.destroy();
          return;
        }
        gameObject.x = origX;
        gameObject.y = origY;
      } else {
        gameObject.x = origX;
        gameObject.y = origY;
      }
      gameObject.setDepth(gameObject.y - 10);
    });
  }

  /**
   * Make a meal sprite draggable for force-feeding.
   * Called by CookSystem.drawMeal.
   */
  makeMealDraggable(sprite, mealId) {
    sprite.setData('mealId', mealId);
    sprite.setInteractive({ useHandCursor: true });
    this.scene.input.setDraggable(sprite);
  }

  // --- Hunger tick ---

  onHungerTick() {
    const scene = this.scene;
    const cfg = CONFIG.eating;

    // 1. Drain hunger for everyone not currently heading to food.
    for (let i = 0; i < scene.villagers.length; i++) {
      const v = scene.villagers[i];
      if (!v.stats) {
        scene.villagers[i] = { ...v, stats: createStats() };
        continue;
      }
      if (v.state === 'eating') continue;
      scene.villagers[i] = { ...v, stats: drainHunger(v.stats, cfg.baseHungerDrain) };
    }

    // 2. Match hungry villagers to the nearest unreserved meal.
    const hungry = scene.villagers.filter(
      (v) => v.stats && v.stats.hunger < cfg.hungerThreshold && v.state !== 'eating'
    );
    for (const v of hungry) {
      const meal = this.findNearestMeal(v);
      if (!meal) continue; // stay hungry, try again next tick
      const reserved = reserveMeal(meal, v.id);
      if (!reserved) continue;
      this.replaceMeal(meal.id, reserved);
      this.sendToEat(v.id, reserved.id);
    }
  }

  findNearestMeal(v) {
    let best = null;
    let bestDist = Infinity;
    for (const m of this.scene.cook.meals) {
      if (m.rotten || m.reservedBy != null) continue;
      const d = Math.abs(m.tileX - v.tileX) + Math.abs(m.tileY - v.tileY);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    return best;
  }

  replaceMeal(mealId, newMeal) {
    const idx = this.scene.cook.meals.findIndex((m) => m.id === mealId);
    if (idx !== -1) this.scene.cook.meals[idx] = newMeal;
  }

  // --- Walk-to-eat ---

  sendToEat(villagerId, mealId) {
    const scene = this.scene;
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    const v = scene.villagers[idx];
    const meal = scene.cook.meals.find((m) => m.id === mealId);
    if (!meal) return;

    // Remember work so we can go back to it. Wanderers just go idle after.
    const previousAssignment =
      v.state === 'assigned'
        ? { assignedTo: v.assignedTo }
        : null;

    scene.wander.cancelWander(villagerId);
    scene.movement.cancel(villagerId);

    scene.villagers[idx] = {
      ...v,
      state: 'eating',
      eatingMealId: mealId,
      previousAssignment,
    };

    scene.movement.moveTo(villagerId, meal.tileX, meal.tileY, {
      onArrive: () => this.arriveAtMeal(villagerId, mealId),
    });
  }

  arriveAtMeal(villagerId, mealId) {
    const scene = this.scene;
    const meal = scene.cook.meals.find((m) => m.id === mealId);
    if (!meal || meal.rotten || meal.reservedBy !== villagerId) {
      // Meal gone or stolen: release and go back.
      if (meal && meal.reservedBy === villagerId) {
        this.replaceMeal(mealId, releaseMeal(meal));
      }
      this.finishEating(villagerId);
      return;
    }
    // Update logical position to the meal's tile (we walked here).
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx !== -1) {
      scene.villagers[idx] = {
        ...scene.villagers[idx],
        tileX: meal.tileX,
        tileY: meal.tileY,
      };
    }
    // Nudge sprite so multiple eaters on the same tile don't stack.
    const sprite = scene.renderer.getSprite(villagerId);
    if (sprite) {
      sprite.x += (Math.random() - 0.5) * 20;
      sprite.y += (Math.random() - 0.5) * 12;
    }
    this.consumeMeal(villagerId, meal);
    this.finishEating(villagerId);
  }

  // --- Consuming ---

  consumeMeal(villagerId, meal) {
    const scene = this.scene;
    scene.cook.removeMeal(meal.id);

    const isRotten = meal.rotten;
    const expGain = isRotten ? 0 : (CONFIG.eating.expPerMeal[meal.recipeId] || 0);
    const idx = scene.villagers.findIndex((x) => x.id === villagerId);
    if (idx === -1) return;
    const v = scene.villagers[idx];
    const { stats, leveledUp, newLevel } = gainExp(v.stats, expGain);
    scene.villagers[idx] = { ...v, stats: { ...stats, hunger: 100 } };

    if (isRotten) {
      // Angry red glow, no EXP, no debuff (yet).
      this.angryGlow(villagerId);
      this.floatText(villagerId, 'Yuck!', '#ff6666', 13);
    } else {
      this.happyBounce(villagerId);
      if (expGain > 0) this.floatText(villagerId, `+${expGain} EXP`, '#88ff88', 13);
    }
    if (leveledUp) {
      this.floatText(
        villagerId,
        `${v.name || 'Villager'} reached level ${newLevel}!`,
        '#ffd700',
        15
      );
      this.levelGlow(villagerId);
    }
    if (scene.save) scene.save.saveToStorage();
  }

  /**
   * Manual feed: drag a meal onto a villager. Bypasses hunger check,
   * grants EXP immediately. Returns false if the feed didn't happen.
   */
  feedVillager(villagerId, mealId) {
    const scene = this.scene;
    const meal = scene.cook.meals.find((m) => m.id === mealId);
    const idx = scene.villagers.findIndex((x) => x.id === villagerId);
    if (!meal || idx === -1) return false;
    if (meal.reservedBy != null && meal.reservedBy !== villagerId) return false;

    const v = scene.villagers[idx];
    // Was walking to a different meal? Release it and settle state first.
    if (v.state === 'eating') {
      if (v.eatingMealId != null && v.eatingMealId !== mealId) {
        const other = scene.cook.meals.find((m) => m.id === v.eatingMealId);
        if (other && other.reservedBy === villagerId) {
          this.replaceMeal(other.id, releaseMeal(other));
        }
      }
      this.finishEating(villagerId);
    }
    this.consumeMeal(villagerId, meal);
    return true;
  }

  // --- State helpers ---

  /**
   * Stop an in-progress eat walk. Used when the villager is dragged
   * or force-fed mid-walk.
   */
  cancelEat(villagerId) {
    if (this.scene.movement) this.scene.movement.cancel(villagerId);
  }

  /**
   * Interrupt eating entirely: release the reserved meal and reset to
   * idle. Called when the player drags the villager elsewhere.
   */
  interruptEat(villagerId) {
    const scene = this.scene;
    this.cancelEat(villagerId);
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    const v = scene.villagers[idx];
    if (v.eatingMealId != null) {
      const meal = scene.cook.meals.find((m) => m.id === v.eatingMealId);
      if (meal && meal.reservedBy === villagerId) {
        this.replaceMeal(meal.id, releaseMeal(meal));
      }
    }
    if (v.state === 'eating') {
      scene.villagers[idx] = {
        ...v,
        state: 'idle',
        eatingMealId: undefined,
        previousAssignment: undefined,
      };
    }
  }

  /**
   * After eating: go back to the remembered assignment, or idle + wander.
   */
  finishEating(villagerId) {
    const scene = this.scene;
    this.cancelEat(villagerId);
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    const v = scene.villagers[idx];
    const prev = v.previousAssignment;

    // Stand idle first.
    scene.villagers[idx] = {
      ...v,
      state: 'idle',
      eatingMealId: undefined,
      previousAssignment: undefined,
    };
    scene.work.playIdleAnim(villagerId);

    if (prev && prev.assignedTo != null) {
      // Walk back to work after a cooldown (don't teleport).
      const cooldown = 3000 + Math.random() * 7000;
      scene.time.delayedCall(cooldown, () => {
        // Target still exists?
        let targetTile = null;
        let isCampfire = false;
        if (prev.assignedTo === 'campfire') {
          if (scene.cook.campfireTile) {
            targetTile = scene.cook.campfireTile;
            isCampfire = true;
          }
        } else {
          const bush = scene.bushes.getBushById(prev.assignedTo);
          if (bush) targetTile = { tileX: bush.tileX, tileY: bush.tileY };
        }
        if (!targetTile) {
          scene.wander.scheduleWander(villagerId, 1000);
          return;
        }
        // Find a walkable tile adjacent to the target (target itself is blocked).
        const walkTarget = this.findWalkableNear(targetTile.tileX, targetTile.tileY);
        if (!walkTarget) {
          // No walkable tile nearby, just assign (teleport fallback).
          if (isCampfire) scene.cook.assignToCampfire(villagerId);
          else {
            const bush = scene.bushes.getBushById(prev.assignedTo);
            if (bush) scene.bushes.assignToBush(villagerId, bush);
          }
          return;
        }
        // Walk there via MovementSystem, then assign (no teleport).
        scene.movement.moveTo(villagerId, walkTarget.x, walkTarget.y, {
          onArrive: () => {
            if (isCampfire) {
              scene.cook.assignToCampfire(villagerId);
            } else {
              const bush = scene.bushes.getBushById(prev.assignedTo);
              if (bush) scene.bushes.assignToBush(villagerId, bush);
              else scene.wander.scheduleWander(villagerId, 1000);
            }
          },
        });
      });
    } else {
      // Was wandering: cooldown then wander.
      scene.wander.scheduleWander(villagerId, 3000 + Math.random() * 7000);
    }
  }

  // --- Juice ---

  /**
   * Happy bounce: the "stuffed look". Scale to 1.1x with a little hop,
   * ~2 seconds total. No custom sprites needed.
   */
  happyBounce(villagerId) {
    const scene = this.scene;
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;
    const startY = sprite.y;
    scene.tweens.add({
      targets: sprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 250,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        sprite.setScale(1);
        sprite.y = startY;
      },
    });
    scene.tweens.add({
      targets: sprite,
      y: startY - 8,
      duration: 250,
      yoyo: true,
      repeat: 3,
    });
  }

  /**
   * Level-up glow: gold flash for 3 seconds.
   */
  levelGlow(villagerId) {
    const scene = this.scene;
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;
    sprite.setTintFill(0xfff176);
    scene.time.delayedCall(3000, () => {
      if (sprite.active) sprite.clearTint();
    });
  }

  angryGlow(villagerId) {
    const scene = this.scene;
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;
    sprite.setTintFill(0xff4444);
    // Angry shake.
    scene.tweens.add({
      targets: sprite,
      x: sprite.x + 4,
      duration: 80,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (sprite.active) sprite.clearTint();
      },
    });
  }

  floatText(villagerId, msg, color, fontSize = 13) {
    const scene = this.scene;
    const sprite = scene.renderer.getSprite(villagerId);
    if (!sprite) return;
    const text = scene.add
    .text(sprite.x, sprite.y - 40, msg, {
      fontSize: `${fontSize}px`,
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(1000);
    scene.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    });
  }

  // Reuse the drag manager's closest-villager picker.
  pickVillagerAt(pointer) {
    return this.scene.drag.pickVillagerAt(pointer);
  }

  /**
   * Find a walkable tile adjacent to (or at) the given tile.
   * Used for walking back to blocked work targets (bush, campfire).
   */
  findWalkableNear(tileX, tileY) {
    const scene = this.scene;
    const candidates = [
      { x: tileX, y: tileY },
      { x: tileX + 1, y: tileY },
      { x: tileX - 1, y: tileY },
      { x: tileX, y: tileY + 1 },
      { x: tileX, y: tileY - 1 },
    ];
    for (const c of candidates) {
      if (c.x < 0 || c.x >= scene.grid.width || c.y < 0 || c.y >= scene.grid.height) continue;
      if (!scene.blockedTiles.has(`${c.x},${c.y}`)) return c;
    }
    return null;
  }

  /**
   * Offline priority: lower runs first. Berries=0, cooking=10, eating=20.
   */
  get offlinePriority() { return 20; }

  /**
   * Format the offline result for the "While you were away" toast.
   */
  offlineToast({ mealsEaten, levelsGained }) {
    const parts = [];
    if (mealsEaten > 0) parts.push(`${mealsEaten} meals eaten`);
    if (levelsGained > 0) parts.push(`${levelsGained} level-ups`);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  /**
   * Simulate eating while the tab was closed.
   * Villagers drain hunger, hungry ones auto-eat available meals (no walking),
   * gaining EXP and leveling up. Returns { mealsEaten, levelsGained }.
   */
  simulateOffline(elapsedMs) {
    const scene = this.scene;
    const cfg = CONFIG.eating;
    const elapsedSec = elapsedMs / 1000;
    // Hunger drains per 10s tick; convert to per-second.
    const drainPerSec = cfg.baseHungerDrain / 10;

    let mealsEaten = 0;
    let levelsGained = 0;

    for (let i = 0; i < scene.villagers.length; i++) {
      const v = scene.villagers[i];
      if (!v.stats) {
        scene.villagers[i] = { ...v, stats: createStats() };
        continue;
      }

      // Drain hunger for elapsed time.
      let stats = v.stats;
      const totalDrain = drainPerSec * elapsedSec;
      // Apply drain in chunks to avoid floating point issues.
      stats = { ...stats, hunger: Math.max(0, stats.hunger - totalDrain) };

      // If hungry and meals available, eat (no walking offline).
      // Villagers eat until full or meals run out.
      while (stats.hunger < cfg.hungerThreshold) {
        const meal = scene.cook.meals.find((m) => !m.rotten && m.reservedBy == null);
        if (!meal) break; // no food, stay hungry

        // Consume the meal.
        scene.cook.removeMeal(meal.id);
        mealsEaten++;

        const isRotten = meal.rotten; // always false here (we filtered)
        const expGain = CONFIG.eating.expPerMeal[meal.recipeId] || 0;
        const result = gainExp(stats, expGain);
        stats = { ...result.stats, hunger: 100 };
        if (result.leveledUp) levelsGained++;
      }

      scene.villagers[i] = { ...v, stats };
    }

    return { mealsEaten, levelsGained };
  }
}
