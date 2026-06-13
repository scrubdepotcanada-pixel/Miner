import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // All visuals are drawn via Phaser graphics (no external assets needed for Session 1).
    // Audio assets would be loaded here in later sessions.
    // this.load.audio('dig', 'assets/audio/dig.ogg');

    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 400, 12, 0x333333);
    const fill = this.add.rectangle(width / 2 - 200, height / 2, 0, 12, 0xFFDD00);
    fill.setOrigin(0, 0.5);
    this.add.text(width / 2, height / 2 - 30, 'DEEP DIG', {
      fontSize: '32px', color: '#FFdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      fill.width = 400 * v;
      bar.width = 400;
    });
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
