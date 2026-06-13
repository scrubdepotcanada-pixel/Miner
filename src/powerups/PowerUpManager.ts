import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

export type PowerUpType = 'drill' | 'dynamite' | 'shield' | 'sonar' | 'speed' | 'freeze';

export interface ActivePowerUp {
  type: PowerUpType;
  timeRemaining: number;
  duration: number;
}

export class PowerUpManager {
  private player: Player;
  private enemies: Enemy[];
  active: ActivePowerUp | null = null;
  hasDynamite = false;

  constructor(_scene: Phaser.Scene, player: Player, enemies: Enemy[]) {
    this.player = player;
    this.enemies = enemies;
  }

  collect(type: PowerUpType): void {
    // Clear previous timed power-up
    if (this.active) this.deactivate(this.active.type);

    switch (type) {
      case 'drill':
        this.player.activateDrill(3);
        this.active = { type, timeRemaining: 0, duration: 0 }; // no timer — depleted by use
        break;
      case 'dynamite':
        this.hasDynamite = true;
        this.active = { type, timeRemaining: 0, duration: 0 };
        break;
      case 'shield':
        this.player.activateShield();
        this.active = { type, timeRemaining: 0, duration: 0 };
        break;
      case 'sonar':
        this.active = { type, timeRemaining: 10000, duration: 10000 };
        break;
      case 'speed':
        this.player.setSpeed(2);
        this.active = { type, timeRemaining: 8000, duration: 8000 };
        break;
      case 'freeze':
        for (const e of this.enemies) e.frozen = true;
        this.active = { type, timeRemaining: 5000, duration: 5000 };
        break;
    }
  }

  update(delta: number): void {
    if (!this.active) return;
    if (this.active.duration === 0) return; // no-timer power-ups

    this.active.timeRemaining -= delta;
    if (this.active.timeRemaining <= 0) {
      this.deactivate(this.active.type);
      this.active = null;
    }
  }

  private deactivate(type: PowerUpType): void {
    switch (type) {
      case 'speed': this.player.setSpeed(1); break;
      case 'freeze': for (const e of this.enemies) e.frozen = false; break;
      default: break;
    }
  }

  reset(): void {
    if (this.active) this.deactivate(this.active.type);
    this.active = null;
    this.hasDynamite = false;
  }
}
