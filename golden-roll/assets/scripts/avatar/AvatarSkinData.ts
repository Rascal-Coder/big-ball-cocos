import { SpriteFrame } from 'cc';

/** 头像状态。Click 最高优先，播放中不可被其它动作打断。 */
export enum AvatarState {
    Idle = 0,
    Blink = 1,
    Bubble = 2,
    Expression = 3,
    Click = 4,
}

/** Full：首页完整动作；Lite：商店列表只保留呼吸 + 眨眼。 */
export enum AvatarPlayMode {
    Full = 0,
    Lite = 1,
}

export type AvatarExpression = 'happy' | 'surprised' | 'angry';

export interface SkinAnimationData {
    id: string;
    idleFrames: SpriteFrame[];
    bubbleFrames: SpriteFrame[];
    swayFrames?: SpriteFrame[];
    blinkFrames: SpriteFrame[];
    happyFrames?: SpriteFrame[];
    surprisedFrames?: SpriteFrame[];
    angryFrames?: SpriteFrame[];
    clickFrames: SpriteFrame[];
    /** 大帽子皮肤可到 2°，其它约 1.5°。 */
    hatSwayMax?: number;
    /** 泡泡已画进角色帧时隐藏独立 BubbleFX。 */
    bubbleInSheet?: boolean;
}

export interface AvatarSkinDef {
    id: string;
    name: string;
    row: number;
    hatSwayMax: number;
}

export const DEFAULT_AVATAR_SKIN_ID = 'cowboy';

export const AVATAR_SHEET_PATH = 'ui/avatars/role-sheet/spriteFrame';

/**
 * role-sheet.png（1448×1086）布局：
 * 左侧中文名 + 顶栏分组标题不参与切图。
 * 每行 4 组 × 6 帧：bubble / sway / blink / click。
 */
export const AVATAR_SHEET_GROUPS = [
    { key: 'bubble', x: 90, w: 356 },
    { key: 'sway', x: 448, w: 304 },
    { key: 'blink', x: 760, w: 326 },
    { key: 'click', x: 1096, w: 326 },
] as const;

/**
 * 必须小于最密一组的列距（摇摆组 304/6 ≈ 50.7）。
 * 比列距更宽会切进左右相邻帧，播放时就会叠出多个角色。
 */
export const AVATAR_SHEET_CELL_W = 50;
export const AVATAR_SHEET_SLICE_VERSION = 2;

export const AVATAR_SHEET_ROWS: ReadonlyArray<{ y: number; h: number }> = [
    { y: 44, h: 68 },
    { y: 122, h: 70 },
    { y: 202, h: 68 },
    { y: 284, h: 70 },
    { y: 365, h: 74 },
    { y: 447, h: 74 },
    { y: 532, h: 72 },
    { y: 615, h: 78 },
    { y: 700, h: 79 },
    { y: 784, h: 77 },
    { y: 870, h: 82 },
    { y: 966, h: 77 },
];

export const AVATAR_SKINS: readonly AvatarSkinDef[] = [
    { id: 'cowboy', name: '经典牛仔仔', row: 0, hatSwayMax: 2 },
    { id: 'sheriff', name: '白帽警长', row: 1, hatSwayMax: 2 },
    { id: 'cowgirl', name: '粉色女牛仔', row: 2, hatSwayMax: 2 },
    { id: 'bandit', name: '黑帽盗匪', row: 3, hatSwayMax: 2 },
    { id: 'mexican', name: '墨西哥风', row: 4, hatSwayMax: 2 },
    { id: 'indian', name: '印第安安', row: 5, hatSwayMax: 2 },
    { id: 'pilot', name: '飞行员', row: 6, hatSwayMax: 1.5 },
    { id: 'panda', name: '熊猫仔', row: 7, hatSwayMax: 1.5 },
    { id: 'dinosaur', name: '恐龙装', row: 8, hatSwayMax: 1.5 },
    { id: 'cow', name: '奶牛装', row: 9, hatSwayMax: 1.5 },
    { id: 'rabbit', name: '兔兔装', row: 10, hatSwayMax: 1.6 },
    { id: 'monster', name: '怪兽装', row: 11, hatSwayMax: 1.5 },
];

export const AVATAR_FPS = {
    idle: 7,
    bubble: 8,
    sway: 7,
    blink: 10,
    expression: 7,
    click: 12,
} as const;

export function randRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

export function resolveAvatarSkin(id: string | null | undefined): AvatarSkinDef {
    return AVATAR_SKINS.find((skin) => skin.id === id) ?? AVATAR_SKINS[0];
}
