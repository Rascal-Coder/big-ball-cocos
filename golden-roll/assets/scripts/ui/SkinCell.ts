import { _decorator, Color, Component, Label, Node } from 'cc';
import { AvatarAnimator } from '../avatar/AvatarAnimator';
import { AvatarPlayMode } from '../avatar/AvatarSkinData';
import { findNode } from '../core/NodeQuery';

const { ccclass } = _decorator;

@ccclass('SkinCell')
export class SkinCell extends Component {
    onPick: ((id: string) => void) | null = null;

    private _skinId = '';

    onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this._emit, this);
    }

    onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this._emit, this);
    }

    bind(id: string, name: string, selected: boolean): void {
        this._skinId = id;
        const nameLabel = findNode(this.node, 'SkinName')?.getComponent(Label);
        if (nameLabel) {
            nameLabel.string = name;
            nameLabel.color = selected ? new Color(154, 86, 24) : new Color(90, 58, 28);
        }
        const mini = findNode(this.node, 'MiniAvatar');
        mini?.setScale(selected ? 1.08 : 1, selected ? 1.08 : 1, 1);
        this._ensureThumb(id);
    }

    private _ensureThumb(skinId: string): void {
        const mini = findNode(this.node, 'MiniAvatar');
        if (!mini) {
            return;
        }
        const animator = mini.getComponent(AvatarAnimator) ?? mini.addComponent(AvatarAnimator);
        animator.playMode = AvatarPlayMode.Lite;
        animator.clickEnabled = false;
        animator.setSkin(skinId);
        mini.off(Node.EventType.TOUCH_END);
        const shadow = mini.getChildByName('Shadow');
        if (shadow) {
            shadow.active = false;
        }
    }

    private _emit(): void {
        if (this._skinId) {
            this.onPick?.(this._skinId);
        }
    }
}
