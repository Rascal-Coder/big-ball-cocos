import { _decorator, Component, Label, Node } from 'cc';
import { findNode } from '../core/NodeQuery';
import { RigClip } from './BeetleRigData';
import { BeetleRigView } from './BeetleRigView';

const { ccclass } = _decorator;

@ccclass('BeetleRigTest')
export class BeetleRigTest extends Component {
    private view: BeetleRigView | null = null;
    private status: Label | null = null;

    onLoad(): void {
        this.view = findNode(this.node, 'BeetleRig')?.getComponent(BeetleRigView) ?? null;
        this.status = findNode(this.node, 'Status')?.getComponent(Label) ?? null;
        this._bind('BtnIdle', 'idle');
        this._bind('BtnWalk', 'walk');
        this._bind('BtnPush', 'push');
        this.view?.play('push');
        this._refresh();
    }

    private _bind(name: string, clip: RigClip): void {
        const node = findNode(this.node, name);
        node?.on(Node.EventType.TOUCH_END, () => {
            this.view?.play(clip);
            this._refresh();
        }, this);
    }

    private _refresh(): void {
        if (this.status && this.view) {
            this.status.string = this.view.statusText();
        }
    }
}
