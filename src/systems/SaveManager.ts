const SAVE_KEY = 'deepdig_save';

export interface SaveData {
  worldProgress: number;  // highest world unlocked (1-5)
  levelProgress: number[];  // per-world: highest level reached (1-10)
  starRatings: Record<string, number>; // key: "W1L3" -> stars 1-3
  highScore: number;
  dailyScores: Record<string, number>; // key: date string
  muted: boolean;
}

const DEFAULT_SAVE: SaveData = {
  worldProgress: 1,
  levelProgress: [1, 1, 1, 1, 1],
  starRatings: {},
  highScore: 0,
  dailyScores: {},
  muted: false,
};

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      return { ...DEFAULT_SAVE, ...JSON.parse(raw) } as SaveData;
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  static save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked — silently fail
    }
  }

  static setStars(data: SaveData, world: number, level: number, stars: number): void {
    const key = `W${world}L${level}`;
    const current = data.starRatings[key] ?? 0;
    data.starRatings[key] = Math.max(current, stars);
  }

  static getStars(data: SaveData, world: number, level: number): number {
    return data.starRatings[`W${world}L${level}`] ?? 0;
  }

  static clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
