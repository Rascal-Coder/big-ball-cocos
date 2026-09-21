import {
    _decorator,
    Asset,
    Color,
    Component,
    Constructor,
    director,
    Font,
    Graphics,
    Input,
    input,
    KeyCode,
    Label,
    Node,
    Prefab,
    SpriteFrame,
    UIOpacity,
    UITransform,
    Vec2,
    view,
    ResolutionPolicy,
    Widget,
} from 'cc';
import { AVATAR_SHEET_PATHS } from '../avatar/AvatarSkinData';
import { AvatarSkinManager } from '../avatar/AvatarSkinManager';
import { BACKDROP_SPRITES, bindNamedSprites, HOME_SPRITES } from '../core/ArtBinder';
import { AssetService } from '../core/AssetService';
import { applyGameFace, applyTitleFace, formatCompactAmount, GAME_FONT } from '../core/Format';
import { GameModel } from '../core/GameModel';
import { findNode } from '../core/NodeQuery';
import { HomeController } from '../ui/HomeController';
import { Joystick } from '../ui/Joystick';
import { LoadingView } from '../ui/LoadingView';
import { OverlayService } from '../ui/OverlayService';
import { MapStreamer } from '../map/MapStreamer';

const { ccclass } = _decorator;

type Phase = 'loading' | 'toHome' | 'home' | 'game' | 'result';

const FONT = GAME_FONT;
const DESIGN = { w: 750, h: 1334 };

@ccclass('GameApp')
export class GameApp extends Component {
    private readonly model = new GameModel();
    private readonly keyDir = new Vec2();
    private readonly move = new Vec2();

    private phase: Phase = 'loading';
    private backdrop: Node = null!;
    private bgLoading: Node | null = null;
    private bgHome: Node | null = null;
    private loading: Node = null!;
    private home: Node = null!;
    private game: Node = null!;
    private result: Node = null!;
    private overlay: Node = null!;
    private world: Node = null!;
    private ball: Node = null!;
    private beetle: Node = null!;
    private joystick: Joystick | null = null;
    private hudGold: Label | null = null;
    private hudDistance: Label | null = null;
    private hudWeight: Label | null = null;
    private hudLives: Label | null = null;
    private resultBody: Label | null = null;
    private loadingView: LoadingView | null = null;
    private homeCtrl: HomeController | null = null;
    private gameFont: Font | null = null;

    private homeReady = false;
    private map: MapStreamer | null = null;
    private ballPos = { x: 0, y: 0 };
    private facing = { x: 0, y: 1 };

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

    onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    update(dt: number): void {
        if (this.phase !== 'game') {
            return;
        }
        this._tickGame(dt);
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
            this.game = this._page('Game');
            this.result = this._page('Result');
            this.overlay = this._page('Overlay');
            this._setActive(this.game, false);
            this._setActive(this.result, false);
            OverlayService.bind(this.overlay);
            this._buildGame();
            this._buildResult();
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

    private _must(name: string): Node {
        const node = this.node.getChildByName(name);
        if (!node) {
            throw new Error(`Scene missing page root: ${name}`);
        }
        node.active = true;
        if (!node.getComponent(UIOpacity)) {
            node.addComponent(UIOpacity);
        }
        return node;
    }

    private _page(name: string): Node {
        let node = this.node.getChildByName(name);
        if (!node) {
            node = this._ui(name, DESIGN.w, DESIGN.h);
            this.node.addChild(node);
            this._pin(node, { top: 0, bottom: 0, left: 0, right: 0 });
        }
        if (!node.getComponent(UIOpacity)) {
            node.addComponent(UIOpacity);
        }
        return node;
    }

    private _show(phase: Phase): void {
        if (phase === 'home') {
            if (this.phase === 'loading' || this.phase === 'toHome' || !this.homeReady) {
                this._leaveLoadingToHome();
                return;
            }
            this._enterHome();
            return;
        }
        if (phase === 'game') {
            if (this.phase === 'home') {
                this._leaveHomeToGame();
                return;
            }
            this._enterGame();
            return;
        }
        this.phase = 'result';
        this._setActive(this.loading, false);
        this._setActive(this.home, false);
        this._setActive(this.game, true);
        this._setActive(this.result, true);
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
        if (this.phase !== 'home') {
            return;
        }
        this._setActive(this.home, false);
        this._setActive(this.backdrop, false);
        this._enterGamePlay();
    }

    private _enterGame(): void {
        this._setActive(this.loading, false);
        this._setActive(this.home, false);
        this._setActive(this.backdrop, false);
        this._setOpacity(this.backdrop, 0);
        this._enterGamePlay();
    }

    private _enterGamePlay(): void {
        this.phase = 'game';
        if (!this.game?.isValid) {
            this.game = this._page('Game');
            this._buildGame();
        }
        if (!this.result?.isValid) {
            this.result = this._page('Result');
            this._buildResult();
        }
        this._setActive(this.game, true);
        this._setActive(this.result, false);
        this._setOpacity(this.game, 255);
        this._startRun();
    }

    private _startRun(): void {
        this.model.reset();
        this.ballPos.x = 0;
        this.ballPos.y = 0;
        this.facing.x = 0;
        this.facing.y = 1;
        this._ensureActors();
        this._refreshHud();
        void this._bootMap();
    }

    private _ensureActors(): void {
        if (!this.world?.isValid) {
            this._buildGame();
        }
        if (!this.world?.isValid) {
            return;
        }
        if (!this.ball?.isValid) {
            this.ball = this._dot('MudBall', new Color(92, 58, 36), 46);
            this.world.addChild(this.ball);
        }
        if (!this.beetle?.isValid) {
            this.beetle = this._dot('Beetle', new Color(36, 28, 20), 22);
            this.world.addChild(this.beetle);
        }
        this.ball.setSiblingIndex(this.world.children.length - 1);
        this.beetle.setSiblingIndex(this.world.children.length - 1);
        this.ball.setPosition(0, 0, 0);
        this.beetle.setPosition(0, -58, 0);
    }

    private async _bootMap(): Promise<void> {
        if (!this.world?.isValid) {
            this._buildGame();
        }
        if (!this.world?.isValid) {
            console.warn('[GameApp] map skipped: no World');
            return;
        }
        let terrain = this.world.getChildByName('Terrain');
        if (!terrain) {
            terrain = this._ui('Terrain', DESIGN.w, DESIGN.h);
            this.world.addChild(terrain);
            terrain.setSiblingIndex(0);
        }
        this.map = terrain.getComponent(MapStreamer) ?? terrain.addComponent(MapStreamer);
        try {
            await this.map.setup();
            this.map.reset(Date.now() & 0x7fffffff);
            this._ensureActors();
        } catch (err) {
            console.warn('[GameApp] map', err);
        }
    }

    private _tickGame(dt: number): void {
        const stick = this.joystick ? this.joystick.direction : new Vec2();
        this.move.set(stick.x + this.keyDir.x, stick.y + this.keyDir.y);
        if (this.move.lengthSqr() > 1) {
            this.move.normalize();
        }
        if (this.move.lengthSqr() < 0.0004) {
            this.move.set(0, 0.35);
        }
        const weightSlow = 1 - this.model.weight * 0.004;
        const speed = 240 * Math.max(0.55, weightSlow);
        const half = this.map?.pathHalfWidth ?? 210;
        this.ballPos.x = this._clamp(this.ballPos.x + this.move.x * speed * dt, -half, half);
        this.ballPos.y += Math.max(40, this.move.y * speed) * dt;
        const len = Math.hypot(this.move.x, this.move.y) || 1;
        this.facing.x = this.move.x / len;
        this.facing.y = this.move.y / len;
        this.model.addDistance((Math.max(40, this.move.y * speed) * dt) / 72);
        this.ball.setPosition(this.ballPos.x, this.ballPos.y, 0);
        this.beetle.setPosition(
            this.ballPos.x - this.facing.x * 58,
            this.ballPos.y - this.facing.y * 58,
            0,
        );
        this.world.setPosition(-this.ballPos.x * 0.15, -this.ballPos.y - 100, 0);
        this.map?.tick(this.ballPos.y);
        this._collideMap();
        this._refreshHud();
        if (this.model.isDead) {
            this._openResult();
        }
    }

    private _collideMap(): void {
        if (!this.map) {
            return;
        }
        for (const item of this.map.collect(this.ballPos.x, this.ballPos.y, 42)) {
            item.consume();
            if (item.kind === 'coin') {
                this.model.addGold(item.radius >= 22 ? 12 : 5);
            } else if (item.kind === 'mud') {
                this.model.addMud(6);
            } else if (item.kind === 'life') {
                this.model.addLife(1);
            } else if (this.model.hitObstacle()) {
                this._openResult();
            }
        }
    }

    private _openResult(): void {
        if (this.resultBody) {
            this.resultBody.string =
                `行进距离  ${this.model.distance.toFixed(1)} m\n` +
                `金币      ${formatCompactAmount(this.model.gold)}\n` +
                `泥球重量  ${this.model.weightPercent}%`;
        }
        this._show('result');
    }

    private _refreshHud(): void {
        if (this.hudGold) this.hudGold.string = formatCompactAmount(this.model.gold);
        if (this.hudDistance) this.hudDistance.string = `${this.model.distance.toFixed(0)}m`;
        if (this.hudWeight) this.hudWeight.string = `${this.model.weightPercent}%`;
        if (this.hudLives) this.hudLives.string = '生命 '.concat('♥'.repeat(this.model.lives) || '—');
    }

    private _onKeyDown(event: { keyCode: KeyCode }): void {
        this._setKey(event.keyCode, 1);
    }

    private _onKeyUp(event: { keyCode: KeyCode }): void {
        this._setKey(event.keyCode, 0);
    }

    private _setKey(key: KeyCode, value: number): void {
        if (key === KeyCode.KEY_A || key === KeyCode.ARROW_LEFT) this.keyDir.x = -value;
        if (key === KeyCode.KEY_D || key === KeyCode.ARROW_RIGHT) this.keyDir.x = value;
        if (key === KeyCode.KEY_W || key === KeyCode.ARROW_UP) this.keyDir.y = value;
        if (key === KeyCode.KEY_S || key === KeyCode.ARROW_DOWN) this.keyDir.y = -value;
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

    private _buildGame(): void {
        if (!this.game?.isValid) {
            this.game = this._page('Game');
        }
        if (!this.world) {
            this.world = this.game.getChildByName('World') || this._ui('World', DESIGN.w, DESIGN.h);
            if (!this.world.parent) {
                this.game.addChild(this.world);
            }
        }
        if (this.game.getChildByName('HUD')) {
            this.hudGold = this.game.getChildByName('HUD')?.getChildByName('Gold')?.getComponent(Label) ?? null;
            this.hudDistance = this.game.getChildByName('HUD')?.getChildByName('Distance')?.getComponent(Label) ?? null;
            this.hudWeight = this.game.getChildByName('HUD')?.getChildByName('Weight')?.getComponent(Label) ?? null;
            this.hudLives = this.game.getChildByName('HUD')?.getChildByName('Lives')?.getComponent(Label) ?? null;
            this._applyFonts(this.game);
            const stick = this.game.getChildByName('Joystick');
            this.joystick = stick?.getComponent(Joystick) ?? null;
            return;
        }
        const hud = this._ui('HUD', 720, 110);
        this._fill(hud, new Color(245, 230, 200, 210));
        this.game.addChild(hud);
        this._pin(hud, { top: 16 });
        this.hudGold = this._hudText(hud, 'Gold', '0', -240, 18);
        this.hudDistance = this._hudText(hud, 'Distance', '0m', -40, 18);
        this.hudWeight = this._hudText(hud, 'Weight', '12%', 160, 18);
        this.hudLives = this._hudText(hud, 'Lives', '生命 ♥♥♥', 0, -22);
        const finish = this._label('Finish', '结束', 28, new Color(90, 58, 28));
        finish.on(Node.EventType.TOUCH_END, () => this._openResult(), this);
        this.game.addChild(finish);
        this._pin(finish, { top: 28, right: 24 });
        const stick = this._ui('Joystick', 200, 200);
        this._fill(stick, new Color(107, 63, 31, 150));
        const knob = this._ui('Knob', 86, 86);
        this._fill(knob, new Color(232, 185, 35, 230));
        stick.addChild(knob);
        this.game.addChild(stick);
        this._pin(stick, { left: 36, bottom: 36 });
        this.joystick = stick.addComponent(Joystick);
    }

    private _buildResult(): void {
        if (!this.result?.isValid) {
            this.result = this._page('Result');
        }
        if (this.result.getChildByName('Panel')) {
            this.resultBody = this.result.getChildByName('Panel')?.getChildByName('Body')?.getComponent(Label) ?? null;
            this._applyFonts(this.result);
            return;
        }
        this._fill(this.result, new Color(48, 28, 14, 180));
        const panel = this._ui('Panel', 560, 520);
        this._fill(panel, new Color(245, 230, 200));
        this.result.addChild(panel);
        const title = this._label('Title', '本局结算', 46, new Color(154, 106, 32), 400);
        title.setPosition(0, 190, 0);
        panel.addChild(title);
        const body = this._label('Body', '', 30, new Color(90, 58, 28));
        body.setPosition(0, 40, 0);
        panel.addChild(body);
        this.resultBody = body.getComponent(Label);
        const again = this._label('Again', '再推一次', 32, new Color(90, 58, 28));
        again.setPosition(0, -120, 0);
        again.on(Node.EventType.TOUCH_END, () => this._show('game'), this);
        panel.addChild(again);
        const back = this._label('Back', '回首页', 28, new Color(107, 63, 31));
        back.setPosition(0, -190, 0);
        back.on(Node.EventType.TOUCH_END, () => this._show('home'), this);
        panel.addChild(back);
    }

    private _hudText(parent: Node, name: string, text: string, x: number, y: number): Label {
        const node = this._label(name, text, 24, new Color(90, 58, 28));
        node.setPosition(x, y, 0);
        parent.addChild(node);
        return node.getComponent(Label)!;
    }

    private _ui(name: string, w: number, h: number): Node {
        const node = new Node(name);
        node.layer = this.node.layer;
        const transform = node.addComponent(UITransform);
        transform.setContentSize(w, h);
        return node;
    }

    private _fill(node: Node, color: Color): void {
        let g = node.getComponent(Graphics);
        if (!g) g = node.addComponent(Graphics);
        const t = node.getComponent(UITransform)!;
        g.clear();
        g.fillColor = color;
        g.rect(-t.width / 2, -t.height / 2, t.width, t.height);
        g.fill();
    }

    private _dot(name: string, color: Color, radius: number): Node {
        const node = this._ui(name, radius * 2, radius * 2);
        const g = node.addComponent(Graphics);
        g.fillColor = color;
        g.circle(0, 0, radius);
        g.fill();
        return node;
    }

    private _label(name: string, text: string, size: number, color: Color, width = 280): Node {
        const node = this._ui(name, width, size + 28);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 16;
        label.color = color;
        label.overflow = Label.Overflow.NONE;
        label.enableWrapText = false;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        this._paintFont(label);
        return node;
    }

    private _lockPortrait(): void {
        view.setDesignResolutionSize(DESIGN.w, DESIGN.h, ResolutionPolicy.SHOW_ALL);
        view.resizeWithBrowserSize(true);
    }

    private _pin(node: Node | null, edges: { top?: number; bottom?: number; left?: number; right?: number; cx?: number }): void {
        if (!node) {
            return;
        }
        const widget = node.getComponent(Widget) || node.addComponent(Widget);
        widget.isAlignTop = edges.top !== undefined;
        widget.isAlignBottom = edges.bottom !== undefined;
        widget.isAlignLeft = edges.left !== undefined;
        widget.isAlignRight = edges.right !== undefined;
        widget.isAlignHorizontalCenter = edges.cx !== undefined || (edges.left === undefined && edges.right === undefined);
        widget.isAlignVerticalCenter = edges.top === undefined && edges.bottom === undefined;
        if (edges.top !== undefined) widget.top = edges.top;
        if (edges.bottom !== undefined) widget.bottom = edges.bottom;
        if (edges.left !== undefined) widget.left = edges.left;
        if (edges.right !== undefined) widget.right = edges.right;
        if (edges.cx !== undefined) widget.horizontalCenter = edges.cx;
        widget.alignMode = Widget.AlignMode.ALWAYS;
        widget.updateAlignment();
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

    private _clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}
