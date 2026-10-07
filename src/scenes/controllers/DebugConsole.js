import { createSave, serialize } from '../../game/sim/save.js';
import { calculateOfflineBerries } from '../../game/sim/save.js';
import { SAVE_KEY } from '../../game/sim/save.js';
import { CONFIG } from '../../game/config.js';

/**
 * In-game debug console. Toggle with the Debug button in HUD.
 * Type /help for available commands.
 */
export default class DebugConsole {
  constructor(scene) {
    this.scene = scene;
    this.panel = null;
    this.input = null;
    this.output = null;
    this.outputLines = [];
    this.isOpen = false;
  }

  setup() {
    const scene = this.scene;
    const btn = scene.rexUI.add.label({
      x: scene.scale.width - 50,
      y: 30,
      width: 80,
      height: 28,
      background: scene.rexUI.add.roundRectangle(0, 0, 80, 28, 6, 0x333333),
      text: scene.add.text(0, 0, 'Debug', { fontSize: '12px', color: '#888888' }),
      align: 'center',
    })
    .setDepth(1000)
    .layout();
    btn.setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggle());
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    const scene = this.scene;
    this.isOpen = true;

    const w = 440;
    const h = 320;
    const x = scene.scale.width / 2;
    const y = scene.scale.height - h / 2 - 20;

    // Fullscreen input blocker (prevents clicks reaching the game).
    this.blocker = scene.add
    .rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      scene.scale.width,
      scene.scale.height,
      0x000000,
      0.01 // nearly invisible, but interactive
    )
    .setDepth(1999)
    .setInteractive();
    // Swallow all pointer events.
    this.blocker.on('pointerdown', (p) => p.event.stopPropagation());

    // Background panel.
    this.panel = scene.add.container(x, y).setDepth(2000).setScrollFactor(0);
    const bg = scene.rexUI.add.roundRectangle(0, 0, w, h, 12, 0x1a1a1a, 0.95);
    this.panel.add(bg);

    // Title bar.
    const title = scene.add.text(0, -h / 2 + 20, 'Debug Console  (type /help)', {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.panel.add(title);

    // Close button.
    const closeBtn = scene.add.text(w / 2 - 20, -h / 2 + 20, 'X', {
      fontSize: '14px', color: '#ff6666', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    this.panel.add(closeBtn);

    // Output area (scrollable text).
    this.output = scene.add.text(-w / 2 + 16, -h / 2 + 44, '', {
      fontSize: '12px', color: '#00ff88', fontFamily: 'monospace',
      wordWrap: { width: w - 32 },
    }).setOrigin(0, 0);
    this.panel.add(this.output);

    // Input field (native HTML for reliable typing).
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.placeholder = 'Type a command...';
    inputEl.style.cssText = `
      position: absolute;
      width: ${w - 32}px;
      height: 36px;
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #444;
      border-radius: 6px;
      font-size: 13px;
      font-family: monospace;
      padding: 0 12px;
      outline: none;
      z-index: 1000;
    `;
    // Position it over the canvas.
    const canvas = scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    // Panel is at bottom center of game (512x512 logical).
    // Input is at panel bottom: y = scene.height - 20 - 28 (within panel).
    const scaleX = rect.width / scene.scale.width;
    const scaleY = rect.height / scene.scale.height;
    const inputX = rect.left + (x - (w - 32) / 2) * scaleX;
    const inputY = rect.top + (y + h / 2 - 28 - 18) * scaleY;
    inputEl.style.left = `${inputX}px`;
    inputEl.style.top = `${inputY}px`;
    inputEl.style.width = `${(w - 32) * scaleX}px`;
    inputEl.style.height = `${36 * scaleY}px`;
    document.body.appendChild(inputEl);
    this.nativeInput = inputEl;

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = inputEl.value.trim();
        if (cmd) {
          this.execute(cmd);
          inputEl.value = '';
        }
      }
      e.stopPropagation(); // don't let Phaser see it
    });

    setTimeout(() => inputEl.focus(), 100);
  }

  close() {
    this.isOpen = false;
    if (this.blocker) {
      this.blocker.destroy();
      this.blocker = null;
    }
    if (this.panel) {
      this.panel.destroy();
      this.panel = null;
    }
    if (this.nativeInput) {
      this.nativeInput.remove();
      this.nativeInput = null;
    }
    this.input = null;
    this.output = null;
    this.outputLines = [];
  }

  log(msg) {
    this.outputLines.push(msg);
    // Keep last 12 lines.
    if (this.outputLines.length > 12) this.outputLines.shift();
    if (this.output) {
      this.output.setText(this.outputLines.join('\n'));
    }
  }

  execute(cmdStr) {
    const scene = this.scene;
    const parts = cmdStr.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1];

    this.log(`> ${cmdStr}`);

    switch (cmd) {
      case '/help':
        this.log('/berries <n> - set berry count');
        this.log('/meal <berry|stew> - spawn a meal');
        this.log('/hungry - make all villagers hungry');
        this.log('/clearbuilding - remove all buildings');
        this.log('/perf - show performance stats');
        this.log('/assignall - assign all villagers');
        this.log('/unassignall - unassign all');
        this.log('/tick - force production tick');
        this.log('/away <sec> - simulate time away');
        this.log('/export - download save file');
        this.log('/wipe - clear save and reload');
        break;

      case '/berries': {
        const n = parseInt(arg, 10);
        if (isNaN(n)) { this.log('Usage: /berries <number>'); break; }
        scene.bushes.berries = n;
        scene.bushes.berryText.setText(`Berries: ${n}`);
        this.log(`Berries set to ${n}`);
        break;
      }

      case '/meal': {
        const type = (arg || 'berry').toLowerCase();
        // /meal 5 or /meal stew 3
        let recipeId = 'berry-meal';
        let count = 1;
        const parts = cmdStr.split(/\s+/).slice(1);
        for (const p of parts) {
          if (/^\d+$/.test(p)) count = parseInt(p, 10);
          else if (p.toLowerCase().startsWith('stew')) recipeId = 'hearty-stew';
          else if (p.toLowerCase().startsWith('berry')) recipeId = 'berry-meal';
        }
        count = Math.min(Math.max(count, 1), 20); // cap at 20
        if (scene.cook && scene.cook.spawnDebugMeal) {
          for (let i = 0; i < count; i++) scene.cook.spawnDebugMeal(recipeId);
          this.log(`Spawned ${count}x ${recipeId}`);
        } else {
          this.log('Cook system not ready');
        }
        break;
      }

      case '/hungry': {
        for (let i = 0; i < scene.villagers.length; i++) {
          const v = scene.villagers[i];
          if (v.stats) {
            scene.villagers[i] = {
              ...v,
              stats: { ...v.stats, hunger: 10 },
            };
          }
        }
        this.log('All villagers are now hungry');
        break;
      }

      case '/clearbuilding': {
        if (scene.build) {
          const count = scene.build.buildings.length;
          // Demolish all (frees tiles, destroys sprites, saves).
          for (const b of [...scene.build.buildings]) {
            scene.build.demolish(b.id);
          }
          this.log(`Cleared ${count} buildings`);
        } else {
          this.log('Build system not ready');
        }
        break;
      }

      case '/perf': {
        const displayList = scene.children.list.length;
        const tweens = scene.tweens.getTweens().length;
        const timers = scene.time._active ? scene.time._active.length : 0;
        const meals = scene.cook ? scene.cook.meals.length : 0;
        const mealSprites = scene.cook ? scene.cook.mealSprites.size : 0;
        const buildings = scene.build ? scene.build.buildings.length : 0;
        this.log(`Display: ${displayList} objects`);
        this.log(`Tweens: ${tweens} active`);
        this.log(`Timers: ${timers} active`);
        this.log(`Meals: ${meals} data, ${mealSprites} sprites`);
        this.log(`Buildings: ${buildings}`);
        this.log(`Villagers: ${scene.villagers.length}`);
        break;
      }

      case '/assignall': {
        const bushes = scene.bushes.bushes;
        scene.villagers.forEach((v, i) => {
          const bush = bushes[i % bushes.length];
          if (bush) scene.bushes.assignToBush(v.id, bush);
        });
        this.log('All villagers assigned');
        break;
      }

      case '/unassignall': {
        if (window.__debug && window.__debug.unassignAll) {
          window.__debug.unassignAll();
          this.log('All villagers unassigned');
        }
        break;
      }

      case '/tick':
        scene.bushes.onTick();
        this.log('Tick forced');
        break;

      case '/away': {
        const secs = parseInt(arg, 10);
        if (isNaN(secs)) { this.log('Usage: /away <seconds>'); break; }
        if (window.__debug && window.__debug.simulateAway) {
          const gained = window.__debug.simulateAway(secs);
          this.log(`Simulated ${secs}s: +${gained} berries`);
        }
        break;
      }

      case '/export':
        if (scene.save) {
          scene.save.exportToFile();
          this.log('Save file downloading...');
        }
        break;

      case '/wipe':
        this.log('Wiping save...');
        setTimeout(() => {
          if (window.__debug) window.__debug.wipe();
        }, 500);
        break;

      default:
        this.log(`Unknown command: ${cmd}. Try /help`);
    }
  }
}
