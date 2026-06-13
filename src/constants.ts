export const GRID_COLS = 20;
export const GRID_ROWS = 15;
export const TILE_SIZE = 32;

export const GAME_WIDTH = GRID_COLS * TILE_SIZE;   // 640
export const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;  // 480

export const MOVE_INTERVAL_MS = 150; // ms between grid steps

export const SCORE_GEM = 100;
export const SCORE_MONEY_BAG = 250;
export const SCORE_BAG_CRUSH = 500;
export const SCORE_EXTRA_LIFE_THRESHOLD = 10000;
export const STARTING_LIVES = 3;

// Tile colors (placeholder — replaced with sprites later)
export const COLOR_DIRT   = 0x8B5E3C;
export const COLOR_EMPTY  = 0x111111;
export const COLOR_GEM    = 0x00DD66;
export const COLOR_ROCK   = 0x555555;
export const COLOR_BORDER = 0x333333;
export const COLOR_HAZARD = 0xFF4400;
export const COLOR_BAG    = 0xDDAA00;
export const COLOR_PLAYER = 0xFFDD00;
export const COLOR_ENEMY  = 0xFF2222;

// World palette sets (dirt, rock, gem, border, bg)
export const WORLD_PALETTES = [
  // World 1: Archaeology
  { dirt: 0xB8865A, rock: 0x5C3A1E, gem: 0xFFD700, border: 0x3D2B1F, bg: 0x1A0E08, accent: 0xE8A060 },
  // World 2: Space Mining
  { dirt: 0x2A2A3C, rock: 0x1A1A28, gem: 0x00CFFF, border: 0x0D0D1A, bg: 0x050510, accent: 0x8855FF },
  // World 3: Escape
  { dirt: 0x2E4A3C, rock: 0x1C2E26, gem: 0x44FFAA, border: 0x0E1E18, bg: 0x061210, accent: 0x2266AA },
  // World 4: Crime Scene
  { dirt: 0x4A4A4A, rock: 0x2A2A2A, gem: 0xFFCC00, border: 0x1A1A1A, bg: 0x0A0A0A, accent: 0x2244AA },
  // World 5: Deep Core
  { dirt: 0x1A0A00, rock: 0x0A0500, gem: 0xFFFFFF, border: 0x050200, bg: 0x000000, accent: 0xFF4400 },
];
