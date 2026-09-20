import {
    _decorator,
    Color,
    Component,
    Enum,
    EventTouch,
    Graphics,
    Node,
    Sprite,
    SpriteFrame,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
    tween,
} from 'cc';
import {
    AVATAR_FPS,
    AvatarExpression,
    AvatarPlayMode,
    AvatarState,
    DEFAULT_AVATAR_SKIN_ID,
    SkinAnimationData,
    randRange,
} from './AvatarSkinData';
import { AvatarSkinManager } from './AvatarSkinManager';

const { ccclass, property, menu } = _decorator;

const IDLE_SCALE = new Vec3(1, 1, 1);
const IDLE_POS = new Vec3(0, 0, 0);
const BREATH_SCALE = new Vec3(1.015, 0.985, 1);
const BREATH_POS = new Vec3(0, 1.6, 0);
const BLOW_SCALE = new Vec3(1.03, 0.98, 1);
const CLICK_SQUASH = new Vec3(1.12, 0.86, 1);
const CLICK_STRETCH = new Vec3(0.92, 1.1, 1);
const CLICK_SETTLE = new Vec3(1.04, 0.98, 1);
const STAR_SCALE = new Vec3(1.05, 1.05, 1);
const STAR_START = new Vec3(0, 18, 0);
const STAR_ENDS = [
    new Vec3(46, 32, 0),
    new Vec3(25, 58, 0),
    new Vec3(-9, 58, 0),
    new Vec3(-44, 36, 0),
    new Vec3(-32, -4, 0),
    new Vec3(35, -2, 0),
];

class SpriteFramePlayer {
    sprite: Sprite | null = null;
    private _frames: SpriteFrame[] = [];
    private _fps = 8;
    private _loop = false;
    private _playing = false;
    private _index = 0;
    private _acc = 0;
    private _onComplete: (() => void) | null = null;
    private _idle: SpriteFrame | null = null;

    get playing(): boolean {
        return this._playing;
    }

    bind(sprite: Sprite | null): void {
        this.sprite = sprite;
    }

    setIdle(frame: SpriteFrame | null): void {
        this._idle = frame;
    }

    play(frames: SpriteFrame[], fps: number, loop: boolean, onComplete?: () => void): void {
        if (!this.sprite || !frames || frames.length === 0) {
            onComplete?.();
            return;
        }
        this._frames = frames;
        this._fps = Math.max(1, fps);
        this._loop = loop;
        this._onComplete = onComplete ?? null;
        this._index = 0;
        this._acc = 0;
        this._playing = true;
        this.sprite.spriteFrame = frames[0];
    }

    stop(restoreIdle = false): void {
        this._playing = false;
        this._onComplete = null;
        this._acc = 0;
        this._index = 0;
        if (restoreIdle) {
            this.showIdle();
        }
    }

    showIdle(): void {
        if (this.sprite && this._idle) {
            this.sprite.spriteFrame = this._idle;
        }
    }

    tick(dt: number): void {
        if (!this._playing || !this.sprite) {
            return;
        }
        this._acc += dt;
        const step = 1 / this._fps;
        if (this._acc < step) {
            return;
        }
        this._acc -= step;
        this._index += 1;
        if (this._index < this._frames.length) {
            this.sprite.spriteFrame = this._frames[this._index];
            return;
        }
        if (this._loop) {
            this._index = 0;
            this.sprite.spriteFrame = this._frames[0];
            return;
        }
        this._playing = false;
        const last = this._frames[this._frames.length - 1];
        if (this._idle && last !== this._idle) {
            this.showIdle();
        }
        const done = this._onComplete;
        this._onComplete = null;
        done?.();
    }
}

@ccclass('AvatarAnimator')
@menu('泥球大侠/AvatarAnimator')
export class AvatarAnimator extends Component {
    @property({ displayName: '皮肤 ID' })
    skinId = DEFAULT_AVATAR_SKIN_ID;

    @property({ type: Enum(AvatarPlayMode), displayName: '播放模式' })
    playMode = AvatarPlayMode.Full;

    @property({ displayName: '允许点击' })
    clickEnabled = true;

    @property({ type: SpriteFrame, displayName: '整表 SpriteSheet（可选）' })
    sheetOverride: SpriteFrame | null = null;

    @property({ type: [SpriteFrame], displayName: 'Idle 帧（可选）' })
    idleFrames: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: 'Bubble 帧（可选）' })
    bubbleFrames: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: 'Sway 帧（可选）' })
    swayFrames: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: 'Blink 帧（可选）' })
    blinkFrames: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: 'Happy 帧（可选）' })
    happyFrames: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: 'Click 帧（可选）' })
    clickFrames: SpriteFrame[] = [];

    characterRoot: Node | null = null;
    characterSprite: Node | null = null;
    bubbleFX: Node | null = null;
    clickFX: Node | null = null;
    shadow: Node | null = null;
    avatarFrame: Node | null = null;

    private readonly _player = new SpriteFramePlayer();
    private readonly _starNodes: Node[] = [];
    private _skin: SkinAnimationData | null = null;
    private _state = AvatarState.Idle;
    private _alive = false;
    private _hatSway = 1.5;
    private _breathing = false;

    onLoad(): void {
        this._ensureTree();
        this._player.bind(this.characterSprite?.getComponent(Sprite) ?? null);
        if (this.sheetOverride) {
            AvatarSkinManager.instance.bindSheet(this.sheetOverride);
        }
    }

    onEnable(): void {
        this._alive = true;
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        if (this._skin) {
            this._resumeIdle();
            return;
        }
        this._boot();
    }

    onDisable(): void {
        this._alive = false;
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this._teardown();
    }

    onDestroy(): void {
        this._alive = false;
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this._teardown();
        this._skin = null;
    }

    update(dt: number): void {
        this._player.tick(dt);
    }

    setPlayMode(mode: AvatarPlayMode): void {
        this.playMode = mode;
        this.clickEnabled = mode === AvatarPlayMode.Full;
        if (this._alive && this._skin && this._state !== AvatarState.Click) {
            this._resumeIdle();
        }
    }

    setSkin(id: string): void {
        this.skinId = id;
        if (!this._alive) {
            return;
        }
        this._boot();
    }

    playClick(): void {
        if (!this.clickEnabled || this.playMode !== AvatarPlayMode.Full) {
            return;
        }
        if (this._state === AvatarState.Click || !this._skin) {
            return;
        }
        this._enter(AvatarState.Click);
        this._playStars();
        this._playClickTween();
        this._player.play(this._skin.clickFrames, AVATAR_FPS.click, false, () => this._finishClick());
    }

    private _boot(): void {
        const apply = (): void => {
            if (!this._alive) {
                return;
            }
            const data = this._mergeSkin(AvatarSkinManager.instance.get(this.skinId));
            if (!data || data.idleFrames.length === 0) {
                return;
            }
            this._teardown();
            this._skin = data;
            this._hatSway = data.hatSwayMax ?? 1.5;
            this._player.setIdle(data.idleFrames[0]);
            this._fitSprite(data.idleFrames[0]);
            this._player.showIdle();
            if (this.bubbleFX) {
                this.bubbleFX.active = !data.bubbleInSheet;
            }
            this._resumeIdle();
        };
        if (this.sheetOverride && !AvatarSkinManager.instance.ready) {
            AvatarSkinManager.instance.bindSheet(this.sheetOverride);
        }
        if (AvatarSkinManager.instance.ready || this._hasOverrideFrames()) {
            apply();
            return;
        }
        AvatarSkinManager.instance.load((ok) => {
            if (ok) {
                apply();
            }
        });
    }

    private _mergeSkin(base: SkinAnimationData | null): SkinAnimationData | null {
        if (!base && !this._hasOverrideFrames()) {
            return null;
        }
        return {
            id: this.skinId,
            idleFrames: this.idleFrames.length ? this.idleFrames : base?.idleFrames ?? [],
            bubbleFrames: this.bubbleFrames.length ? this.bubbleFrames : base?.bubbleFrames ?? [],
            swayFrames: this.swayFrames.length ? this.swayFrames : base?.swayFrames,
            blinkFrames: this.blinkFrames.length ? this.blinkFrames : base?.blinkFrames ?? [],
            happyFrames: this.happyFrames.length ? this.happyFrames : base?.happyFrames,
            surprisedFrames: base?.surprisedFrames,
            angryFrames: base?.angryFrames,
            clickFrames: this.clickFrames.length ? this.clickFrames : base?.clickFrames ?? [],
            hatSwayMax: base?.hatSwayMax,
            bubbleInSheet: base?.bubbleInSheet ?? true,
        };
    }

    private _hasOverrideFrames(): boolean {
        return this.idleFrames.length > 0;
    }

    private _fitSprite(frame: SpriteFrame): void {
        if (!this.characterSprite) {
            return;
        }
        const transform = this.characterSprite.getComponent(UITransform);
        if (!transform) {
            return;
        }
        const srcW = Math.max(1, frame.rect.width);
        const srcH = Math.max(1, frame.rect.height);
        const displayH = 132;
        transform.setContentSize(Math.round(displayH * srcW / srcH), displayH);
    }

    private _resumeIdle(): void {
        this._state = AvatarState.Idle;
        this._player.stop(true);
        this._startBreath();
        this._easeRootHome();
        this._scheduleIdleAction();
    }

    private _scheduleIdleAction(): void {
        this.unschedule(this._rollIdleAction);
        if (!this._alive) {
            return;
        }
        this.scheduleOnce(this._rollIdleAction, randRange(2, 4));
    }

    private _rollIdleAction(): void {
        if (!this._alive || this._state === AvatarState.Click) {
            return;
        }
        if (this.playMode === AvatarPlayMode.Lite) {
            this._playBlink();
            return;
        }
        const roll = Math.random();
        if (roll < 0.5) {
            this._playBlink();
            return;
        }
        if (roll < 0.8) {
            this._playBubble();
            return;
        }
        if (roll < 0.95) {
            this._playSway();
            return;
        }
        this._playExpression();
    }

    private _playBlink(): void {
        const frames = this._skin?.blinkFrames;
        if (!frames || frames.length === 0) {
            this._scheduleIdleAction();
            return;
        }
        this._enter(AvatarState.Blink, false);
        this._player.play(frames, AVATAR_FPS.blink, false, () => this._backToIdle());
    }

    private _playBubble(): void {
        const frames = this._skin?.bubbleFrames;
        if (!frames || frames.length === 0) {
            this._scheduleIdleAction();
            return;
        }
        this._enter(AvatarState.Bubble, false);
        const root = this.characterRoot;
        if (root) {
            Tween.stopAllByTarget(root);
            tween(root)
                .to(0.22, { scale: BLOW_SCALE }, { easing: 'sineOut' })
                .to(0.28, { scale: IDLE_SCALE }, { easing: 'sineInOut' })
                .start();
        }
        this._player.play(frames, AVATAR_FPS.bubble, false, () => this._backToIdle());
    }

    private _playSway(): void {
        this._enter(AvatarState.Idle, false);
        const root = this.characterRoot;
        const amp = this._hatSway;
        const duration = randRange(1.2, 1.8);
        if (root) {
            Tween.stopAllByTarget(root);
            tween(root)
                .to(duration * 0.34, { angle: -amp }, { easing: 'sineInOut' })
                .to(duration * 0.4, { angle: amp }, { easing: 'sineInOut' })
                .to(duration * 0.26, { angle: 0 }, { easing: 'sineInOut' })
                .start();
        }
        const frames = this._skin?.swayFrames;
        if (frames && frames.length > 0) {
            this._player.play(frames, AVATAR_FPS.sway, false, () => this._scheduleIdleAction());
            return;
        }
        this.scheduleOnce(this._scheduleIdleAction, duration);
    }

    private _playExpression(): void {
        const kind = this._pickExpression();
        const frames = kind ? this._expressionFrames(kind) : null;
        if (!frames || frames.length === 0) {
            this._playBlink();
            return;
        }
        this._enter(AvatarState.Expression, false);
        this._player.play(frames, AVATAR_FPS.expression, false, () => this._backToIdle());
    }

    private _pickExpression(): AvatarExpression | null {
        const options: AvatarExpression[] = [];
        if (this._skin?.happyFrames?.length) {
            options.push('happy');
        }
        if (this._skin?.surprisedFrames?.length) {
            options.push('surprised');
        }
        if (this._skin?.angryFrames?.length) {
            options.push('angry');
        }
        if (options.length === 0) {
            return null;
        }
        return options[(Math.random() * options.length) | 0];
    }

    private _expressionFrames(kind: AvatarExpression): SpriteFrame[] | undefined {
        if (kind === 'happy') {
            return this._skin?.happyFrames;
        }
        if (kind === 'surprised') {
            return this._skin?.surprisedFrames;
        }
        return this._skin?.angryFrames;
    }

    private _playClickTween(): void {
        const root = this.characterRoot;
        if (!root) {
            return;
        }
        Tween.stopAllByTarget(root);
        tween(root)
            .to(0.08, { scale: CLICK_SQUASH, angle: -6 }, { easing: 'quadOut' })
            .to(0.1, { scale: CLICK_STRETCH, angle: 5 }, { easing: 'quadInOut' })
            .to(0.1, { scale: CLICK_SETTLE, angle: -2 }, { easing: 'quadInOut' })
            .to(0.12, { scale: IDLE_SCALE, angle: 0 }, { easing: 'sineOut' })
            .start();
    }

    private _finishClick(): void {
        if (!this._alive) {
            return;
        }
        this._resumeIdle();
    }

    private _backToIdle(): void {
        if (!this._alive || this._state === AvatarState.Click) {
            return;
        }
        this._state = AvatarState.Idle;
        this._easeRootHome();
        this._startBreath();
        this._scheduleIdleAction();
    }

    private _enter(next: AvatarState, stopRoot = true): void {
        this.unschedule(this._rollIdleAction);
        this.unschedule(this._scheduleIdleAction);
        this._state = next;
        if (stopRoot && this.characterRoot) {
            Tween.stopAllByTarget(this.characterRoot);
        }
    }

    private _startBreath(): void {
        const body = this.characterSprite;
        if (!body || this._breathing) {
            return;
        }
        this._breathing = true;
        const duration = randRange(1.6, 2);
        tween(body)
            .to(duration * 0.5, { scale: BREATH_SCALE, position: BREATH_POS }, { easing: 'sineInOut' })
            .to(duration * 0.5, { scale: IDLE_SCALE, position: IDLE_POS }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    private _easeRootHome(): void {
        const root = this.characterRoot;
        if (!root) {
            return;
        }
        Tween.stopAllByTarget(root);
        tween(root)
            .to(0.18, { scale: IDLE_SCALE, position: IDLE_POS, angle: 0 }, { easing: 'sineOut' })
            .start();
    }

    private _stopMotionTweens(): void {
        if (this.characterRoot) {
            Tween.stopAllByTarget(this.characterRoot);
        }
        if (this.characterSprite) {
            Tween.stopAllByTarget(this.characterSprite);
        }
        this._breathing = false;
        for (let i = 0; i < this._starNodes.length; i++) {
            Tween.stopAllByTarget(this._starNodes[i]);
        }
    }

    private _resetPose(): void {
        const root = this.characterRoot;
        if (root) {
            root.setScale(IDLE_SCALE);
            root.setPosition(IDLE_POS);
            root.angle = 0;
        }
        const body = this.characterSprite;
        if (body) {
            body.setScale(IDLE_SCALE);
            body.setPosition(IDLE_POS);
        }
    }

    private _teardown(): void {
        this.unscheduleAllCallbacks();
        this._player.stop(false);
        this._state = AvatarState.Idle;
        this._stopMotionTweens();
        this._resetPose();
        this._hideStars();
    }

    private _onTouchEnd(event: EventTouch): void {
        event.propagationStopped = true;
        this.playClick();
    }

    private _ensureTree(): void {
        this.characterRoot = this._child(this.node, 'CharacterRoot', 136, 136);
        this.characterSprite = this._child(this.characterRoot, 'CharacterSprite', 120, 128);
        const sprite = this.characterSprite.getComponent(Sprite) || this.characterSprite.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        this.bubbleFX = this._child(this.node, 'BubbleFX', 80, 80);
        this.bubbleFX.active = false;
        this.clickFX = this._child(this.node, 'ClickFX', 160, 160);
        this.shadow = this._child(this.node, 'Shadow', 78, 18);
        this._drawShadow();
        this.avatarFrame = this.node.getChildByName('AvatarFrame');
        const leftoverFill = this.node.getChildByName('PortraitFill');
        if (leftoverFill) {
            leftoverFill.active = false;
        }
        this._stackLayers();
        this._ensureStars();
    }

    private _stackLayers(): void {
        const shade = this.node.getChildByName('Shade');
        const back = [shade, this.shadow, this.characterRoot, this.bubbleFX, this.clickFX, this.avatarFrame];
        for (let i = 0; i < back.length; i++) {
            const node = back[i];
            if (node) {
                node.setSiblingIndex(i);
            }
        }
    }

    private _child(parent: Node, name: string, w: number, h: number): Node {
        let node = parent.getChildByName(name);
        if (!node) {
            node = new Node(name);
            node.layer = parent.layer;
            parent.addChild(node);
        }
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setContentSize(w, h);
        transform.setAnchorPoint(0.5, 0.5);
        return node;
    }

    private _drawShadow(): void {
        if (!this.shadow) {
            return;
        }
        this.shadow.setPosition(0, -52, 0);
        const g = this.shadow.getComponent(Graphics) || this.shadow.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(38, 20, 8, 54);
        g.ellipse(0, 0, 36, 8);
        g.fill();
    }

    private _ensureStars(): void {
        if (!this.clickFX || this._starNodes.length > 0) {
            return;
        }
        for (let i = 0; i < STAR_ENDS.length; i++) {
            const star = new Node(`Star${i}`);
            star.layer = this.clickFX.layer;
            const transform = star.addComponent(UITransform);
            transform.setContentSize(14, 14);
            star.addComponent(UIOpacity);
            const g = star.addComponent(Graphics);
            g.fillColor = new Color(247, 214, 92, 255);
            g.moveTo(0, 6);
            g.lineTo(1.6, 1.6);
            g.lineTo(6, 0);
            g.lineTo(1.6, -1.6);
            g.lineTo(0, -6);
            g.lineTo(-1.6, -1.6);
            g.lineTo(-6, 0);
            g.lineTo(-1.6, 1.6);
            g.close();
            g.fill();
            star.active = false;
            this.clickFX.addChild(star);
            this._starNodes.push(star);
        }
    }

    private _playStars(): void {
        this._ensureStars();
        for (let i = 0; i < this._starNodes.length; i++) {
            const star = this._starNodes[i];
            const opacity = star.getComponent(UIOpacity)!;
            Tween.stopAllByTarget(star);
            Tween.stopAllByTarget(opacity);
            star.active = true;
            star.setPosition(STAR_START);
            star.setScale(0.4, 0.4, 1);
            opacity.opacity = 255;
            tween(star)
                .to(0.28, { position: STAR_ENDS[i], scale: STAR_SCALE }, { easing: 'quadOut' })
                .start();
            tween(opacity)
                .delay(0.12)
                .to(0.2, { opacity: 0 }, { easing: 'quadIn' })
                .call(() => {
                    star.active = false;
                })
                .start();
        }
    }

    private _hideStars(): void {
        for (let i = 0; i < this._starNodes.length; i++) {
            const star = this._starNodes[i];
            Tween.stopAllByTarget(star);
            const opacity = star.getComponent(UIOpacity);
            if (opacity) {
                Tween.stopAllByTarget(opacity);
                opacity.opacity = 255;
            }
            star.active = false;
        }
    }
}
