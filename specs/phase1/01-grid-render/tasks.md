# Tasks: Grid Render (spec 01)

The smallest playable foundation: an 8x8 grid on screen. Nothing else.

## Key decisions
- 8x8 fixed grid for the slice. Grid expansion is a future idea, not this spec (how it's unlocked/paid for is undecided).
- Grid is data, not rendering: a plain model (`createGrid`, `tileAt`) that Phaser draws from. Data-Driven pattern.
- Placeholder tile colors. Real art (Serene Village tileset) swaps in later without touching the model.
- Scope is ONLY the grid. No villagers, no forage spots, no assignment, no counters, no flavor text, no cutscenes, no chat. Each of those is its own spec.
- Tile size: whatever looks right at phone width; tune when art arrives.
- Future cutscenes/flavor text need nothing from this spec: cutscenes will overlay as separate Phaser scenes, and tile content is a later spec's concern. No hooks or placeholders.

## Checklist
- [ ] `src/game/sim/grid.js`: `createGrid(width, height)` returns `{ width, height, tiles }`; `tileAt(grid, x, y)` returns the tile or `null` out of bounds; tiles carry their `x, y`
- [ ] `src/game/sim/grid.test.js`: 8x8 gives 64 tiles; `tileAt` in-bounds returns correct tile; out-of-bounds (negative, >= width/height) returns `null`
- [ ] `src/scenes/VillageScene.js`: Phaser scene that builds the grid model and renders 64 tiles from it, centered, placeholder colors
- [ ] Scene wired into the Phaser game config so it shows on boot
- [ ] `npm test` passes, `npm run build` passes
- [ ] Constitution conformance: data-driven (model separate from rendering), one system only, tests ship with it
