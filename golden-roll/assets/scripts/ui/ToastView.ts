import { _decorator, Component, Label, Tween, tween, UIOpacity } from 'cc';
import { findNode } from '../core/NodeQuery';

const { ccclass } = _decorator;

@ccclass('ToastView')
export class ToastView extends Component {
    show(message: string, duration = 1.4): void {
        const label = findNode(this.node, 'Label')?.getComponent(Label);
        if (label) {
            label.string = message;
        }
        const opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        opacity.opacity = 0;
        this.node.active = true;
        tween(opacity)
            .to(0.16, { opacity: 255 }, { easing: 'sineOut' })
            .delay(duration)
            .to(0.2, { opacity: 0 }, { easing: 'sineIn' })
            .call(() => {
                this.node.active = false;
            })
            .start();
    }
}
