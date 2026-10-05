import { createInitialBushes } from '../../game/sim/bushes.js';
import { assignVillager } from '../../game/sim/assignment.js';
import { forageTick } from '../../game/sim/foraging.js';
import { TILE_SIZE, TICK_MS } from '../scene-constants.js';

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
      .setDepth(20);

    scene.time.addEvent({
      delay: TICK_MS,
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

  // Find a free adjacent tile for a villager to stand on when assigned.
  // Prefers the direction they came from (dropX, dropY). Returns null if
  // none free.
  findWorkTile(bush, preferX, preferY) {
    const scene = this.scene;
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    dirs.sort((a, b) => {
      const da =
        Math.abs(bush.tileX + a[0] - preferX) +
        Math.abs(bush.tileY + a[1] - preferY);
      const db =
        Math.abs(bush.tileX + b[0] - preferX) +
        Math.abs(bush.tileY + b[1] - preferY);
      return da - db;
    });
    for (const [dx, dy] of dirs) {
      const tx = bush.tileX + dx;
      const ty = bush.tileY + dy;
      if (tx < 0 || tx >= scene.grid.width || ty < 0 || ty >= scene.grid.height)
        continue;
      if (scene.blockedTiles.has(`${tx},${ty}`)) continue;
      return { x: tx, y: ty };
    }
    return null;
  }

  // Which way is the bush from the villager? For the work animation.
  getWorkDir(vx, vy, bx, by) {
    const dx = bx - vx;
    const dy = by - vy;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  // Assign a villager to a bush. They move to an adjacent tile, face the
  // bush, and play the work animation. Wandering stops.
  assignToBush(villagerId, bush, dropX, dropY) {
    const scene = this.scene;
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    scene.wander.cancelWander(villagerId);

    const workTile = this.findWorkTile(bush, dropX, dropY);
    const tx = workTile ? workTile.x : bush.tileX;
    const ty = workTile ? workTile.y : bush.tileY;

    scene.villagers[idx] = {
      ...assignVillager(scene.villagers[idx], bush.id),
      tileX: tx,
      tileY: ty,
    };
    scene.drag.selectedVillager = null;

    const sprite = scene.renderer.getSprite(villagerId);
    const px = scene.originX + tx * TILE_SIZE + TILE_SIZE / 2;
    const py = scene.originY + (ty + 1) * TILE_SIZE;
    const dir = this.getWorkDir(tx, ty, bush.tileX, bush.tileY);
    const villager = scene.villagers[idx];
    sprite.play(`${villager.spriteKey}_work_${dir}`);
    scene.tweens.add({
      targets: sprite,
      x: px,
      y: py,
      duration: 300,
      ease: 'Power2',
    });
    scene.drag.updateSelectionRing();
  }

  // Harvest tick: assigned villagers produce berries.
  onTick() {
    const scene = this.scene;
    const produced = forageTick(scene.villagers);
    if (produced === 0) return;
    this.berries += produced;
    this.berryText.setText(`Berries: ${this.berries}`);

    // Feedback per bush with workers: floating "+1" and wobble.
    const bushesWithWorkers = new Set(
      scene.villagers
        .filter((v) => v.state === 'assigned')
        .map((v) => v.assignedTo)
    );
    for (const bushId of bushesWithWorkers) {
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
