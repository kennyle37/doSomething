# Spec 09: Eating, EXP, Leveling & Villager Stats

## Goal
Villagers get hungry, eat meals, gain EXP, and level up. Each villager has individual stats. Blocked tiles are not walkable or spawnable.

## Design

### Villager Stats (new)
Each villager gets a `stats` object:
```js
stats: {
  metabolism: 0.8-1.2,  // random at creation, hunger drain rate
  hunger: 100,           // 0-100, drains over time
  exp: 0,                // total EXP earned
  level: 1,              // 1-30, +2% output per level
  traits: [],            // future: trait IDs
}
```

### Hunger
- Drains at `baseHungerDrain * metabolism` per tick.
- Base drain tuned so average villager hits 0 hunger in ~24h game time.
- When hunger < 30: villager is "hungry", seeks food.

### Eating Behavior
1. Hungry villager checks: is there an unreserved meal available?
2. If yes: reserve it (`meal.reservedBy = villagerId`), walk to it.
3. If no: stay hungry, check again next tick. No penalty.
4. On arrival: consume meal, gain EXP, hunger resets to 100.
5. If villager was working: store `previousAssignment`, restore after eating.
6. Meal reservation prevents two villagers targeting the same meal.

### Manual Feeding (Player Agency)
- Player can drag a meal directly onto any villager to force-feed them.
- Bypasses hunger check. Grants EXP immediately.
- This is how players min-max favorites: focus food on one villager to level them faster.
- Meal is consumed, villager plays eat animation.

### EXP & Leveling
- Berry Meal: 1 EXP. Hearty Stew: 2 EXP.
- Numeric levels 1-30. Each level: +2% output (additive).
- Titles at milestones (flavor only):
  - Levels 1-9: Villager
  - Levels 10-19: Adventurer
  - Levels 20-30: Hero
- Exponential curve: `expForLevel(n) = ceil(0.8 * (1.06 ^ n))`
  - Level 1→2: 1 EXP, Level 10→11: 2 EXP, Level 20→21: 3 EXP, Level 29→30: 5 EXP
  - Total 1→30: ~62 EXP (~3 weeks at 3 EXP/day)
  - Breakdown:
    - Levels 1-10: ~10 EXP → 3 days
    - Levels 10-20: ~19 EXP → 6 days
    - Levels 20-30: ~33 EXP → 11 days
  - Note: villagers die, so 3-week max keeps investment reasonable without feeling grindy.
- Level up: toast "[name] reached level X!", glow effect for 3s.
- Permanent, no decay. Cap at 30.

### Blocked Tiles
- `blockedTiles` set: campfire, bushes, (future: buildings).
- Wandering: pick random tile, skip if blocked. Retry up to 10 times.
- Spawn: initial placement and new villagers avoid blocked tiles.
- Drag onto blocked tile: assign to work that target (existing behavior, unchanged).

### Eat Reactions (Juice)
When a villager eats, they do a happy bounce: scale to 1.1x with a little hop, lasts 2 seconds. That's the "stuffed look." No custom sprites needed, fits the pixel art style.
- Level up: green/gold glow (already planned) + bounce.

### Future Ideas (Not in Spec)
- Favorite foods: hidden per villager, double EXP + heart
- Stuffed buff: overfeed for +50% output (1h)
- Cook quality: Hardy/Mighty cooks make better food (+1 EXP)

### Retention Hook (Schell)
Randomized metabolism creates unpredictable leveling. Manual feeding creates favorites. The question "did my favorite level up?" pulls players back. The "ding" is the payoff.

### Meaningful Choice (Schell #39)
Food is limited. Who do you feed? Your hardest worker? Your favorite? Spread it evenly or min-max one? The choice is tactile (drag meal → villager), not a menu.

## Changes

### Sim
- `src/game/sim/villagerStats.js` (new): `createStats()`, `drainHunger()`, `gainExp()`, `checkLevelUp()`
- `src/game/sim/villagerStats.test.js` (new): hunger drain, EXP thresholds, level transitions
- `src/game/sim/meals.js`: add `reservedBy` field, `reserveMeal()`, `releaseMeal()`
- `src/game/config.js`: add `eating` section (hunger drain rate, EXP per meal, level thresholds)

### Controller
- `src/scenes/controllers/EatSystem.js` (new):
  - Hunger tick (every 10s, same as game tick)
  - Find hungry villagers, match to available meals
  - Handle walk-to-eat, consume, EXP, level up
  - Restore previous work assignment after eating
- `src/scenes/controllers/WanderController.js`: skip blocked tiles
- `src/scenes/VillageScene.js`: wire EatSystem, pass blockedTiles to spawn logic

### Save
- Persist `stats` per villager (metabolism, hunger, exp, level, traits)
- Persist `reservedBy` on meals

## Out of Scope
- Table ritual, feast day, Divine Tribute (future)
- Traits system (structure only, no traits yet)
- Hunger penalties (no starvation, just no EXP)
- Cooking while eating (independent systems)

## Play Verdict Needed
- Does the hunger timing feel right?
- Is the level-up moment satisfying?
- Do villagers reliably find and eat food?

