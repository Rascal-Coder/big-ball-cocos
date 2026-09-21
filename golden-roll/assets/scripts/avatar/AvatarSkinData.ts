import { SpriteFrame } from 'cc';

/** 头像状态。Click 最高优先，播放中不可被其它动作打断。 */
export enum AvatarState {
    Idle = 0,
    Blink = 1,
    Expression = 2,
    Click = 3,
}

/** Full：首页完整动作；Lite：只保留呼吸 + 眨眼。 */
export enum AvatarPlayMode {
    Full = 0,
    Lite = 1,
}

export type AvatarExpression = 'happy' | 'surprised' | 'wink';

export type AvatarSheetId = 'skins' | 'faces';

export type AvatarPartId =
    | 'eyeOpenL'
    | 'eyeOpenR'
    | 'lidClosedL'
    | 'lidClosedR'
    | 'lidHalfL'
    | 'lidHalfR'
    | 'eyeStarL'
    | 'eyeStarR'
    | 'eyeHeartL'
    | 'eyeHeartR'
    | 'browL'
    | 'browR'
    | 'mouthSmile'
    | 'mouthHappy'
    | 'mouthOh'
    | 'mouthGrin';

export interface AtlasRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface AvatarPartSet {
    id: string;
    portrait: SpriteFrame;
    parts: Partial<Record<AvatarPartId, SpriteFrame>>;
}

export interface AvatarSkinDef {
    id: string;
    name: string;
    rect: AtlasRect;
}

export const DEFAULT_AVATAR_SKIN_ID = 'cowboy';

export const AVATAR_SHEET_PATHS: Record<AvatarSheetId, string> = {
    skins: 'ui/avatars/skins/spriteFrame',
    faces: 'ui/avatars/faces/spriteFrame',
};

export const AVATAR_DISPLAY = 1;
export const AVATAR_RIG_SCALE = AVATAR_DISPLAY;

/** 整身皮肤，不含标签、不含拆开的头和身体。 */
export const AVATAR_SKINS: readonly AvatarSkinDef[] = [
    { id: 'cowboy', name: '经典牛仔', rect: { x: 23, y: 15, w: 212, h: 188 } },
    { id: 'pilot', name: '飞行员', rect: { x: 472, y: 18, w: 186, h: 185 } },
    { id: 'steampunk', name: '蒸汽朋克', rect: { x: 673, y: 8, w: 196, h: 195 } },
    { id: 'mexican', name: '墨西哥', rect: { x: 887, y: 7, w: 206, h: 196 } },
    { id: 'desert', name: '沙漠旅人', rect: { x: 1104, y: 1, w: 208, h: 202 } },
    { id: 'miner', name: '矿工', rect: { x: 1334, y: 20, w: 180, h: 183 } },
    { id: 'tribe', name: '部落', rect: { x: 176, y: 256, w: 210, h: 200 } },
    { id: 'astronaut', name: '宇航员', rect: { x: 422, y: 262, w: 205, h: 196 } },
    { id: 'pirate', name: '海盗', rect: { x: 668, y: 259, w: 217, h: 198 } },
    { id: 'cactus', name: '仙人掌', rect: { x: 909, y: 267, w: 215, h: 190 } },
    { id: 'king', name: '国王', rect: { x: 1167, y: 257, w: 209, h: 200 } },
];

/** image1 表情表。 */
export const AVATAR_FACE_SLICES: Record<AvatarPartId, AtlasRect> = {
    eyeOpenL: { x: 514, y: 225, w: 67, h: 82 },
    eyeOpenR: { x: 601, y: 225, w: 67, h: 82 },
    lidClosedL: { x: 693, y: 247, w: 69, h: 43 },
    lidClosedR: { x: 784, y: 249, w: 67, h: 41 },
    lidHalfL: { x: 867, y: 251, w: 71, h: 55 },
    lidHalfR: { x: 960, y: 249, w: 71, h: 56 },
    eyeStarL: { x: 889, y: 403, w: 67, h: 79 },
    eyeStarR: { x: 973, y: 403, w: 67, h: 78 },
    eyeHeartL: { x: 1066, y: 402, w: 76, h: 74 },
    eyeHeartR: { x: 1149, y: 402, w: 77, h: 74 },
    browL: { x: 35, y: 772, w: 72, h: 36 },
    browR: { x: 142, y: 770, w: 72, h: 38 },
    mouthSmile: { x: 66, y: 947, w: 113, h: 27 },
    mouthHappy: { x: 474, y: 922, w: 107, h: 65 },
    mouthOh: { x: 1105, y: 908, w: 66, h: 78 },
    mouthGrin: { x: 666, y: 925, w: 121, h: 63 },
};

export interface PartPose {
    x: number;
    y: number;
    /** 贴图像素缩放，写入 contentSize。 */
    scale: number;
    /** 节点 Scale。 */
    nodeScale: number;
    anchorX: number;
    anchorY: number;
}

export interface FaceCell {
    col: number;
    row: number;
}

/** 牛仔整身像素（y 向下）。脸是横椭圆，左右取亮肤色最长行，上下包到帽檐下。 */
export const AVATAR_PORTRAIT_SRC = { w: 212, h: 188 };
export const AVATAR_FACE_ELLIPSE_PX = { cx: 76, cy: 117, rx: 46, ry: 35 };
export const AVATAR_PORTRAIT_LAYOUT = { scale: 0.7, anchorX: 0.5, anchorY: 0.42 };
export const AVATAR_FACE_GRID = { cols: 6, rows: 8 };

/**
 * 脸格槽位。列/行从椭圆外接框左上角起算，(0,0) 是左上格。
 * 眉、眼、嘴各隔一行，避免挤在椭圆中腰。
 */
export const AVATAR_FACE_CELLS: Record<'browL' | 'browR' | 'eyeL' | 'eyeR' | 'mouth', FaceCell> = {
    browL: { col: 1, row: 1 },
    browR: { col: 4, row: 1 },
    eyeL: { col: 1, row: 4 },
    eyeR: { col: 4, row: 4 },
    mouth: { col: 2.5, row: 7 },
};

function portraitLocalFromPx(px: number, py: number): { x: number; y: number } {
    const dw = AVATAR_PORTRAIT_SRC.w * AVATAR_PORTRAIT_LAYOUT.scale;
    const dh = AVATAR_PORTRAIT_SRC.h * AVATAR_PORTRAIT_LAYOUT.scale;
    return {
        x: px * AVATAR_PORTRAIT_LAYOUT.scale - dw * AVATAR_PORTRAIT_LAYOUT.anchorX,
        y: (AVATAR_PORTRAIT_SRC.h - py) * AVATAR_PORTRAIT_LAYOUT.scale - dh * AVATAR_PORTRAIT_LAYOUT.anchorY,
    };
}

/** 脸格中心 → Face 节点本地坐标（原点是椭圆心，Y 向上）。 */
export function faceCellLocal(col: number, row: number): { x: number; y: number } {
    const rx = AVATAR_FACE_ELLIPSE_PX.rx * AVATAR_PORTRAIT_LAYOUT.scale;
    const ry = AVATAR_FACE_ELLIPSE_PX.ry * AVATAR_PORTRAIT_LAYOUT.scale;
    const cellW = (rx * 2) / AVATAR_FACE_GRID.cols;
    const cellH = (ry * 2) / AVATAR_FACE_GRID.rows;
    return {
        x: -rx + (col + 0.5) * cellW,
        y: ry - (row + 0.5) * cellH,
    };
}

function cellPose(cell: FaceCell, scale: number, nodeScale: number): PartPose {
    const local = faceCellLocal(cell.col, cell.row);
    return { x: local.x, y: local.y, scale, nodeScale, anchorX: 0.5, anchorY: 0.5 };
}

const FACE_ORIGIN = portraitLocalFromPx(AVATAR_FACE_ELLIPSE_PX.cx, AVATAR_FACE_ELLIPSE_PX.cy);

/** 头像布局唯一基准：整身/骨骼写死，五官由脸格算出。 */
export const AVATAR_POSE: Record<string, PartPose> = {
    rig: { x: 0, y: -4, scale: 1, nodeScale: 1, anchorX: 0.5, anchorY: 0.5 },
    portrait: {
        x: 0,
        y: -4,
        scale: AVATAR_PORTRAIT_LAYOUT.scale,
        nodeScale: 1,
        anchorX: AVATAR_PORTRAIT_LAYOUT.anchorX,
        anchorY: AVATAR_PORTRAIT_LAYOUT.anchorY,
    },
    face: { x: FACE_ORIGIN.x, y: FACE_ORIGIN.y, scale: 1, nodeScale: 1, anchorX: 0.5, anchorY: 0.5 },
    browL: cellPose(AVATAR_FACE_CELLS.browL, 0.34, 1),
    browR: cellPose(AVATAR_FACE_CELLS.browR, 0.34, 1),
    eyeL: cellPose(AVATAR_FACE_CELLS.eyeL, 0.38, 0.8),
    eyeR: cellPose(AVATAR_FACE_CELLS.eyeR, 0.38, 0.8),
    mouth: cellPose(AVATAR_FACE_CELLS.mouth, 0.38, 0.4),
};

export function randRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function resolveAvatarSkin(id: string | null | undefined): AvatarSkinDef {
    return AVATAR_SKINS.find((skin) => skin.id === id) ?? AVATAR_SKINS[0];
}
