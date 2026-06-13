import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score: number; world: number; level: number }): void {
    this.cameras.main.setBackgroundColor('#110000');

    this.add.text(GAME_WIDTH / 2, 120, 'GAME OVER', {
      fontSize: '48px', color: '#FF2222', fontFamily: 'monospace',
      stroke: '#880000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 210, `Score: ${data.score}`, {
      fontSize: '26px', color: '#FFFFFF', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 250, `Reached: World ${data.world} - Level ${data.level}`, {
      fontSize: '18px', color: '#AAAAAA', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const retry = this.add.text(GAME_WIDTH / 2, 330, 'Try Again', {
      fontSize: '26px', color: '#FFdd00', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerover', () => retry.setColor('#FFFFFF'));
    retry.on('pointerdown', () => this.scene.start('GameScene', { world: data.world, level: data.level }));

    const title = this.add.text(GAME_WIDTH / 2, 395, 'Main Menu', {
      fontSize: '20px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    title.on('pointerover', () => title.setColor('#FFFFFF'));
    title.on('pointerdown', () => this.scene.start('TitleScene'));

    this.input.keyboard!.on('keydown-ENTER', () =>
      this.scene.start('GameScene', { world: data.world, level: data.level }),
    );
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
