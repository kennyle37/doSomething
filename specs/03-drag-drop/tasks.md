# Tasks: 03 Drag and Drop

Key decisions (locked):
- Drag a villager to any tile. On drop, the villager moves to the nearest
  available tile. Forgiving, never punishing: out-of-bounds or blocked drops
  snap to the closest free tile instead of bouncing back.
- "Available" = in bounds and not blocked. `blocked` is a Set of `"x,y"`
  strings. Empty for now (no buildings/bushes yet). Bushes and buildings
  fill it in later specs.
- Nearest-tile search: spiral outward from drop point by Chebyshev distance,
  first free tile wins. Deterministic tiebreak (topmost, then leftmost).
- Phaser drag events on villager sprites. Expanded touch target (1.5x sprite).
- Data model: `findDropTile(x, y, w, h, blocked)` and
  `moveVillager(villager, tileX, tileY, blocked)` are pure functions,
  tested like everything else. Scene calls them on drop.
- Tap-tap fallback: tap villager to select (highlight ring), tap tile to move.
- Patterns: Command (move is a discrete action).

Experience goal: the player feels the villagers are tangible when they pick
one up and put it down somewhere else. (Bushes and assignment come later.)

## Build
- [ ] `src/game/sim/movement.js` — `findDropTile(x, y, w, h, blocked)`,
      `moveVillager(villager, tileX, tileY, blocked)`. Pure functions.
- [ ] `src/game/sim/movement.test.js` — moves within bounds; out-of-bounds
      snaps to nearest edge tile; blocked target snaps to free neighbor;
      same-tile move is a no-op; fully surrounded target stays put.
- [ ] `src/scenes/VillageScene.js` — draggable villager sprites; snap to
      nearest available tile on drop; tap-tap fallback.

## Play
- [ ] Kenny plays: drag villagers around, including off the grid edge.
      Does it feel good? Does the snap read clearly?

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check against constitution.
