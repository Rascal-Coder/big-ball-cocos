import { _decorator, Color, Component, Graphics, Label, Node, UITransform } from 'cc';
import { findNode } from '../core/NodeQuery';

const { ccclass } = _decorator;

@ccclass('ConfirmView')
export class ConfirmView extends Component {
    private _onOk: (() => void) | null = null;
    private _onCancel: (() => void) | null = null;

    onLoad(): void {
        const dim = findNode(this.node, 'Dim');
        if (!dim) {
            return;
        }
        const t = dim.getComponent(UITransform);
        if (!t || dim.getComponent(Graphics)) {
            return;
        }
        const g = dim.addComponent(Graphics);
        g.fillColor = new Color(48, 28, 14, 170);
        g.rect(-t.width / 2, -t.height / 2, t.width, t.height);
        g.fill();
    }

    onEnable(): void {
        findNode(this.node, 'Ok')?.on(Node.EventType.TOUCH_END, this._ok, this);
        findNode(this.node, 'Cancel')?.on(Node.EventType.TOUCH_END, this._cancel, this);
        findNode(this.node, 'Dim')?.on(Node.EventType.TOUCH_END, this._cancel, this);
    }

    onDisable(): void {
        findNode(this.node, 'Ok')?.off(Node.EventType.TOUCH_END, this._ok, this);
        findNode(this.node, 'Cancel')?.off(Node.EventType.TOUCH_END, this._cancel, this);
        findNode(this.node, 'Dim')?.off(Node.EventType.TOUCH_END, this._cancel, this);
    }

    open(title: string, body: string, onOk?: () => void, onCancel?: () => void): void {
        const titleLabel = findNode(this.node, 'Title')?.getComponent(Label);
        const bodyLabel = findNode(this.node, 'Body')?.getComponent(Label);
        if (titleLabel) titleLabel.string = title;
        if (bodyLabel) bodyLabel.string = body;
        this._onOk = onOk ?? null;
        this._onCancel = onCancel ?? null;
        this.node.active = true;
    }

    close(): void {
        this.node.active = false;
    }

    private _ok(): void {
        const fn = this._onOk;
        this.close();
        fn?.();
    }

    private _cancel(): void {
        const fn = this._onCancel;
        this.close();
        fn?.();
    }
}
