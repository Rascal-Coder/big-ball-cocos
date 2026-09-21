import { _decorator, Component, instantiate, Node, Prefab, UIOpacity } from 'cc';
import { AvatarAnimator } from '../avatar/AvatarAnimator';
import { AvatarPlayMode } from '../avatar/AvatarSkinData';
import { AssetService } from '../core/AssetService';
import { bindNamedSprites, HOME_SPRITES, SKIN_MODAL_SPRITES } from '../core/ArtBinder';
import { GameModel } from '../core/GameModel';
import { findNode } from '../core/NodeQuery';
import { CurrencyBar } from './CurrencyBar';
import { OverlayService } from './OverlayService';
import { PlaqueButton } from './PlaqueButton';
import { SkinModalView } from './SkinModalView';

const { ccclass } = _decorator;

const LATER = '后续开放';

export interface HomeHost {
    model: GameModel;
    onStart: () => void;
    applyFonts: (root: Node) => void;
}

@ccclass('HomeController')
export class HomeController extends Component {
    private _host: HomeHost | null = null;
    private _gold: CurrencyBar | null = null;
    private _avatar: AvatarAnimator | null = null;
    private _skinModal: SkinModalView | null = null;

    async setup(host: HomeHost): Promise<void> {
        this._host = host;
        this._gold = this._bindGold();
        this._wireStart();
        this._wirePlaques();
        this._setSlotVisible(false);
        await bindNamedSprites(this.node, HOME_SPRITES);
        try {
            await this._mountAvatar();
        } catch (err) {
            console.warn('[HomeController] avatar prefab', err);
        }
        this.refresh();
        host.applyFonts(this.node);
        this._setSlotVisible(true);
    }

    refresh(): void {
        if (this._host && this._gold) {
            this._gold.setValue(this._host.model.wallet);
        }
        this._avatar?.setSkin(this._host?.model.skinId ?? 'cowboy');
    }

    private _bindGold(): CurrencyBar | null {
        const board = findNode(this.node, 'GoldBoard');
        if (!board) {
            return null;
        }
        return board.getComponent(CurrencyBar) ?? board.addComponent(CurrencyBar);
    }

    private _wireStart(): void {
        const start = findNode(this.node, 'StartBtn');
        start?.on(Node.EventType.TOUCH_END, () => this._host?.onStart(), this);
    }

    private _wirePlaques(): void {
        const actions: Array<[string, string]> = [
            ['Icon0', 'checkin'],
            ['Icon1', 'stats'],
            ['Icon2', 'rank'],
            ['Icon3', 'settings'],
            ['Shop', 'shop'],
        ];
        for (const [name, actionId] of actions) {
            const node = findNode(this.node, name);
            if (!node) {
                continue;
            }
            const btn = node.getComponent(PlaqueButton) ?? node.addComponent(PlaqueButton);
            btn.actionId = actionId;
            btn.onClick = (id) => this._onAction(id);
        }
    }

    private async _mountAvatar(): Promise<void> {
        const slot = findNode(this.node, 'AvatarSlot') ?? findNode(this.node, 'PortraitCol');
        if (!slot) {
            return;
        }
        let portrait = findNode(slot, 'AvatarRoot') ?? slot.getChildByName('avatar-cowboy');
        if (!portrait) {
            const prefab = AssetService.get('ui/avatar-cowboy', Prefab) ?? (await AssetService.loadPrefab('ui/avatar-cowboy'));
            if (!slot.isValid) {
                return;
            }
            portrait = instantiate(prefab);
            portrait.name = 'AvatarRoot';
            portrait.setPosition(0, slot.name === 'AvatarSlot' ? 0 : 72, 0);
            slot.addChild(portrait);
        }
        const animator = portrait.getComponent(AvatarAnimator) ?? portrait.addComponent(AvatarAnimator);
        animator.playMode = AvatarPlayMode.Full;
        animator.clickEnabled = true;
        animator.skinId = this._host?.model.skinId ?? 'cowboy';
        this._avatar = animator;
        this._host?.applyFonts(portrait);
    }

    private _onAction(actionId: string): void {
        if (actionId === 'shop') {
            void this._openSkin();
            return;
        }
        void OverlayService.showToast(LATER);
    }

    private async _openSkin(): Promise<void> {
        if (!this._host) {
            return;
        }
        try {
            if (!this._skinModal?.isValid) {
                const prefab = await this._skinPrefab();
                const layer = this.node.parent?.getChildByName('Overlay');
                if (!layer) {
                    return;
                }
                const node = instantiate(prefab);
                node.name = 'SkinModal';
                layer.addChild(node);
                this._skinModal = node.getComponent(SkinModalView) ?? node.addComponent(SkinModalView);
                await bindNamedSprites(node, SKIN_MODAL_SPRITES);
                this._host.applyFonts(node);
            }
            await this._skinModal.open(this._host.model, () => this.refresh());
        } catch (err) {
            console.warn('[HomeController] skin modal', err);
        }
    }

    private _setSlotVisible(visible: boolean): void {
        const slot = findNode(this.node, 'AvatarSlot') ?? findNode(this.node, 'PortraitCol');
        if (!slot) {
            return;
        }
        const opacity = slot.getComponent(UIOpacity) ?? slot.addComponent(UIOpacity);
        opacity.opacity = visible ? 255 : 0;
    }

    private _skinPrefab(): Promise<Prefab> {
        return AssetService.loadPrefab('ui/prefabs/modal-skin');
    }
}
