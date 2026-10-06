# Tasks: 07 Cooking Mechanics (Phase 2)

Key decisions (locked):
- Campfire (animated campfire_48x48.png spritesheet) at C5 (tileX: 2, tileY: 4).
  Deterministic placement, config-driven.
- Campfire tile is blocked (not walkable, not wandering-through).
- Two separate interactions:
  - **Drag** villager to campfire → assign as cook (same as bushes:
    random side, directional work anim, workOffset).
  - **Tap** campfire → recipe menu (RexUI dialog, text for now, pictures later).
- Recipes are per-recipe cook requirements. Can't start without enough cooks.
- Recipes (numbers are v1, Kenny will tune):
  - **Berry Meal**: 2 berries → 1 meal. 1 cook required. 1 EXP. 2 ticks (20s).
  - **Hearty Stew**: 4 berries → 1 hearty meal. 2 cooks required. 2 EXP. 3 ticks (30s).
- Player taps a recipe in the menu to add it to the queue (if enough cooks assigned).
- **Recipe queue**: FIFO list. Tap a recipe to queue it, tap a queued item to remove it.
- Queue display: text list showing recipe names in order (e.g. "1. Berry Meal\n2. Hearty Stew").
- Berries consumed when cooking starts (not when queued).
- One recipe cooks at a time. When done, next in queue starts automatically
  (if berries + cooks still available).
- Cooking pauses if cooks drop below requirement. Resumes when restored.
- When done: planter_white_01.png drops on a random adjacent tile.
  If multiple meals on same tile, offset slightly (same cluster logic as villagers).
- **Food expiration**: meals rot after 10 minutes (config: `mealExpiryMs`).
  Rotten meals transform to mushroom_orange sprite. Villagers can't eat rotten food.
  Rotten meals disappear after 2 more minutes (config: `rottenDespawnMs`).
- All tuning numbers in config: recipe costs, cook requirements, cook ticks,
  EXP values, meal caps, expiry time, eat tick length. Functionality only;
  Kenny tunes numbers later.
- Meal counter UI (next to berry counter). Berry cap + meal cap in config.
- Meal dispatcher: on eat tick, each villager walks to nearest meal, eats, gains EXP.
- EXP: Berry Meal = 1, Hearty Stew = 2. Tiny EXP bar under villager (no numbers).
- Breakfast bonus: first meal of day = +1 extra EXP.
- No starvation. No punishment.
- All numbers in config (recipes, cook requirements, ticks, EXP, caps).

Experience goal: the player feels like a provider when they watch raw
berries become meals that their villagers walk over to eat.

## Build
- [ ] `src/game/sim/cooking.js` — `canStartRecipe(recipe, cooks, berries)`,
      `startCooking(...)`, `cookingTick(...)`. Pure functions.
- [ ] `src/game/sim/cooking.test.js` — recipe requirements, insufficient cooks,
      insufficient berries, tick progress, completion.
- [ ] `src/game/sim/meals.js` — meal objects, dispatcher logic
      (`assignMealsToVillagers`), EXP gain.
- [ ] `src/game/sim/meals.test.js` — dispatcher assigns nearest, EXP correct.
- [ ] `src/scenes/controllers/CookSystem.js` — campfire sprite + animation,
      drag assignment, tap menu (RexUI), cooking progress, meal drops.
- [ ] Config: campfire position, recipes array, meal caps, eat tick length.
- [ ] Wire into VillageScene. Campfire tile added to blockedTiles.
- [ ] Save: persist meals on ground, cooking progress, meal count.

## Play
- [ ] Kenny plays: drag cook to campfire, tap campfire, start Berry Meal.
      Does the meal drop? Do villagers eat it? Does EXP go up?

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check.
