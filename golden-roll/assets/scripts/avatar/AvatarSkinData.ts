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
    { id: 'sheriff', name: '警长', rect: { x: 255, y: 15, w: 209, h: 188 } },
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
    scale: number;
    nodeScale: number;
    anchorX: number;
    anchorY: number;
}

/** 五官坐标以编辑器手动对齐为准，换肤只换整身。 */
export const AVATAR_POSE: Record<string, PartPose> = {
    rig: { x: 0, y: 8, scale: 1, nodeScale: 1, anchorX: 0.5, anchorY: 0.5 },
    portrait: { x: 0, y: -4, scale: 0.7, nodeScale: 1, anchorX: 0.5, anchorY: 0.42 },
    face: { x: 0, y: -6, scale: 1, nodeScale: 1, anchorX: 0.5, anchorY: 0.5 },
    browL: { x: -33, y: 12.5, scale: 0.34, nodeScale: 1, anchorX: 0.5, anchorY: 0.5 },
    browR: { x: -3, y: 12.5, scale: 0.34, nodeScale: 1, anchorX: 0.5, anchorY: 0.5 },
    eyeL: { x: -33, y: -5, scale: 0.38, nodeScale: 0.8, anchorX: 0.5, anchorY: 0.5 },
    eyeR: { x: -3, y: -5, scale: 0.38, nodeScale: 0.8, anchorX: 0.5, anchorY: 0.5 },
    mouth: { x: -18, y: -22, scale: 0.38, nodeScale: 0.4, anchorX: 0.5, anchorY: 0.5 },
};

export function randRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function resolveAvatarSkin(id: string | null | undefined): AvatarSkinDef {
    return AVATAR_SKINS.find((skin) => skin.id === id) ?? AVATAR_SKINS[0];
}
