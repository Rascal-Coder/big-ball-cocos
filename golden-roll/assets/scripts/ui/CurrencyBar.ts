import { _decorator, Color, Component, Label } from 'cc';
import { formatCompactAmount } from '../core/Format';
import { findNode } from '../core/NodeQuery';

const { ccclass } = _decorator;

const INK = new Color(92, 58, 28, 255);
const INK_EDGE = new Color(62, 36, 14, 90);

@ccclass('CurrencyBar')
export class CurrencyBar extends Component {
    private _label: Label | null = null;

    onLoad(): void {
        this._bind();
    }

    setValue(value: number): void {
        this._bind();
        if (this._label) {
            this._label.string = formatCompactAmount(value);
        }
    }

    private _bind(): void {
        if (this._label?.isValid) {
            return;
        }
        const node = findNode(this.node, 'GoldText') ?? findNode(this.node, 'Value') ?? findNode(this.node, 'Label');
        this._label = node?.getComponent(Label) ?? null;
        if (!this._label) {
            return;
        }
        this._label.fontSize = 56;
        this._label.lineHeight = 72;
        this._label.spacingX = 2;
        this._label.overflow = Label.Overflow.SHRINK;
        this._label.enableWrapText = false;
        this._label.color = INK;
        this._label.enableOutline = true;
        this._label.outlineColor = INK_EDGE;
        this._label.outlineWidth = 1;
        this._label.cacheMode = Label.CacheMode.BITMAP;
    }
}
