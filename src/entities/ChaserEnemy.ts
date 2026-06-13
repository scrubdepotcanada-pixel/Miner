import { Enemy } from './Enemy';
import { TileMap } from '../grid/TileMap';
import { findPath } from '../utils/Pathfinding';
import Phaser from 'phaser';

export class ChaserEnemy extends Enemy {
  private path: Array<{ col: number; row: number }> = [];
  private pathTimer = 0;
  private readonly PATH_INTERVAL = 500;

  constructor(scene: Phaser.Scene, col: number, row: number, map: TileMap) {
    super(scene, col, row, map, 0xFF2222);
    this.moveInterval = 350;
  }

  update(delta: number, playerCol: number, playerRow: number): void {
    if (!this.alive || this.frozen) return;

    this.pathTimer += delta;
    if (this.pathTimer >= this.PATH_INTERVAL) {
      this.pathTimer = 0;
      this.path = findPath(this.map, this.col, this.row, playerCol, playerRow, false);
    }

    this.moveTimer += delta;
    if (this.moveTimer < this.moveInterval) return;
    this.moveTimer = 0;

    if (this.path.length > 0) {
      const next = this.path.shift()!;
      this.col = next.col;
      this.row = next.row;
      this.updateSprite();
    }
  }
}
