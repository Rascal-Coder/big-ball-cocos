import { Sprite, SpriteFrame, Node } from 'cc';
import { AssetService } from './AssetService';
import { findNode } from './NodeQuery';

export const BACKDROP_SPRITES = {
    LoadingBg: 'ui/bg-loading/spriteFrame',
    HomeBg: 'ui/bg-home/spriteFrame',
} as const;

export const LOADING_SPRITES = {
    TitleSign: 'ui/sign-title/spriteFrame',
    Beetle: 'ui/beetle-roll/spriteFrame',
    ProgressPanel: 'ui/panel-progress/spriteFrame',
    Bar: 'ui/load-fill/spriteFrame',
} as const;

export const HOME_SPRITES = {
    DecorLeft: 'ui/home-decor-left/spriteFrame',
    DecorRight: 'ui/home-decor-right/spriteFrame',
    Cactus: 'ui/home-prop-cactus/spriteFrame',
    Sage: 'ui/home-prop-sage/spriteFrame',
    Tumbleweed: 'ui/home-prop-tumbleweed/spriteFrame',
    Skull: 'ui/home-prop-skull/spriteFrame',
    RockLg: 'ui/home-prop-rock-lg/spriteFrame',
    RockSm: 'ui/home-prop-rock-sm/spriteFrame',
    GoldBoard: 'ui/home-board-gold/spriteFrame',
    StartBtn: 'ui/home-btn-start/spriteFrame',
    HomeTitle: 'ui/home-sign-title/spriteFrame',
    Icon0: 'ui/home-plaque/spriteFrame',
    Icon1: 'ui/home-plaque/spriteFrame',
    Icon2: 'ui/home-plaque/spriteFrame',
    Icon3: 'ui/home-plaque/spriteFrame',
    Shop: 'ui/home-plaque/spriteFrame',
} as const;

export const SKIN_MODAL_SPRITES = {
    SkinPanel: 'ui/modal-skin/spriteFrame',
    SkinBarTrack: 'ui/load-track/spriteFrame',
    bar: 'ui/load-fill/spriteFrame',
} as const;

export function applySprite(node: Node | null, sf: SpriteFrame): void {
    if (!node) {
        return;
    }
    const body = node.getComponent(Sprite) ? node : findNode(node, 'Body') ?? node;
    const sprite = body.getComponent(Sprite);
    if (!sprite) {
        return;
    }
    sprite.spriteFrame = sf;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
}

export async function bindNamedSprites(root: Node | null, map: Record<string, string>): Promise<void> {
    if (!root?.isValid) {
        return;
    }
    await Promise.all(
        Object.entries(map).map(async ([name, path]) => {
            const node = findNode(root, name);
            if (!node) {
                return;
            }
            try {
                applySprite(node, await AssetService.load(path, SpriteFrame));
            } catch (err) {
                console.warn('[ArtBinder]', path, err);
            }
        }),
    );
}
