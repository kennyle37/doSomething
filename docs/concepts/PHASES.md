# Phase Plan: Isekai Idle Village

World: 32x32 grid. Ocean west, village center, snowy mountains north, volcanoes east, forest south, farm southeast, ruins scattered. (See `concepts/world-map-final-inspo.webp`)

Philosophy: barebone engine first, fun later. Each phase is one core feature. Generalize last.

---

## Phase 1: Gathering (DONE)
**Goal:** Villagers collect berries from bushes.

- 3 villagers, Memao sprites, idle/walk/work animations
- Drag-and-drop assignment to bushes
- 10s foraging tick, berries increment
- Villagers wander when idle
- 8x8 starting grid

**Out of scope:** Everything else.

---

## Phase 2: Food Chain (cooking DONE)
**Goal:** Cook food → villagers eat → gain EXP → level up.

- [x] Campfire at fixed tile, animated
- [x] Recipe queue (FIFO, add/remove)
- [x] 2 recipes: Berry Meal, Hearty Stew
- [x] Meals pop out, expire → rotten → despawn
- [ ] Villagers auto-eat when hungry (daily cycle)
- [ ] EXP per meal eaten (config-driven)
- [ ] Level thresholds: Normal → Hardy (+25% output) → Mighty (+50% output)
- [ ] Visual: glow/aura per tier, "LEVEL UP!" toast
- [ ] Save/restore EXP and levels

**Out of scope:** Table ritual, feast day, Divine Tribute, recipe discovery (future).

**Done when:** A villager eats enough meals to hit Hardy, and you see the glow.

---

## Phase 3: Buildings
**Goal:** Spend resources to place buildings on the grid.

- Building types: House (+4 villager cap), Farm (unlocks crop gathering), Town Hall (unlocks menu)
- Plop placement: select from build menu → click tile → placed instantly, resources deducted
- Buildings occupy tiles (blocked, not walkable)
- Buildings have pixel art from Serene Village pack
- Save/restore building placements

**Out of scope:** Construction time, building upgrades, building levels (future).

**Done when:** You can place a house and the villager cap increases.

---

## Phase 4: Menu / UI Shell
**Goal:** Full game UI matching the mockup layout.

- Top bar: resource counters (berries, wood, stone, meals) with per-min rates, day counter
- Sidebar tabs: Build, Villagers, Skills (locked until Phase 7), Stats
- Build tab: building cards with costs, click to enter placement mode
- Villagers tab: roster with name, job, level, EXP bar
- Mobile: drawer pattern (sidebar slides in)
- Visual style lock: palette, typography, CRT overlay (from mockup)

**Out of scope:** Skill tree content (Phase 7), fancy animations (post-MVP).

**Done when:** You can manage the entire game from the UI without debug tools.

---

## Phase 5: Resources & Regions
**Goal:** Wood and stone gathering from regional nodes.

- South forest: trees → wood (reskin of berry gathering)
- North mountains: rocks → stone (reskin of berry gathering)
- Unlock regions by expanding grid (12x12 → 16x16 → 20x20)
- New resource counters in top bar
- GatherSystem generalized from BushSystem (config-driven: resource type, art, timing)
- **Map rebuild:** terrain matches `concepts/world-map-final-inspo.webp`
  - Ocean west with beach + dock, snowy mountains north, volcanic east, forest south
  - Village center with plaza (not farm look)
  - Scrolling camera (drag to pan, pinch to zoom)
  - 32x32 world grid

**Out of scope:** Ocean/fishing, volcanic mining, farm crops (future phases).

**Done when:** Villagers gather wood and stone, counters increment, map looks like the inspo.

---

## Phase 6: Upgrades
**Goal:** Spend resources to boost production.

- Upgrade types: Sharper Tools (+gather speed), Cozy Beds (+villager cap), Fertile Soil (+farm output)
- Each upgrade has 3 tiers, increasing cost
- Upgrades panel in sidebar (or Build tab section)
- Effects apply immediately, config-driven
- Save/restore upgrade levels

**Out of scope:** Skill tree (Phase 7), building-specific upgrades (future).

**Done when:** Buying Sharper Tools visibly speeds up gathering.

---

## Phase 7: Skill Tree
**Goal:** Manager corruption arc skill tree.

- Three branches: Delegation, Synergy, Thought Leadership
- Corruption branch (opt-in): Micromanage, Downsize
- Skill points earned from leveling villagers (Phase 2)
- Corruption meter tracks dark choices
- Visual: skill tree UI in sidebar Skills tab

**Out of scope:** Government system, demons, prestige (future).

**Done when:** You can spend a skill point and feel the effect.

---

## Phase 8: Generalize
**Goal:** Refactor into reusable components.

- BushSystem → GatherSystem (config: resource, art, timing, node type)
- CookSystem → CraftSystem (config: inputs, outputs, duration, station)
- Extract shared patterns: assignment, progress tracking, expiration
- All existing features keep working (no regressions)
- 81+ tests passing

**Out of scope:** New features. This is pure refactoring.

**Done when:** Adding a new resource (e.g., fish) is config-only, no new code.

---

## Phase 9: Cutscenes
**Goal:** Intro storyboard.

- Night office: layoff dialogue
- Walk home
- EDISON cybertruck truck-kun
- First-person village wake-up POV
- Skippable, plays on new game

**Out of scope:** Mid-game cutscenes, multiple endings (future).

**Done when:** New game plays the intro and lands in the village.

---

## Post-MVP: The Full Vision

These phases build toward the mockup's end product. Same rules: one core feature per phase, tightly scoped.

---

## Phase 10: Ocean & Fishing
**Goal:** Unlock the west coast for fishing.

- Fishing dock building (place on beach tiles)
- Fish as new resource (reskin of gathering via GatherSystem)
- Villagers assigned as fishers
- Fish → cooked meals (new recipes via CraftSystem)

**Out of scope:** Boats, deep-sea content (future).

**Done when:** Villagers catch fish, fish appears in resource bar.

---

## Phase 11: Farm & Crops
**Goal:** Farming system in the southeast plots.

- Farm building enables crop plots
- Crops: wheat, carrots (timed growth, harvest when ready)
- Different from gathering: plant → wait → harvest cycle
- Crops → new cooking recipes

**Out of scope:** Crop breeding, seasons (future).

**Done when:** You plant wheat, wait, harvest it.

---

## Phase 12: Feast & Table Ritual
**Goal:** Social eating mechanics.

- Table building: villagers visually gather to eat together
- Feast day: every 7 days, happiness buff if enough food stored
- Divine Tribute: surplus food saved for blessings (random buffs)
- Villager happiness stat (affects output)

**Out of scope:** Complex AI, relationships (future).

**Done when:** Feast day triggers and villagers gather at the table.

---

## Phase 13: Recipe Discovery
**Goal:** Unlock new recipes through experimentation.

- Discovery: combine ingredients to discover recipes (or unlock via milestones)
- New recipes: Fish Stew, Veggie Roast, Hearty Platter
- Recipe book UI showing discovered/undiscovered
- Each recipe has different EXP values and buffs

**Out of scope:** Fail states, complex cooking minigames (future).

**Done when:** You discover a new recipe and cook it.

---

## Phase 14: Government
**Goal:** Choose how the village is run.

- Forum building: triggers village assembly ceremony
- Choose: Top-Down / Republic / Cult / Anarchy
- Each changes assignment mechanics:
  - Top-Down: direct control (current)
  - Republic: villagers vote on priorities
  - Cult: villagers auto-worship, work for devotion
  - Anarchy: villagers choose own jobs
- Can switch via new assembly (costs resources)

**Out of scope:** Elections, campaigning (future).

**Done when:** You switch to Republic and villagers vote.

---

## Phase 15: Lineage & Kings
**Goal:** Villagers breed, traits inherit, kings emerge.

- Breeding: two villagers → child with mixed traits
- Traits: Strong (+output), Swift (+speed), Wise (+EXP gain)
- Traits stack over generations
- King: emerges from strongest bloodline, aura buff to nearby villagers
- Population cap: 30 (gated by houses)

**Out of scope:** Complex genetics, family trees UI (future).

**Done when:** A child is born with parent traits.

---

## Phase 16: Demons
**Goal:** Summon demon-managers from portals.

- Demon portal in volcanic east (pre-placed, unlock via quest)
- Summon ritual: costs resources, spawns demon-manager
- Demon types: Efficiency Imp (+gather speed aura), Morale Succubus (+happiness aura), Paperwork Devil (+bureaucracy but +output)
- Bureaucracy meter: rises with demons, causes slowdowns if too high
- Demons are permanent unless banished

**Out of scope:** Demon quests, hell dimension (future).

**Done when:** You summon a demon and see its aura effect.

---

## Phase 17: Dragons
**Goal:** Wild dragons → hatchable companions.

- Dragons fly overhead randomly (already in mockup)
- Dragon nest in north mountains (discoverable)
- Egg: rare drop from nest, hatch after X days
- Hatchling: mostly vibes, small buffs (warms campfire, scares pests)
- Adult dragon: major buffs, can be ridden (visual)

**Out of scope:** Dragon combat, breeding (future).

**Done when:** A dragon egg hatches.

---

## Phase 18: Laws & Decrees
**Goal:** Political systems layer.

- Decrees: player-issued laws (e.g., "No work on feast day", "Double rations for miners")
- Each decree has effects and costs
- Villager reactions based on government type
- Succession: when king dies, heir takes over (lineage)
- Corruption meter: tracks dark choices across all systems

**Out of scope:** Revolutions, coups (future).

**Done when:** You issue a decree and see its effect.

---

## Phase 19: Prestige (Promotions)
**Goal:** Corporate ladder prestige system.

- Promote: Junior Manager → Manager → Senior Manager → Director → VP → CEO
- Each promotion: reset village, keep permanent stacking perk
- Perks: +10% output, +1 villager cap, unlock new buildings, etc.
- New game+ with harder challenges

**Out of scope:** Multiple save slots, leaderboards (future).

**Done when:** You promote and start over with a perk.

---

## Phase 20: Magic System
**Goal:** Village becomes progressively more magical.

- Magic unfolds across runs (tied to prestige level)
- Raw resources become magical (Glimmerwood, Runestone)
- Finished goods stay mundane (thesis: magic-to-mundane pipeline)
- Blessings, enchantments, ley lines
- The mystery of the ruins deepens

**Out of scope:** Spellcasting, mana (future).

**Done when:** You harvest your first Glimmerwood.

---

## End Product Checklist
The mockup's vision, fully realized:
- [ ] 5 regions with unique resources
- [ ] Full village with 30 villagers
- [ ] Government, laws, succession
- [ ] Lineage, kings, traits
- [ ] Demons, bureaucracy
- [ ] Dragons
- [ ] Magic system unfolding
- [ ] Prestige loop
- [ ] Corruption arc complete
- [ ] Intro + ending cutscenes

---

## MVP Checklist
After Phase 9, the game has:
- [ ] Gather 3 resources (berries, wood, stone)
- [ ] Cook meals, villagers eat and level up
- [ ] Place buildings, manage villagers via UI
- [ ] Buy upgrades, unlock skill tree
- [ ] Intro cutscene
- [ ] Save/load everything
- [ ] 32x32 world with regions, scrolling camera
- [ ] Generalizable architecture for future content
