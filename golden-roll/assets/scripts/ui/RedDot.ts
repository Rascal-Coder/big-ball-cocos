import { _decorator, Color, Component, Graphics, UITransform } from 'cc';

const { ccclass } = _decorator;

@ccclass('RedDot')
export class RedDot extends Component {
    onLoad(): void {
        const transform = this.node.getComponent(UITransform);
        const radius = Math.max(6, (transform?.width ?? 18) * 0.5);
        const g = this.node.getComponent(Graphics) ?? this.node.addComponent(Graphics);
        g.clear();
        g.fillColor = new Color(196, 48, 36, 255);
        g.circle(0, 0, radius);
        g.fill();
        g.strokeColor = new Color(255, 220, 180, 220);
        g.lineWidth = 2;
        g.circle(0, 0, radius);
        g.stroke();
    }

    setVisible(visible: boolean): void {
        this.node.active = visible;
    }
}
