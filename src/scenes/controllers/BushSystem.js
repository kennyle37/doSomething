import { createInitialBushes } from '../../game/sim/bushes.js';
import { assignVillager } from '../../game/sim/assignment.js';
import { forageTick } from '../../game/sim/foraging.js';
import { TILE_SIZE, TICK_MS } from '../scene-constants.js';

export default class BushSystem {
  constructor(scene) {
    this.scene = scene;
    this.bushes = createInitialBushes();
    this.sprites = new Map();
    this.berries = 0;
    this.berryText = null;
  }

  setup() {
    const scene = this.scene;
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
      .setDepth(1000);
    scene.time.addEvent({
      delay: TICK_MS,
      loop: true,
      callback: () => this.onTick(),
    });
  }

  drawBushes() {
    const scene = this.scene;
    for (const bush of this.bushes) {
      const px = scene.originX + bush.tileX * TILE_SIZE + TILE_SIZE / 2;
      const py = scene.originY + (bush.tileY + 1) * TILE_SIZE;
      const sprite = scene.add.image(px, py, bush.spriteKey);
      sprite.setOrigin(0.5, 1);
      sprite.setScale(0.75);
      sprite.setDepth(py);
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

  assignToBush(villagerId, bush) {
    const scene = this.scene;
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    scene.wander.cancelWander(villagerId);

    const sides = [
      { workOffset: { x: -22, y: 2 }, workDir: 'right' },
      { workOffset: { x: 22, y: 2 }, workDir: 'left' },
      { workOffset: { x: 0, y: -14 }, workDir: 'down' },
    ];
    const { workOffset, workDir } =
      sides[Math.floor(Math.random() * sides.length)];

    const existingWorkers = scene.villagers.filter(
      (v) => v.assignedTo === bush.id
    ).length;
    const nudge = (existingWorkers % 3 - 1) * 6;
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

  onTick() {
    const scene = this.scene;
    const now = Date.now();
    const producers = forageTick(scene.villagers, now, TICK_MS);
    if (producers.length === 0) return;

    const producerIds = new Set(producers.map((v) => v.id));
    for (const v of scene.villagers) {
      if (producerIds.has(v.id)) v.assignedAt = now;
    }

    this.berries += producers.length;
    this.berryText.setText(`Berries: ${this.berries}`);

    const producingBushes = new Set(producers.map((v) => v.assignedTo));
    for (const bushId of producingBushes) {
      const sprite = this.sprites.get(bushId);
      if (!sprite) continue;
      const text = scene.add
        .text(sprite.x, sprite.y - 48, '+1', {
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
