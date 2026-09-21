import { _decorator, Asset, Component, Constructor, director, Font, Label, Node, Prefab, SpriteFrame, UIOpacity, view, ResolutionPolicy, Color } from 'cc';
import { AVATAR_SHEET_PATHS } from '../avatar/AvatarSkinData';
import { AvatarSkinManager } from '../avatar/AvatarSkinManager';
import { BACKDROP_SPRITES, bindNamedSprites, HOME_SPRITES } from '../core/ArtBinder';
import { AssetService } from '../core/AssetService';
import { applyGameFace, applyTitleFace, formatCompactAmount, GAME_FONT } from '../core/Format';
import { GameModel } from '../core/GameModel';
import { findNode } from '../core/NodeQuery';
import { HomeController } from '../ui/HomeController';
import { LoadingView } from '../ui/LoadingView';
import { OverlayService } from '../ui/OverlayService';
import { RunSessionService } from '../runner/RunSessionService';

const { ccclass } = _decorator;

type Phase = 'loading' | 'toHome' | 'home' | 'game' | 'result';

const FONT = GAME_FONT;
const DESIGN = { w: 750, h: 1334 };

@ccclass('GameApp')
export class GameApp extends Component {
    private readonly model = new GameModel();

    private phase: Phase = 'loading';
    private backdrop: Node = null!;
    private bgLoading: Node | null = null;
    private bgHome: Node | null = null;
    private loading: Node = null!;
    private home: Node = null!;
    private game: Node = null!;
    private result: Node = null!;
    private overlay: Node = null!;
    private loadingView: LoadingView | null = null;
    private homeCtrl: HomeController | null = null;
    private gameFont: Font | null = null;

    private homeReady = false;

    onLoad(): void {
        this._lockPortrait();
        view.on('canvas-resize', this._lockPortrait, this);
        try {
            this._bindScene();
        } catch (err) {
            console.error('[GameApp] bind scene', err);
        }
        this._loadFonts();
        if (this.backdrop) {
            void bindNamedSprites(this.backdrop, BACKDROP_SPRITES);
        }
        if (this.loading) {
            this._enterLoading();
            void this._bootFromLoading();
        } else if (this.home) {
            void this._bootHome();
        }
    }

    onDestroy(): void {
        view.off('canvas-resize', this._lockPortrait, this);
    }

    private _bindScene(): void {
        this.backdrop = this.node.getChildByName('Backdrop') ?? this.node;
        this.bgLoading = findNode(this.backdrop, 'LoadingBg');
        this.bgHome = findNode(this.backdrop, 'HomeBg');
        this.loading = this.node.getChildByName('Loading');
        this.home = this.node.getChildByName('Home');
        if (this.loading) {
            this._ensureOpacity(this.loading);
            this.loadingView = this.loading.getComponent(LoadingView) ?? this.loading.addComponent(LoadingView);
        }
        if (this.home) {
            this.home.active = false;
            this._ensureOpacity(this.home);
            this.homeCtrl = this.home.getComponent(HomeController) ?? this.home.addComponent(HomeController);
            this.overlay = this.node.getChildByName('Overlay')!;
            this._setActive(this.game, false);
            this._setActive(this.result, false);
            OverlayService.bind(this.overlay);
        }
        this._ensureOpacity(this.backdrop);
        this._ensureOpacity(this.bgLoading);
        this._ensureOpacity(this.bgHome);
    }

    private _loadHomeScene(): void {
        const tryLoad = (name: string, next?: () => void): void => {
            director.loadScene(name, (err) => {
                if (!err) {
                    return;
                }
                console.warn('[GameApp] load scene', name, err);
                next?.();
            });
        };
        tryLoad('main', () => {
            tryLoad('8f128e7c-3830-41db-9053-75d632c776af', () => {
                console.error('[GameApp] cannot open home scene');
                this.phase = 'loading';
            });
        });
    }

    private _ensureOpacity(node: Node | null): void {
        if (node && !node.getComponent(UIOpacity)) {
            node.addComponent(UIOpacity);
        }
    }

    private async _bootFromLoading(): Promise<void> {
        try {
            await Promise.race([
                this._preloadHomeAssets((t) => this.loadingView?.setProgress(t)),
                new Promise<void>((resolve) => this.scheduleOnce(() => resolve(), 8)),
            ]);
        } catch (err) {
            console.warn('[GameApp] preload', err);
        }
        this.loadingView?.setProgress(1);
        this._leaveLoadingToHome();
    }

    private async _bootHome(): Promise<void> {
        if (this.home) {
            this.home.active = false;
        }
        if (this.homeCtrl && !this.homeReady) {
            try {
                await this.homeCtrl.setup({
                    model: this.model,
                    onStart: () => this._leaveHomeToGame(),
                    applyFonts: (root) => this._applyFonts(root),
                });
            } catch (err) {
                console.warn('[GameApp] home setup', err);
            }
            this.homeReady = true;
        }
        this._enterHome();
    }

    private _bootAssets(): Array<readonly [string, Constructor<Asset>]> {
        const items: Array<readonly [string, Constructor<Asset>]> = [
            ['ui/avatar-cowboy', Prefab],
            [AVATAR_SHEET_PATHS.skins, SpriteFrame],
            [AVATAR_SHEET_PATHS.faces, SpriteFrame],
            [FONT, Font],
        ];
        Object.values(HOME_SPRITES).forEach((path) => items.push([path, SpriteFrame]));
        Object.values(BACKDROP_SPRITES).forEach((path) => items.push([path, SpriteFrame]));
        const seen = new Set<string>();
        return items.filter(([path]) => {
            if (seen.has(path)) {
                return false;
            }
            seen.add(path);
            return true;
        });
    }

    private async _preloadHomeAssets(onProgress?: (t: number) => void): Promise<void> {
        await AssetService.preload(this._bootAssets(), (t) => onProgress?.(t * 0.72));
        await AvatarSkinManager.instance.loadAsync();
        onProgress?.(0.8);
        await new Promise<void>((resolve) => {
            director.preloadScene('main', (completed, total) => {
                if (total > 0) {
                    onProgress?.(0.8 + 0.2 * (completed / total));
                }
            }, (err) => {
                if (err) {
                    console.warn('[GameApp] preload main', err);
                }
                resolve();
            });
        });
        onProgress?.(1);
    }

    private _enterLoading(): void {
        this.phase = 'loading';
        this._setActive(this.backdrop, true);
        this._setActive(this.loading, true);
        this._setActive(this.home, false);
        this._setActive(this.game, false);
        this._setActive(this.result, false);
        this._setOpacity(this.backdrop, 255);
        this._setOpacity(this.bgLoading, 255);
        this._setOpacity(this.bgHome, 0);
        this._setOpacity(this.loading, 255);
        this.loadingView?.setProgress(0);
    }

    private _leaveLoadingToHome(): void {
        if (this.phase === 'toHome' || this.phase === 'home') {
            return;
        }
        if (!this.home) {
            this.phase = 'toHome';
            this._loadHomeScene();
            return;
        }
        void this._bootHome();
    }

    private _finishArriveHome(): void {
        this.unschedule(this._finishArriveHome);
        this._setActive(this.loading, false);
        this._setActive(this.home, true);
        this._setActive(this.bgHome, true);
        this._setActive(this.backdrop, true);
        this._setOpacity(this.loading, 0);
        this._setOpacity(this.bgLoading, 0);
        this._setOpacity(this.bgHome, 255);
        this._setOpacity(this.home, 255);
        this.phase = 'home';
        this.homeCtrl?.refresh();
    }

    private _enterHome(): void {
        this.phase = 'home';
        this._setActive(this.backdrop, true);
        this._setActive(this.loading, false);
        this._setActive(this.home, true);
        this._setActive(this.game, false);
        this._setActive(this.result, false);
        this._setOpacity(this.backdrop, 255);
        this._setOpacity(this.bgLoading, 0);
        this._setOpacity(this.bgHome, 255);
        this._setOpacity(this.home, 255);
        this.homeCtrl?.refresh();
    }

    private _leaveHomeToGame(): void {
        if (this.phase !== 'home') return;
        this.phase = 'game';
        RunSessionService.skin = this.model.skinId;
        director.loadScene('runner', (error) => {
            if (error) {
                console.error('[GameApp] runner scene', error);
                this._enterHome();
            }
        });
    }

    private _loadFonts(): void {
        void AssetService.load(FONT, Font)
            .then((font) => {
                this.gameFont = font;
                this._applyFonts(this.node);
            })
            .catch((err) => console.warn('[GameApp] font', err));
    }

    private _applyFonts(root: Node): void {
        const label = root.getComponent(Label);
        if (label) {
            this._paintFont(label);
        }
        root.children.forEach((child) => this._applyFonts(child));
    }

    private _labelKind(label: Label): 'title' | 'sign' | 'number' | 'ink' {
        const name = label.node.name;
        if (name === 'GoldText' || name === 'Percent' || name === 'Gold' || name === 'Distance' || name === 'Weight') {
            return 'number';
        }
        if (name === 'Main') {
            return 'title';
        }
        if (name.startsWith('IconLabel') || name === 'ShopLabel' || name === 'SkinTitle' || name === 'SkinClose') {
            return 'sign';
        }
        return 'ink';
    }

    private _paintFont(label: Label): void {
        if (!label.isValid) {
            return;
        }
        if (!this.gameFont) {
            return;
        }
        applyGameFace(label, this.gameFont);
        const kind = this._labelKind(label);
        if (kind === 'number') {
            label.color = new Color(92, 58, 28, 255);
            label.enableOutline = true;
            label.outlineColor = new Color(62, 36, 14, 90);
            label.outlineWidth = 1;
            label.cacheMode = Label.CacheMode.BITMAP;
        } else if (kind === 'title') {
            applyTitleFace(label);
        } else if (kind === 'sign') {
            label.enableOutline = true;
            label.outlineColor = new Color(40, 22, 10, 180);
            label.outlineWidth = 2;
            label.cacheMode = Label.CacheMode.BITMAP;
        } else {
            label.enableOutline = false;
            label.cacheMode = Label.CacheMode.CHAR;
        }
        const text = label.string;
        label.string = '';
        label.string = text;
    }

    private _lockPortrait(): void {
        view.setDesignResolutionSize(DESIGN.w, DESIGN.h, ResolutionPolicy.SHOW_ALL);
        view.resizeWithBrowserSize(true);
    }

    private _opacity(node: Node): UIOpacity {
        return node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
    }

    private _setOpacity(node: Node | null, value: number): void {
        if (!node) {
            return;
        }
        this._opacity(node).opacity = value;
    }

    private _setActive(node: Node | null | undefined, value: boolean): void {
        if (node?.isValid) {
            node.active = value;
        }
    }


}
