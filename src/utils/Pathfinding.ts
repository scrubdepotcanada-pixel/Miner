import { TileMap } from '../grid/TileMap';
import { TileType } from '../grid/TileTypes';

interface Node {
  col: number;
  row: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

function heuristic(ac: number, ar: number, bc: number, br: number): number {
  return Math.abs(ac - bc) + Math.abs(ar - br);
}

export function findPath(
  map: TileMap,
  startCol: number,
  startRow: number,
  goalCol: number,
  goalRow: number,
  canDig = false,
): Array<{ col: number; row: number }> {
  const open: Node[] = [];
  const closed = new Set<string>();

  const startNode: Node = { col: startCol, row: startRow, g: 0, h: heuristic(startCol, startRow, goalCol, goalRow), f: 0, parent: null };
  startNode.f = startNode.g + startNode.h;
  open.push(startNode);

  const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const key = `${current.col},${current.row}`;

    if (current.col === goalCol && current.row === goalRow) {
      const path: Array<{ col: number; row: number }> = [];
      let node: Node | null = current;
      while (node) { path.unshift({ col: node.col, row: node.row }); node = node.parent; }
      return path.slice(1); // exclude start
    }

    closed.add(key);

    for (const [dc, dr] of DIRS) {
      const nc = current.col + dc;
      const nr = current.row + dr;
      if (closed.has(`${nc},${nr}`)) continue;

      const tile = map.get(nc, nr);
      const blocked = tile === TileType.ROCK || tile === TileType.BORDER;
      const needsDig = tile === TileType.DIRT || tile === TileType.GEM;

      if (blocked) continue;
      if (needsDig && !canDig) continue;

      const g = current.g + (needsDig ? 5 : 1); // digging costs more
      const h = heuristic(nc, nr, goalCol, goalRow);
      const existing = open.find(n => n.col === nc && n.row === nr);
      if (existing) {
        if (g < existing.g) { existing.g = g; existing.f = g + existing.h; existing.parent = current; }
      } else {
        open.push({ col: nc, row: nr, g, h, f: g + h, parent: current });
      }
    }
  }

  return []; // no path found
}
