import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { PauseScene } from './scenes/PauseScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { GameOverScene } from './scenes/GameOverScene';
import { DailyDigScene } from './scenes/DailyDigScene';
import { TwoPlayerScene } from './scenes/TwoPlayerScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  parent: 'game-container',
  scene: [
    BootScene,
    TitleScene,
    GameScene,
    HUDScene,
    PauseScene,
    LevelCompleteScene,
    GameOverScene,
    DailyDigScene,
    TwoPlayerScene,
  ],
  render: {
    pixelArt: true,
    antialias: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 320, height: 240 },
    max: { width: 1280, height: 960 },
  },
};

new Phaser.Game(config);
