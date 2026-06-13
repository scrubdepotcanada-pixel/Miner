import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';

interface LevelCompleteData {
  score: number;
  world: number;
  level: number;
  gemsCollected: number;
  totalGems: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  create(data: LevelCompleteData): void {
    this.cameras.main.setBackgroundColor('#000000');

    this.add.text(GAME_WIDTH / 2, 100, 'LEVEL COMPLETE!', {
      fontSize: '36px', color: '#FFdd00', fontFamily: 'monospace',
      stroke: '#884400', strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 160, `World ${data.world} - Level ${data.level}`, {
      fontSize: '20px', color: '#AAAAAA', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 220, `Score: ${data.score}`, {
      fontSize: '24px', color: '#FFFFFF', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 260, `Gems: ${data.gemsCollected}/${data.totalGems}`, {
      fontSize: '20px', color: '#00DD66', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Next level button
    const nextWorld = data.level === 10 ? data.world + 1 : data.world;
    const nextLevel = data.level === 10 ? 1 : data.level + 1;
    const canContinue = nextWorld <= 5;

    if (canContinue) {
      const next = this.add.text(GAME_WIDTH / 2, 330, `Next Level (W${nextWorld}-${nextLevel})`, {
        fontSize: '22px', color: '#00DD66', fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      next.on('pointerover', () => next.setColor('#FFdd00'));
      next.on('pointerdown', () => this.scene.start('GameScene', { world: nextWorld, level: nextLevel }));
    } else {
      this.add.text(GAME_WIDTH / 2, 330, 'YOU WIN! All worlds complete!', {
        fontSize: '22px', color: '#FF88FF', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    const title = this.add.text(GAME_WIDTH / 2, 390, 'Main Menu', {
      fontSize: '20px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    title.on('pointerover', () => title.setColor('#FFFFFF'));
    title.on('pointerdown', () => this.scene.start('TitleScene'));

    this.input.keyboard!.on('keydown-ENTER', () => {
      if (canContinue) this.scene.start('GameScene', { world: nextWorld, level: nextLevel });
    });
  }
}
