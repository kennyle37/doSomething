import {
  SAVE_KEY,
  createSave,
  serialize,
  deserialize,
  calculateOfflineBerries,
  applySave,
} from '../../game/sim/save.js';
import { unassignVillager } from '../../game/sim/assignment.js';
import { CONFIG } from '../../game/config.js';

/**
 * Owns everything save: auto-save timer, visibility handlers,
 * export/import UI (RexUI), offline progress calc, and debug hooks.
 */
export default class SaveSystem {
  constructor(scene) {
    this.scene = scene;
    this.saveButton = null;
  }

  setup() {
    // Try to load an existing save.
    const offlineBerries = this.loadFromStorage();
    if (offlineBerries > 0) {
      this.showToast(`While you were away: +${offlineBerries} berries`);
    }

    // Auto-save every 30 seconds.
    this.scene.time.addEvent({
      delay: CONFIG.save.autoSaveMs,
      loop: true,
      callback: () => this.saveToStorage(),
    });

    // Save when tab hides or page closes.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.saveToStorage();
      else this.checkOfflineProgress();
    });
    window.addEventListener('beforeunload', () => this.saveToStorage());

    this.createHudButtons();
    this.setupDebug();
  }

  // --- Core save/load ---

  saveToStorage() {
    const scene = this.scene;
    const save = createSave(scene.villagers, scene.bushes.berries, Date.now(), scene.cook ? scene.cook.getSaveData() : null);
    try {
      localStorage.setItem(SAVE_KEY, serialize(save));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  /**
   * Load from localStorage. Returns offline berries earned (0 if none).
   */
  loadFromStorage() {
    const scene = this.scene;
    let raw = null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return 0;
    }
    if (!raw) return 0;

    const save = deserialize(raw);
    if (!save) return 0;

    // Restore villager positions and assignments.
    applySave(scene.villagers, save);
    scene.bushes.berries = save.berries;
    scene.bushes.berryText.setText(`Berries: ${save.berries}`);

    // Restore cooking state (queue, active job, meals on ground).
    if (scene.cook && save.cooking) {
      scene.cook.loadSaveData(save.cooking);
    }

    // Re-render villagers at their saved positions.
    scene.renderer.drawVillagers();
    scene.renderer.layoutVillagers();

    // Restore work animations for assigned villagers.
    // Cancel any wandering for them (they're working, not wandering).
    for (const v of scene.villagers) {
      if (v.assignedTo != null && v.workDir) {
        const sprite = scene.renderer.getSprite(v.id);
        if (sprite) sprite.play(`${v.spriteKey}_work_${v.workDir}`);
        scene.wander.cancelWander(v.id);
      }
    }

    // Calculate offline progress.
    const offline = calculateOfflineBerries(
      save,
      Date.now(),
      CONFIG.tickMs,
      CONFIG.save.maxOfflineMs
    );
    if (offline > 0) {
      scene.bushes.berries += offline;
      scene.bushes.berryText.setText(`Berries: ${scene.bushes.berries}`);
    }

    // Simulate offline progress for ALL systems that support it.
    // Convention: any system with time-based progress implements
    // Offline simulation: auto-discover all systems with time-based progress.
    // Any controller on the scene that implements
    //   simulateOffline(elapsedMs, saveTimestamp)
    // gets called automatically, in dependency order. New timed systems
    // just implement the method; no SaveSystem changes needed.
    //
    // Order matters: berries -> cooking -> eating (each feeds the next).
    // Systems define `offlinePriority` (lower runs first). Default is 100.
    const elapsedMs = Date.now() - save.timestamp;
    const toastParts = [];

    // Berries are already added above; include in toast.
    if (offline > 0) toastParts.push(`+${offline} berries`);

    // Auto-discover systems with simulateOffline.
    const offlineSystems = [];
    for (const key of Object.keys(scene)) {
      const sys = scene[key];
      if (sys && typeof sys.simulateOffline === 'function' && key !== 'save') {
        offlineSystems.push({
          key,
          system: sys,
          priority: sys.offlinePriority ?? 100,
        });
      }
    }
    offlineSystems.sort((a, b) => a.priority - b.priority);

    for (const { key, system } of offlineSystems) {
      const result = system.simulateOffline(elapsedMs, save.timestamp);
      // Each system formats its own toast part via offlineToast(result).
      if (typeof system.offlineToast === 'function') {
        const part = system.offlineToast(result);
        if (part) toastParts.push(part);
      } else if (typeof result === 'number' && result > 0) {
        toastParts.push(`+${result} ${key}`);
      }
    }

    if (toastParts.length > 0) {
      this.showToast(`While you were away: ${toastParts.join(', ')}`);
    }

    return offline;
  }

  /**
   * Check for offline progress when tab becomes visible again.
   * Saves a fresh timestamp so we don't double-count.
   */
  checkOfflineProgress() {
    this.loadFromStorage(); // toast is shown inside if there's anything
    // Re-save so the timestamp is fresh.
    this.saveToStorage();
  }

  // --- HUD buttons (RexUI) ---

  createHudButtons() {
    const scene = this.scene;
    const y = scene.scale.height - 30;

    const makeButton = (x, label, onClick) => {
      const bg = scene.rexUI.add.roundRectangle(0, 0, 80, 36, 8, 0x4e342e);
      const btn = scene.rexUI.add.label({
        x, y,
        width: 80,
        height: 36,
        background: bg,
        text: scene.add.text(0, 0, label, { fontSize: '14px', color: '#ffffff' }),
        align: 'center',
        space: { left: 8, right: 8, top: 4, bottom: 4 },
      })
      .setDepth(1000)
      .layout();
      btn.setInteractive({ useHandCursor: true })
      .on('pointerdown', onClick);
      return btn;
    };

    makeButton(scene.scale.width - 140, 'Export', () => this.exportToFile());
    makeButton(scene.scale.width - 50, 'Import', () => this.importFromFile());
  }

  exportToFile() {
    const scene = this.scene;
    const save = createSave(scene.villagers, scene.bushes.berries, Date.now(), scene.cook ? scene.cook.getSaveData() : null);
    const json = JSON.stringify(save, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idle-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Save downloaded!');
  }

  importFromFile() {
    const scene = this.scene;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const save = JSON.parse(reader.result);
          // Validate version.
          if (save.version !== 1 || !Array.isArray(save.villagers)) {
            this.showToast('Invalid save file!');
            return;
          }
          // Store as serialized string for consistency.
          try {
            localStorage.setItem(SAVE_KEY, btoa(JSON.stringify(save)));
          } catch (err) {
            console.warn('Save failed:', err);
          }
          scene.scene.restart();
        } catch (err) {
          this.showToast('Could not read save file!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  showToast(message) {
    const scene = this.scene;
    const toast = scene.add
    .text(scene.scale.width / 2, 80, message, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 16, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(2000);
    scene.tweens.add({
      targets: toast,
      alpha: 0,
      y: 60,
      delay: 2000,
      duration: 800,
      onComplete: () => toast.destroy(),
    });
  }

  // --- Debug tools ---

  setupDebug() {
    const scene = this.scene;
    window.__debug = {
      setBerries: (n) => {
        scene.bushes.berries = n;
        scene.bushes.berryText.setText(`Berries: ${n}`);
      },
      assignAll: () => {
        const bushes = scene.bushes.bushes;
        scene.villagers.forEach((v, i) => {
          const bush = bushes[i % bushes.length];
          if (bush) scene.bushes.assignToBush(v.id, bush);
        });
      },
      unassignAll: () => {
        for (const v of scene.villagers) {
          if (v.assignedTo != null) {
            const idx = scene.villagers.findIndex((x) => x.id === v.id);
            if (idx !== -1) {
              scene.villagers[idx] = unassignVillager(v);
              delete scene.villagers[idx].workOffset;
              delete scene.villagers[idx].workDir;
            }
          }
        }
        scene.renderer.layoutVillagers();
      },
      tick: () => scene.bushes.onTick(),
      export: () => {
        const str = serialize(createSave(scene.villagers, scene.bushes.berries, Date.now(), scene.cook ? scene.cook.getSaveData() : null));
        console.log(str);
        return str;
      },
      import: (str) => {
        const save = deserialize(str);
        if (save) {
          localStorage.setItem(SAVE_KEY, str);
          scene.scene.restart();
        }
      },
      wipe: () => {
        localStorage.removeItem(SAVE_KEY);
        scene.scene.restart();
      },
      simulateAway: (seconds) => {
        const save = createSave(scene.villagers, scene.bushes.berries, Date.now() - seconds * 1000);
        const gained = calculateOfflineBerries(save, Date.now(), CONFIG.tickMs, CONFIG.save.maxOfflineMs);
        scene.bushes.berries += gained;
        scene.bushes.berryText.setText(`Berries: ${scene.bushes.berries}`);
        this.showToast(`Simulated ${seconds}s away: +${gained} berries`);
        return gained;
      },
    };
  }
}
