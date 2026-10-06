import {
  canStartRecipe,
  startCooking,
  cookingTick,
  queueAdd,
  queueRemove,
  queueNext,
} from '../../game/sim/cooking.js';
import {
  createMeal,
  updateMeals,
  assignMeals,
  expForMeal,
} from '../../game/sim/meals.js';
import { CONFIG } from '../../game/config.js';
import { TILE_SIZE } from '../scene-constants.js';

/**
 * Owns everything cooking: campfire, cook assignment, recipe queue,
 * cooking progress, meal drops, expiration, and eating.
 */
export default class CookSystem {
  constructor(scene) {
    this.scene = scene;
    this.campfire = null; // sprite
    this.campfireTile = null; // { tileX, tileY }
    this.queue = []; // recipe IDs
    this.activeJob = null; // current cooking job
    this.meals = []; // meal objects on ground
    this.mealSprites = new Map(); // meal id -> sprite
    this.mealText = null; // meal counter
    this.menuOpen = false;
  }

  setup() {
    const scene = this.scene;
    const cfg = CONFIG.cooking;

    // Campfire tile is blocked.
    this.campfireTile = { tileX: cfg.campfire.tileX, tileY: cfg.campfire.tileY };
    scene.blockedTiles.add(`${this.campfireTile.tileX},${this.campfireTile.tileY}`);

    this.drawCampfire();

    // Meal counter UI (below berry counter).
    this.mealText = scene.add
    .text(16, 48, 'Meals: 0', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    })
    .setDepth(1000);

    // Cooking tick (same 10s as foraging).
    scene.time.addEvent({
      delay: CONFIG.tickMs,
      loop: true,
      callback: () => this.onCookTick(),
    });

    // Eat tick (villagers seek meals). PAUSED for now - eating is a separate spec.
    // scene.time.addEvent({
    //   delay: cfg.eatTickMs,
    //   loop: true,
    //   callback: () => this.onEatTick(),
    // });

    // Meal expiration check (every 30s).
    scene.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => this.onExpiryCheck(),
    });

    // Make campfire tappable for recipe menu.
    // Tight hit area (just the fire, not the full sprite frame).
    this.campfire.setInteractive({
      hitArea: new Phaser.Geom.Circle(24, 32, 16),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    this.campfire.on('pointerdown', () => this.showRecipeMenu());
    // Hover: scale up slightly (shows it's clickable).
    this.campfire.on('pointerover', () => {
      if (!scene.drag.dragging) this.campfire.setScale(0.75 * 1.15);
    });
    this.campfire.on('pointerout', () => {
      if (!scene.drag.dragging) this.campfire.setScale(0.75);
    });
  }

  syncCookAnims() {
    const scene = this.scene;
    const isCooking = this.activeJob != null;
    for (const v of scene.villagers) {
      if (v.assignedTo === 'campfire') {
        if (isCooking) scene.work.playWorkAnim(v.id);
        else scene.work.playIdleAnim(v.id);
      }
    }
  }

  drawCampfire() {
    const scene = this.scene;
    const { tileX, tileY } = this.campfireTile;
    const px = scene.originX + tileX * TILE_SIZE + TILE_SIZE / 2;
    // Feet at tile bottom (same as bushes and villagers) for consistent Y-sort.
    const py = scene.originY + (tileY + 1) * TILE_SIZE;

    this.campfire = scene.add
    .sprite(px, py, 'campfire')
    .setOrigin(0.5, 1) // bottom-anchored, like bushes
    .setDepth(py)
    .setScale(0.75); // same as bushes

    // Register for drag-highlight.
    if (scene.work) scene.work.registerTarget('campfire', tileX, tileY, this.campfire);

    // Play fire animation.
    this.campfire.play('campfire_burn');
  }

  // --- Cook assignment (via shared WorkSystem) ---

  assignToCampfire(villagerId) {
    const cfg = CONFIG.cooking.campfire;
    this.scene.work.assignToTarget(villagerId, {
      tileX: this.campfireTile.tileX,
      tileY: this.campfireTile.tileY,
      assignedTo: 'campfire',
      workOffsetScale: cfg.workOffsetScale || 1.5,
    });
  }

  getCookCount() {
    return this.scene.villagers.filter((v) => v.assignedTo === 'campfire').length;
  }

  // --- Recipe menu (tap campfire) ---
  // HTML overlay. Click a recipe to add to queue.

  showRecipeMenu() {
    if (this.menuOpen) return;
    this.menuOpen = true;

    const scene = this.scene;
    const recipes = CONFIG.cooking.recipes;
    const cookCount = this.getCookCount();

    const blocker = document.createElement('div');
    blocker.style.cssText =
      'position: fixed; inset: 0; background: rgba(0,0,0,0.5);' +
      'z-index: 2000; display: flex; align-items: center; justify-content: center;';
    document.body.appendChild(blocker);

    const dialog = document.createElement('div');
    dialog.style.cssText =
      'background: #2d2d2d; border-radius: 16px; padding: 20px;' +
      'width: 340px; max-height: 80vh; overflow-y: auto;' +
      'color: #fff; font-family: monospace;';
    blocker.appendChild(dialog);

    const title = document.createElement('div');
    title.style.cssText = 'font-size: 18px; margin-bottom: 12px; text-align: center;';
    title.textContent = 'Campfire (' + cookCount + ' cooks)';
    dialog.appendChild(title);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size: 12px; color: #aaa; margin-bottom: 8px; text-align: center;';
    hint.textContent = 'Click a recipe to add to queue';
    dialog.appendChild(hint);

    // Queue display with removable items.
    const queueDiv = document.createElement('div');
    queueDiv.style.cssText =
      'background: #222; border-radius: 8px; padding: 10px 12px;' +
      'margin: 12px 0; font-size: 12px; color: #ccc;';
    const updateQueueText = () => {
      queueDiv.innerHTML = '';
      const titleDiv = document.createElement('div');
      titleDiv.style.marginBottom = '6px';
      titleDiv.textContent = 'Queue:';
      queueDiv.appendChild(titleDiv);

      if (this.queue.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.color = '#888';
        emptyDiv.textContent = '  (empty)';
        queueDiv.appendChild(emptyDiv);
      } else {
        // Group consecutive identical for display, but track original indices.
        const groups = [];
        this.queue.forEach((recipeId, idx) => {
          const last = groups[groups.length - 1];
          if (last && last.recipeId === recipeId) last.indices.push(idx);
          else groups.push({ recipeId, indices: [idx] });
        });
        groups.forEach((g, i) => {
          const r = recipes.find((x) => x.id === g.recipeId);
          const name = r ? r.name : g.recipeId;
          const count = g.indices.length;
          const row = document.createElement('div');
          row.style.cssText =
            'display: flex; justify-content: space-between; align-items: center;' +
            'padding: 4px 0;';
          const label = document.createElement('span');
          label.textContent = `  ${i + 1}. ${name}` + (count > 1 ? ` (x${count})` : '');
          const xBtn = document.createElement('button');
          xBtn.textContent = 'X';
          xBtn.style.cssText =
            'background: #553333; color: #ff8888; border: none; border-radius: 4px;' +
            'width: 22px; height: 22px; cursor: pointer; font-size: 12px;';
          xBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Remove one instance (the first of this group).
            const removeIdx = g.indices[0];
            this.queue = [
              ...this.queue.slice(0, removeIdx),
              ...this.queue.slice(removeIdx + 1),
            ];
            if (scene.save) scene.save.saveToStorage();
            updateQueueText();
          });
          row.appendChild(label);
          row.appendChild(xBtn);
          queueDiv.appendChild(row);
        });
      }
      if (this.activeJob) {
        const r = recipes.find((x) => x.id === this.activeJob.recipeId);
        const cookingDiv = document.createElement('div');
        cookingDiv.style.cssText = 'margin-top: 8px; color: #ffdd88;';
        cookingDiv.textContent =
          `Cooking: ${r ? r.name : '?'} (${this.activeJob.ticksLeft} left)`;
        queueDiv.appendChild(cookingDiv);
      }
    };

    recipes.forEach((r) => {
      const row = document.createElement('div');
      row.style.cssText =
        'background: #3a3a3a; border-radius: 8px; padding: 10px 12px;' +
        'margin-bottom: 8px; cursor: pointer; user-select: none;';
      const nameDiv = document.createElement('div');
      nameDiv.style.fontWeight = 'bold';
      nameDiv.textContent = r.name;
      const infoDiv = document.createElement('div');
      infoDiv.style.cssText = 'font-size: 12px; color: #ccc;';
      infoDiv.textContent =
        r.berriesCost + ' berries | ' + r.cooksRequired + ' cooks | ' + r.exp + ' EXP';
      row.appendChild(nameDiv);
      row.appendChild(infoDiv);
      row.addEventListener('mouseenter', () => { row.style.background = '#4a4a4a'; });
      row.addEventListener('mouseleave', () => { row.style.background = '#3a3a3a'; });
      row.addEventListener('click', () => {
        this.queue = queueAdd(this.queue, r.id);
        if (scene.save) scene.save.saveToStorage();
        updateQueueText();
      });
      dialog.appendChild(row);
    });

    updateQueueText();
    dialog.appendChild(queueDiv);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText =
      'width: 100%; padding: 10px; background: #666; color: #fff;' +
      'border: none; border-radius: 8px; cursor: pointer; font-size: 14px;';
    closeBtn.addEventListener('click', () => this.closeRecipeMenu());
    dialog.appendChild(closeBtn);

    blocker.addEventListener('pointerdown', (e) => {
      if (e.target === blocker) this.closeRecipeMenu();
    });

    this.menuBlocker = blocker;
  }

  closeRecipeMenu() {
    if (this.menuBlocker) {
      this.menuBlocker.remove();
      this.menuBlocker = null;
    }
    this.menuOpen = false;
  }

  // --- Cooking tick ---

  onCookTick() {
    const scene = this.scene;
    const recipes = CONFIG.cooking.recipes;
    const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

    // If not cooking, find the first queue item we can start.
    // Skips recipes that need more cooks than we have.
    if (!this.activeJob && this.queue.length > 0) {
      const cookCount = this.getCookCount();
      let startedIdx = -1;
      for (let i = 0; i < this.queue.length; i++) {
        const recipe = recipeMap[this.queue[i]];
        if (!recipe) continue;
        const check = canStartRecipe(recipe, cookCount, scene.bushes.berries);
        if (check.ok) {
          const { job, berriesLeft } = startCooking(recipe, scene.bushes.berries);
          this.activeJob = job;
          startedIdx = i;
          scene.bushes.berries = berriesLeft;
          scene.bushes.berryText.setText(`Berries: ${berriesLeft}`);
          for (const v of scene.villagers) {
            if (v.assignedTo === 'campfire') {
              scene.work.playWorkAnim(v.id);
            }
          }
          break;
        }
      }
      // Remove the started recipe from queue (others stay in order).
      if (startedIdx >= 0) {
        this.queue = [
          ...this.queue.slice(0, startedIdx),
          ...this.queue.slice(startedIdx + 1),
        ];
      }
    }

    // Update cook animations: work only when actively cooking, idle otherwise.
    // (Queued but waiting = idle, not smacking the air.)
    this.syncCookAnims();

    // Advance active job.
    if (this.activeJob) {
      const recipe = recipeMap[this.activeJob.recipeId];
      const cookCount = this.getCookCount();
      const { done, job } = cookingTick(this.activeJob, cookCount, recipe.cooksRequired);
      this.activeJob = job;
      if (done) {
        this.completeCooking(recipe);
        this.activeJob = null;
        // Cooks stay in work anim (tending the fire) while assigned.
      }
    }
  }

  completeCooking(recipe) {
    const scene = this.scene;
    // Drop meal on random adjacent tile (including diagonals).
    const { tileX, tileY } = this.campfireTile;
    const adj = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = tileX + dx, y = tileY + dy;
        if (x >= 0 && x < 8 && y >= 0 && y < 8 &&
          !scene.blockedTiles.has(`${x},${y}`)) {
          adj.push({ x, y });
        }
      }
    }
    if (adj.length === 0) return;
    const spot = adj[Math.floor(Math.random() * adj.length)];

    // Random offset (not grid-aligned) for natural scatter.
    const offsetX = (Math.random() - 0.5) * 28;
    const offsetY = (Math.random() - 0.5) * 20;

    const meal = createMeal(recipe.id, spot.x, spot.y, offsetX, offsetY);
    this.meals.push(meal);
    this.drawMeal(meal, true); // pop-out animation

    // Update meal counter.
    const fresh = this.meals.filter((m) => !m.rotten).length;
    this.mealText.setText(`Meals: ${fresh}`);

    // Floating text.
    const px = scene.originX + spot.x * TILE_SIZE + TILE_SIZE / 2 + offsetX;
    const py = scene.originY + spot.y * TILE_SIZE + TILE_SIZE / 2 + offsetY;
    const text = scene.add
    .text(px, py - 30, `${recipe.name} ready!`, {
      fontSize: '14px', color: '#ffdd88', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(1000);
    scene.tweens.add({
      targets: text, y: text.y - 20, alpha: 0,
      duration: 1500, onComplete: () => text.destroy(),
    });
  }

  drawMeal(meal, animate = false) {
    const scene = this.scene;
    const px = scene.originX + meal.tileX * TILE_SIZE + TILE_SIZE / 2 + meal.offsetX;
    const py = scene.originY + meal.tileY * TILE_SIZE + TILE_SIZE / 2 + meal.offsetY;
    const key = meal.rotten ? 'mushroom_orange_02' : 'planter_green_01';
    const sprite = scene.add
    .image(px, py, key)
    .setDepth(py - 10)
    .setScale(0.25);
    this.mealSprites.set(meal.id, sprite);

    // Pop-out animation: scale up with bounce + slight upward hop.
    if (animate) {
      sprite.setScale(0);
      scene.tweens.add({
        targets: sprite,
        scaleX: 0.25,
        scaleY: 0.25,
        duration: 400,
        ease: 'Back.easeOut',
      });
      scene.tweens.add({
        targets: sprite,
        y: py - 12,
        duration: 200,
        ease: 'Quad.easeOut',
        yoyo: true,
      });
    }
  }

  // --- Expiration ---

  onExpiryCheck() {
    const scene = this.scene;
    const cfg = CONFIG.cooking;
    const { meals, despawned } = updateMeals(
      this.meals, Date.now(), cfg.mealExpiryMs, cfg.rottenDespawnMs
    );

    // Update rotten sprites.
    for (const m of meals) {
      if (m.rotten) {
        const sprite = this.mealSprites.get(m.id);
        if (sprite) {
          sprite.setTexture('mushroom_orange_02');
        }
      }
    }

    // Remove despawned.
    for (const id of despawned) {
      const sprite = this.mealSprites.get(id);
      if (sprite) sprite.destroy();
      this.mealSprites.delete(id);
    }

    this.meals = meals;
    const fresh = this.meals.filter((m) => !m.rotten).length;
    this.mealText.setText(`Meals: ${fresh}`);
  }

  // --- Eating ---

  onEatTick() {
    const scene = this.scene;
    const recipes = CONFIG.cooking.recipes;
    const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

    const assignments = assignMeals(scene.villagers, this.meals);
    if (assignments.size === 0) return;

    for (const [villagerId, mealId] of assignments) {
      const meal = this.meals.find((m) => m.id === mealId);
      if (!meal) continue;

      // Remove meal.
      this.meals = this.meals.filter((m) => m.id !== mealId);
      const sprite = this.mealSprites.get(mealId);
      if (sprite) sprite.destroy();
      this.mealSprites.delete(mealId);

      // Award EXP.
      const v = scene.villagers.find((x) => x.id === villagerId);
      if (v) {
        v.exp = (v.exp || 0) + expForMeal(meal.recipeId, recipeMap, false);
        // Floating +EXP text.
        const vsprite = scene.renderer.getSprite(villagerId);
        if (vsprite) {
          const text = scene.add
          .text(vsprite.x, vsprite.y - 40, `+${expForMeal(meal.recipeId, recipeMap)} EXP`, {
            fontSize: '13px', color: '#88ff88', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(1000);
          scene.tweens.add({
            targets: text, y: text.y - 20, alpha: 0,
            duration: 1200, onComplete: () => text.destroy(),
          });
        }
      }
    }

    const fresh = this.meals.filter((m) => !m.rotten).length;
    this.mealText.setText(`Meals: ${fresh}`);
  }

  // --- Save integration ---

  getSaveData() {
    return {
      queue: this.queue,
      activeJob: this.activeJob,
      meals: this.meals,
      mealCount: this.meals.filter((m) => !m.rotten).length,
    };
  }

  loadSaveData(data) {
    if (!data) return;
    this.queue = data.queue || [];
    this.activeJob = data.activeJob || null;
    this.meals = data.meals || [];
    // Redraw meal sprites.
    for (const meal of this.meals) {
      this.drawMeal(meal);
    }
    const fresh = this.meals.filter((m) => !m.rotten).length;
    if (this.mealText) this.mealText.setText(`Meals: ${fresh}`);
  }
}
