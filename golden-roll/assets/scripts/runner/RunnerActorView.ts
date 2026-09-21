import { _decorator, Color, Component, Material, Node, ParticleSystem2D, sp, Sprite, tween, Tween, UIOpacity, Vec3 } from 'cc';
import { RunnerAssets } from './RunnerAssets';
import { LANES, PLAYER_Y, RunnerModel } from './RunnerModel';
const { ccclass, property } = _decorator;
@ccclass('RunnerActorView')
export class RunnerActorView extends Component {
    @property(sp.Skeleton) skeleton: sp.Skeleton = null!;
    @property(Sprite) ball: Sprite = null!;
    @property(UIOpacity) opacity: UIOpacity = null!;
    @property(ParticleSystem2D) dust: ParticleSystem2D = null!;
    @property(ParticleSystem2D) aura: ParticleSystem2D = null!;
    @property(Node) pushRoot: Node = null!;
    private flashTime = 0;
    private rolling: Tween<Node> | null = null;
    setData(data: sp.SkeletonData): void {
        this.skeleton.skeletonData = data;
        this.skeleton.setAnimation(0, 'push', true);
        this.skeleton.timeScale = 1;
        this.flashTime = 0; this.opacity.opacity = 255;
        this.ball.spriteFrame = RunnerAssets.frames.get('ball-earth')!;
        this.ball.node.angle = 0;
        this.rolling?.stop();
        this.rolling = tween(this.ball.node).by(1.7, { angle: -360 }).repeatForever().start();
        this.dust.resetSystem(); this.aura.stopSystem();
    }
    render(run: RunnerModel, dt: number): void {
        this.node.setPosition(run.x, PLAYER_Y);
        this.node.angle = (LANES[run.lane] - run.x) * -0.035;
        this.skeleton.timeScale = run.speed / 255;
        this.opacity.opacity = run.invulnerable > 0 && Math.sin(run.time * 32) > 0 ? 125 : 255;
        const variant = run.powers.boot > 0 ? 'gold' : run.powers.shield > 0 ? 'crystal' : run.powers.magnet > 0 ? 'cactus' : 'earth';
        this.ball.spriteFrame = RunnerAssets.frames.get('ball-' + variant)!;
        this.dust.emissionRate = run.powers.boot > 0 ? 65 : 22;
        const powered = variant !== 'earth';
        if (powered && !this.aura.active) this.aura.resetSystem();
        if (!powered && this.aura.active) this.aura.stopSystem();
        this.flashTime = Math.max(0, this.flashTime - dt);
        this.ball.getMaterialInstance(0)?.setProperty('flash', this.flashTime > 0 ? 0.9 : 0);
        this.skeleton.color = this.flashTime > 0 ? new Color(255, 170, 140) : Color.WHITE;
    }
    hit(): void {
        this.flashTime = 0.16;
        this.skeleton.setAnimation(0, 'hit', false);
        this.skeleton.addAnimation(0, 'push', true, 0);
        Tween.stopAllByTarget(this.pushRoot);
        this.pushRoot.setPosition(0, 0);
        tween(this.pushRoot).to(0.07, { position: new Vec3(0, -12) }).to(0.2, { position: new Vec3(0, 0) }, { easing: 'backOut' }).start();
    }
    setPaused(paused: boolean): void {
        this.skeleton.paused = paused;
        paused ? this.rolling?.pause() : this.rolling?.resume();
        if (paused) { this.dust.stopSystem(); this.aura.stopSystem(); } else this.dust.resetSystem();
    }
    onDestroy(): void { this.rolling?.stop(); }
}
