import {
    _decorator,
    assetManager,
    Color,
    Component,
    Enum,
    EventTouch,
    Graphics,
    Node,
    Sprite,
    SpriteFrame,
    Tween,
    UITransform,
    tween,
} from 'cc';
import { EDITOR } from 'cc/env';
import {
    AVATAR_POSE,
    AvatarExpression,
    AvatarPartId,
    AvatarPartSet,
    AvatarPlayMode,
    AvatarState,
    DEFAULT_AVATAR_SKIN_ID,
    PartPose,
    randRange,
} from './AvatarSkinData';
import { AvatarSkinManager } from './AvatarSkinManager';

const { ccclass, property, menu, executeInEditMode } = _decorator;

interface Punch {
    squashX: number;
    squashY: number;
    hop: number;
    tilt: number;
}

@ccclass('AvatarAnimator')
@executeInEditMode
@menu('泥球大侠/AvatarAnimator')
export class AvatarAnimator extends Component {
    @property({ displayName: '皮肤 ID' })
    skinId = DEFAULT_AVATAR_SKIN_ID;

    @property({ type: Enum(AvatarPlayMode), displayName: '播放模式' })
    playMode = AvatarPlayMode.Full;

    @property({ displayName: '允许点击' })
    clickEnabled = true;

    @property({ type: SpriteFrame, displayName: '皮肤表' })
    skinsSheet: SpriteFrame | null = null;

    @property({ type: SpriteFrame, displayName: '表情表' })
    facesSheet: SpriteFrame | null = null;

    @property({ type: SpriteFrame, displayName: '部件表（可选）' })
    partsOverride: SpriteFrame | null = null;

    private _editorTried = false;
    private _bundle: AvatarPartSet | null = null;
    private _state = AvatarState.Idle;
    private _alive = false;
    private _ready = false;
    private _idleTime = 0;
    private readonly _punch: Punch = { squashX: 0, squashY: 0, hop: 0, tilt: 0 };

    private rig: Node | null = null;
    private portrait: Node | null = null;
    private face: Node | null = null;
    private eyeL: Node | null = null;
    private eyeR: Node | null = null;
    private browL: Node | null = null;
    private browR: Node | null = null;
    private mouth: Node | null = null;
    private shadow: Node | null = null;
    private avatarFrame: Node | null = null;

    onLoad(): void {
        if (!this.node.isValid) {
            return;
        }
        this._ensureTree();
        this._bindAssignedSheets();
        if (EDITOR) {
            this._alive = true;
            this._boot();
        }
    }

    onEnable(): void {
        this._alive = true;
        this.node.on(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        if (this._ready) {
            this._resumeIdle();
            return;
        }
        this._boot();
    }

    onDisable(): void {
        this._alive = false;
        if (this.node.isValid) {
            this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        }
        this._stopMotion();
    }

    onDestroy(): void {
        this._alive = false;
        if (this.node.isValid) {
            this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        }
        this._stopMotion();
        this._bundle = null;
        this.rig = null;
        this.portrait = null;
        this.face = null;
        this.eyeL = null;
        this.eyeR = null;
        this.browL = null;
        this.browR = null;
        this.mouth = null;
        this.shadow = null;
        this.avatarFrame = null;
    }

    update(dt: number): void {
        if (EDITOR) {
            if (!this._ready && !this._editorTried) {
                this._editorTried = true;
                this._ensureTree();
                this._boot();
            }
            return;
        }
        if (!this._ready || !this._alive) {
            return;
        }
        this._idleTime += dt;
        this._applyIdleBones();
    }

    setPlayMode(mode: AvatarPlayMode): void {
        this.playMode = mode;
        this.clickEnabled = mode === AvatarPlayMode.Full;
        if (this._alive && this._ready && this._state !== AvatarState.Click) {
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
        if (this._state === AvatarState.Click || !this._ready) {
            return;
        }
        this._enter(AvatarState.Click);
        this._setMouth('mouthHappy');
        this._setEyes('eyeHeartL', 'eyeHeartR');
        this._playClickPunch();
    }

    private _boot(): void {
        const apply = (): void => {
            if (!this._alive) {
                return;
            }
            const bundle = AvatarSkinManager.instance.get(this.skinId);
            if (!bundle?.portrait) {
                return;
            }
            this._stopMotion();
            this._bundle = bundle;
            this._bindRig();
            this._ready = true;
            if (EDITOR) {
                this._setIdleFace();
                this._drawShadow();
                return;
            }
            this._resumeIdle();
        };
        this._bindAssignedSheets();
        if (AvatarSkinManager.instance.ready) {
            apply();
            return;
        }
        if (EDITOR) {
            this._loadEditorSheets((ok) => {
                if (ok) {
                    apply();
                }
            });
            return;
        }
        AvatarSkinManager.instance.load((ok) => {
            if (ok) {
                apply();
            }
        });
    }

    private _bindRig(): void {
        const bundle = this._bundle;
        if (!bundle) {
            return;
        }
        this._paint(this.portrait, bundle.portrait, 'portrait');
        this._paint(this.browL, bundle.parts.browL, 'browL');
        this._paint(this.browR, bundle.parts.browR, 'browR');
        this._setIdleFace();
    }

    private _resumeIdle(): void {
        this._state = AvatarState.Idle;
        this._setIdleFace();
        this._resetPunch();
        this._scheduleIdleAction();
    }

    private _scheduleIdleAction(): void {
        this.unschedule(this._rollIdleAction);
        if (!this._alive) {
            return;
        }
        this.scheduleOnce(this._rollIdleAction, randRange(2.1, 4.2));
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
        if (roll < 0.55) {
            this._playBlink();
            return;
        }
        if (roll < 0.8) {
            this._playSway();
            return;
        }
        this._playExpression();
    }

    private _playBlink(): void {
        this._enter(AvatarState.Blink, false);
        this._setEyes('lidHalfL', 'lidHalfR');
        this.scheduleOnce(() => {
            if (!this._alive || this._state === AvatarState.Click) {
                return;
            }
            this._setEyes('lidClosedL', 'lidClosedR');
        }, 0.055);
        this.scheduleOnce(() => {
            if (!this._alive || this._state === AvatarState.Click) {
                return;
            }
            this._setEyes('lidHalfL', 'lidHalfR');
        }, 0.12);
        this.scheduleOnce(() => {
            if (!this._alive || this._state === AvatarState.Click) {
                return;
            }
            this._setIdleFace();
            this._backToIdle();
        }, 0.18);
    }

    private _playSway(): void {
        this._enter(AvatarState.Idle, false);
        tween(this._punch)
            .to(0.38, { tilt: -5 }, { easing: 'sineInOut' })
            .to(0.46, { tilt: 4.5 }, { easing: 'sineInOut' })
            .to(0.32, { tilt: 0 }, { easing: 'sineOut' })
            .start();
        this.scheduleOnce(() => {
            if (this._alive && this._state !== AvatarState.Click) {
                this._scheduleIdleAction();
            }
        }, 1.2);
    }

    private _playExpression(): void {
        const kind = this._pickExpression();
        this._enter(AvatarState.Expression, false);
        if (kind === 'happy') {
            this._setEyes('eyeStarL', 'eyeStarR');
            this._setMouth('mouthHappy');
        } else if (kind === 'surprised') {
            this._setEyes('eyeOpenL', 'eyeOpenR');
            this._setMouth('mouthOh');
        } else {
            this._setEyes('lidClosedL', 'eyeOpenR');
            this._setMouth('mouthGrin');
        }
        this.scheduleOnce(() => {
            if (!this._alive || this._state === AvatarState.Click) {
                return;
            }
            this._setIdleFace();
            this._backToIdle();
        }, 0.85);
    }

    private _pickExpression(): AvatarExpression {
        const options: AvatarExpression[] = ['happy', 'surprised', 'wink'];
        return options[(Math.random() * options.length) | 0];
    }

    private _playClickPunch(): void {
        Tween.stopAllByTarget(this._punch);
        tween(this._punch)
            .to(0.08, { squashX: 0.12, squashY: -0.14, hop: -6, tilt: -6 }, { easing: 'quadOut' })
            .to(0.1, { squashX: -0.08, squashY: 0.12, hop: 14, tilt: 5 }, { easing: 'quadInOut' })
            .to(0.1, { squashX: 0.03, squashY: -0.02, hop: 4, tilt: -2 }, { easing: 'quadInOut' })
            .to(0.14, { squashX: 0, squashY: 0, hop: 0, tilt: 0 }, { easing: 'sineOut' })
            .call(() => this._finishClick())
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
        this._scheduleIdleAction();
    }

    private _enter(next: AvatarState, stopPunch = true): void {
        this.unschedule(this._rollIdleAction);
        this.unschedule(this._scheduleIdleAction);
        this._state = next;
        if (stopPunch) {
            Tween.stopAllByTarget(this._punch);
        }
    }

    private _applyIdleBones(): void {
        const t = this._idleTime;
        const breath = Math.sin(t * 2.15);
        const sway = Math.sin(t * 1.35);
        if (this._isLive(this.portrait)) {
            this.portrait.setScale(1 + breath * 0.02 + this._punch.squashX, 1 - breath * 0.016 + this._punch.squashY, 1);
        }
        if (this._isLive(this.rig)) {
            const rigPose = this._poseOf('rig');
            this.rig.setPosition(rigPose.x, rigPose.y + this._punch.hop, 0);
            this.rig.angle = this._punch.tilt + sway * 1.4;
        }
        if (this._isLive(this.face)) {
            this.face.angle = Math.sin(t * 1.8) * 2;
        }
    }

    private _setIdleFace(): void {
        this._setEyes('eyeOpenL', 'eyeOpenR');
        this._setMouth('mouthSmile');
        this._setBrows(true);
    }

    private _resetPunch(): void {
        Tween.stopAllByTarget(this._punch);
        this._punch.squashX = 0;
        this._punch.squashY = 0;
        this._punch.hop = 0;
        this._punch.tilt = 0;
    }

    private _setEyes(left: AvatarPartId | null, right: AvatarPartId | null): void {
        const parts = this._bundle?.parts;
        this._paint(this.eyeL, left && parts ? parts[left] : null, 'eyeL');
        this._paint(this.eyeR, right && parts ? parts[right] : null, 'eyeR');
        if (this._isLive(this.eyeL)) {
            this.eyeL.active = !!left;
        }
        if (this._isLive(this.eyeR)) {
            this.eyeR.active = !!right;
        }
    }

    private _setMouth(id: AvatarPartId | null): void {
        const frame = id ? this._bundle?.parts[id] : null;
        this._paint(this.mouth, frame, 'mouth');
        if (this._isLive(this.mouth)) {
            this.mouth.active = !!frame;
        }
    }

    private _setBrows(show: boolean): void {
        if (this._isLive(this.browL)) {
            this.browL.active = show;
        }
        if (this._isLive(this.browR)) {
            this.browR.active = show;
        }
    }

    private _stopMotion(): void {
        this.unscheduleAllCallbacks();
        this._resetPunch();
        this._ready = false;
        this._state = AvatarState.Idle;
        if (this._alive && this._isLive(this.rig)) {
            this._place(this.rig, 'rig');
            this.rig.angle = 0;
        }
    }

    private _bindAssignedSheets(): void {
        const skins = this.skinsSheet ?? this.partsOverride;
        if (skins || this.facesSheet) {
            AvatarSkinManager.instance.bindSheets(skins, this.facesSheet);
        }
    }

    private _loadEditorSheets(done: (ok: boolean) => void): void {
        const skinsId = 'c3d4e5f6-0718-4a01-9cde-334455667788@f9941';
        const facesId = 'd4e5f607-1829-4b12-ade0-445566778899@f9941';
        let left = 2;
        const finish = (): void => {
            left -= 1;
            if (left > 0) {
                return;
            }
            this._bindAssignedSheets();
            done(AvatarSkinManager.instance.ready);
        };
        const take = (key: 'skinsSheet' | 'facesSheet', uuid: string): void => {
            if (this[key]?.texture) {
                finish();
                return;
            }
            assetManager.loadAny({ uuid }, (err: Error | null, sf: SpriteFrame) => {
                if (!err && sf) {
                    this[key] = sf;
                }
                finish();
            });
        };
        take('skinsSheet', skinsId);
        take('facesSheet', facesId);
    }

    private _onTouchEnd(event: EventTouch): void {
        if (!this.clickEnabled) {
            return;
        }
        event.propagationStopped = true;
        this.playClick();
    }

    private _ensureTree(): void {
        if (!this.node.isValid) {
            return;
        }
        this.shadow = this._child(this.node, 'Shadow', 78, 18);
        this._drawShadow();
        this.rig = this._child(this.node, 'CharacterRoot', 160, 160);
        this._place(this.rig, 'rig');
        this._hideNamed(this.rig, 'Body');
        this._hideNamed(this.rig, 'CharacterSprite');
        this.portrait = this._bone(this.rig, 'Portrait', 'portrait');
        this.face = this._child(this.portrait, 'Face', 80, 80);
        this._place(this.face, 'face');
        this.browL = this._bone(this.face, 'BrowL', 'browL');
        this.browR = this._bone(this.face, 'BrowR', 'browR');
        this.eyeL = this._bone(this.face, 'EyeL', 'eyeL');
        this.eyeR = this._bone(this.face, 'EyeR', 'eyeR');
        this.mouth = this._bone(this.face, 'Mouth', 'mouth');
        this.avatarFrame = this.node.getChildByName('AvatarFrame');
        this._hideLeftover('PortraitFill');
        this._hideLeftover('BubbleFX');
        this._hideLeftover('ClickFX');
        this._stackLayers();
    }

    private _stackLayers(): void {
        const shade = this.node.getChildByName('Shade');
        const order = [shade, this.shadow, this.rig, this.avatarFrame];
        for (let i = 0; i < order.length; i++) {
            const node = order[i];
            if (this._isLive(node)) {
                node.setSiblingIndex(i);
            }
        }
    }

    private _hideLeftover(name: string): void {
        this._hideNamed(this.node, name);
    }

    private _hideNamed(parent: Node | null, name: string): void {
        if (!this._isLive(parent)) {
            return;
        }
        const node = parent.getChildByName(name);
        if (this._isLive(node)) {
            node.active = false;
        }
    }

    private _bone(parent: Node | null, name: string, layoutKey: string): Node {
        const node = this._child(this._isLive(parent) ? parent : this.node, name, 32, 32);
        const sprite = node.getComponent(Sprite) || node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        this._place(node, layoutKey);
        return node;
    }

    private _poseOf(layoutKey: string): PartPose {
        return AVATAR_POSE[layoutKey] ?? AVATAR_POSE.portrait;
    }

    private _isLive(node: Node | null | undefined): node is Node {
        return !!node?.isValid;
    }

    private _place(node: Node | null, layoutKey: string): void {
        if (!this._isLive(node)) {
            return;
        }
        const pose = this._poseOf(layoutKey);
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setAnchorPoint(pose.anchorX, pose.anchorY);
        this._applyPoseTransform(node, pose);
    }

    private _paint(node: Node | null, frame: SpriteFrame | null | undefined, layoutKey: string): void {
        if (!this._isLive(node)) {
            return;
        }
        const pose = this._poseOf(layoutKey);
        const sprite = node.getComponent(Sprite) || node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        sprite.spriteFrame = frame ?? null;
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setAnchorPoint(pose.anchorX, pose.anchorY);
        if (frame) {
            transform.setContentSize(frame.rect.width * pose.scale, frame.rect.height * pose.scale);
        }
        this._applyPoseTransform(node, pose);
    }

    private _applyPoseTransform(node: Node, pose: PartPose): void {
        if (!this._isLive(node)) {
            return;
        }
        node.setPosition(pose.x, pose.y, 0);
        node.setScale(pose.nodeScale, pose.nodeScale, 1);
    }

    private _child(parent: Node, name: string, w: number, h: number): Node {
        if (!parent.isValid) {
            return parent;
        }
        let node = parent.getChildByName(name);
        if (!node) {
            node = new Node(name);
            node.layer = parent.layer;
            parent.addChild(node);
            const transform = node.addComponent(UITransform);
            transform.setContentSize(w, h);
            transform.setAnchorPoint(0.5, 0.5);
        }
        return node;
    }

    private _drawShadow(): void {
        if (!this._isLive(this.shadow)) {
            return;
        }
        this.shadow.setPosition(4, -64, 0);
        const g = this.shadow.getComponent(Graphics) || this.shadow.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(38, 20, 8, 54);
        g.ellipse(0, 0, 40, 8);
        g.fill();
    }
}
