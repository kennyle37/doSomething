# Feature List — Idle Game

Living list of designed features by phase. Updated as design happens.
Locked = decided, buildable. Parked = designed, waiting for its phase.

---

## Vision

**Power-trip game with cozy aesthetics.** The art is soft, the fantasy is control.
The player is a god-manager with absolute power over villagers. The tension is
what kind of god they become.

The corruption arc is literal: the protagonist can become the boss he hated.
"Downsize" removes villagers (they walk into the woods and don't return).
Corruption meter tracks dark choices. Villagers' behavior toward the player changes.
Dark path is opt-in, never accidental.

Design pillars:
- Everything interactable (Schell's Lens of the Toy). Only villagers and buildings are levelable.
- Magic = breaking the sim's rules (wild surges, teleportation, unpredictable shrine).
- No FOMO timers that punish absence. Reward presence via curiosity and anticipation.

---

## Phase 1: Gathering + Pathing (LOCKED, BUILT)

The minimum slice. 3 villagers, berry bushes pre-placed on the 8x8 grid.
Village in shambles (cause unknown, mystery hook).

- Drag villager to bush to assign (tap-tap fallback). Bushes glow on valid drop.
- Assigned villagers walk to bush, play work animation, forage on the 10s tick.
- Per-worker production timers (must complete full interval).
- Floating +N feedback (actual count per bush). Berry counter in HUD.
- Idle villagers wander: random destination, BFS pathfinding around blockers.
- Scene split into controllers (VillagerRenderer, DragManager, WanderController, BushSystem).
- Central config at src/game/config.js for all tuning.

**Test:** drag a little guy to a bush, watch the number go up.

---

## Save System (NEXT)

- localStorage, versioned schema (v1), auto-save every 30s + on page hide.
- Offline progress: assigned villagers produce for elapsed time, capped at 8 hours.
- Export/import as base64 text code (backup against cache wipes).
- window.__debug tools: setBerries, assignAll, unassignAll, tick, export, import, wipe.
- RexUI plugin added; export/import modal is the first RexUI UI.

---

## Phase 2: Cooking → Eating → EXP (DEFINED)

Kitchen converts berries to meals. Villagers eat meals, gain EXP.

- Kitchen building (pre-placed, config position). Drag villager to assign as cook.
- Cook converts 2 berries → 1 meal per 10s tick.
- 10% chance of "hearty meal" (double EXP, sparkle effect). Variable reward.
- Meal counter UI. Berry cap + meal cap (production stops at cap).
- Meals drop on ground near kitchen. Meal dispatcher assigns nearest meal to each villager on eat tick.
- Villagers walk to meal, eating animation, +1 EXP float.
- Breakfast bonus: first meal of the day per villager = +2 EXP.
- Tiny EXP bar under each villager (no numbers, threshold hidden).
- After 10 meals cooked: "The cook seems to be experimenting..." (teases recipe discovery).
- High-EXP villagers get subtle glow (teases Phase 3).
- No starvation. No punishment for absence.
- Day length, caps, rates, crit chance all in config.

**Test:** assign a cook, watch meals drop, watch villagers eat and gain EXP.

---

## Phase 3: EXP → Levels (DEFINED)

Cooked meals are XP. Normal → Hardy → Mighty. Permanent, no decay.

- Hardy: +25% output. Visual: slightly bigger, rosy cheeks.
- Mighty: +50% output + new capability (e.g. forager brings 2 berries/tick). Visual: glow/aura.
- Level-up is an event: village gathers, cheer, light beam. Never silent.
- Title bestowal: "Rowan the Sturdy," "Rowan the Mighty."
- Mentor: Mighty villagers speed nearby Normals' XP gain.
- Roster screen (portrait, name, tier, assignment).

---

## Phase 4: Cutscenes (DEFINED)

Intro storyboard (locked):
- Night-office layoff dialogue (monitors show code + kid's birthday reminder).
- Walk home. EDISON cybertruck truck-kun with small logo badge.
- First-person village wake-up POV.
- Subway scene cut.

---

## Parked (designed, unphased)

### Government System
- Player chooses: Top-Down / Republic / Cult / Anarchy.
- Each changes the assignment mechanic (manual / auto-dispatcher / frenzy-when-watched / random).
- Switched via the Forum building: village assembly ceremony.
- Transition period: villagers confused for a day after switching.

### Laws & Decrees
- Enacted at the Forum. Each law is a toggle with a tradeoff.
- Examples: "Mandatory Overtime" (+20% production, -happiness, +corruption),
  "Feast Day" (-food, +happiness), "Tithe" (10% of production to player stockpile).
- Historical inspiration: Roman bread and circuses, Athenian ostracism,
  Hammurabi's code, feudal corvée.

### Demon-Manager Portals
- Late-game building. Summoning ritual (a hiring process).
- Demons are middle managers (tie, latte, clipboard). Villagers are terrified.
- Each type has an aura: Synergist (+15% adjacent workers), Visionary (reveals
  next wild surge), Disruptor (random surges, chaotic).
- Bureaucracy meter: more demons = bigger buffs but slower everything.
- Upkeep: they consume coffee/meals. Unfed demons schedule useless meetings.

### Lineage & Breeding
- Villagers age (young → adult → elder → die peacefully of old age).
- Adults have kids. Traits inherit and combine (foraging speed, cooking skill, luck).
- Selective breeding over generations for stacked bloodlines.

### Kings
- Emerge from strong bloodlines (not appointed by player).
- Don't work, provide aura buffs. Villagers treat them differently.

### Dragons
- Wild dragon nests in mountains, sometimes flies over.
- Late game: find egg via exploration, hatch it, imprints on village.
- Mostly vibes. Maybe increases wild surge frequency when near.

### Magic Mechanics (magic = breaking the sim's rules)
- Wild magic surges: random bush glows, double production for 60s. Unpredictable.
- Waystones: paired teleporters. Villagers carrying meals teleport instead of walking.
- Shrine / Divine Tribute: offer meals, something unpredictable happens.
- Enchanted tools: Mighty villagers attune to stations, sometimes produce without consuming inputs.
- Foresight: once per day, sense which bush will surge next.

### Population
- Cap: 30 villagers max. Gated by houses (each house = 4 beds).
- New villagers arrive as travelers or are born via lineage.

### Corruption Path
- "Downsize" action (corporate euphemism, never "kill"). Villager walks into woods, doesn't return.
- Corruption meter (hidden at first). Rises with downsizing, overwork, Top-Down choices.
- Villagers' behavior changes: stop waving, chatter stops, music shifts.
- Dark path is always opt-in, never accidental.

### Other Parked
- Wood/chopping, lumber economy (GAP: needs sinks designed)
- Stone/Steel resources (GAP: no sinks designed yet, blocked until sinks exist)
- Travelers + Hungry Traveler (named, favorite foods, thought bubbles)
- Recipe discovery (combine ingredients, collection book)
- Feast Day (every 7 days, spend food, tiered work buff)
- Day/night ritual clock (not a production gate)
- Seasons (spring = more berries, winter = slower foraging)
- The woods exploration (send villager, they return with something)
- Expandable grid beyond 8x8 (cost undecided)
- Standup report (overnight summary)

---

## Theme (applies to everything)

**He identifies as an overworked corporate slave.** Every action the reincarnated
protagonist takes, it's because he did this at work. Nothing more, nothing less.
He doesn't think of it as anything more than that. The villagers interpret
everything as divine omniscience. The comedy is the gap between what he sees
(basic corporate playbook) and what they see (miracles). Play it straight from
both sides, never wink.
