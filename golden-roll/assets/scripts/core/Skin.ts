export interface SkinDef {
    id: string;
    name: string;
    portrait: string;
}

export const DEFAULT_SKIN_ID = 'cowboy';

export const SKINS: Record<string, SkinDef> = {
    cowboy: {
        id: 'cowboy',
        name: '牛仔',
        portrait: 'ui/skin-cowboy/spriteFrame',
    },
};

export function resolveSkin(id: string | null | undefined): SkinDef {
    return SKINS[id || ''] ?? SKINS[DEFAULT_SKIN_ID];
}
