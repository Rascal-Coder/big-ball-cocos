import { _decorator, Button, Component, Label, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
export interface ModalData { title: string; body: string; actions: Array<{ title: string; run: () => void }>; }
@ccclass('RunnerModalView')
export class RunnerModalView extends Component {
    @property(Label) title: Label = null!;
    @property(Label) body: Label = null!;
    @property(Node) panel: Node = null!;
    @property([Button]) buttons: Button[] = [];
    @property([Label]) captions: Label[] = [];
    private actions: ModalData['actions'] = [];
    onLoad(): void { this.buttons.forEach((button, i) => button.node.on(Button.EventType.CLICK, () => this.actions[i]?.run())); }
    setData(data: ModalData): void {
        this.actions = data.actions; this.title.string = data.title; this.body.string = data.body;
        this.buttons.forEach((button, i) => { button.node.active = i < data.actions.length; this.captions[i].string = data.actions[i]?.title ?? ''; });
        this.node.active = true; this.panel.setScale(0.9, 0.9, 1);
        tween(this.panel).to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    }
    hide(): void { this.node.active = false; }
}
