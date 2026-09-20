import {
    _decorator,
    Color,
    Component,
    Font,
    Graphics,
    Input,
    input,
    KeyCode,
    Label,
    Layout,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    Tween,
    tween,
    UIOpacity,
    UITransform,
    Vec2,
    view,
    ResolutionPolicy,
    Widget,
} from 'cc';
import { GameModel } from '../core/GameModel';
import { resolveSkin } from '../core/Skin';
import { Joystick } from '../ui/Joystick';

const { ccclass } = _decorator;

type Phase = 'loading' | 'toHome' | 'home' | 'game' | 'result';

const ART = {
    bgLoading: 'ui/bg-loading/spriteFrame',
    bgHome: 'ui/bg-home/spriteFrame',
    title: 'ui/sign-title/spriteFrame',
    beetle: 'ui/beetle-roll/spriteFrame',
    progress: 'ui/panel-progress/spriteFrame',
    plaque: 'ui/home-plaque/spriteFrame',
    gold: 'ui/home-board-gold/spriteFrame',
    frame: 'ui/home-frame-portrait/spriteFrame',
    start: 'ui/home-btn-start/spriteFrame',
    homeTitle: 'ui/home-sign-title/spriteFrame',
    decorLeft: 'ui/home-decor-left/spriteFrame',
    decorRight: 'ui/home-decor-right/spriteFrame',
    cactus: 'ui/home-prop-cactus/spriteFrame',
    skull: 'ui/home-prop-skull/spriteFrame',
    rockLg: 'ui/home-prop-rock-lg/spriteFrame',
    rockSm: 'ui/home-prop-rock-sm/spriteFrame',
    tumbleweed: 'ui/home-prop-tumbleweed/spriteFrame',
    sage: 'ui/home-prop-sage/spriteFrame',
} as const;
/** 全局只用马善政楷书，OFL 可商用裁切子集。 */
const FONT = 'fonts/title-hero';
const GAME_TITLE = '泥球大侠';
const DESIGN = { w: 750, h: 1334 };

interface WorldItem {
    node: Node;
    kind: 'cactus' | 'coin' | 'mud';
    radius: number;
    taken: boolean;
}

@ccclass('GameApp')
export class GameApp extends Component {
    private readonly model = new GameModel();
    private readonly keyDir = new Vec2();
    private readonly move = new Vec2();

    private phase: Phase = 'loading';
    private backdrop: Node = null!;
    private bgLoading: Node = null!;
    private bgHome: Node = null!;
    private loading: Node = null!;
    private home: Node = null!;
    private game: Node = null!;
    private result: Node = null!;
    private world: Node = null!;
    private ball: Node = null!;
    private beetle: Node = null!;
    private joystick: Joystick | null = null;
    private hudGold: Label | null = null;
    private hudDistance: Label | null = null;
    private hudWeight: Label | null = null;
    private hudLives: Label | null = null;
    private resultBody: Label | null = null;
    private progressBar: Node = null!;
    private progressLabel: Label | null = null;
    private homeGoldLabel: Label | null = null;
    private gameFont: Font | null = null;
    private readonly progressTrackWidth = 500;

    private frames: Partial<Record<keyof typeof ART, SpriteFrame>> = {};
    private loadTimer = 0;
    private spawnY = 420;
    private items: WorldItem[] = [];
    private ballPos = { x: 0, y: 0 };
    private facing = { x: 0, y: 1 };

    onLoad(): void {
        this._lockPortrait();
        view.on('canvas-resize', this._lockPortrait, this);
        this._ensureViews();
        this._loadFonts();
        this._loadArt();
        this._enterLoading();
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
        if (this.phase === 'loading') {
            this.loadTimer += dt;
            const t = Math.min(1, this.loadTimer / 1.6);
            this._setProgress(t);
            if (t >= 1) {
                this._leaveLoadingToHome();
            }
            return;
        }
        if (this.phase !== 'game') {
            return;
        }
        this._tickGame(dt);
    }

    private _show(phase: Phase): void {
        if (phase === 'home') {
            if (this.phase === 'loading' || this.phase === 'toHome') {
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
        this.loading.active = false;
        this.home.active = false;
        this.game.active = true;
        this.result.active = true;
    }

    private _enterLoading(): void {
        this.phase = 'loading';
        this.loadTimer = 0;
        this.backdrop.active = true;
        this.loading.active = true;
        this.home.active = false;
        this.game.active = false;
        this.result.active = false;
        this._setOpacity(this.backdrop, 255);
        this._setOpacity(this.bgLoading, 255);
        this._setOpacity(this.bgHome, 0);
        this._setOpacity(this.loading, 0);
        this._fade(this.loading, 255, 0.35, 0, 'sineOut');
    }

    private _leaveLoadingToHome(): void {
        if (this.phase === 'toHome' || this.phase === 'home') {
            return;
        }
        this.phase = 'toHome';
        this.home.active = true;
        this._setOpacity(this.home, 0);
        this._fade(this.loading, 0, 0.42, 0, 'sineIn', () => {
            this.loading.active = false;
        });
        this._fade(this.bgLoading, 0, 0.72, 0.08, 'sineInOut');
        this._fade(this.bgHome, 255, 0.72, 0.08, 'sineInOut');
        this._fade(this.home, 255, 0.5, 0.32, 'sineOut', () => {
            this.phase = 'home';
        });
    }

    private _enterHome(): void {
        this.phase = 'home';
        this.backdrop.active = true;
        this.loading.active = false;
        this.home.active = true;
        this.game.active = false;
        this.result.active = false;
        this._setOpacity(this.backdrop, 255);
        this._setOpacity(this.bgLoading, 0);
        this._setOpacity(this.bgHome, 255);
        this._setOpacity(this.home, 0);
        this._refreshHomeWallet();
        this._applySkin();
        this._fade(this.home, 255, 0.35, 0, 'sineOut');
    }

    private _leaveHomeToGame(): void {
        if (this.phase !== 'home') {
            return;
        }
        this.phase = 'game';
        this._fade(this.home, 0, 0.28, 0, 'sineIn', () => {
            this.home.active = false;
        });
        this._fade(this.backdrop, 0, 0.28, 0, 'sineIn', () => {
            this.backdrop.active = false;
        });
        this._enterGamePlay();
    }

    private _enterGame(): void {
        this.loading.active = false;
        this.home.active = false;
        this.backdrop.active = false;
        this._setOpacity(this.backdrop, 0);
        this._enterGamePlay();
    }

    private _enterGamePlay(): void {
        this.phase = 'game';
        this.game.active = true;
        this.result.active = false;
        this._setOpacity(this.game, 0);
        this._fade(this.game, 255, 0.32, 0.12, 'sineOut');
        this._startRun();
    }

    private _startRun(): void {
        this.model.reset();
        this.items.forEach((item) => item.node.destroy());
        this.items.length = 0;
        this.ballPos.x = 0;
        this.ballPos.y = 0;
        this.spawnY = 420;
        this.facing.x = 0;
        this.facing.y = 1;
        this.world.removeAllChildren();
        this._paintGround();
        this.ball = this._dot('MudBall', new Color(92, 58, 36), 46);
        this.beetle = this._dot('Beetle', new Color(36, 28, 20), 22);
        this.world.addChild(this.ball);
        this.world.addChild(this.beetle);
        this._refreshHud();
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
        this.ballPos.x = this._clamp(this.ballPos.x + this.move.x * speed * dt, -210, 210);
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
        this.world.setPosition(-this.ballPos.x * 0.15, -this.ballPos.y + 180, 0);
        this._spawnAhead();
        this._collide();
        this._refreshHud();
        if (this.model.isDead) {
            this._openResult();
        }
    }

    private _spawnAhead(): void {
        while (this.spawnY < this.ballPos.y + 1400) {
            const lane = (Math.random() - 0.5) * 360;
            const roll = Math.random();
            const kind: WorldItem['kind'] = roll < 0.45 ? 'cactus' : roll < 0.78 ? 'coin' : 'mud';
            const color = kind === 'cactus'
                ? new Color(46, 92, 48)
                : kind === 'coin'
                    ? new Color(232, 185, 35)
                    : new Color(107, 68, 35);
            const radius = kind === 'cactus' ? 28 : 20;
            const node = this._dot(kind, color, radius);
            node.setPosition(lane, this.spawnY, 0);
            this.world.addChild(node);
            this.items.push({ node, kind, radius, taken: false });
            this.spawnY += 170 + Math.random() * 90;
        }
    }

    private _collide(): void {
        for (const item of this.items) {
            if (item.taken) {
                continue;
            }
            const p = item.node.position;
            const dx = p.x - this.ballPos.x;
            const dy = p.y - this.ballPos.y;
            const hit = item.radius + 42;
            if (dx * dx + dy * dy > hit * hit) {
                continue;
            }
            item.taken = true;
            item.node.active = false;
            if (item.kind === 'coin') {
                this.model.addGold(5);
            } else if (item.kind === 'mud') {
                this.model.addMud(6);
            } else if (this.model.hitObstacle()) {
                this._openResult();
            }
        }
    }

    private _openResult(): void {
        if (this.resultBody) {
            this.resultBody.string =
                `行进距离  ${this.model.distance.toFixed(1)} m\n` +
                `金币      ${this.model.gold}\n` +
                `泥球重量  ${this.model.weightPercent}%`;
        }
        this._show('result');
    }

    private _refreshHud(): void {
        if (this.hudGold) this.hudGold.string = `${this.model.gold}`;
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

    private _loadArt(): void {
        (Object.keys(ART) as Array<keyof typeof ART>).forEach((key) => {
            resources.load(ART[key], SpriteFrame, (err: Error | null, sf: SpriteFrame) => {
                if (err || !sf) {
                    return;
                }
                this.frames[key] = sf;
                this._bindArt(key, sf);
            });
        });
    }

    private _loadFonts(): void {
        resources.load(FONT, Font, (err: Error | null, font: Font) => {
            if (err || !font) {
                return;
            }
            this.gameFont = font;
            this._applyFonts(this.node);
        });
    }

    private _applyFonts(root: Node): void {
        const label = root.getComponent(Label);
        if (label) {
            this._paintFont(label);
        }
        root.children.forEach((child) => this._applyFonts(child));
    }

    private _labelKind(label: Label): 'sign' | 'number' | 'ink' {
        const name = label.node.name;
        if (name === 'GoldText' || name === 'Percent' || name === 'Gold' || name === 'Distance' || name === 'Weight') {
            return 'number';
        }
        if (name.startsWith('IconLabel') || name === 'ShopLabel' || name === 'Main') {
            return 'sign';
        }
        return 'ink';
    }

    private _paintFont(label: Label): void {
        if (!this.gameFont || !label.isValid) {
            return;
        }
        label.useSystemFont = false;
        label.font = this.gameFont;
        const kind = this._labelKind(label);
        if (kind === 'sign') {
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

    private _bindArt(key: keyof typeof ART, sf: SpriteFrame): void {
        if (key === 'bgLoading') {
            this._applySprite(this.bgLoading, sf);
            return;
        }
        if (key === 'bgHome') {
            this._applySprite(this.bgHome, sf);
            return;
        }
        if (key === 'title') {
            this._applySprite(this._find(this.loading, 'TitleSign'), sf);
            return;
        }
        if (key === 'plaque') {
            ['Icon0', 'Icon1', 'Icon2', 'Icon3', 'Shop'].forEach((name) => {
                this._applySprite(this._find(this.home, name), sf);
            });
            return;
        }
        const map: Partial<Record<keyof typeof ART, [Node, string]>> = {
            beetle: [this.loading, 'Beetle'],
            progress: [this.loading, 'ProgressPanel'],
            gold: [this.home, 'GoldBoard'],
            frame: [this.home, 'PortraitFrame'],
            start: [this.home, 'StartBtn'],
            homeTitle: [this.home, 'HomeTitle'],
            decorLeft: [this.home, 'DecorLeft'],
            decorRight: [this.home, 'DecorRight'],
            cactus: [this.home, 'Cactus'],
            skull: [this.home, 'Skull'],
            rockLg: [this.home, 'RockLg'],
            rockSm: [this.home, 'RockSm'],
            tumbleweed: [this.home, 'Tumbleweed'],
            sage: [this.home, 'Sage'],
        };
        const pair = map[key];
        if (pair) {
            this._applySprite(this._find(pair[0], pair[1]), sf);
        }
    }

    private _applySprite(node: Node | null, sf: SpriteFrame): void {
        if (!node) return;
        const body = node.getComponent(Sprite) ? node : this._find(node, 'Body') ?? node;
        const sprite = body.getComponent(Sprite);
        if (sprite) {
            sprite.spriteFrame = sf;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        const graphics = body.getComponent(Graphics);
        if (graphics) {
            graphics.clear();
            graphics.enabled = false;
        }
    }

    private _ensureViews(): void {
        this.backdrop = this._view('Backdrop');
        this.bgLoading = this._makeBg(this.backdrop, 'LoadingBg');
        this.bgHome = this._makeBg(this.backdrop, 'HomeBg');
        this.loading = this._view('Loading');
        this.home = this._view('Home');
        this.game = this._view('Game');
        this.result = this._view('Result');
        this.backdrop.setSiblingIndex(0);
        this.loading.setSiblingIndex(1);
        this.home.setSiblingIndex(2);
        this.game.setSiblingIndex(3);
        this.result.setSiblingIndex(4);
        this._wipe(this.loading);
        this._wipe(this.home);
        this._buildLoading();
        this._buildHome();
        this._buildGame();
        this._buildResult();
    }

    private _view(name: string): Node {
        let node = this.node.getChildByName(name);
        if (!node) {
            node = this._ui(name, DESIGN.w, DESIGN.h);
            this.node.addChild(node);
        }
        if (!node.getComponent(UIOpacity)) {
            node.addComponent(UIOpacity);
        }
        this._pin(node, { top: 0, bottom: 0, left: 0, right: 0 });
        return node;
    }

    private _makeBg(parent: Node, name: string): Node {
        let bg = parent.getChildByName(name);
        if (!bg) {
            bg = this._ui(name, DESIGN.w, DESIGN.h);
            parent.addChild(bg);
        }
        const sprite = bg.getComponent(Sprite) || bg.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = Color.WHITE;
        if (!sprite.spriteFrame) {
            this._fill(bg, new Color(198, 149, 82));
        }
        if (!bg.getComponent(UIOpacity)) {
            bg.addComponent(UIOpacity);
        }
        this._pin(bg, { top: 0, bottom: 0, left: 0, right: 0 });
        return bg;
    }

    private _wipe(node: Node): void {
        node.removeAllChildren();
    }

    private _buildLoading(): void {
        const bone = new Color(255, 255, 255);
        const ink = new Color(90, 58, 28);

        const header = this._ui('Header', 680, 200);
        this.loading.addChild(header);
        this._pin(header, { top: 36 });
        const title = this._ui('TitleSign', 640, 188);
        title.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        header.addChild(title);
        this._caption(title, GAME_TITLE, bone);

        const hero = this._ui('Hero', 640, 430);
        this.loading.addChild(hero);
        const beetle = this._ui('Beetle', 620, 380);
        beetle.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        hero.addChild(beetle);

        const footer = this._ui('Footer', 700, 220);
        this.loading.addChild(footer);
        this._pin(footer, { bottom: 28 });
        const panel = this._ui('ProgressPanel', 680, 200);
        panel.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        footer.addChild(panel);
        const tip = this._label('Tip', '正在滚向荒原……', 28, ink, 520);
        tip.setPosition(0, 52, 0);
        panel.addChild(tip);
        const track = this._ui('Track', this.progressTrackWidth, 16);
        track.setPosition(0, 4, 0);
        this._fill(track, new Color(196, 146, 42, 70));
        panel.addChild(track);
        this.progressBar = this._ui('Bar', 12, 14);
        this.progressBar.getComponent(UITransform)!.setAnchorPoint(0, 0.5);
        this.progressBar.setPosition(-this.progressTrackWidth / 2, 0, 0);
        track.addChild(this.progressBar);
        const percent = this._label('Percent', '0%', 28, ink, 160);
        percent.setPosition(0, -50, 0);
        panel.addChild(percent);
        this.progressLabel = percent.getComponent(Label);
        this._setProgress(0);
    }

    private _buildHome(): void {
        const ink = new Color(48, 28, 12);
        const bone = new Color(255, 255, 255);

        const decorL = this._ui('DecorLeft', 248, 454);
        decorL.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        this.home.addChild(decorL);
        this._pin(decorL, { left: -8, bottom: 92 });
        const decorR = this._ui('DecorRight', 236, 288);
        decorR.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        this.home.addChild(decorR);
        this._pin(decorR, { right: -4, bottom: 88 });
        this._prop('Cactus', 112, 230, { right: 18, bottom: 246 });
        this._prop('Sage', 86, 66, { right: 112, bottom: 196 });
        this._prop('Tumbleweed', 96, 70, { left: 28, bottom: 196 });

        const topBar = this._ui('TopBar', DESIGN.w, 148);
        this.home.addChild(topBar);
        topBar.setPosition(0, DESIGN.h / 2 - 60, 0);
        this._pin(topBar, { top: -14, cx: 0 });
        const topLayout = topBar.addComponent(Layout);
        topLayout.type = Layout.Type.HORIZONTAL;
        topLayout.resizeMode = Layout.ResizeMode.NONE;
        topLayout.spacingX = 4;
        topLayout.paddingLeft = 4;
        topLayout.paddingRight = 4;
        topLayout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        ['签到', '属性', '排行榜', '设置'].forEach((text, index) => {
            const plaque = this._board(`Icon${index}`, 182, 148);
            const size = text.length > 2 ? 28 : 34;
            const label = this._label(`IconLabel${index}`, text, size, bone, 168);
            label.setPosition(0, -22, 0);
            plaque.addChild(label);
            topBar.addChild(plaque);
        });
        topLayout.updateLayout();
        this.scheduleOnce(() => topLayout.updateLayout());

        const info = this._ui('InfoRow', 700, 360);
        this.home.addChild(info);
        this._pin(info, { top: 148 });

        const goldBoard = this._board('GoldBoard', 368, 236);
        goldBoard.setPosition(-168, 36, 0);
        const goldText = this._label('GoldText', this._formatWallet(), 52, ink, 220);
        goldText.setPosition(52, 8, 0);
        goldBoard.addChild(goldText);
        this.homeGoldLabel = goldText.getComponent(Label);
        info.addChild(goldBoard);

        const side = this._ui('PortraitCol', 220, 340);
        side.setPosition(208, -4, 0);
        info.addChild(side);

        const shop = this._board('Shop', 196, 128);
        shop.setPosition(0, -58, 0);
        const shopLabel = this._label('ShopLabel', '商店', 34, bone, 168);
        shopLabel.setPosition(0, -20, 0);
        shop.addChild(shopLabel);
        side.addChild(shop);

        const portrait = this._ui('PortraitRoot', 204, 202);
        portrait.setPosition(0, 72, 0);
        this._shade(portrait, 148, 20, -88);
        const fill = this._ui('PortraitFill', 148, 148);
        const fillG = fill.addComponent(Graphics);
        fillG.fillColor = new Color(236, 214, 170);
        fillG.circle(0, 0, 74);
        fillG.fill();
        const face = this._ui('PortraitFace', 136, 136);
        face.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        const frame = this._ui('PortraitFrame', 204, 202);
        frame.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        portrait.addChild(fill);
        portrait.addChild(face);
        portrait.addChild(frame);
        side.addChild(portrait);

        const start = this._board('StartBtn', 388, 384);
        this.home.addChild(start);
        start.setPosition(0, -48, 0);
        start.on(Node.EventType.TOUCH_END, () => this._leaveHomeToGame(), this);

        const bottom = this._ui('Bottom', 700, 196);
        this.home.addChild(bottom);
        this._pin(bottom, { bottom: 10 });
        const title = this._board('HomeTitle', 640, 177);
        const main = this._label('Main', GAME_TITLE, 64, bone, 560);
        main.setPosition(0, 6, 0);
        title.addChild(main);
        bottom.addChild(title);

        this._prop('Skull', 168, 118, { left: 2, bottom: 164 });
        this._prop('RockLg', 126, 84, { left: 20, bottom: 0 });
        this._prop('RockSm', 78, 40, { right: 64, bottom: 2 });

        this._applySkin();
    }

    private _buildGame(): void {
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

    private _paintGround(): void {
        for (let i = -2; i < 28; i++) {
            const sand = this._ui(`Sand${i}`, 900, 220);
            sand.setPosition(0, i * 210, 0);
            this._fill(sand, i % 2 === 0 ? new Color(210, 166, 96) : new Color(196, 149, 82));
            this.world.addChild(sand);
            const path = this._ui(`Path${i}`, 340, 220);
            path.setPosition(0, i * 210, 0);
            this._fill(path, new Color(186, 138, 74));
            this.world.addChild(path);
        }
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

    private _caption(board: Node, title: string, color: Color): void {
        const mainNode = this._label('Main', title, 58, color, 560);
        mainNode.setPosition(0, 4, 0);
        board.addChild(mainNode);
    }

    private _find(root: Node | null, name: string): Node | null {
        if (!root) {
            return null;
        }
        if (root.name === name) {
            return root;
        }
        for (const child of root.children) {
            const hit = this._find(child, name);
            if (hit) {
                return hit;
            }
        }
        return null;
    }

    private _setProgress(t: number): void {
        const ratio = Math.min(1, Math.max(0, t));
        if (this.progressLabel) {
            this.progressLabel.string = `${Math.round(ratio * 100)}%`;
        }
        if (!this.progressBar) {
            return;
        }
        const width = Math.max(12, this.progressTrackWidth * ratio);
        this.progressBar.getComponent(UITransform)!.setContentSize(width, 14);
        this._fill(this.progressBar, new Color(196, 146, 42));
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

    private _setOpacity(node: Node, value: number): void {
        this._opacity(node).opacity = value;
    }

    private _fade(
        node: Node,
        opacity: number,
        duration: number,
        delay: number,
        easing: 'sineIn' | 'sineOut' | 'sineInOut',
        onDone?: () => void,
    ): void {
        const op = this._opacity(node);
        Tween.stopAllByTarget(op);
        const tw = tween(op);
        if (delay > 0) {
            tw.delay(delay);
        }
        tw.to(duration, { opacity }, { easing }).call(() => onDone?.()).start();
    }

    private _clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private _prop(
        name: string,
        w: number,
        h: number,
        edges: { top?: number; bottom?: number; left?: number; right?: number },
    ): Node {
        const node = this._ui(name, w, h);
        node.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        this.home.addChild(node);
        this._pin(node, edges);
        return node;
    }

    private _board(name: string, w: number, h: number): Node {
        const root = this._ui(name, w, h);
        this._shade(root, w * 0.74, Math.max(16, h * 0.11), -h * 0.4);
        const body = this._ui('Body', w, h);
        body.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
        root.addChild(body);
        return root;
    }

    private _shade(parent: Node, w: number, h: number, y: number): void {
        const shade = this._ui('Shade', w, h);
        shade.setPosition(4, y, 0);
        const g = shade.addComponent(Graphics);
        g.fillColor = new Color(38, 20, 8, 62);
        g.ellipse(0, 0, w / 2, h / 2);
        g.fill();
        parent.addChild(shade);
    }

    private _formatWallet(): string {
        return this.model.wallet.toLocaleString('en-US');
    }

    private _refreshHomeWallet(): void {
        if (this.homeGoldLabel) {
            this.homeGoldLabel.string = this._formatWallet();
        }
    }

    private _applySkin(): void {
        const face = this._find(this.home, 'PortraitFace');
        if (!face) {
            return;
        }
        const skin = resolveSkin(this.model.skinId);
        resources.load(skin.portrait, SpriteFrame, (err: Error | null, sf: SpriteFrame) => {
            if (err || !sf) {
                return;
            }
            this._applySprite(face, sf);
        });
    }
}
