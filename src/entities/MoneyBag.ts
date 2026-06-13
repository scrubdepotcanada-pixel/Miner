import Phaser from 'phaser';
import { TILE_SIZE, COLOR_BAG } from '../constants';

export class MoneyBag {
  col: number;
  row: number;
  private sprite: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  falling = false;
  hasPowerUp = false;

  constructor(scene: Phaser.Scene, col: number, row: number, hasPowerUp = false) {
    this.col = col;
    this.row = row;
    this.hasPowerUp = hasPowerUp;

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.rectangle(px, py, TILE_SIZE - 4, TILE_SIZE - 4, COLOR_BAG);
    this.sprite.setDepth(7);
    this.label = scene.add.text(px - 5, py - 6, '$', { fontSize: '14px', color: '#000' }).setDepth(8);
  }

  updatePosition(col: number, row: number): void {
    this.col = col;
    this.row = row;
    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite.setPosition(px, py);
    this.label.setPosition(px - 5, py - 6);
  }

  highlight(): void {
    this.sprite.setFillStyle(this.hasPowerUp ? 0xFF88FF : 0xFFDD88);
  }

  destroy(): void {
    this.sprite.destroy();
    this.label.destroy();
  }
}
