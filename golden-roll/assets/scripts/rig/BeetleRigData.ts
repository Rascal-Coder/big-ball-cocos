export type RigClip = 'idle' | 'walk' | 'push';

export const RIG_CLIP_LABEL: Record<RigClip, string> = {
    idle: '待机 · 呼吸',
    walk: '行走 · 中足换帧',
    push: '推球 · 前足抓推',
};

export const RIG_PART_SCALE = {
    ball: 0.7,
    body: 0.44,
    hat: 0.36,
    bandana: 0.26,
    leg: 0.4,
};

export const RIG_SHEET = {
    ball: Array.from({ length: 16 }, (_, i) => `rig-test/ball-${String(i).padStart(2, '0')}/spriteFrame`),
    body: 'rig-test/body/spriteFrame',
    hat: 'rig-test/hat/spriteFrame',
    bandana: 'rig-test/bandana/spriteFrame',
    front: Array.from({ length: 6 }, (_, i) => `rig-test/front-${i}/spriteFrame`),
    mid: Array.from({ length: 6 }, (_, i) => `rig-test/mid-${i}/spriteFrame`),
    hind: Array.from({ length: 6 }, (_, i) => `rig-test/hind-${i}/spriteFrame`),
};

export const RIG_PATHS = [
    RIG_SHEET.body,
    RIG_SHEET.hat,
    RIG_SHEET.bandana,
    ...RIG_SHEET.ball,
    ...RIG_SHEET.front,
    ...RIG_SHEET.mid,
    ...RIG_SHEET.hind,
];
