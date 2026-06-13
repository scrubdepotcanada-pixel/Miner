import Phaser from 'phaser';

/**
 * Pixel-art diamond gem, recreated from reference art as an in-engine
 * generated texture (no binary asset needed). 16x16 grid; '.' is
 * transparent. Shaded with white highlights upper-left and darker teal
 * toward the lower-right.
 */

const PALETTE: Record<string, number> = {
  D: 0x176b63, // dark teal outline / deep shadow
  S: 0x2f9b90, // shadow teal
  T: 0x46c9ba, // mid teal
  C: 0x62e6d4, // main cyan
  L: 0xa8f2e6, // light cyan
  W: 0xf4fffd, // white highlight
};

export const GEM_ROWS: string[] = [
  '................',
  '......DDDD......',
  '.....DWWWTD.....',
  '....DWWLCCTD....',
  '...DWLLCCCTSD...',
  '...DLLCWWCTSD...',
  '..DWLCCWWCCTSD..',
  '..DLCCCCCCCTSD..',
  '..DLCCCCCCTTSD..',
  '..DTCCCTTTTSSD..',
  '...DTCTTTTSSD...',
  '...DTTTLTTSSD...',
  '....DTTTTSSD....',
  '.....DTTSSD.....',
  '......DDDD......',
  '................',
];

export const GEM_SIZE = 16;

/** Draws the gem pixel map into a Phaser texture under `key`. */
export function createGemTexture(scene: Phaser.Scene, key = 'gem', px = 4): void {
  if (scene.textures.exists(key)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let y = 0; y < GEM_ROWS.length; y++) {
    const row = GEM_ROWS[y];
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]];
      if (color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x * px, y * px, px, px);
    }
  }
  g.generateTexture(key, GEM_SIZE * px, GEM_SIZE * px);
  g.destroy();
}
