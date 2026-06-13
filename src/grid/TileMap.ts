import { TileType } from './TileTypes';
import { GRID_COLS, GRID_ROWS } from '../constants';

export class TileMap {
  private grid: TileType[][];
  cols: number;
  rows: number;

  constructor(cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(TileType.DIRT));
  }

  get(col: number, row: number): TileType {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return TileType.BORDER;
    return this.grid[row][col];
  }

  set(col: number, row: number, type: TileType): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    this.grid[row][col] = type;
  }

  loadFromArray(data: number[][]): void {
    for (let r = 0; r < Math.min(data.length, this.rows); r++) {
      for (let c = 0; c < Math.min(data[r].length, this.cols); c++) {
        this.grid[r][c] = data[r][c] as TileType;
      }
    }
  }

  countType(type: TileType): number {
    let n = 0;
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        if (this.grid[r][c] === type) n++;
    return n;
  }

  clone(): TileMap {
    const m = new TileMap(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++)
      m.grid[r] = [...this.grid[r]];
    return m;
  }
}
