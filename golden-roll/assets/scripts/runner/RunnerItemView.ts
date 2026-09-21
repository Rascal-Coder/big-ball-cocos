import { _decorator, Color, Component, Material, Sprite, SpriteFrame, UITransform, Tween, Vec4 } from 'cc';
import { RunnerAssets } from './RunnerAssets';
const { ccclass, property } = _decorator;

@ccclass('RunnerItemView')
export class RunnerItemView extends Component {
    @property(Sprite) image: Sprite = null!;
    @property(UITransform) bounds: UITransform = null!;
    depth = 0;
    private readonly near = new Vec4();
    private readonly far = new Vec4();
    private readonly uv = new Vec4(0, 0, 1, 1);
    private warpCopy: Material | null = null;

    setData(frame: SpriteFrame, width: number, height: number): void {
        Tween.stopAllByTarget(this.node);
        this.image.customMaterial = null;
        this.image.spriteFrame = frame;
        this.image.trim = false;
        this.image.color = Color.WHITE;
        this.bounds.setContentSize(width, height);
        this.node.setScale(1, 1, 1);
        this.node.angle = 0;
    }

    setPose(x: number, y: number, sx: number, sy: number, depth = 0): void {
        this.depth = depth;
        this.node.setPosition(x, y);
        this.node.setScale(sx, sy, 1);
    }

    setTrapezoid(
        bl: { x: number; y: number },
        br: { x: number; y: number },
        tl: { x: number; y: number },
        tr: { x: number; y: number },
        depth = 0,
        uv = { u0: 0, v0: 0, u1: 1, v1: 1 },
    ): void {
        const minX = Math.min(bl.x, br.x, tl.x, tr.x);
        const maxX = Math.max(bl.x, br.x, tl.x, tr.x);
        const minY = Math.min(bl.y, br.y, tl.y, tr.y);
        const maxY = Math.max(bl.y, br.y, tl.y, tr.y);
        const cx = (minX + maxX) * 0.5;
        const cy = (minY + maxY) * 0.5;
        this.depth = depth;
        this.node.setPosition(cx, cy);
        this.node.setScale(1, 1, 1);
        this.bounds.setContentSize(Math.max(2, maxX - minX), Math.max(2, maxY - minY));
        this.image.trim = false;
        if (RunnerAssets.warp) {
            try {
                if (!this.warpCopy) {
                    this.warpCopy = new Material();
                    this.warpCopy.copy(RunnerAssets.warp);
                }
                if (this.image.customMaterial !== this.warpCopy) {
                    this.image.customMaterial = this.warpCopy;
                }
                this.near.set(bl.x - cx, bl.y - cy, br.x - cx, br.y - cy);
                this.far.set(tl.x - cx, tl.y - cy, tr.x - cx, tr.y - cy);
                this.uv.set(uv.u0, uv.v0, uv.u1, uv.v1);
                this.warpCopy.setProperty('nearCorners', this.near);
                this.warpCopy.setProperty('farCorners', this.far);
                this.warpCopy.setProperty('uvRect', this.uv);
            } catch (error) {
                console.warn('[RunnerItemView] warp failed', error);
                this.image.customMaterial = null;
                RunnerAssets.warp = null;
            }
        }
    }

    setTint(r: number, g: number, b: number, a = 255): void {
        this.image.color = new Color(r, g, b, a);
    }

    setPaused(paused: boolean): void {
        if (paused) {
            Tween.pauseAllByTarget(this.node);
        } else {
            Tween.resumeAllByTarget(this.node);
        }
    }

    onDisable(): void {
        Tween.stopAllByTarget(this.node);
    }
    onDestroy(): void { this.warpCopy?.destroy(); }
}
