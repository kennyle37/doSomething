# Tasks: Production Formula

Key decisions (locked):
- Tick = 10 seconds. Pure function, `(state) => void` (mutates state).
- Formula: `output = baseRate × boosted × (1 + teamBoost × (boosted−1))
  × (1 − overstaffDrag)^extra`
    - `boosted` = min(workers, sweetSpot); `extra` = max(0, workers − sweetSpot)
- Per-building knobs: `sweetSpot`, `teamBoost`, `overstaffDrag`. No worker
  cap; the drag self-regulates.
- Patterns: Update Method (tick), Data-Driven (formula reads config only).

## Build
- [ ] `src/game/sim/tick.js` — tick function implementing the formula.
- [ ] `src/game/data/buildings.js` — config module documenting the def shape.
  Adding a building later = one data entry, no code changes.
- [ ] Tests: zero workers → 0; one worker → baseRate; sweetSpot crew →
  boosted output; overstaffed → dragged output; determinism (same
  input, same output); multiple producers accumulate.

## Verify
- [ ] Tests pass.
- [ ] `npm run build` passes.
- [ ] Conformance check against constitution.
