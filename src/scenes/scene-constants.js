// Shared render constants. Tile size lives here, never in the grid model.
export const TILE_SIZE = 48;
export const TILE_COLOR = 0x7fbf5f; // placeholder grass green
export const BACKGROUND_COLOR = '#141f14';
export const SHOW_COORDS = true; // debug overlay, not game UI
export const TAP_THRESHOLD = 10; // px, below this a drag counts as a tap
export const WALK_DIRS = ['down', 'up', 'left', 'right'];
export const WORK_DIRS = ['down', 'up', 'left', 'right'];
export const WALK_MS_PER_TILE = 1000;
export const TICK_MS = 10000; // 10s production tick
