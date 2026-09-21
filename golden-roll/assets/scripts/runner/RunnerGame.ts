import { _decorator, Component, director, EventKeyboard, EventTouch, game, Game, input, Input, instantiate, KeyCode, Node, Prefab, ResolutionPolicy, view } from 'cc';
import { RunnerActorView } from './RunnerActorView';
import { RunnerAssets } from './RunnerAssets';
import { RunnerEffects } from './RunnerEffects';
import { RunnerHudView } from './RunnerHudView';
import { RunnerModalView } from './RunnerModalView';
import { Power, RunnerModel } from './RunnerModel';
import { project } from './RunnerProjection';
import { RunnerWorldView } from './RunnerWorldView';
import { RunSessionService } from './RunSessionService';
const { ccclass, property } = _decorator;

/** Scene coordinator only: input -> Model -> Views; loading and storage stay in services. */
@ccclass('RunnerGame')
export class RunnerGame extends Component {
    @property(RunnerWorldView) world: RunnerWorldView = null!;
    @property(RunnerHudView) hud: RunnerHudView = null!;
    @property(RunnerEffects) effects: RunnerEffects = null!;
    @property(Node) actorRoot: Node = null!;
    @property(Node) modalRoot: Node = null!;
    @property(Prefab) actorPrefab: Prefab = null!;
    @property(Prefab) modalPrefab: Prefab = null!;
    readonly run = new RunnerModel();
    private actor: RunnerActorView = null!;
    private modal: RunnerModalView = null!;
    private loaded = false;
    private hitStop = 0;
    private saved = false;
    private starting = false;
    private swipeUsed = false;
    onLoad(): void {
        view.setDesignResolutionSize(750, 1334, ResolutionPolicy.SHOW_ALL);
        const hero = instantiate(this.actorPrefab); this.actorRoot.addChild(hero); this.actor = hero.getComponent(RunnerActorView)!;
        const modal = instantiate(this.modalPrefab); this.modalRoot.addChild(modal); this.modal = modal.getComponent(RunnerModalView)!; this.modal.hide();
        this.hud.node.on('move', this.move, this); this.hud.node.on('pause', this.pause, this); this.hud.node.on('power', this.use, this);
        this.hud.node.on('jump', () => this.run.jump(), this);
        void this.startRun();
    }
    onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this.key, this);
        input.on(Input.EventType.TOUCH_START, this.swipeStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.swipe, this);
        input.on(Input.EventType.TOUCH_END, this.swipe, this);
        game.on(Game.EVENT_HIDE, this.pause, this);
    }
    onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this.key, this);
        input.off(Input.EventType.TOUCH_START, this.swipeStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.swipe, this);
        input.off(Input.EventType.TOUCH_END, this.swipe, this);
        game.off(Game.EVENT_HIDE, this.pause, this);
    }
    private async startRun(): Promise<void> {
        if (this.starting) return; this.starting = true;
        this.run.state = 'ready'; this.modal.hide(); this.hud.showHint('正在准备西部冒险…', 30);
        try {
            await RunnerAssets.prepare(RunSessionService.skin);
            if (!this.isValid) return;
            this.actor.setData(); this.actor.setPaused(false); this.world.reset(); this.world.setPaused(false);
            this.run.reset(); this.hitStop = 0; this.saved = false; this.loaded = true;
            this.hud.showHint('左右滑动换道 · 上滑 / 空格跳跃 · 1/2/3 道具', 5);
            this.paint(0);
        } catch (error) {
            console.error('[RunnerGame] load failed', error);
            const detail = error instanceof Error ? error.message : String(error);
            if (this.isValid) this.modal.setData({ title: '旅程准备失败', body: detail.slice(0, 160) || '素材暂时未就绪，请重试', actions: [{ title: '重试', run: () => { void this.startRun(); } }, { title: '返回营地', run: () => this.home() }] });
        } finally { this.starting = false; }
    }
    update(dt: number): void {
        if (!this.loaded || this.run.state !== 'running') return;
        if (this.hitStop > 0) {
            this.hitStop -= dt;
            if (this.hitStop <= 0) this.actor.setPaused(false);
            return;
        }
        this.run.tick(dt);
        for (const event of this.run.events) {
            const pose = project(event.x, 0);
            this.effects.burst(pose.x, pose.y, event.type);
            if (event.type === 'hit') {
                this.actor.hit(); this.effects.shake(); this.hitStop = 0.065; this.actor.setPaused(true);
                this.hud.showHint(`撞到了！剩余 ${this.run.lives} 颗心`, 1.2);
            }
            if (event.type === 'shield') this.hud.showHint('护盾挡住了障碍', 1);
            if (event.type === 'mission') this.hud.showHint('任务完成！额外奖励 100 金币', 3);
            if (event.type === 'power') this.hud.showHint('道具已生效', 1);
            if (event.type === 'land') this.actor.land();
        }
        this.run.events.length = 0; this.paint(dt);
        if (this.run.lives <= 0) this.finish();
    }
    private paint(dt: number): void { this.world.render(this.run); this.actor.render(this.run, dt); this.hud.setData(this.run, RunSessionService.best); }
    private move(direction: number): void { this.run.move(direction); }
    private use(power: Power): void {
        if (!this.run.use(power) && this.run.state === 'running') this.hud.showHint(this.run.powers[power] > 0 ? '道具正在生效' : '道具已用完，拾取可再次生效');
    }
    private pause(): void {
        if (this.run.state !== 'running') return;
        this.run.pause(); this.actor.setPaused(true); this.world.setPaused(true);
        this.modal.setData({ title: '歇一歇，牛仔', body: '旅程已暂停\n准备好了就继续向前', actions: [
            { title: '继续冒险', run: () => this.resume() }, { title: '重新出发', run: () => { void this.startRun(); } }, { title: '返回营地', run: () => this.home() },
        ] });
    }
    private resume(): void { this.modal.hide(); this.run.resume(); this.actor.setPaused(false); this.world.setPaused(false); this.hitStop = 0; }
    private finish(): void {
        if (this.saved) return; this.saved = true; this.actor.setPaused(true); this.world.setPaused(true);
        const reward = this.run.coins + (this.run.missionComplete ? 100 : 0);
        const record = this.run.score > RunSessionService.best;
        RunSessionService.save(this.run.score, reward, this.run.distance, this.run.weight);
        this.modal.setData({ title: record ? '新的西部纪录！' : '这趟旅程，真不错', body: `本局得分   ${this.run.score}\n行进距离   ${this.run.distance} m\n泥球重量   ${Math.round(this.run.weight)}%\n收获金币   ${reward}\n最高纪录   ${RunSessionService.best}`, actions: [
            { title: '再跑一次', run: () => { void this.startRun(); } }, { title: '返回营地', run: () => this.home() },
        ] });
    }
    private home(): void { director.loadScene('main'); }
    private key(event: EventKeyboard): void {
        const key = event.keyCode;
        if (key === KeyCode.ESCAPE) { if (this.run.state === 'paused') this.resume(); else this.pause(); }
        if (key === KeyCode.SPACE || key === KeyCode.ARROW_UP || key === KeyCode.KEY_W) this.run.jump();
        if (key === KeyCode.KEY_A || key === KeyCode.ARROW_LEFT) this.move(-1);
        if (key === KeyCode.KEY_D || key === KeyCode.ARROW_RIGHT) this.move(1);
        if (key === KeyCode.DIGIT_1) this.use('magnet');
        if (key === KeyCode.DIGIT_2) this.use('shield');
        if (key === KeyCode.DIGIT_3) this.use('boot');
    }
    private swipeStart(): void { this.swipeUsed = false; }
    private swipe(event: EventTouch): void {
        if (this.swipeUsed) return;
        const a = event.getUIStartLocation(), b = event.getUILocation();
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
            this.move(dx > 0 ? 1 : -1);
            this.swipeUsed = true;
        } else if (dy > 42) {
            this.run.jump();
            this.swipeUsed = true;
        }
    }
}
