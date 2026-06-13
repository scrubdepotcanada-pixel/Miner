import { SCORE_EXTRA_LIFE_THRESHOLD } from '../constants';

export class ScoreManager {
  private score = 0;
  private lives = 3;
  private nextExtraLife: number;
  private onExtraLife?: () => void;

  constructor(startingLives = 3, onExtraLife?: () => void) {
    this.lives = startingLives;
    this.nextExtraLife = SCORE_EXTRA_LIFE_THRESHOLD;
    this.onExtraLife = onExtraLife;
  }

  add(points: number): void {
    this.score += points;
    if (this.score >= this.nextExtraLife) {
      this.lives++;
      this.nextExtraLife += SCORE_EXTRA_LIFE_THRESHOLD;
      this.onExtraLife?.();
    }
  }

  getScore(): number { return this.score; }
  getLives(): number { return this.lives; }

  loseLife(): boolean {
    this.lives--;
    return this.lives >= 0;
  }

  reset(keepScore = false): void {
    if (!keepScore) this.score = 0;
    this.lives = 3;
    this.nextExtraLife = SCORE_EXTRA_LIFE_THRESHOLD;
  }
}
