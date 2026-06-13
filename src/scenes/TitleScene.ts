import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

interface MenuItem {
  text: Phaser.GameObjects.Text;
  action: () => void;
}

export class TitleScene extends Phaser.Scene {
  private menuItems: MenuItem[] = [];
  private selectedIdx = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private navTimer = 0;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    // Title
    this.add.text(GAME_WIDTH / 2, 80, 'DEEP DIG', {
      fontSize: '48px',
      color: '#FFdd00',
      fontFamily: 'monospace',
      stroke: '#884400',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 130, 'A DIGGER-STYLE ROGUELIKE', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Draw decorative dirt tiles across bottom
    for (let i = 0; i < 20; i++) {
      this.add.rectangle(i * 32 + 16, GAME_HEIGHT - 16, 30, 30, 0x8B5E3C);
    }

    const menuOptions: Array<{ label: string; action: () => void }> = [
      { label: 'Campaign', action: () => this.scene.start('GameScene', { world: 1, level: 1 }) },
      { label: 'Daily Dig', action: () => this.scene.start('DailyDigScene') },
      { label: '2 Player', action: () => this.scene.start('TwoPlayerScene') },
      { label: 'Settings', action: () => this.showSettings() },
    ];

    menuOptions.forEach((opt, i) => {
      const text = this.add.text(GAME_WIDTH / 2, 230 + i * 55, opt.label, {
        fontSize: '28px',
        color: '#FFFFFF',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => { this.selectedIdx = i; this.updateSelection(); });
      text.on('pointerdown', () => opt.action());
      this.menuItems.push({ text, action: opt.action });
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    this.updateSelection();

    // Version tag
    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 8, 'v0.1', {
      fontSize: '11px', color: '#444444', fontFamily: 'monospace',
    }).setOrigin(1, 1);
  }

  update(_time: number, delta: number): void {
    this.navTimer += delta;
    if (this.navTimer < 160) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIdx = (this.selectedIdx - 1 + this.menuItems.length) % this.menuItems.length;
      this.updateSelection();
      this.navTimer = 0;
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIdx = (this.selectedIdx + 1) % this.menuItems.length;
      this.updateSelection();
      this.navTimer = 0;
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.menuItems[this.selectedIdx].action();
      this.navTimer = 0;
    }
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, i) => {
      item.text.setColor(i === this.selectedIdx ? '#FFdd00' : '#FFFFFF');
      item.text.setScale(i === this.selectedIdx ? 1.08 : 1);
    });
  }

  private showSettings(): void {
    // Placeholder — will be a proper scene in Session 3
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 360, 200, 0x111111, 0.95).setDepth(20);
    const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Settings coming in Session 3\n\nPress ESC to close', {
      fontSize: '16px', color: '#FFFFFF', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5).setDepth(21);

    this.input.keyboard!.once('keydown-ESC', () => { overlay.destroy(); msg.destroy(); });
  }
}
