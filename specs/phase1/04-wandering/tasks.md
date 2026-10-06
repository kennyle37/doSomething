# Tasks: 04 Wandering

Key decisions (locked):
- Villagers spawn at random distinct tiles (not deterministic).
- No distance limit. Villagers pick any random free tile on the grid and walk
  there. Free-range, not tethered to home.
- Initial wander delayed 2-8s (random per villager). They shouldn't all start
  walking the moment the game loads.
- Blocked tiles are excluded from wander targets. `pickWanderTarget` takes
  the blocked set. Houses (future) won't have villagers wandering inside them.
- Always selectable: the sprite stays interactive mid-wander. Dragging
  cancels the wander tween and grabs the villager from wherever they are.
  On drop, wandering resumes after a 1s delay.
- Data model follows the visual: tileX/tileY updates when the villager
  arrives at the wander target. While walking, the sprite is tweening.
- Walk sprites: `walk_down/up/left/right.png` strips from the Memao pack.
  Directional: play the anim matching the dominant walk direction.
  Walk anim while moving, idle anim while paused between wanders.
- Cooldown scales with distance: 5s base + 3s per tile walked. They should
  spend more time idling than walking.
- Walk speed: 1s per tile (leisurely stroll).
- Path: axis-aligned (longer axis first), like classic RPG movement. No
  diagonal sliding.
- `pickWanderTarget(tileX, tileY, w, h, blocked)` is pure and tested.
  Tween choreography lives in the scene (render concern, untested).
- Patterns: Update Method (Phaser timer drives the wander loop).

Experience goal: the player feels the village is alive when villagers
roam the map on their own, and can still grab any of them at any moment.

## Build
- [ ] `src/game/sim/wandering.js` — `pickWanderTarget(tileX, tileY, w, h,
      blocked)`. Returns random free tile, never the current tile,
      never blocked. Null if nothing free.
- [ ] `src/game/sim/wandering.test.js` — target in bounds; never current
      tile; never blocked; null when all blocked; works at corners.
- [ ] `src/game/sim/villagers.js` — `createInitialVillagers(rng)` spawns at
      random distinct tiles.
- [ ] `src/scenes/VillageScene.js` — preload all 4 `walk_` direction strips;
      per-villager wander loop (pick target, tween, arrive, pause, repeat);
      directional walk anim by dominant direction, idle anim when still;
      cancel tween on drag start; resume on drop; random 2-8s initial delay.

## Play
- [ ] Kenny plays: watch for a minute. Do they feel alive? Try grabbing one
      mid-wander, does it feel clean? Drop them, do they resume wandering?

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check against constitution.
