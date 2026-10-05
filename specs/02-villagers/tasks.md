# Tasks: 02 Villagers

Key decisions (locked):
- Villager = pure data: `{ id, name, spriteKey, tileX, tileY, state }`.
  `state` starts as `'idle'`. No behavior yet, that's spec 03 (assignment)
  and spec 04 (wandering).
- 3 villagers: `villager_female_elf`, `villager_male_elf_gray`,
  `villager_male_horns`. Sprite referenced by key per §4, never by path.
- Names: data model supports them (emotional hook pillar). Defaults for now,
  player-facing naming comes later.
- Spawn positions: 2 villagers share one tile (to test cluster rendering), 1 on its
  own tile. Fixed tiles, deterministic for tests.
- Stacking: data model allows multiple villagers per tile, no constraint.
  Renderer offsets clustered villagers slightly by id (deterministic, no jitter)
  so they read as a little group, not a blob.
- Render: Phaser sprites with idle animation, 48x48 cells. Renderer reads
  villager data, same separation as grid (data model vs render).
- Placeholder: blue circles for now, `drawVillager()` is the single swap point
  (same pattern as `drawTile()`). Real Memao sprites when the asset PR merges.
- Debug: chess-notation coordinates (A1-H8) on tiles, behind SHOW_COORDS flag.
  Dev tool, not game UI.
- Patterns: Data-Driven/Type Object (villager defs are config).

Experience goal: the player feels delight when they see three villagers
standing on the grid. (Wandering comes in spec 04.)

## Build
- [ ] `src/game/sim/villagers.js` — `createVillager(id, name, spriteKey, tileX, tileY)`,
      `createInitialVillagers()` returning the 3 locked villagers.
- [ ] `src/game/sim/villagers.test.js` — villager has required fields; initial
      set has 3 villagers; spawn tiles are within grid bounds; spriteKeys match
      the locked set; 2 share a tile, 1 solo.
- [ ] `src/scenes/VillageScene.js` — render villagers from data (idle anim).
      Cluster offset for shared tiles. No interaction.

## Play
- [ ] Kenny plays: do the three villagers appear? Do they look right? Does the
      cluster read as a group?

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check against constitution.
