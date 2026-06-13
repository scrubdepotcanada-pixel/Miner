import Phaser from 'phaser';

/**
 * Pixel-art digger sprite (drill-mounted mining vehicle), recreated from
 * reference art as an in-engine generated texture so no binary asset is
 * needed. The vehicle faces RIGHT by default (drill on the right side).
 *
 * Grid is 40 wide x 27 tall. Each character maps to a palette colour;
 * '.' is transparent.
 */

const PALETTE: Record<string, number> = {
  K: 0x161616, // black outline
  Y: 0xf5c518, // body yellow
  o: 0xe8821e, // orange band
  r: 0xd8392b, // red stripe / beacon
  b: 0x29c5f0, // cab screen blue
  w: 0xbfeaf7, // screen highlight
  G: 0x9aa6b3, // wheel / drill mid-grey
  D: 0x5b6470, // dark grey (hubs, drill shaft)
  S: 0xc8d2de, // silver drill
};

const dots = '.'.repeat(13);
const Y23 = 'Y'.repeat(23);
const O23 = 'o'.repeat(23);
const R23 = 'r'.repeat(23);
const K23 = 'K'.repeat(23);
const D23 = 'D'.repeat(23);
const wheelsSolid = 'DDGGGGGDDGGGGGDDGGGGGDD';
const wheelsHub = 'DDGDDDGDDGDDDGDDGDDDGDD';

// Body row = left wall + interior(23) + right wall + tail(13) => 40 chars
const body = (interior: string, tail: string): string => '..K' + interior + 'K' + tail;

export const DIGGER_ROWS: string[] = [
  '............rr..........................',
  '............rr..........................',
  '.......KKKKKKKKKKKKKKK..................',
  '...S...KYYYYYYYYYYYYYK..................',
  '.......KYbbbbbbbbbbbYK..................',
  '.....S.KYbwwbbbbbbbbYK..................',
  '.......KYbbbbbbbbbbbYK..................',
  '.......KKKKKKKKKKKKKKK..................',
  '..' + 'K'.repeat(25) + '.'.repeat(13),
  body(Y23, dots),
  body(Y23, dots),
  body(Y23, '...SS........'),
  body(Y23, '...SSSS......'),
  body(O23, '...SSSSSS....'),
  body(O23, 'DDDSSSSSSSS..'),
  body(R23, 'DDDSSSSSSSSS.'),
  body(O23, 'DDDSSSSSSSS..'),
  body(Y23, '...SSSSSS....'),
  body(Y23, '...SSSS......'),
  body(K23, '...SS........'),
  body(D23, dots),
  body(D23, dots),
  body(wheelsSolid, dots),
  body(wheelsHub, dots),
  body(wheelsSolid, dots),
  body(D23, dots),
  body(K23, dots),
];

export const DIGGER_W = 40;
export const DIGGER_H = DIGGER_ROWS.length;

/**
 * Draws the digger pixel map into a Phaser texture under `key`.
 * `px` is the pixel scale baked into the texture (kept at 1; the game
 * scales the resulting image with nearest-neighbour filtering).
 */
export function createDiggerTexture(scene: Phaser.Scene, key = 'digger', px = 4): void {
  if (scene.textures.exists(key)) return;

  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let y = 0; y < DIGGER_ROWS.length; y++) {
    const row = DIGGER_ROWS[y];
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]];
      if (color === undefined) continue; // transparent
      g.fillStyle(color, 1);
      g.fillRect(x * px, y * px, px, px);
    }
  }

  g.generateTexture(key, DIGGER_W * px, DIGGER_H * px);
  g.destroy();
}
