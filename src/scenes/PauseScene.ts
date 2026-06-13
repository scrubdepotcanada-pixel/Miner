import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'PAUSED', {
      fontSize: '36px', color: '#FFdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const resume = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'Resume', {
      fontSize: '24px', color: '#FFFFFF', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resume.on('pointerover', () => resume.setColor('#FFdd00'));
    resume.on('pointerout', () => resume.setColor('#FFFFFF'));
    resume.on('pointerdown', () => this.resumeGame());

    const quit = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 'Quit to Title', {
      fontSize: '24px', color: '#FFFFFF', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quit.on('pointerover', () => quit.setColor('#FFdd00'));
    quit.on('pointerout', () => quit.setColor('#FFFFFF'));
    quit.on('pointerdown', () => {
      this.scene.stop('GameScene');
      this.scene.stop('PauseScene');
      this.scene.start('TitleScene');
    });

    this.input.keyboard!.once('keydown-ESC', () => this.resumeGame());
  }

  private resumeGame(): void {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }
}
