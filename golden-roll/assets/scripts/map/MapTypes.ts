export type ChunkType = 'start' | 'normal' | 'reward' | 'trap' | 'event';

export type ItemKind = 'obstacle' | 'coin' | 'mud' | 'hazard' | 'deco' | 'life';

export type MapLayer = 'Ground' | 'Path' | 'Decor' | 'Obstacle' | 'Pickup';

export interface TileSpec {
    col: number;
    row: number;
    sprite: string;
    layer: MapLayer;
    rot?: number;
}

export interface PropSpec {
    col: number;
    row: number;
    sprite: string;
    kind: ItemKind;
    radius: number;
    layer: MapLayer;
    scale?: number;
}

export interface ChunkRecipe {
    id: string;
    type: ChunkType;
    pathLeft: number;
    pathRight: number;
    tiles: TileSpec[];
    props: PropSpec[];
}

/** 新图地砖约 222×222，圆角用重叠绘制盖住。 */
export const TILE = 208;
export const TILE_DRAW = 248;
export const TILE_DRAW_H = 248;
export const COLS = 7;
export const ROWS = 6;
export const CHUNK_H = TILE * ROWS;
export const KEEP_BEHIND = 1600;
export const KEEP_AHEAD = 2600;

export function cellX(col: number): number {
    return (col - (COLS - 1) / 2) * TILE;
}

export function cellY(row: number): number {
    return row * TILE + TILE * 0.5;
}
