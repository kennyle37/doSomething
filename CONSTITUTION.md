# CONSTITUTION.md — Idle Game

Standing law for this project. Every change must conform to this file.
If a rule conflicts with a better idea, propose amending this file first.
Never silently violate it.

## 1. Authorities (guidelines, not ranked)

Reference library for checking and verifying decisions. No priority order,
use whichever lens fits the question.

1. **Game Programming Patterns** (Nystrom) — architecture guidance, applied with
   judgment. The simple thing beats the pattern when the pattern is overkill.
2. **The Art of Game Design** (Schell) — design decisions get run through
   Schell's lenses. If a feature doesn't survive its lens, it gets cut or reworked.
3. **Virtual Economies** (Lehdonvirta & Castronova) — every currency follows
   faucet/sink discipline.
4. **Game Design Workshop** (Fullerton) — playcentric process. Prototype early,
   playtest, iterate on feel. The build-test-fix loop is the design method;
   no feature is finished until it has been played.
5. **Bullshit Jobs** (Graeber) — thematic reference for the middle-manager satire.
6. **Capitalist Realism** (Fisher) — thematic reference for the
   capitalist-hellscape atmosphere, kept in the background.

## 2. Game design pillars (locked)

- **Cozy but interesting.** No fail states that feel punishing. The worst thing
  that happens to a neglected villager is they quit. Villagers age and die
  peacefully of old age only. Cozy is the floor, not the ceiling.
- **Capitalist hellscape, played straight.** We turn an untouched magical world
  into industrialized capital. The fantasy feels awesome: cool magical goods,
  satisfying production. The dystopia stays in the background, never preached,
  never winked at. The smart player notices what the village is becoming.
- **The manager is the corruption arc.** The skill tree (Delegation, Synergy,
  Thought Leadership) is the protagonist becoming what he hated. Villagers notice.
  Play it straight, never wink at the camera.
- **He identifies as an overworked corporate slave.** Every action the reincarnated
  protagonist takes, it's because he did this at work. Nothing more, nothing less.
  He doesn't think of it as anything more than that. The villagers interpret
  everything as divine omniscience. The comedy is the gap between what he sees
  (basic corporate playbook) and what they see (miracles). Play it straight from
  both sides, never wink.
- **Free placement, zero consequences.** Player places buildings anywhere on the
  grid, moves them anytime, for free. Position never affects production.
- **Anti-grind rule.** Every loop pays out inside its own timeframe. Session loops
  resolve in minutes, hourly loops in an hour, weekly loops in a week.

## 3. Architecture rules

These exist to make the game easier to change as it grows, not harder.
Each pays an upfront cost once and makes every later feature cheaper.

- **Data-driven.** Buildings, resources, skill nodes, cutscenes are config data;
  one generic system reads the config. Adding a Sawmill = 5 lines in a data file,
  not a new class. Balancing = editing numbers, not code.
- **Tick-based simulation, separate from render.** The world updates on a fixed
  clock, independent of frame rate. Offline progress is free: reopen after
  8 hours and we just run the tick for the elapsed time. Same code path online
  or offline, same results on any device.
- **Event bus between logic and UI.** Phaser's emitter. Logic never touches UI
  directly; UI subscribes to events. HUD updates are a subscription, not a call.
- **Versioned save schema.** localStorage, schema version + timestamp on every
  save. Migrations for old versions, never silent data loss. Export/import save
  as text code (no-backend backup).
- **Scenes are states.** One Phaser scene per screen/state (Boot, Cutscene,
  Village, etc.). Cutscenes are data played by a generic player, not bespoke code.

## 4. Code rules

- Patterns with judgment (§1.1). Name the pattern when it drives a decision.
- No hard-coded game values. No magic numbers for anything a designer would tune.
- Every step's code must build cleanly before handoff. No "it should work."
- Art is referenced by sprite key, never by file path in logic. Swapping art =
  replacing files, zero code changes.
- New systems ship with tests.

## 5. Asset rules

- Current art:
    - LimeZu Serene Village revamped (CC-BY 4.0 — credit required).
    - Memao Fantasy Character Sprite Pack by Sleeping Robot Games (free;
      check original page for attribution terms). Split into per-character
      animation strips on 48x48 cells.
- Attribution file lives at `public/assets/ATTRIBUTION.md`, updated whenever a
  pack is added.
- Packs stay in their own subfolder under `public/assets/`. Never dump flat.

### 5a. Art direction (locked)

- **48x48 cells.** Every sprite sits on the 48x48 grid. Tiles, characters,
  objects, no exceptions.
- **One style.** Pixel art with dark outlines and a soft, desaturated palette,
  matching the Serene Village set. No mixed styles in the same scene: no
  photorealistic, no vector cartoon, no second pixel style.
- **Fantasy villagers, not modern farmers.** Characters are isekai natives in
  simple tunics and work clothes. Nothing job-specific in the base sprite;
  role cues (a straw hat for farmhands) are overlays, not separate characters.
- **New packs must conform before merging.** A pack that doesn't match the grid
  or the style doesn't go into `public/assets/` until it's converted or it's
  rejected. Style fit is decided at pack-pick time, not at render time.

## 6. Process (spec-driven)

## 6. Process

**One thing at a time.** Work on one system at a time. The moment discussion
drifts into a second system, stop: finish the current one, then open a new
one. A growing task list is a scope problem, not a space problem. When in
doubt, the smaller step is the right one.

1. **Propose** — the user proposes an idea.
2. **Design together** — the idea gets worked in conversation. Muse maps it
   to this constitution's patterns and rules, naming the patterns per §4.
   Run the relevant `docs/conformance.md` checklist. Write the experience goal
   ("the player feels ___ when ___"). Unanswered items are missing decisions.
3. **Tasks** — `specs/<step>/tasks.md`: implementation checklist plus key
   decisions, written together. **User approves before code is written.**
4. **Build** — Muse writes the code and its tests.
5. **Play** — the user plays the build. One key question per spec, beginner's
   mind, think aloud. Fill the playtest report (`docs/conformance.md` §4c).
   Verdict: ship, tune numbers, or redesign (redesign loops to step 2).
6. **Verify** — build passes, tests pass, conformance re-checked, then handoff.
   Economy specs must include the faucet/sink worksheet per resource.

Skipping the approval gate is a constitution violation.
