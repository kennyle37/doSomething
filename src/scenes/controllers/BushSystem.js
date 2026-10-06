import { createInitialBushes } from '../../game/sim/bushes.js';
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

    // Inline +N indicator, sits right after the counter text.
    this.berryGainText = scene.add
    .text(16, 16, '', {
      fontSize: '14px',
      color: '#7CFC00',
      fontStyle: 'bold',
    })
    .setDepth(1000);
    this._gainTimer = null;

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
      // Register for drag-highlight.
      if (scene.work) scene.work.registerTarget(bush.id, bush.tileX, bush.tileY, sprite);
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
    this.scene.work.assignToTarget(villagerId, {
      tileX: bush.tileX,
      tileY: bush.tileY,
      assignedTo: bush.id,
    });
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

    // Show +N inline next to the counter, fades after 1.5s.
    const gainText = this.berryGainText;
    gainText.setText(`+${producers.length}`);
    gainText.setPosition(this.berryText.x + this.berryText.width + 8, this.berryText.y + 4);
    gainText.setAlpha(1);
    if (this._gainTimer) this._gainTimer.remove();
    this._gainTimer = scene.time.delayedCall(1500, () => gainText.setText(''));

    // Feedback only on bushes that actually produced.
    // Feedback per bush: show actual count produced there.
    const producedPerBush = new Map();
    for (const v of producers) {
      producedPerBush.set(v.assignedTo, (producedPerBush.get(v.assignedTo) || 0) + 1);
    }
    for (const [bushId, count] of producedPerBush) {
      const sprite = this.sprites.get(bushId);
      if (!sprite) continue;
      const text = scene.add
      .text(sprite.x, sprite.y - 48, `+${count}`, {
        fontSize: '26px',
        color: '#ffff88',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(1000); // above everything
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
