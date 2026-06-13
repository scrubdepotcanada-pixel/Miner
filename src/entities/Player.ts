import Phaser from 'phaser';
import { TileMap } from '../grid/TileMap';
import { TileType, isSolid } from '../grid/TileTypes';
import { TILE_SIZE, MOVE_INTERVAL_MS, COLOR_PLAYER, SCORE_GEM } from '../constants';

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface PlayerEvents {
  onDig: (col: number, row: number) => void;
  onGemCollect: (col: number, row: number, points: number) => void;
  onDeath: () => void;
  onCheckLevelComplete: () => void;
}

export class Player {
  col: number;
  row: number;
  private sprite: Phaser.GameObjects.Rectangle;
  private map: TileMap;
  private events: PlayerEvents;
  private moveTimer = 0;
  private moveInterval: number;
  alive = true;
  private shieldActive = false;
  private drillCharges = 0;
  private frozen = false;
  speedMultiplier = 1;

  constructor(scene: Phaser.Scene, col: number, row: number, map: TileMap, events: PlayerEvents) {
    this.col = col;
    this.row = row;
    this.map = map;
    this.events = events;
    this.moveInterval = MOVE_INTERVAL_MS;

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.rectangle(px, py, TILE_SIZE - 4, TILE_SIZE - 4, COLOR_PLAYER);
    this.sprite.setDepth(10);

    // Hard hat indicator (small rect on top)
    scene.add.rectangle(px, py - 10, TILE_SIZE - 12, 6, 0xFFAA00).setDepth(11);
  }

  setFrozen(frozen: boolean): void { this.frozen = frozen; }
  activateShield(): void { this.shieldActive = true; }
  activateDrill(charges: number): void { this.drillCharges = charges; }
  setSpeed(mult: number): void {
    this.speedMultiplier = mult;
    this.moveInterval = MOVE_INTERVAL_MS / mult;
  }

  tryMove(dir: Direction): void {
    if (!this.alive || this.frozen) return;

    const [dc, dr] = dirToDelta(dir);
    let steps = this.drillCharges > 0 ? 3 : 1;

    for (let i = 0; i < steps; i++) {
      const nc = this.col + dc;
      const nr = this.row + dr;
      const tile = this.map.get(nc, nr);

      if (isSolid(tile)) break;

      if (tile === TileType.DIRT) {
        this.map.set(nc, nr, TileType.EMPTY);
        this.col = nc;
        this.row = nr;
        this.events.onDig(nc, nr);
        if (this.drillCharges > 0) this.drillCharges--;
      } else if (tile === TileType.GEM || tile === TileType.ARTIFACT) {
        this.map.set(nc, nr, TileType.EMPTY);
        this.col = nc;
        this.row = nr;
        this.events.onGemCollect(nc, nr, SCORE_GEM);
        this.events.onCheckLevelComplete();
        if (this.drillCharges > 0) this.drillCharges--;
      } else if (tile === TileType.EMPTY || tile === TileType.SPAWN) {
        this.col = nc;
        this.row = nr;
      } else if (tile === TileType.BAG) {
        // Try push bag horizontally
        if (dr === 0) {
          const bagDestC = nc + dc;
          const bagDest = this.map.get(bagDestC, nr);
          if (bagDest === TileType.EMPTY || bagDest === TileType.SPAWN) {
            this.map.set(nc, nr, TileType.EMPTY);
            this.map.set(bagDestC, nr, TileType.BAG);
            this.col = nc;
            this.row = nr;
          }
        }
        break; // can't drill through bags
      } else {
        break;
      }
    }

    this.updateSprite();
  }

  kill(): void {
    if (!this.alive) return;
    if (this.shieldActive) {
      this.shieldActive = false;
      return; // absorbed
    }
    this.alive = false;
    this.sprite.setFillStyle(0x880000);
    this.events.onDeath();
  }

  respawn(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.alive = true;
    this.shieldActive = false;
    this.drillCharges = 0;
    this.speedMultiplier = 1;
    this.moveInterval = MOVE_INTERVAL_MS;
    this.sprite.setFillStyle(COLOR_PLAYER);
    this.updateSprite();
  }

  update(delta: number, cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    if (!this.alive) return;
    this.moveTimer += delta;
    if (this.moveTimer < this.moveInterval) return;

    if (cursors.left.isDown) this.tryMove('left');
    else if (cursors.right.isDown) this.tryMove('right');
    else if (cursors.up.isDown) this.tryMove('up');
    else if (cursors.down.isDown) this.tryMove('down');
    else return;

    this.moveTimer = 0;
  }

  private updateSprite(): void {
    this.sprite.setPosition(
      this.col * TILE_SIZE + TILE_SIZE / 2,
      this.row * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  getPosition(): { x: number; y: number } {
    return {
      x: this.col * TILE_SIZE + TILE_SIZE / 2,
      y: this.row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  destroy(): void {
    this.sprite.destroy();
  }
}

function dirToDelta(dir: Direction): [number, number] {
  switch (dir) {
    case 'left':  return [-1, 0];
    case 'right': return [1, 0];
    case 'up':    return [0, -1];
    case 'down':  return [0, 1];
  }
}
