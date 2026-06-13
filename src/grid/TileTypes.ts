export enum TileType {
  EMPTY   = 0,
  DIRT    = 1,
  GEM     = 2,
  ROCK    = 3,
  BORDER  = 4,
  HAZARD  = 5,
  SPAWN   = 6,
  BAG     = 7,
  ARTIFACT = 8,
}

export function isSolid(t: TileType): boolean {
  return t === TileType.ROCK || t === TileType.BORDER;
}

export function isDiggable(t: TileType): boolean {
  return t === TileType.DIRT || t === TileType.GEM || t === TileType.ARTIFACT;
}

export function isPassable(t: TileType): boolean {
  return t === TileType.EMPTY || t === TileType.SPAWN;
}
