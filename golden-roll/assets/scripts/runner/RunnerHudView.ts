import { _decorator, Button, Color, Component, Label, Sprite, tween, Tween, UIOpacity } from 'cc';
import { Power, RunnerModel } from './RunnerModel';
const { ccclass, property } = _decorator;
@ccclass('RunnerHudView')
export class RunnerHudView extends Component {
    @property(Label) coins: Label = null!;
    @property(Label) distance: Label = null!;
    @property(Label) best: Label = null!;
    @property(Label) mission: Label = null!;
    @property(Label) hint: Label = null!;
    @property(UIOpacity) hintOpacity: UIOpacity = null!;
    @property(Sprite) progress: Sprite = null!;
    @property([Sprite]) hearts: Sprite[] = [];
    @property([Label]) powerCounts: Label[] = [];
    @property([Button]) powerButtons: Button[] = [];
    @property(Button) left: Button = null!;
    @property(Button) right: Button = null!;
    @property(Button) pause: Button = null!;
    @property(Button) jump: Button = null!;
    @property(Label) weight: Label = null!;
    onLoad(): void {
        this.left.node.on(Button.EventType.CLICK, () => this.node.emit('move', -1));
        this.right.node.on(Button.EventType.CLICK, () => this.node.emit('move', 1));
        this.pause.node.on(Button.EventType.CLICK, () => this.node.emit('pause'));
        this.jump.node.on(Button.EventType.CLICK, () => this.node.emit('jump'));
        this.powerButtons.forEach((button, index) => button.node.on(Button.EventType.CLICK, () => this.node.emit('power', (['magnet', 'shield', 'boot'] as Power[])[index])));
    }
    setData(run: RunnerModel, best: number): void {
        this.coins.string = String(run.coins); this.distance.string = run.distance + 'm';
        this.best.string = String(Math.max(best, run.score));
        this.weight.string = `泥球 ${Math.round(run.weight)}%`;
        this.jump.interactable = run.state === 'running' && !run.airborne;
        this.mission.string = run.missionComplete ? '已完成 ✓' : `${run.coins} / 50`;
        this.hearts.forEach((sprite, i) => { sprite.color = i < run.lives ? Color.WHITE : new Color(72, 44, 31); });
        this.progress.fillRange = Math.min(1, run.coins / 50);
        (['magnet', 'shield', 'boot'] as Power[]).forEach((power, i) => {
            this.powerCounts[i].string = run.powers[power] > 0 ? Math.ceil(run.powers[power]) + 's' : String(run.charges[power]);
            this.powerButtons[i].interactable = run.state === 'running' && run.powers[power] <= 0 && run.charges[power] > 0;
        });
    }
    showHint(message: string, duration = 2): void {
        this.hint.string = message; Tween.stopAllByTarget(this.hintOpacity);
        this.hintOpacity.opacity = 255;
        tween(this.hintOpacity).delay(duration).to(0.35, { opacity: 0 }).start();
    }
}
