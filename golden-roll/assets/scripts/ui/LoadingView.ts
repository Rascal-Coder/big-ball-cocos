import { _decorator, Component, Label, Mask, Sprite, UITransform } from 'cc';
import { bindNamedSprites, LOADING_SPRITES } from '../core/ArtBinder';
import { findNode } from '../core/NodeQuery';

const { ccclass } = _decorator;

const FILL_HEIGHT = 8;

@ccclass('LoadingView')
export class LoadingView extends Component {
    private _bar: UITransform | null = null;
    private _label: Label | null = null;
    private _trackWidth = 420;

    onLoad(): void {
        this._bind();
        this.setProgress(0);
        void bindNamedSprites(this.node, LOADING_SPRITES).then(() => this._styleFill());
    }

    setProgress(t: number): void {
        this._bind();
        const ratio = Math.min(1, Math.max(0, t));
        if (this._label) {
            this._label.string = `${Math.round(ratio * 100)}%`;
        }
        if (!this._bar) {
            return;
        }
        const width = this._trackWidth * ratio;
        this._bar.node.active = width >= 6;
        this._bar.setContentSize(Math.max(6, width), FILL_HEIGHT);
        this._styleFill();
    }

    private _styleFill(): void {
        const sprite = this._bar?.node.getComponent(Sprite);
        if (!sprite) {
            return;
        }
        sprite.enabled = true;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.type = Sprite.Type.SLICED;
        sprite.trim = false;
    }

    private _bind(): void {
        if (!this._bar) {
            const track = findNode(this.node, 'Track');
            const trackTf = track?.getComponent(UITransform);
            if (track && trackTf) {
                this._trackWidth = trackTf.width || 420;
                trackTf.setContentSize(this._trackWidth, 12);
                if (!track.getComponent(Mask)) {
                    const mask = track.addComponent(Mask);
                    mask.type = Mask.Type.GRAPHICS_RECT;
                }
            }
            this._bar = findNode(this.node, 'Bar')?.getComponent(UITransform) ?? null;
            if (this._bar) {
                this._bar.setAnchorPoint(0, 0.5);
                this._bar.node.setPosition(-this._trackWidth / 2, 0, 0);
            }
        }
        if (!this._label) {
            this._label = findNode(this.node, 'Percent')?.getComponent(Label) ?? null;
        }
    }
}
