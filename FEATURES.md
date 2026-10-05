# Feature List — Idle Game

Living list of designed features by phase. Updated as design happens.
Locked = decided, buildable. Parked = designed, waiting for its phase.

---

## Phase 1: Gathering + Pathing (LOCKED)

The minimum slice. 3 villagers, berry bushes pre-placed on the 8x8 grid.
Village in shambles (cause unknown, mystery hook).

- Drag villager to bush to assign (tap-tap fallback). Bushes glow on valid drop.
- Assigned villagers walk to bush, play work animation, forage on the 10s tick.
- Production formula. Bush sweetSpot ~2.
- Floating +1s. Food counter appears in HUD on first gather.
- Idle villagers wander (render layer): random destination, random path, random 5-15s delay. BFS when blocked.
- Zero food behavior: TBD (stop working vs work slower).

**Test:** drag a little guy to a bush, watch the number go up.

---

## Phase 2: What We Do With Food (DEFINED)

- Eating: villagers eat daily. Table building (pre-placed), villagers visually gather.
- Cooking: kitchen building (pre-placed), auto-converts 2 berries → 1 meal.
- Raw → crafted resource model. Separate caps per tier. Crafting is cap relief.
- Recipe Discovery: start with 1 recipe, experiment to unlock more. Collection book.
- Feast Day: every 7 days. Spend food, villagers gather, cheer, tiered work buff.
- Divine Tribute: 0-25% tithe slider, offerings stockpile, spend on Blessings.

---

## Phase 3: Villagers Level Up (DEFINED)

Cooked meals are XP. Normal → Hardy (+25% output) → Mighty (+50% output).
Permanent, no decay. Glow at Hardy, golden aura at Mighty.

1. **Ascension Ceremony** (required): village gathers, cheer emotes, light beam. Level-ups are events, never silent.
2. **Tier Blessings:** Hardy = +25% output. Mighty = +50% + gather adjacent tiles without moving.
3. **Title Bestowal:** "Rowan the Sturdy," "Rowan the Mighty." Shown on sprite/roster.
4. **The Roster:** party screen. Portrait, name, tier, meals-to-next, assignment.
5. **Mentor:** Mighty villagers speed nearby Normals' XP gain (+25% within 2 tiles).

---

## Parked (designed, unphased)

- Wood/chopping, homes, build menu, population cap, lumber economy
- Travelers + Hungry Traveler (named, favorite foods, thought bubbles)
- Golden Berry (4% chance, 5x value, sparkle tell)
- Break Room (lumber building, +10% efficiency, visual breaks)
- Employee of the Month (top producer crown, buff + visual)
- Lineage: children start one tier below parents. Multi-generational progression.
- Day/night ritual clock (not a production gate)
- Save system: localStorage + export/import code. Offline: sinks tick or caps apply (TBD)
- Standup report (overnight summary)
- Stone/Steel resources (GAP: no sinks designed yet — blocked until sinks exist)
- Expandable grid beyond 8x8 (cost undecided)

---

## Theme (applies to everything)

**He identifies as an overworked corporate slave.** Every action the reincarnated
protagonist takes, it's because he did this at work. Nothing more, nothing less.
The villagers interpret everything as divine omniscience. The comedy is the gap
between what he sees (basic corporate playbook) and what they see (miracles).
Play it straight from both sides, never wink.
