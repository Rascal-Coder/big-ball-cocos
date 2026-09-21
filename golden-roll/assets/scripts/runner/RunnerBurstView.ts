import { _decorator, Color, Component, ParticleSystem2D } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('RunnerBurstView')
export class RunnerBurstView extends Component {
    @property(ParticleSystem2D) particles: ParticleSystem2D = null!;
    setData(x: number, y: number, kind: string): void {
        this.node.setPosition(x, y);
        this.particles.startColor = kind === 'hit' ? new Color(221, 130, 64, 230) : new Color(255, 214, 84, 255);
        this.particles.resetSystem();
    }
}
