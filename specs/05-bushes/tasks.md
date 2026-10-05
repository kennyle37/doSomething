# Tasks: 05 Bushes and Harvesting

Key decisions (locked):
- 4 berry bushes, deterministic positions: F2, G2, F3, G3.
  - F2 (5,1): `bush_flowers_red_01.png`
  - G2 (6,1): `bush_flowers_white_01.png`
  - F3 (5,2): `bush_flowers_yellow_01.png`
  - G3 (6,2): `bush_round_01.png`
  - Sprites from `public/serene_village_split/objects/`.
- Bush data: `{ id, tileX, tileY, spriteKey }`.
- Assignment: drag a villager onto a bush tile to assign. The villager moves
  to an adjacent free tile (not on top of the bush), facing the bush.
  `villager.state` goes `'idle'` → `'assigned'`, `villager.assignedTo = bushId`.
- Work animation is directional: bush to the right → `work_right`,
  bush to the left → `work_left`, bush below → `work_down`,
  bush above → `work_up`. Plays on loop while assigned.
- Persistent: assigned villagers stay at the bush until manually removed.
  No wandering while assigned. No idle timeout.
- Unassign: drag an assigned villager to a non-bush tile. State goes back to
  `'idle'`, `assignedTo = null`, wandering resumes.
- Reassign: drag from one bush directly to another.
- Bushes glow when a dragged villager hovers them (valid drop target).
- Bush tiles are added to `blockedTiles` for wandering (villagers don't walk
  through bushes). Dropping on a bush = assign, not blocked.
- Foraging: on the 10s tick, each assigned villager produces 1 berry.
- Berry counter: simple text top-left ("Berries: N").
- Harvest feedback: floating "+1" text rises from the bush and fades, plus
  a quick bush wobble (scale punch). No new art needed.
- Multiple villagers can share a bush (each gets an adjacent tile if free).
- Patterns: Observer (tick drives foraging), Command (assign/unassign).

Experience goal: the player feels like a manager when they drag a villager
to a bush, watch them work, and see the berry count tick up.

## Build
- [ ] `src/game/sim/bushes.js` — `createBush(id, tileX, tileY, spriteKey)`,
      `createInitialBushes()` (4 fixed positions with sprite keys).
- [ ] `src/game/sim/bushes.test.js` — bush has required fields; 4 bushes;
      positions match F2/G2/F3/G3; spriteKeys are set.
- [ ] `src/game/sim/assignment.js` — `assignVillager(villager, bushId)`,
      `unassignVillager(villager)`. Pure functions.
- [ ] `src/game/sim/assignment.test.js` — assign sets assignedTo and state;
      unassign clears both; reassign updates bushId.
- [ ] `src/game/sim/foraging.js` — `forageTick(villagers)` returns berries
      produced (1 per assigned villager).
- [ ] `src/game/sim/foraging.test.js` — 0 assigned = 0; 1 assigned = 1;
      3 assigned = 3; idle villagers don't produce.
- [ ] `src/scenes/VillageScene.js` — render bushes from sprite keys; bush
      glow on drag hover; drop on bush → find adjacent tile, move there,
      face bush, play directional work anim, disable wandering; drop
      elsewhere → unassign, resume wandering; berry counter; 10s tick
      triggers foraging with floating "+1" and bush wobble.

## Play
- [ ] Kenny plays: drag villagers to bushes. Do they walk over and start
      working? Does the facing look right? Does the berry count go up with
      feedback? Drag one away, does it stop?

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check against constitution.
