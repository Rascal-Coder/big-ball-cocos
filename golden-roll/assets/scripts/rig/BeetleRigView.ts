import { _decorator, Animation, Component } from 'cc';
import { RIG_CLIP_LABEL, RigClip } from './BeetleRigData';

const { ccclass } = _decorator;

@ccclass('BeetleRigView')
export class BeetleRigView extends Component {
    clip: RigClip = 'push';

    private anim: Animation | null = null;

    onLoad(): void {
        this.anim = this.getComponent(Animation);
        this.play(this.clip);
    }

    play(clip: RigClip): void {
        this.clip = clip;
        this.anim?.play(clip);
    }

    statusText(): string {
        return RIG_CLIP_LABEL[this.clip];
    }
}
