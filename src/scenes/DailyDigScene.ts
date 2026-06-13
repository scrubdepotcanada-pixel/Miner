import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

// Placeholder — full implementation in Session 6
export class DailyDigScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DailyDigScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'Daily Dig', {
      fontSize: '32px', color: '#FFdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Coming in Session 6', {
      fontSize: '18px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const back = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 'Back', {
      fontSize: '22px', color: '#FFFFFF', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#FFdd00'));
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard!.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
