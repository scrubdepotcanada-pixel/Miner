import { Enemy } from './Enemy';
import { TileMap } from '../grid/TileMap';
import { findPath } from '../utils/Pathfinding';
import { TileType } from '../grid/TileTypes';
import Phaser from 'phaser';

export class DiggerEnemy extends Enemy {
  private path: Array<{ col: number; row: number }> = [];
  private pathTimer = 0;
  private readonly PATH_INTERVAL = 700;

  constructor(scene: Phaser.Scene, col: number, row: number, map: TileMap) {
    super(scene, col, row, map, 0xAA00FF);
    this.moveInterval = 500;
    this.pathTimer = this.PATH_INTERVAL;
    this.moveTimer = this.moveInterval;
  }

  update(delta: number, playerCol: number, playerRow: number): void {
    if (!this.alive || this.frozen) return;

    this.pathTimer += delta;
    if (this.pathTimer >= this.PATH_INTERVAL) {
      this.pathTimer = 0;
      this.path = findPath(this.map, this.col, this.row, playerCol, playerRow, true);
    }

    this.moveTimer += delta;
    if (this.moveTimer < this.moveInterval) return;
    this.moveTimer = 0;

    if (this.path.length > 0) {
      const next = this.path.shift()!;
      // Dig dirt as we move
      if (this.map.get(next.col, next.row) === TileType.DIRT) {
        this.map.set(next.col, next.row, TileType.EMPTY);
      }
      this.col = next.col;
      this.row = next.row;
      this.updateSprite();
    }
  }
}
