import { SeededRandom } from '../utils/SeededRandom';
import { TileType } from '../grid/TileTypes';
import { GRID_COLS, GRID_ROWS } from '../constants';

export class LevelGenerator {
  static generate(seed: string): number[][] {
    const rng = new SeededRandom(seed);
    const grid: number[][] = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        if (r === 0 || r === GRID_ROWS - 1 || c === 0 || c === GRID_COLS - 1) {
          grid[r][c] = TileType.BORDER;
        } else {
          const roll = rng.next();
          if (roll < 0.04) grid[r][c] = TileType.GEM;
          else if (roll < 0.08) grid[r][c] = TileType.ROCK;
          else if (roll < 0.10) grid[r][c] = TileType.BAG;
          else grid[r][c] = TileType.DIRT;
        }
      }
    }

    // Guarantee spawn points on left/right edges
    grid[7][1] = TileType.SPAWN;
    grid[7][GRID_COLS - 2] = TileType.SPAWN;

    // Guarantee at least 5 gems
    let gemCount = 0;
    for (let r = 1; r < GRID_ROWS - 1; r++)
      for (let c = 1; c < GRID_COLS - 1; c++)
        if (grid[r][c] === TileType.GEM) gemCount++;

    while (gemCount < 5) {
      const c = rng.nextInt(1, GRID_COLS - 2);
      const r = rng.nextInt(1, GRID_ROWS - 2);
      if (grid[r][c] === TileType.DIRT) { grid[r][c] = TileType.GEM; gemCount++; }
    }

    return grid;
  }
}
