import {
  createBuilding,
  getBuildingTiles,
  canPlaceBuilding,
  BUILDING_TYPES,
} from '../../game/sim/buildings.js';
import { CONFIG } from '../../game/config.js';
import { TILE_SIZE } from '../scene-constants.js';

/**
 * Owns building placement, moving, demolishing.
 *
 * Barebone: plop buildings down, they block tiles, they save.
 * No interiors, no functionality yet.
 *
 * Flow:
 *   - Build menu -> select type -> placement mode (ghost follows cursor)
 *   - Click tile -> place (if valid)
 *   - Click placed building -> popup (Move, Demolish)
 *   - Move -> ghost follows, click to drop
 *   - Demolish -> instant remove
 */
export default class BuildingSystem {
  constructor(scene) {
    this.scene = scene;
    this.buildings = []; // { id, type, tileX, tileY, width, height }
    /** building id -> Phaser sprite/container */
    this.buildingSprites = new Map();
    this.placementMode = null; // { typeId } while placing
    this.moveMode = null; // { buildingId } while moving
    this.ghost = null; // preview sprite
    this.popup = null; // action popup element

    // Ghost follows cursor during placement/move.
    scene.input.on('pointermove', (pointer) => {
      this.updateGhost(pointer);
    });
    // Click to place/move. Right-click cancels.
    scene.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        this.cancelModes();
        this.closePopup();
        return;
      }
      // Only handle left-clicks in placement/move mode.
      // (Building clicks are handled by the sprite's own pointerdown.)
      if ((this.placementMode || this.moveMode) && pointer.leftButtonDown()) {
        this.handleClick(pointer);
      }
    });
    // ESC cancels placement/move.
    scene.input.keyboard?.on('keydown-ESC', () => {
      this.cancelModes();
      this.closePopup();
    });

    this.createBuildButton();
  }

  createBuildButton() {
    const scene = this.scene;
    // Wait a tick for RexUI to be ready (same as SaveSystem buttons).
    scene.time.delayedCall(100, () => {
      const y = scene.scale.height - 30;
      const x = 70;
      const bg = scene.rexUI.add.roundRectangle(0, 0, 80, 36, 8, 0x4e342e);
      const btn = scene.rexUI.add.label({
        x, y, width: 80, height: 36,
        background: bg,
        text: scene.add.text(0, 0, 'Build', { fontSize: '14px', color: '#ffffff' }),
        align: 'center',
        space: { left: 8, right: 8, top: 4, bottom: 4 },
      }).setDepth(1000).layout();
      btn.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showBuildMenu());
    });
  }

  showBuildMenu() {
    // Simple HTML overlay like the campfire queue.
    const overlay = document.createElement('div');
    overlay.id = 'build-menu-overlay';
    overlay.style.cssText =
      'position: fixed; inset: 0; background: rgba(0,0,0,0.5); ' +
      'z-index: 9999; display: flex; align-items: center; justify-content: center;';
    const dialog = document.createElement('div');
    dialog.style.cssText =
      'background: #2a2a2a; border-radius: 12px; padding: 20px; ' +
      'min-width: 250px; color: #fff;';
    dialog.innerHTML = '<h3 style="margin: 0 0 12px 0;">Build</h3>';
    for (const typeId of Object.keys(BUILDING_TYPES)) {
      const type = BUILDING_TYPES[typeId];
      const row = document.createElement('div');
      row.style.cssText =
        'padding: 10px; margin: 6px 0; background: #3a3a3a; border-radius: 8px; ' +
        'cursor: pointer; display: flex; justify-content: space-between;';
      row.innerHTML = `<span>${type.name}</span><span style="color: #888;">${type.width}x${type.height}</span>`;
      row.onmouseenter = () => row.style.background = '#4a4a4a';
      row.onmouseleave = () => row.style.background = '#3a3a3a';
      row.onclick = () => {
        document.body.removeChild(overlay);
        this.startPlacement(typeId);
      };
      dialog.appendChild(row);
    }
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = 'margin-top: 12px; padding: 8px 16px; cursor: pointer;';
    closeBtn.onclick = () => document.body.removeChild(overlay);
    dialog.appendChild(closeBtn);
    overlay.appendChild(dialog);
    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };
    document.body.appendChild(overlay);
  }

  // --- Placement ---

  startPlacement(typeId) {
    this.cancelModes();
    this.placementMode = { typeId };
    this.showGhost(typeId);
  }

  startMove(buildingId) {
    this.cancelModes();
    this.closePopup();
    this.moveMode = { buildingId };
    const b = this.buildings.find((x) => x.id === buildingId);
    if (b) this.showGhost(b.type);
  }

  cancelModes() {
    this.placementMode = null;
    this.moveMode = null;
    if (this.ghost) {
      this.ghost.destroy();
      this.ghost = null;
    }
  }

  showGhost(typeId) {
    const scene = this.scene;
    const type = BUILDING_TYPES[typeId];
    if (!type) return;
    // Simple ghost: semi-transparent rectangle sized to footprint.
    const w = type.width * TILE_SIZE;
    const h = type.height * TILE_SIZE;
    this.ghost = scene.add
    .rectangle(0, 0, w, h, 0x00ff00, 0.3)
    .setOrigin(0, 0)
    .setDepth(2000);
  }

  updateGhost(pointer) {
    if (!this.ghost || (!this.placementMode && !this.moveMode)) return;
    const scene = this.scene;
    const tileX = Math.floor((pointer.x - scene.originX) / TILE_SIZE);
    const tileY = Math.floor((pointer.y - scene.originY) / TILE_SIZE);
    const px = scene.originX + tileX * TILE_SIZE;
    const py = scene.originY + tileY * TILE_SIZE;
    this.ghost.x = px;
    this.ghost.y = py;

    // Validate.
    const typeId = this.placementMode
      ? this.placementMode.typeId
      : this.buildings.find((b) => b.id === this.moveMode.buildingId)?.type;
    if (!typeId) return;

    // For move mode, temporarily unblock the building's own tiles.
    let blocked = scene.blockedTiles;
    if (this.moveMode) {
      const b = this.buildings.find((x) => x.id === this.moveMode.buildingId);
      if (b) {
        blocked = new Set(scene.blockedTiles);
        for (const t of getBuildingTiles(b)) {
          blocked.delete(`${t.x},${t.y}`);
        }
      }
    }

    const check = canPlaceBuilding(
      typeId, tileX, tileY,
      scene.grid.width, scene.grid.height,
      blocked, scene.villagers
    );
    this.ghost.setFillStyle(check.ok ? 0x00ff00 : 0xff0000, 0.3);
    this.ghost.setData('valid', check.ok);
    this.ghost.setData('tileX', tileX);
    this.ghost.setData('tileY', tileY);
  }

  handleClick(pointer) {
    if (this.placementMode) {
      this.tryPlace(pointer);
    } else if (this.moveMode) {
      this.tryMove(pointer);
    }
  }

  tryPlace(pointer) {
    const scene = this.scene;
    if (!this.ghost || !this.ghost.getData('valid')) return;
    const tileX = this.ghost.getData('tileX');
    const tileY = this.ghost.getData('tileY');
    const typeId = this.placementMode.typeId;

    const building = createBuilding(typeId, tileX, tileY);
    this.buildings.push(building);
    this.addBlockedTiles(building);
    this.drawBuilding(building);
    this.cancelModes();
    if (scene.save) scene.save.saveToStorage();
  }

  tryMove(pointer) {
    const scene = this.scene;
    if (!this.ghost || !this.ghost.getData('valid')) return;
    const tileX = this.ghost.getData('tileX');
    const tileY = this.ghost.getData('tileY');
    const building = this.buildings.find((b) => b.id === this.moveMode.buildingId);
    if (!building) {
      this.cancelModes();
      return;
    }
    // Free old tiles, claim new ones.
    this.removeBlockedTiles(building);
    building.tileX = tileX;
    building.tileY = tileY;
    this.addBlockedTiles(building);
    this.redrawBuilding(building);
    this.cancelModes();
    if (scene.save) scene.save.saveToStorage();
  }

  demolish(buildingId) {
    const scene = this.scene;
    const idx = this.buildings.findIndex((b) => b.id === buildingId);
    if (idx === -1) return;
    const building = this.buildings[idx];
    this.removeBlockedTiles(building);
    const sprite = this.buildingSprites.get(buildingId);
    if (sprite) sprite.destroy();
    this.buildingSprites.delete(buildingId);
    this.buildings.splice(idx, 1);
    this.closePopup();
    if (scene.save) scene.save.saveToStorage();
  }

  // --- Blocked tiles ---

  addBlockedTiles(building) {
    for (const t of getBuildingTiles(building)) {
      this.scene.blockedTiles.add(`${t.x},${t.y}`);
    }
  }

  removeBlockedTiles(building) {
    for (const t of getBuildingTiles(building)) {
      this.scene.blockedTiles.delete(`${t.x},${t.y}`);
    }
  }

  // --- Rendering ---

  drawBuilding(building) {
    const scene = this.scene;
    const type = BUILDING_TYPES[building.type];
    const px = scene.originX + building.tileX * TILE_SIZE;
    const py = scene.originY + building.tileY * TILE_SIZE;
    const w = building.width * TILE_SIZE;
    const h = building.height * TILE_SIZE;

    // House sprite, scaled to fit 2x2 footprint with padding.
    const img = scene.add
    .image(px + w / 2, py + h / 2, type.spriteKey)
    .setDepth(py + h - 10);
    // Scale to fit within footprint (use limiting dimension, 90% for padding).
    const scale = Math.min(w / img.width, h / img.height) * 0.9;
    img.setScale(scale);
    img.setInteractive({ useHandCursor: true });
    img.setData('buildingId', building.id);
    img.on('pointerdown', () => this.showPopup(building.id, px + w / 2, py));

    const container = scene.add.container(0, 0, [img]);
    this.buildingSprites.set(building.id, container);
  }

  redrawBuilding(building) {
    const old = this.buildingSprites.get(building.id);
    if (old) old.destroy();
    this.buildingSprites.delete(building.id);
    this.drawBuilding(building);
  }

  // --- Popup (Move / Demolish) ---

  showPopup(buildingId, x, y) {
    this.closePopup();
    const popup = document.createElement('div');
    popup.style.cssText =
      'position: fixed; z-index: 10000; background: #2a2a2a; ' +
      'border: 1px solid #555; border-radius: 8px; padding: 8px; ' +
      'display: flex; gap: 8px;';
    popup.innerHTML = `
      <button id="bld-move" style="padding: 6px 12px; cursor: pointer;">Move</button>
      <button id="bld-demolish" style="padding: 6px 12px; cursor: pointer; background: #c62828; color: white; border: none; border-radius: 4px;">Demolish</button>
    `;
    // Position near the building (convert world to screen).
    const scene = this.scene;
    const scale = scene.scale.zoom || 1;
    popup.style.left = `${x * scale + 100}px`;
    popup.style.top = `${y * scale + 100}px`;
    document.body.appendChild(popup);

    popup.querySelector('#bld-move').onclick = () => this.startMove(buildingId);
    popup.querySelector('#bld-demolish').onclick = () => this.demolish(buildingId);

    // Close on outside click. Store handler so we can remove it.
    const closeOnClick = (e) => {
      if (!popup.contains(e.target)) {
        this.closePopup();
      }
    };
    // Remove any stale listener first.
    if (this._popupCloseHandler) {
      document.removeEventListener('pointerdown', this._popupCloseHandler);
    }
    this._popupCloseHandler = closeOnClick;
    setTimeout(() => document.addEventListener('pointerdown', closeOnClick), 100);

    this.popup = popup;
  }

  closePopup() {
    if (this._popupCloseHandler) {
      document.removeEventListener('pointerdown', this._popupCloseHandler);
      this._popupCloseHandler = null;
    }
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }
  }

  // --- Save/load ---

  getSaveData() {
    return this.buildings.map((b) => ({
      id: b.id, type: b.type, tileX: b.tileX, tileY: b.tileY,
    }));
  }

  loadSaveData(data) {
    if (!data) return;
    // Clear existing (prevents duplicates on reload/visibility).
    for (const b of this.buildings) {
      this.removeBlockedTiles(b);
      const sprite = this.buildingSprites.get(b.id);
      if (sprite) sprite.destroy();
    }
    this.buildings = [];
    this.buildingSprites.clear();
    for (const saved of data) {
      const building = createBuilding(saved.type, saved.tileX, saved.tileY);
      building.id = saved.id; // preserve id
      this.buildings.push(building);
      this.addBlockedTiles(building);
      this.drawBuilding(building);
    }
  }

  /**
   * Offline: buildings are static, nothing to simulate.
   */
  get offlinePriority() { return 50; }
}
