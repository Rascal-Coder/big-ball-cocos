import { _decorator, Component, Node, Prefab, tween, Tween, Vec3 } from 'cc';
import { NodePool } from '../core/NodePool';
import { RunnerBurstView } from './RunnerBurstView';
const { ccclass, property } = _decorator;
@ccclass('RunnerEffects')
export class RunnerEffects extends Component {
    @property(Node) cameraRig: Node = null!;
    @property(Prefab) burstPrefab: Prefab = null!;
    private pool = new NodePool();
    onLoad(): void { this.pool.register('burst', this.burstPrefab); }
    burst(x: number, y: number, kind: string): void {
        const node = this.pool.acquire('burst', this.node);
        node.getComponent(RunnerBurstView)!.setData(x, y, kind);
        this.scheduleOnce(() => this.pool.release('burst', node), 0.8);
    }
    shake(): void {
        Tween.stopAllByTarget(this.cameraRig); this.cameraRig.setPosition(0, 0);
        tween(this.cameraRig).to(0.035, { position: new Vec3(-7, 3) }).to(0.05, { position: new Vec3(6, -2) }).to(0.055, { position: new Vec3(-4, 1) }).to(0.07, { position: new Vec3(0, 0) }).start();
    }
    onDestroy(): void { this.pool.clear(); Tween.stopAllByTarget(this.cameraRig); }
}
