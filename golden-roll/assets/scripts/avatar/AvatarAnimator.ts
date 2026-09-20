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
    UITransform,
    Vec3,
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

@ccclass('AvatarEditPose')
class AvatarEditPose {
    @property({ displayName: 'X' })
    x = 0;

    @property({ displayName: 'Y' })
    y = 0;

    @property({ displayName: '缩放' })
    scale = 1;
}

const ZERO = new Vec3(0, 0, 0);

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

    @property({ type: SpriteFrame, displayName: '部件表（可选）' })
    partsOverride: SpriteFrame | null = null;

    @property({
        displayName: '保留场景拖动',
        tooltip: '勾选后眨眼/换表情不会改回坐标。可直接拖 Portrait、Face、眼、眉、嘴。',
    })
    keepScenePose = true;

    @property({ displayName: '整身', type: AvatarEditPose })
    portraitPose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: 0, y: -4, scale: 0.7 });

    @property({ displayName: '脸根', type: AvatarEditPose })
    facePose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: 0, y: -6, scale: 1 });

    @property({ displayName: '左眉', type: AvatarEditPose })
    browLPose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: -13, y: 18, scale: 0.34 });

    @property({ displayName: '右眉', type: AvatarEditPose })
    browRPose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: 13, y: 18, scale: 0.34 });

    @property({ displayName: '左眼', type: AvatarEditPose })
    eyeLPose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: -13, y: 8, scale: 0.38 });

    @property({ displayName: '右眼', type: AvatarEditPose })
    eyeRPose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: 13, y: 8, scale: 0.38 });

    @property({ displayName: '嘴', type: AvatarEditPose })
    mouthPose: AvatarEditPose = Object.assign(new AvatarEditPose(), { x: 0, y: -8, scale: 0.38 });

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
        this._ensureTree();
        if (this.partsOverride) {
            AvatarSkinManager.instance.bindSheets(this.partsOverride);
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
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this._teardown();
    }

    onDestroy(): void {
        this._alive = false;
        this.node.off(Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this._teardown();
        this._bundle = null;
    }

    update(dt: number): void {
        if (EDITOR || !this._ready || !this._alive) {
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
            this._teardown();
            this._bundle = bundle;
            this._bindRig();
            this._ready = true;
            this._resumeIdle();
        };
        if (this.partsOverride && !AvatarSkinManager.instance.ready) {
            AvatarSkinManager.instance.bindSheets(this.partsOverride);
        }
        if (AvatarSkinManager.instance.ready) {
            apply();
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
        if (this.portrait) {
            this.portrait.setScale(1 + breath * 0.02 + this._punch.squashX, 1 - breath * 0.016 + this._punch.squashY, 1);
        }
        if (this.rig) {
            this.rig.setPosition(0, 8 + this._punch.hop, 0);
            this.rig.angle = this._punch.tilt + sway * 1.4;
        }
        if (this.face) {
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
        if (this.eyeL) {
            this.eyeL.active = !!left;
        }
        if (this.eyeR) {
            this.eyeR.active = !!right;
        }
    }

    private _setMouth(id: AvatarPartId | null): void {
        const frame = id ? this._bundle?.parts[id] : null;
        this._paint(this.mouth, frame, 'mouth');
        if (this.mouth) {
            this.mouth.active = !!frame;
        }
    }

    private _setBrows(show: boolean): void {
        if (this.browL) {
            this.browL.active = show;
        }
        if (this.browR) {
            this.browR.active = show;
        }
    }

    private _teardown(): void {
        this.unscheduleAllCallbacks();
        this._resetPunch();
        this._ready = false;
        this._state = AvatarState.Idle;
        if (this.rig) {
            this.rig.setPosition(ZERO);
            this.rig.angle = 0;
            this.rig.setScale(1, 1, 1);
        }
    }

    private _onTouchEnd(event: EventTouch): void {
        event.propagationStopped = true;
        this.playClick();
    }

    private _ensureTree(): void {
        this.shadow = this._child(this.node, 'Shadow', 78, 18).node;
        this._drawShadow();
        const rig = this._child(this.node, 'CharacterRoot', 160, 160);
        this.rig = rig.node;
        this._place(this.rig, 'rig', rig.created);
        this._hideNamed(this.rig, 'Body');
        this._hideNamed(this.rig, 'CharacterSprite');
        this.portrait = this._bone(this.rig, 'Portrait', 'portrait');
        this.face = this._child(this.portrait, 'Face', 80, 80).node;
        if (!this.keepScenePose || this._isUnset(this.face)) {
            this.face.setPosition(this.facePose.x, this.facePose.y, 0);
        }
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
            if (node) {
                node.setSiblingIndex(i);
            }
        }
    }

    private _hideLeftover(name: string): void {
        this._hideNamed(this.node, name);
    }

    private _hideNamed(parent: Node | null, name: string): void {
        const node = parent?.getChildByName(name);
        if (node) {
            node.active = false;
        }
    }

    private _bone(parent: Node | null, name: string, layoutKey: string): Node {
        const { node, created } = this._child(parent ?? this.node, name, 32, 32);
        const sprite = node.getComponent(Sprite) || node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        this._place(node, layoutKey, created);
        return node;
    }

    private _editPose(layoutKey: string): AvatarEditPose | null {
        switch (layoutKey) {
            case 'portrait':
                return this.portraitPose;
            case 'browL':
                return this.browLPose;
            case 'browR':
                return this.browRPose;
            case 'eyeL':
                return this.eyeLPose;
            case 'eyeR':
                return this.eyeRPose;
            case 'mouth':
                return this.mouthPose;
            default:
                return null;
        }
    }

    private _poseOf(layoutKey: string): PartPose {
        const edit = this._editPose(layoutKey);
        const fallback = AVATAR_POSE[layoutKey] ?? AVATAR_POSE.portrait;
        if (!edit) {
            return fallback;
        }
        return {
            x: edit.x,
            y: edit.y,
            scale: edit.scale,
            anchorX: fallback.anchorX,
            anchorY: fallback.anchorY,
        };
    }

    private _isUnset(node: Node): boolean {
        return Math.abs(node.position.x) < 0.01 && Math.abs(node.position.y) < 0.01;
    }

    private _place(node: Node, layoutKey: string, force: boolean): void {
        const pose = this._poseOf(layoutKey);
        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setAnchorPoint(pose.anchorX, pose.anchorY);
        if (force || !this.keepScenePose || this._isUnset(node)) {
            node.setPosition(pose.x, pose.y, 0);
        }
    }

    private _paint(node: Node | null, frame: SpriteFrame | null | undefined, layoutKey: string): void {
        if (!node) {
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
        if (!this.keepScenePose) {
            node.setPosition(pose.x, pose.y, 0);
        }
    }

    private _child(parent: Node, name: string, w: number, h: number): { node: Node; created: boolean } {
        let node = parent.getChildByName(name);
        const created = !node;
        if (!node) {
            node = new Node(name);
            node.layer = parent.layer;
            parent.addChild(node);
            const transform = node.addComponent(UITransform);
            transform.setContentSize(w, h);
            transform.setAnchorPoint(0.5, 0.5);
        }
        return { node, created };
    }

    private _drawShadow(): void {
        if (!this.shadow) {
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
