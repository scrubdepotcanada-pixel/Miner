import Phaser from 'phaser';
import { TileMap } from '../grid/TileMap';
import { TILE_SIZE, COLOR_ENEMY } from '../constants';

export abstract class Enemy {
  col: number;
  row: number;
  protected sprite: Phaser.GameObjects.Rectangle;
  protected scene: Phaser.Scene;
  protected map: TileMap;
  alive = true;
  frozen = false;
  protected moveTimer = 0;
  protected moveInterval = 500;

  constructor(scene: Phaser.Scene, col: number, row: number, map: TileMap, color = COLOR_ENEMY) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.map = map;

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.rectangle(px, py, TILE_SIZE - 6, TILE_SIZE - 6, color);
    this.sprite.setDepth(8);
  }

  abstract update(delta: number, playerCol: number, playerRow: number): void;

  kill(): void {
    this.alive = false;
    this.sprite.destroy();
  }

  protected updateSprite(): void {
    this.sprite.setPosition(
      this.col * TILE_SIZE + TILE_SIZE / 2,
      this.row * TILE_SIZE + TILE_SIZE / 2,
    );
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
