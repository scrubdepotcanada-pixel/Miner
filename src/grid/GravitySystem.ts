import { TileMap } from './TileMap';
import { TileType } from './TileTypes';

export interface FallingBag {
  col: number;
  row: number;
  velRow: number; // positive = falling down
  settled: boolean;
}

export class GravitySystem {
  private tileMap: TileMap;
  private fallingBags: FallingBag[] = [];

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
  }

  /** Called when a tile changes — check if bags above should start falling */
  notifyTileChanged(col: number, row: number): void {
    // Check the tile directly above for a bag
    const aboveRow = row - 1;
    if (this.tileMap.get(col, aboveRow) === TileType.BAG) {
      this.startFalling(col, aboveRow);
    }
  }

  private startFalling(col: number, row: number): void {
    const already = this.fallingBags.find(b => b.col === col && b.row === row && !b.settled);
    if (already) return;
    this.tileMap.set(col, row, TileType.EMPTY);
    this.fallingBags.push({ col, row, velRow: 1, settled: false });
  }

  /** Advance falling bags by one step. Returns list of {col,row} where bags landed */
  step(): Array<{ col: number; row: number; crushed: boolean }> {
    const landed: Array<{ col: number; row: number; crushed: boolean }> = [];

    for (const bag of this.fallingBags) {
      if (bag.settled) continue;

      const nextRow = bag.row + bag.velRow;
      const below = this.tileMap.get(bag.col, nextRow);

      if (below === TileType.EMPTY || below === TileType.SPAWN) {
        bag.row = nextRow;
      } else {
        // Landed — settle the bag
        bag.settled = true;
        this.tileMap.set(bag.col, bag.row, TileType.BAG);
        landed.push({ col: bag.col, row: bag.row, crushed: false });
        // Chain: notify the tile we just landed on is now occupied
        // (not digging, but anything below the new position shifts)
      }
    }

    this.fallingBags = this.fallingBags.filter(b => !b.settled);
    return landed;
  }

  getActiveBags(): FallingBag[] {
    return this.fallingBags;
  }

  reset(): void {
    this.fallingBags = [];
  }
}
