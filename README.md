# Isekai Idle Village

Cozy isekai idle-builder. A laid-off engineer reborn with zero powers becomes
the middle manager he always hated, delegating everything to villagers.

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Project layout

- `src/main.js` — Phaser game boot config
- `src/scenes/` — one scene per screen (Boot, Village, etc.)
- `src/game/` — game logic: resources, villagers, save system (coming)
- `assets/` — sprites, tiles, audio (dropped in per step)

## Workflow with Muse

Each build step arrives as a zip. Extract it over this folder, run `npm run dev`,
and check the step works before moving on.
