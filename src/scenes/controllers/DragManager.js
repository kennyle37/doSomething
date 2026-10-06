import Phaser from 'phaser';
import { moveVillager } from '../../game/sim/movement.js';
import { unassignVillager } from '../../game/sim/assignment.js';
import { TILE_SIZE, TAP_THRESHOLD } from '../scene-constants.js';

export default class DragManager {
  constructor(scene) {
    this.scene = scene;
    this.dragging = null;
    this.selectedVillager = null;
    this.selectionRing = scene.add
      .circle(0, 0, 26)
      .setStrokeStyle(3, 0xffffff)
      .setVisible(false)
      .setDepth(1000); // above Y-sorted sprites
  }

  setupInput() {
    const scene = this.scene;
    scene.input.on('pointermove', (pointer) => {
      if (this.dragging && pointer.isDown) {
        const sprite = scene.renderer.getSprite(this.dragging.villagerId);
        if (sprite) {
          sprite.x = pointer.x;
          sprite.y = pointer.y;
          sprite.setDepth(pointer.y + 1);
        }
        const tileX = Math.floor((pointer.x - scene.originX) / TILE_SIZE);
        const tileY = Math.floor((pointer.y - scene.originY) / TILE_SIZE);
        for (const [id, bushSprite] of scene.bushes.sprites) {
          const bush = scene.bushes.getBushById(id);
          const isHover = bush.tileX === tileX && bush.tileY === tileY;
          bushSprite.setTint(isHover ? 0xaaffaa : 0xffffff);
        }
      }
    });

    scene.input.on('pointerup', (pointer) => {
      if (!this.dragging) return;
      for (const [, bushSprite] of scene.bushes.sprites) {
        bushSprite.clearTint();
      }
      const { villagerId, downX, downY } = this.dragging;
      this.dragging = null;
      const sprite = scene.renderer.getSprite(villagerId);
      if (sprite) sprite.setScale(1);
      const dist = Phaser.Math.Distance.Between(downX, downY, pointer.x, pointer.y);
      if (dist < TAP_THRESHOLD) {
        this.handleVillagerTap(villagerId);
      } else {
        const tileX = Math.floor((pointer.x - scene.originX) / TILE_SIZE);
        const tileY = Math.floor((pointer.y - scene.originY) / TILE_SIZE);
        const tileCenterX = scene.originX + tileX * TILE_SIZE + TILE_SIZE / 2;
        scene.dropOffsets.set(villagerId, pointer.x - tileCenterX);
        this.dropVillager(villagerId, tileX, tileY);
      }
    });
  }

  setupTileTap() {
    const scene = this.scene;
    const zone = scene.add
      .zone(
        scene.originX + (scene.grid.width * TILE_SIZE) / 2,
        scene.originY + (scene.grid.height * TILE_SIZE) / 2,
        scene.grid.width * TILE_SIZE,
        scene.grid.height * TILE_SIZE
      )
      .setInteractive();
    zone.setDepth(-1);
    zone.on('pointerdown', (pointer) => {
      if (this.selectedVillager == null) return;
      const tileX = Math.floor((pointer.x - scene.originX) / TILE_SIZE);
      const tileY = Math.floor((pointer.y - scene.originY) / TILE_SIZE);
      scene.dropOffsets.set(this.selectedVillager, 0);
      this.dropVillager(this.selectedVillager, tileX, tileY);
    });
  }

  pickVillagerAt(pointer) {
    const scene = this.scene;
    const hits = scene.input
      .hitTestPointer(pointer)
      .filter((obj) => obj.getData && obj.getData('villagerId') != null);
    if (hits.length === 0) return null;
    let best = hits[0];
    let bestDist = Infinity;
    for (const obj of hits) {
      const d = Phaser.Math.Distance.Between(pointer.x, pointer.y, obj.x, obj.y - 24);
      if (d < bestDist) {
        bestDist = d;
        best = obj;
      }
    }
    return best.getData('villagerId');
  }

  dropVillager(villagerId, tileX, tileY) {
    const scene = this.scene;
    const bush = scene.bushes.getBushAt(tileX, tileY);
    if (bush) {
      scene.bushes.assignToBush(villagerId, bush);
      return;
    }
    const idx = scene.villagers.findIndex((v) => v.id === villagerId);
    if (idx === -1) return;
    const moved = moveVillager(
      unassignVillager(scene.villagers[idx]),
      tileX,
      tileY,
      scene.grid.width,
      scene.grid.height,
      scene.blockedTiles
    );
    delete moved.workOffset;
    delete moved.workDir;
    scene.villagers[idx] = moved;
    this.selectedVillager = null;
    scene.renderer.layoutVillagers();
    if (moved.state === 'idle') {
      scene.wander.scheduleWander(villagerId, 1000);
    }
  }

  handleVillagerTap(villagerId) {
    this.selectedVillager =
      this.selectedVillager === villagerId ? null : villagerId;
    this.updateSelectionRing();
  }

  updateSelectionRing() {
    if (this.selectedVillager == null) {
      this.selectionRing.setVisible(false);
      return;
    }
    const sprite = this.scene.renderer.getSprite(this.selectedVillager);
    if (!sprite) {
      this.selectionRing.setVisible(false);
      return;
    }
    this.selectionRing.setPosition(sprite.x, sprite.y - 24).setVisible(true);
  }
}
