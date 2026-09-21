import { _decorator, Component, Label, Node } from 'cc';
import { findNode } from '../core/NodeQuery';

const { ccclass, property } = _decorator;

@ccclass('PlaqueButton')
export class PlaqueButton extends Component {
    @property
    actionId = '';

    onClick: ((actionId: string) => void) | null = null;

    onLoad(): void {
        const label = this._label();
        if (label) {
            this.setText(label.string);
        }
    }

    onEnable(): void {
        this.node.on(Node.EventType.TOUCH_END, this._emit, this);
    }

    onDisable(): void {
        this.node.off(Node.EventType.TOUCH_END, this._emit, this);
    }

    setText(text: string): void {
        const label = this._label();
        if (!label) {
            return;
        }
        label.string = text;
        label.fontSize = 34;
        label.lineHeight = 50;
        label.spacingX = text.length > 2 ? -4 : 0;
    }

    private _label(): Label | null {
        const node = findNode(this.node, 'Label') ?? findNode(this.node, 'ShopLabel') ?? this.node.children.find((child) => child.getComponent(Label));
        return node?.getComponent(Label) ?? null;
    }

    private _emit(): void {
        this.onClick?.(this.actionId || this.node.name);
    }
}
