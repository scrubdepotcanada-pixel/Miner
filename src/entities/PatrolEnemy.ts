import { Enemy } from './Enemy';
import { TileMap } from '../grid/TileMap';
import { TileType } from '../grid/TileTypes';
import Phaser from 'phaser';

export class PatrolEnemy extends Enemy {
  private dirC: number;
  private dirR: number;

  constructor(scene: Phaser.Scene, col: number, row: number, map: TileMap, dirC = 1, dirR = 0) {
    super(scene, col, row, map, 0xFF8800);
    this.dirC = dirC;
    this.dirR = dirR;
    this.moveInterval = 450;
  }

  update(delta: number, _playerCol: number, _playerRow: number): void {
    if (!this.alive || this.frozen) return;

    this.moveTimer += delta;
    if (this.moveTimer < this.moveInterval) return;
    this.moveTimer = 0;

    const nc = this.col + this.dirC;
    const nr = this.row + this.dirR;
    const tile = this.map.get(nc, nr);

    if (tile === TileType.EMPTY || tile === TileType.SPAWN) {
      this.col = nc;
      this.row = nr;
    } else {
      // Reverse direction
      this.dirC = -this.dirC;
      this.dirR = -this.dirR;
    }

    this.updateSprite();
  }
}
