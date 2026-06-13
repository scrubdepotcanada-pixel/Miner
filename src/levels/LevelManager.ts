import { WORLD1_LEVELS, WORLD1_CONFIG } from './World1_Archaeology';
import { SaveManager, SaveData } from '../systems/SaveManager';

export interface LevelConfig {
  world: number;
  level: number;       // 1-10
  gridData: number[][];
  enemyCount: number;
  enemySpeedMult: number;
  starThresholds: [number, number, number];
  worldName: string;
}

const WORLD_DATA = [
  { levels: WORLD1_LEVELS, config: WORLD1_CONFIG },
  // Worlds 2-5 will be added in later sessions
];

export class LevelManager {
  private saveData: SaveData;

  constructor() {
    this.saveData = SaveManager.load();
  }

  getLevel(world: number, level: number): LevelConfig {
    const worldIdx = world - 1;
    const levelIdx = level - 1;
    const wd = WORLD_DATA[worldIdx];

    if (!wd) throw new Error(`World ${world} not yet implemented`);
    if (!wd.levels[levelIdx]) throw new Error(`Level ${world}-${level} not found`);

    return {
      world,
      level,
      gridData: wd.levels[levelIdx],
      enemyCount: wd.config.enemyCounts[levelIdx] ?? 0,
      enemySpeedMult: wd.config.enemySpeed[levelIdx] ?? 1,
      starThresholds: wd.config.starThresholds[levelIdx] as [number, number, number],
      worldName: wd.config.name,
    };
  }

  isWorldUnlocked(world: number): boolean {
    return world <= this.saveData.worldProgress;
  }

  isLevelUnlocked(world: number, level: number): boolean {
    if (!this.isWorldUnlocked(world)) return false;
    const progress = this.saveData.levelProgress[world - 1] ?? 1;
    return level <= progress;
  }

  completeLevel(world: number, level: number, score: number): void {
    const thresholds = this.getLevel(world, level).starThresholds;
    const stars = score >= thresholds[2] ? 3 : score >= thresholds[1] ? 2 : score >= thresholds[0] ? 1 : 0;
    SaveManager.setStars(this.saveData, world, level, stars);

    // Unlock next level/world
    if (level === 10 && world < 5) {
      this.saveData.worldProgress = Math.max(this.saveData.worldProgress, world + 1);
      this.saveData.levelProgress[world] = Math.max(this.saveData.levelProgress[world] ?? 1, 1);
    } else if (level < 10) {
      this.saveData.levelProgress[world - 1] = Math.max(this.saveData.levelProgress[world - 1] ?? 1, level + 1);
    }

    if (score > this.saveData.highScore) this.saveData.highScore = score;
    SaveManager.save(this.saveData);
  }

  getStars(world: number, level: number): number {
    return SaveManager.getStars(this.saveData, world, level);
  }

  getSaveData(): SaveData { return this.saveData; }
}
