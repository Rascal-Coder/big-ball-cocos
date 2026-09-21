import { _decorator, Component, Sprite, SpriteFrame, UITransform, Tween, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('RunnerItemView')
export class RunnerItemView extends Component {
    @property(Sprite) image: Sprite = null!;
    @property(UITransform) bounds: UITransform = null!;
    setData(frame: SpriteFrame, width: number, height: number, coin = false): void {
        Tween.stopAllByTarget(this.node);
        this.image.spriteFrame = frame;
        this.image.trim = true;
        this.bounds.setContentSize(width, height);
        this.node.setScale(1, 1, 1); this.node.angle = 0;
        if (coin) tween(this.node).to(0.35, { scale: new Vec3(0.65, 1, 1) }).to(0.35, { scale: new Vec3(1, 1, 1) }).union().repeatForever().start();
    }
    setPosition(x: number, y: number): void { this.node.setPosition(x, y); }
    setPaused(paused: boolean): void { if (paused) Tween.pauseAllByTarget(this.node); else Tween.resumeAllByTarget(this.node); }
    onDisable(): void { Tween.stopAllByTarget(this.node); }
}
