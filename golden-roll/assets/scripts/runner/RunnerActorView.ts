import { _decorator, Color, Component, Node, ParticleSystem2D, Sprite, UIOpacity } from 'cc';
import { RunnerAssets } from './RunnerAssets';
import { LANES, RunnerModel } from './RunnerModel';
import { projectSprite } from './RunnerProjection';
const { ccclass, property } = _decorator;

/** Static rider layers sit on an independently rotating and growing sphere. */
@ccclass('RunnerActorView')
export class RunnerActorView extends Component {
    @property(Sprite) body: Sprite = null!;
    @property(Sprite) hat: Sprite = null!;
    @property(Sprite) ball: Sprite = null!;
    @property(Node) shadow: Node = null!;
    @property(UIOpacity) opacity: UIOpacity = null!;
    @property(ParticleSystem2D) dust: ParticleSystem2D = null!;
    @property(ParticleSystem2D) aura: ParticleSystem2D = null!;
    @property(Node) pushRoot: Node = null!;
    private flashTime = 0;
    private landing = 0;
    private paused = false;
    private previousTravel = 0;

    setData(): void {
        this.body.spriteFrame = RunnerAssets.frames.get('beetle-body')!;
        this.setHat('cowboy');
        this.ball.spriteFrame = RunnerAssets.frames.get('ball-earth')!;
        this.flashTime = 0; this.landing = 0; this.previousTravel = 0;
        this.opacity.opacity = 255; this.ball.node.angle = 0;
        this.pushRoot.setPosition(0, 0); this.pushRoot.setScale(1, 1, 1);
        this.dust.resetSystem(); this.aura.stopSystem();
    }
    setHat(skin: string): void {
        this.hat.spriteFrame = RunnerAssets.frames.get('hat-' + skin) ?? RunnerAssets.frames.get('hat-cowboy')!;
    }
    render(run: RunnerModel, dt: number): void {
        const pose = projectSprite(run.x, 0);
        this.node.setPosition(pose.x, pose.y);
        this.node.setScale(pose.s, pose.s, 1);
        const scale = run.ballScale;
        const radius = 48 * scale;
        const bob = run.airborne ? 0 : Math.sin(run.travel * 0.055) * 1.6;
        this.flashTime = Math.max(0, this.flashTime - dt);
        this.landing = Math.max(0, this.landing - dt);
        const squash = Math.sin(this.landing / 0.22 * Math.PI) * 0.13;
        this.pushRoot.setPosition(0, run.height);
        this.pushRoot.setScale(1 + squash, 1 - squash, 1);
        this.pushRoot.angle = (LANES[run.lane] - run.x) * -0.018;
        this.ball.node.setPosition(0, radius);
        this.ball.node.setScale(scale, scale, 1);
        this.ball.node.angle -= (run.travel - this.previousTravel) / radius * 180 / Math.PI;
        this.previousTravel = run.travel;
        this.body.node.setPosition(0, radius * 1.78 + bob);
        this.hat.node.setPosition(7, radius * 1.78 + 27 + bob);
        this.shadow.setScale(scale * (1 - Math.min(0.35, run.height / 260)), scale, 1);
        this.opacity.opacity = run.invulnerable > 0 && Math.sin(run.time * 32) > 0 ? 125 : 255;
        const variant = run.powers.boot > 0 ? 'gold' : run.powers.shield > 0 ? 'crystal' : run.powers.magnet > 0 ? 'cactus' : 'earth';
        this.ball.spriteFrame = RunnerAssets.frames.get('ball-' + variant)!;
        this.dust.emissionRate = run.airborne || this.paused ? 0 : run.powers.boot > 0 ? 65 : 22;
        if (variant !== 'earth' && !this.paused && !this.aura.active) this.aura.resetSystem();
        if ((variant === 'earth' || this.paused) && this.aura.active) this.aura.stopSystem();
        this.ball.getMaterialInstance(0)?.setProperty('flash', this.flashTime > 0 ? 0.9 : 0);
        this.body.color = this.flashTime > 0 ? new Color(255, 170, 140) : Color.WHITE;
    }
    hit(): void { this.flashTime = 0.16; this.landing = 0.22; }
    land(): void { this.landing = 0.22; }
    setPaused(paused: boolean): void {
        this.paused = paused;
        if (paused) { this.dust.stopSystem(); this.aura.stopSystem(); } else this.dust.resetSystem();
    }
}
