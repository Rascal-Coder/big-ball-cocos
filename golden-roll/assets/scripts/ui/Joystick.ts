import { _decorator, Component, EventTouch, Input, Node, UITransform, Vec2, Vec3 } from 'cc';

const { ccclass } = _decorator;

@ccclass('Joystick')
export class Joystick extends Component {
    readonly direction = new Vec2();

    private _knob: Node | null = null;
    private _radius = 88;
    private _pointerId = -1;
    private readonly _origin = new Vec3();
    private readonly _tmp = new Vec3();

    onLoad(): void {
        this._knob = this.node.getChildByName('Knob');
        const transform = this.node.getComponent(UITransform);
        if (transform) {
            this._radius = Math.max(48, transform.width * 0.38);
        }
    }

    onEnable(): void {
        this.node.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.on(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    onDisable(): void {
        this.node.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        this.node.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.node.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        this.node.off(Input.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
        this._reset();
    }

    private _onTouchStart(event: EventTouch): void {
        if (this._pointerId !== -1) {
            return;
        }
        this._pointerId = event.getID();
        this._apply(event);
    }

    private _onTouchMove(event: EventTouch): void {
        if (event.getID() !== this._pointerId) {
            return;
        }
        this._apply(event);
    }

    private _onTouchEnd(event: EventTouch): void {
        if (event.getID() !== this._pointerId) {
            return;
        }
        this._reset();
    }

    private _apply(event: EventTouch): void {
        const transform = this.node.getComponent(UITransform);
        if (!transform) {
            return;
        }
        event.getUILocation(this._tmp as unknown as Vec2);
        transform.convertToNodeSpaceAR(this._tmp, this._tmp);
        const length = Math.hypot(this._tmp.x, this._tmp.y);
        const scale = length > this._radius ? this._radius / length : 1;
        this.direction.set(this._tmp.x * scale / this._radius, this._tmp.y * scale / this._radius);
        if (this._knob) {
            this._knob.setPosition(this._tmp.x * scale, this._tmp.y * scale, 0);
        }
    }

    private _reset(): void {
        this._pointerId = -1;
        this.direction.set(0, 0);
        if (this._knob) {
            this._knob.setPosition(this._origin);
        }
    }
}
