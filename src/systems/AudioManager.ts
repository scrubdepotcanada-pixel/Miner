import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private muted = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  play(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (this.muted) return;
    if (this.scene.sound.get(key)) {
      this.scene.sound.play(key, config);
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.scene.sound.setMute(this.muted);
    return this.muted;
  }

  isMuted(): boolean { return this.muted; }
}
