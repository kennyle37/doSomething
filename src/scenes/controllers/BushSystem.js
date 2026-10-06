import { createInitialBushes } from '../../game/sim/bushes.js';
import { assignVillager } from '../../game/sim/assignment.js';
import { forageTick } from '../../game/sim/foraging.js';
import { CONFIG } from '../../game/config.js';
import { TILE_SIZE } from '../scene-constants.js';

/**
 * Owns everything bush: data, sprites, assignment visuals, the foraging
 * tick, harvest feedback, and the berry counter.
 */
export default class BushSystem {
  constructor(scene) {
    this.scene = scene;
    this.bushes = createInitialBushes();
    this.sprites = new Map(); // bush id -> sprite
    this.berries = 0;
    this.berryText = null;
  }

  setup() {
    const scene = this.scene;
    // Bush tiles are blocked for wandering (but droppable for assignment).
    for (const b of this.bushes) {
      scene.blockedTiles.add(`${b.tileX},${b.tileY}`);
    }
    this.drawBushes();

    this.berryText = scene.add
    .text(16, 16, 'Berries: 0', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    })
    .setDepth(1000); // above Y-sorted sprites

    scene.time.addEvent({
      delay: CONFIG.tickMs,
      loop: true,
      callback: () => this.onTick(),
    });
  }

  // Swap this when bush art changes; everything else stays.
  drawBushes() {
    const scene = this.scene;
    for (const bush of this.bushes) {
      const px = scene.originX + bush.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = scene.originY + (bush.tileY + 1) * TILE_SIZE;
      const sprite = scene.add.image(px, py, bush.spriteKey);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(0.75);
      sprite.setDepth(py); // pure Y-sort
      sprite.setData('bushId', bush.id);
      this.sprites.set(bush.id, sprite);
    }
  }

  getBushAt(tileX, tileY) {
    return this.bushes.find((b) => b.tileX === tileX && b.tileY === tileY);
  }

  getBushById(id) {
    return this.bushes.find((b) => b.id === id);
  }

  // Assign a villager to a bush. They stand on the bush tile at a random
  // side (left, right, or top), facing the bush. Wandering stops.
  assignToBush(villagerId, bush) {
    const scene = this.scene;
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    scene.wander.cancelWander(villagerId);

    const sides = CONFIG.workSides.map((s) => ({
      workOffset: { ...s.offset },
      workDir: s.dir,
    }));
    const { workOffset, workDir } =
      sides[Math.floor(Math.random() * sides.length)];

    // Nudge apart when multiple workers share a bush, so they're all visible.
    const existingWorkers = scene.villagers.filter(
      (v) => v.assignedTo === bush.id
    ).length;
    const nudge = (existingWorkers % 3 - 1) * 6; // -6, 0, 6
    if (workDir === 'left' || workDir === 'right') {
      workOffset.y += nudge;
    } else {
      workOffset.x += nudge;
    }

    scene.villagers[idx] = {
      ...assignVillager(scene.villagers[idx], bush.id),
      tileX: bush.tileX,
      tileY: bush.tileY,
      workOffset,
      workDir,
      assignedAt: Date.now(),
    };
    scene.drag.selectedVillager = null;

    const sprite = scene.renderer.getSprite(villagerId);
    const villager = scene.villagers[idx];
    sprite.play(`${villager.spriteKey}_work_${workDir}`);
    scene.renderer.layoutVillagers();
    scene.drag.updateSelectionRing();
  }

  // Harvest tick: villagers who've worked a full interval produce berries.
  onTick() {
    const scene = this.scene;
    const now = Date.now();
    const producers = forageTick(scene.villagers, now, CONFIG.tickMs);
    if (producers.length === 0) return;

    // Reset their work clocks so they produce every interval going forward.
    const producerIds = new Set(producers.map((v) => v.id));
    for (const v of scene.villagers) {
      if (producerIds.has(v.id)) v.assignedAt = now;
    }

    this.berries += producers.length;
    this.berryText.setText(`Berries: ${this.berries}`);

    // Feedback only on bushes that actually produced.
    const producedPerBush = new Map();
    for (const v of producers) {
      producedPerBush.set(v.assignedTo, (producedPerBush.get(v.assignedTo) || 0) + 1);
    }
    for (const [bushId, count] of producedPerBush) {
      const sprite = this.sprites.get(bushId);
      if (!sprite) continue;
      const text = scene.add
      .text(sprite.x, sprite.y - 48, `+${count}`, {
        fontSize: '18px',
        color: '#ffff88',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
      scene.tweens.add({
        targets: text,
        y: text.y - 30,
        alpha: 0,
        duration: 1200,
        ease: 'Power1',
        onComplete: () => text.destroy(),
      });
      scene.tweens.add({
        targets: sprite,
        scaleX: 1.15,
        scaleY: 0.9,
        duration: 150,
        yoyo: true,
        ease: 'Power2',
      });
    }
  }
}
