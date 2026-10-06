# Tasks: 06 Save System

Key decisions (locked):
- localStorage for auto-save. Key: `idle-save-1`.
- Versioned schema: `{ version: 1, savedAt: timestamp, villagers: [...], berries: number }`.
- Villager fields saved: id, name, spriteKey, tileX, tileY, state, assignedTo,
  workOffset, workDir, assignedAt.
- Bushes not saved (static from config for now).
- Auto-save every 10 seconds and on page hide/close (visibilitychange + beforeunload).
- RexUI plugin added to project. Export/import modal built with RexUI (first use).
- Manual save button in HUD (RexUI button) alongside auto-save.
- Patterns: Memento (save/restore), Observer (auto-save on events).

Three requirements:
1. **Save progress**: auto-save + manual save button. Player can close and return.
2. **Background progress**: on tab return (visibilitychange visible) or page load,
   if `savedAt` exists, calculate elapsed seconds. For each assigned villager,
   award `floor(elapsed / tickMs)` berries. Cap offline window at 8 hours.
   Show "While you were away: +N berries" toast on return.
3. **Cross-device**: Export button downloads a `.json` save file.
   Import button opens a file picker; select a save file to restore.
   Works across computers, no backend. Scales to any save size.

- Debug spoofing: `window.__debug` object with functions:
    - `__debug.setBerries(n)` — set berry count
    - `__debug.assignAll()` — assign all villagers to bushes
    - `__debug.unassignAll()` — unassign all
    - `__debug.tick()` — force a production tick
    - `__debug.export()` — print save string to console
    - `__debug.import(str)` — load from save string
    - `__debug.wipe()` — clear save and reload
    - `__debug.simulateAway(seconds)` — fake elapsed time for offline testing

Experience goal: the player feels safe closing the tab, knowing their
villagers kept working while they were away.

## Build
- [ ] `npm install phaser3-rex-plugins` + register RexUI as scene plugin.
- [ ] `src/game/sim/save.js` — `createSave(villagers, berries)`,
  `serialize(save)`, `deserialize(str)`, `calculateOfflineBerries(save, now)`.
  Pure functions, versioned.
- [ ] `src/game/sim/save.test.js` — round-trip serialize/deserialize;
  offline calc with 1 worker for 1 hour; offline cap enforced;
  version mismatch handled; corrupt string handled gracefully.
- [ ] `src/scenes/controllers/SaveSystem.js` — auto-save timer, visibilitychange
  handler, beforeunload handler, RexUI export/import modal, manual save button,
  "while you were away" toast, `window.__debug` hooks.
- [ ] Wire into VillageScene: load on create (with offline calc), save on interval.

## Play
- [ ] Kenny plays: assign workers, switch tabs for 2 min, come back. Toast shows? Berries higher?
- [ ] Export save string, wipe localStorage, import. Does it restore?
- [ ] Copy export string to different browser. Does it load?

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check against constitution.
