# Spec 10: Building Placement (Barebone)

## Goal
Place buildings on the map. That's it. No interiors, no functionality yet. Just plop them down, they block tiles, they save.

## Experience Goal
Player opens build menu, picks a house, clicks a tile, house appears. Feels like placing furniture. Satisfying thunk.

## Scope
IN:
- Build menu UI (list of placeable buildings)
- Plop placement: select building, click tile, building appears
- Click building → action popup (Move, Demolish)
- Move: drag building to new location (re-validates tiles)
- Demolish: remove building, free the tiles
- Buildings block tiles (can't walk on, can't spawn on)
- Buildings save/load
- Cancel placement (ESC or right-click)
- Invalid placement feedback (red ghost on blocked tiles)

OUT:
- Building interiors (explicitly out per Kenny)
- Building functionality (houses don't give beds yet, that's later)
- Building upgrades, rotation
- Resource costs (free placement for now)

## Design

### Buildings (v1)
| Type | Sprite | Size | Notes |
|------|--------|------|-------|
| House | Serene Village house | 2x2 tiles | The classic |

### Placement Flow
1. Click "Build" button (HUD)
2. Menu shows available buildings
3. Click a building → enter placement mode
4. Ghost preview follows cursor (green = valid, red = invalid)
5. Click tile → building placed, exit placement mode
6. ESC/right-click → cancel, exit placement mode

### Building Actions
Click a placed building → small popup with:
- **Move**: enter move mode (ghost follows cursor, click to drop, re-validates)
- **Demolish**: remove building, free tiles (confirm? or instant? Let's do instant for now)

### Validation
- Tile must be in bounds
- Tile (and all tiles for multi-tile buildings) must not be blocked
- Tile must not have a villager on it (block placement, show red)

### Data Model
```js
// sim/buildings.js
export function createBuilding(type, tileX, tileY) {
  return {
    id: buildingIdCounter++,
    type, // 'house'
    tileX, tileY,
    width: 2, height: 2, // tiles
  };
}
```

### Blocked Tiles
When a building is placed, add all its tiles to `scene.blockedTiles`.
When loaded from save, same.

### Save Format
```js
buildings: [
  { id, type, tileX, tileY },
]
```

## Tasks
1. [ ] sim/buildings.js: createBuilding, building type defs (pure, tested)
2. [ ] BuildingSystem controller: place, move, demolish, getSaveData, loadSaveData
3. [ ] Build menu UI (HTML overlay, like campfire queue)
4. [ ] Placement mode: ghost preview, click to place, ESC to cancel
5. [ ] Building click → action popup (Move, Demolish)
6. [ ] Move mode: drag ghost, click to drop, re-validate
7. [ ] Blocked tiles integration (add on place, remove on demolish/move)
8. [ ] Save/load buildings
9. [ ] House sprite (from Serene Village tileset, 2x2)
10. [ ] Tests for sim/buildings.js

## Conformance Checklist
- [ ] One thing at a time: this spec is ONLY placement, no functionality
- [ ] New systems ship with tests (sim/buildings.js)
- [ ] Config-driven: building defs in config (size, sprite, name)
- [ ] Offline: buildings are static, no sim needed (but must save/load)
- [ ] Blocked-tile rule: buildings are not walkable/spawnable (existing rule)

## Open Questions
(none - all resolved)
