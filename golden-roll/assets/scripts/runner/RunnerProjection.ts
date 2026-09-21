/** Fake 3/4 projection: world X stays in lane space, depth grows toward the horizon. */
export const TILE = 145;
export const GROUND_STEP = 36;

const FOCAL = 390;
const HORIZON_Y = 410;
const PLAYER_SCREEN_Y = -220;
const SPRITE_SCALE = 1.42;
const TILE_OVERLAP = 1.02;
const HAZE_SAND = { r: 214, g: 162, b: 96 };

export function depthZ(depth: number): number {
    return FOCAL / (FOCAL + Math.max(-270, depth));
}

export function project(worldX: number, depth: number): { x: number; y: number; z: number } {
    const z = depthZ(depth);
    return {
        x: worldX * z,
        y: HORIZON_Y + (PLAYER_SCREEN_Y - HORIZON_Y) * z,
        z,
    };
}

export type TileQuad = {
    bl: { x: number; y: number; z: number };
    br: { x: number; y: number; z: number };
    tl: { x: number; y: number; z: number };
    tr: { x: number; y: number; z: number };
    z: number;
};

export function projectTrapezoid(worldX: number, depth: number, half = TILE * 0.5 * TILE_OVERLAP): TileQuad {
    return projectBand(worldX - half, worldX + half, depth);
}

export function projectBand(leftX: number, rightX: number, depth: number, length = GROUND_STEP): TileQuad {
    const bl = project(leftX, depth);
    const br = project(rightX, depth);
    const tl = project(leftX, depth + length);
    const tr = project(rightX, depth + length);
    return { bl, br, tl, tr, z: (bl.z + tl.z) * 0.5 };
}

export function projectSprite(worldX: number, depth: number, lift = 0): { x: number; y: number; s: number; z: number } {
    const point = project(worldX, depth);
    const scale = point.z * SPRITE_SCALE;
    return { x: point.x, y: point.y + lift * scale, s: scale, z: point.z };
}

export function hazeColor(z: number, path = false): { r: number; g: number; b: number; a: number } {
    const haze = Math.min(1, Math.max(0, (0.42 - z) / 0.3));
    const base = path ? { r: 236, g: 201, b: 148 } : { r: 255, g: 232, b: 196 };
    return {
        r: base.r - (base.r - HAZE_SAND.r) * haze,
        g: base.g - (base.g - HAZE_SAND.g) * haze,
        b: base.b - (base.b - HAZE_SAND.b) * haze,
        a: Math.round(255 * Math.min(1, Math.max(0, (z - 0.165) / 0.15))),
    };
}
