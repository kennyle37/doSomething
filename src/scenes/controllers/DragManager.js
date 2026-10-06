import Phaser from 'phaser';
import { moveVillager } from '../../game/sim/movement.js';
import { unassignVillager } from '../../game/sim/assignment.js';
import { TILE_SIZE, TAP_THRESHOLD } from '../scene-constants.js';

/**
 * Owns all pointer input: manual drag-and-drop, tap selection, tap-tap
 * fallback, and bush hover glow while dragging.
 */
export default class DragManager {
  constructor(scene) {
    this.scene = scene;
    this.dragging = null; // { villagerId, downX, downY } or null
    this.selectedVillager = null;
    // Selection ring removed - Kenny doesn't want the white circle.
  }

  setupInput() {
    const scene = this.scene;

    // Manual drag handling (scene level) so we can pick the closest
    // villager in a cluster instead of just the topmost sprite.
    scene.input.on('pointermove', (pointer) => {
      if (this.dragging && pointer.isDown) {
        const sprite = scene.renderer.getSprite(this.dragging.villagerId);
        if (sprite) {
          sprite.x = pointer.x;
          sprite.y = pointer.y;
          sprite.setDepth(pointer.y + 1); // Y-sort, just above drop point
        }
        // Highlight work target under pointer while dragging.
        const tileX = Math.floor((pointer.x - scene.originX) / TILE_SIZE);
        const tileY = Math.floor((pointer.y - scene.originY) / TILE_SIZE);
        scene.work.highlightAt(tileX, tileY);
      }
    });

    scene.input.on('pointerup', (pointer) => {
      if (!this.dragging) return;
      // Clear highlight.
      scene.work.clearHighlight();
      const { villagerId, downX, downY } = this.dragging;
      this.dragging = null;
      const sprite = scene.renderer.getSprite(villagerId);
      if (sprite) sprite.setScale(1);
      const dist = Phaser.Math.Distance.Between(
        downX,
        downY,
        pointer.x,
        pointer.y
      );
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

  // Tap-tap fallback: tap a tile to move the selected villager there.
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
    // Below the villager sprites, or it eats their drag events.
    zone.setDepth(-1);
    zone.on('pointerdown', (pointer) => {
      if (this.selectedVillager == null) return;
      const tileX = Math.floor((pointer.x - scene.originX) / TILE_SIZE);
      const tileY = Math.floor((pointer.y - scene.originY) / TILE_SIZE);
      scene.dropOffsets.set(this.selectedVillager, 0);
      this.dropVillager(this.selectedVillager, tileX, tileY);
    });
  }

  // Among villager sprites under the pointer, return the id of the one
  // whose center is closest. Lets you grab either villager in a cluster.
  pickVillagerAt(pointer) {
    const scene = this.scene;
    const hits = scene.input
    .hitTestPointer(pointer)
    .filter((obj) => obj.getData && obj.getData('villagerId') != null);
    if (hits.length === 0) return null;
    let best = hits[0];
    let bestDist = Infinity;
    for (const obj of hits) {
      const d = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        obj.x,
        obj.y - 24 // sprite center (origin is at feet)
      );
      if (d < bestDist) {
        bestDist = d;
        best = obj;
      }
    }
    return best.getData('villagerId');
  }

  dropVillager(villagerId, tileX, tileY) {
    const scene = this.scene;
    // Dropped on a bush? Assign.
    const bush = scene.bushes.getBushAt(tileX, tileY);
    if (bush) {
      scene.bushes.assignToBush(villagerId, bush);
      return;
    }

    // Dropped on campfire? Assign as cook.
    if (scene.cook && scene.cook.campfireTile &&
      tileX === scene.cook.campfireTile.tileX &&
      tileY === scene.cook.campfireTile.tileY) {
      scene.cook.assignToCampfire(villagerId);
      return;
    }

    // Otherwise: normal move (unassigns if they were working).
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
    // Clear work positioning.
    delete moved.workOffset;
    delete moved.workDir;
    scene.villagers[idx] = moved;
    this.selectedVillager = null;
    scene.renderer.layoutVillagers();
    // Resume wandering after a beat (assigned villagers don't wander).
    if (moved.state === 'idle') {
      scene.wander.scheduleWander(villagerId, 1000);
    }

    // Save on move/unassign.
    if (scene.save) scene.save.saveToStorage();
  }

  handleVillagerTap(villagerId) {
    // Tap selected villager again to deselect, tap another to switch.
    // (Tap the campfire sprite itself, not a cook, to open the recipe menu.)
    this.selectedVillager =
      this.selectedVillager === villagerId ? null : villagerId;
    this.updateSelectionRing();
  }

  updateSelectionRing() {
    // No-op: selection ring removed.
  }
}
