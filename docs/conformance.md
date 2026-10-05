# Conformance checks

Working checklists derived from the four authorities (§1). Run the relevant
checklist against a spec at design time (before approval) and again at verify
time. Each checklist takes ~5 minutes. If a spec can't answer an item, the
spec is missing a decision, not the checklist being picky.

---

## 1. Economy checklist (Virtual Economies)

Every currency/resource must satisfy the **minimum viable set of pipes**:
at least one faucet AND at least one sink. A resource with a faucet but no
sink accumulates forever; with offline progress, "forever" arrives while the
player sleeps.

### 1a. Faucet/sink worksheet

Copy this per resource touched by the spec. All four rows are mandatory.

```
Resource: _______________

FAUCETS (where it enters the world)
# | Source              | Rate limiting knob
--|---------------------|----------------------------------
1 |                     |
2 |                     |

SINKS (where it leaves the world)
# | Drain               | Rate limiting knob
--|---------------------|----------------------------------
1 |                     |
2 |                     |

Net flow at endgame: [ ] faucet-dominant  [ ] balanced  [ ] sink-dominant
Inflation guard: _______________________________________________
```

Rules (Lehdonvirta & Castronova, ch. 11):

- **One faucet + one sink minimum per resource.** No exceptions. "Upgrade" or
  "grand project" written in the sink row without a designed drain is a
  placeholder, not a sink. Name the drain or admit the gap.
- **Judge every faucet/sink on three dimensions:** efficacy (does it move
  enough volume?), adjustability (can we tune it without players noticing?),
  user acceptance (does it feel fair?). The most effective sinks are usually
  the least accepted; the best sink is one that's fun content, not a tax.
- **Sinks independent of item stock adjust better.** A maintenance fee or
  consumption drain can be tuned without touching item stats.
- **Faucets tune three ways:** make the action harder, make the opportunity
  rarer, lower the yield. Our production formula already exposes these as
  baseRate / sweetSpot+teamBoost / overstaffDrag. Prefer tuning numbers over
  adding systems.
- **Sinks are the usual gap.** "The most common advice we give designers is
  to consider adding more sinks." When a resource piles up, add or strengthen
  a sink before nerfing a faucet; nerfing what players earn feels worse than
  giving them something to spend on.

### 1b. Current ledger (fill as specs land)

| Resource | Faucets | Sinks | Status |
|----------|---------|-------|--------|
| Food     | Farm/berry production (mBerry→mFish→mFarm) | Villager consumption 0.25/tick | OK |
| Lumber   | Tree production (mBranch→mLog→mSawmill) | Home construction costs | OK |
| Stone    | Quarry production (mPebble→mRock→mKiln) | "Upgrade" — NOT YET DESIGNED | GAP |
| Steel    | Mine production (mOre→mVein→mFurnace) | "Grand project" — NOT YET DESIGNED | GAP |

### 1c. Idle-game specific guards

- **Offline progress multiplies faucet runtime.** Every faucet must have a
  sink or cap that holds over 8+ hours away. Uncapped stockpiles are an
  inflation bug, not generosity.
- **Consumption scales with population, production scales with assignment.**
  If those two curves diverge at endgame, name which one wins and why.
- **New tier must not obsolete the old tier's sink.** When mFarm arrives,
  mBerry's faucet shrinks; check the worksheet again for the whole chain.

---

## 2. Lens checklist (Schell)

Selected lenses, as yes/no questions, grouped by when to ask them. Ask at
**design time** (spec discussion), re-ask at **verify time** (playtest).

### Onboarding (first 5 minutes)

- **Lens of the Toy (#17).** With no goals at all, is the grid fun to poke?
  Does the player want to tap tiles before knowing what to do?
- **Lens of Goals (#32).** Is the current goal concrete and visible? Does the
  player know the next 2 steps (forage → wood → homes → travelers)?
  Short-term and long-term goals both present?
- **Lens of Visible Progress (#55).** What does progress look like right now?
  Is any progress hidden that could be shown (counters, animations, grumbles)?

### Economy (any spec touching resources)

- **Lens of Economy (#52).** How is this earned? What is it spent on, and why
  would the player care? Is earning too easy/hard, and which knob changes it?
  Should this be a universal or specialized currency?
- **Lens of Endogenous Value (#7).** What makes this resource valuable *to the
  player*? If the answer is "numbers go up," the resource needs a fiction or a
  choice attached.
- **Lens of Meaningful Choices (#39).** What choice is the player making here?
  Is there a dominant strategy (always assign max villagers)? Where is the
  triangularity: safe small reward vs. risky big reward?

### Retention (session, day, run)

- **Lens of Curiosity (#6).** What question does this spec plant in the
  player's mind? What makes them care? (Curiosity, never FOMO: no timers that
  punish absence.)
- **Lens of the Interest Curve (#69).** Sketch the session curve: hook, rising
  interest, rest, payoff. Does the fractal hold: is a 5-minute session, a day,
  and a full run each shaped like a curve, not a flat line?
- **Lens of Time (#27).** What sets the length of this activity? Hierarchy of
  time structures: ticks → sessions → days → runs. Would a clock make it more
  exciting, or would a time limit just irritate? (Day/night is a ritual clock,
  never a production gate.)

### Cozy feel (every spec, always)

- **Lens of Punishment (#47).** What punishes the player here? Why? Is it
  fair? Can it be turned into a reward with the same effect? (Worst case is
  villagers quit. Never starvation, never raids.)
- **Lens of Reward (#46).** Does the player understand the reward they just
  got? Too regular? Building too fast/slow? Rewards must be legible: never
  show the formula, always show the result.

---

## 3. Pattern checklist (Nystrom)

Name the pattern when it drives a decision (§4). "Data-driven" in this
codebase is Nystrom's **Type Object** pattern: building/villager varieties are
data instances, not classes. Call it by its name.

### Adopted (already in the codebase)

| Pattern | Where | Use-when guidance |
|---------|-------|-------------------|
| Update Method | `sim/tick.js`: 10s tick, pure `(state) => state` | Each sim entity gets one update per tick; caller owns the clock, tick owns the math. |
| Type Object | `data/buildings.js`: buildings as config entries | New variety = new data instance, never a new class. Balancing = editing numbers. |
| Observer | Phaser emitter as event bus (logic → UI) | UI subscribes to sim events; sim never calls UI. HUD updates are subscriptions, not calls. |
| State | One Phaser scene per screen/state | Behavior changes with mode → new state object, not flags + if-chains. Villager lifecycle (idle/working/hungry) is the next State candidate. |
| Game Loop | Fixed 10s sim tick, render decoupled | Update on a fixed timestep; render as fast as the device allows. Offline progress = run N ticks, same code path. |

### Candidates (reach for when the spec needs them)

- **Command** — *Use when:* a player action (assign, build, demolish) should be
  undoable, queueable, or serializable. Encapsulating actions as objects buys
  an action log for free, which doubles as a debug/replay trail. Evaluate at
  the assignment spec.
- **Component** — *Use when:* villagers need mixed behaviors (worker + hunger +
  age) without an inheritance tree. Prefer composition over a
  `Villager extends Unit extends Entity` chain. Evaluate at the villager spec.
- **Event Queue** — *Use when:* the order or timing of processing matters apart
  from when events fire. distinct from Observer: Observer decouples *who*
  listens, Event Queue decouples *when* it's handled. Candidate for cutscene
  sequencing and ordered tick side-effects.
- **Dirty Flag** — *Use when:* recomputation is expensive relative to how often
  things change. HUD counters update per tick: only re-render the digits that
  changed. Cheap now, load-bearing later.
- **Service Locator** — *Use when:* systems (save, audio, rng) need global
  reach without Singleton's test-killing grip. Nystrom's caution stands:
  prefer constructor injection; locator is the fallback, not the default.

### Probably not (say why, don't just skip)

- **Object Pool** — for high-frequency alloc/dealloc (particles, projectiles).
  We have none yet. Revisit if particle effects arrive.
- **Spatial Partition** — for many moving entities with proximity queries. An
  8x8 grid with a dozen villagers doesn't need it. The grid *is* the partition.
- **Singleton** — avoid. Global mutable state breaks the pure-tick discipline
  and makes tests lie. If something feels like a Singleton, it's a Service
  Locator or a constructor argument instead.
- **Double Buffer, Data Locality** — CPU-cache optimization patterns. Our
  bottleneck will be design iteration speed, not cache lines. Ignore until a
  profiler says otherwise.

### The judgment rule (§1.1)

"The simple thing beats the pattern when the pattern is overkill." A pattern
checklist is not a shopping list. If a spec can be written cleanly without a
pattern, that's conformance too. Name the pattern when you *do* use one; say
plainly when you chose the simple thing instead.

---

## 4. Playtest checklist (Fullerton)

The playcentric loop is conceptualize → prototype → playtest → evaluate →
refine, and it never stops (ch. 2, 7). Our process runs it once per spec:
the build IS the prototype, Kenny IS the playtester, and the loop closes
before verify. "No feature is finished until it has been played" (§1.4) is a
process step, not a sentiment: **build → play → evaluate → verify.**

### 4a. Experience goal worksheet

Set per spec at design time, checked at playtest time. An experience goal is
a feeling, not a feature (ch. 1, 5th ed.). Features get brainstormed later to
meet the goal; the playtest checks whether the goal landed.

```
Spec: _______________
Experience goal: "The player feels _______________ when _______________."
How we'll know it landed (observable, not vibes): _______________
```

Examples: "The player feels clever when three villagers finish a home without
being micromanaged." "The player feels cozy dread when the day/night bell
rings and the village glows." If you can't write the sentence, the spec isn't
ready for tasks.md.

### 4b. The playtest protocol (solo dev + AI edition)

Fullerton's A–N rules (ch. 9), adapted for one developer who also designed
the thing:

- **Play before it's polished.** Playtest the ugly build, not the finished
  design. If it feels ready to show off, you waited too long; the valuable
  changes are the structural ones, and those get expensive late.
- **One key question per spec.** Enter every playtest knowing what you want
  to learn. "Does assigning villagers feel good?" beats "is the game fun?"
  The playtest will surface unplanned issues anyway; the question keeps the
  session honest.
- **Beginner's mind.** You know how it works; play like you don't. Don't use
  dev knowledge to skip confusion: if you have to remember the spec to play
  it, the game failed to teach itself. (Fullerton: self-testing is most
  valuable early, but only when played naively.)
- **Don't explain it to yourself.** No re-reading tasks.md before playing.
  The build must carry the design. Whatever you can't figure out cold is a
  real onboarding bug.
- **Think aloud, write it down.** Narrate what you're thinking while you
  play; note timestamps. Memory casts everything in the best possible light,
  so the notes are the truth and the memory is the PR spin.
- **Blame the design, not the player.** Confusion is a design bug. "I should
  have known that" is the design talking, not you.
- **Try one variation.** If something feels off, change ONE knob (a rate, a
  cost, a delay) and replay. Changing three things teaches you nothing about
  which one mattered.
- **Shut up and watch.** Don't guide yourself toward the intended path. Take
  the wrong turn, tap the wrong tile, ignore the goal. The mistakes are the
  data.

### 4c. Playtest report

What Kenny sends back after playing. Five minutes to write, and it's the
input to evaluate/refine before verify.

```
Spec: _______________
Time played: _______________
The one key question: _______________
Answer: _______________
Experience goal landed? [ ] yes [ ] partially [ ] no
Felt-good moments: _______________
Friction moments: _______________
Confusion (what didn't teach itself): _______________
Numbers check (did counters/economy feel right, not just compute right?): ___
Verdict: [ ] ship [ ] tune numbers [ ] redesign
```

- **Ship** = experience goal landed, no confusion, numbers feel right.
- **Tune numbers** = structure is right, feel is off. Change knobs (Fullerton's
  variations rule, §3's "prefer tuning numbers over adding systems"), replay.
- **Redesign** = experience goal missed or the confusion is structural. Back
  to design, not to code. This is the cheap failure the loop exists to catch.

### 4d. Who playtests (stages)

- **Self-test (now):** Kenny, with beginner's mind. Catches structural and
  feel problems. Sufficient while the game is a prototype.
- **Confidants (when the loop is playable end-to-end):** Victoria, a friend.
  They don't know the design; their confusion is pure signal. Don't explain,
  don't defend, take notes.
- **Strangers (much later, if ever):** only when the game is feature-complete
  enough that politeness stops being the main filter. Not a Phase 1 concern.

Fullerton's warning stands at every stage: never rely too heavily on one
small group. Rotate confidants when you have them; until then, rotate your
own mindset (tired-evening play vs. fresh-morning play count as different
testers).
