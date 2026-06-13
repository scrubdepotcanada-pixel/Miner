import Phaser from 'phaser';
import { TILE_SIZE, COLOR_GEM } from '../constants';

export type CollectibleType = 'gem' | 'coin' | 'artifact';

export class Collectible {
  col: number;
  row: number;
  type: CollectibleType;
  collected = false;
  private sprite: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, col: number, row: number, type: CollectibleType = 'gem') {
    this.col = col;
    this.row = row;
    this.type = type;

    const colors: Record<CollectibleType, number> = {
      gem: COLOR_GEM,
      coin: 0xFFCC00,
      artifact: 0xFF88FF,
    };

    const px = col * TILE_SIZE + TILE_SIZE / 2;
    const py = row * TILE_SIZE + TILE_SIZE / 2;
    const size = type === 'gem' ? TILE_SIZE - 8 : TILE_SIZE - 12;
    this.sprite = scene.add.rectangle(px, py, size, size, colors[type]);
    this.sprite.setDepth(5);
  }

  collect(): void {
    this.collected = true;
    this.sprite.destroy();
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
