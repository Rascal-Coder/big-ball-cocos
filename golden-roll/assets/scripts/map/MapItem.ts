import { _decorator, Component } from 'cc';
import { ItemKind } from './MapTypes';

const { ccclass } = _decorator;

@ccclass('MapItem')
export class MapItem extends Component {
    kind: ItemKind = 'deco';
    radius = 16;
    taken = false;

    bind(kind: ItemKind, radius: number): void {
        this.kind = kind;
        this.radius = radius;
        this.taken = false;
        this.node.active = true;
    }

    consume(): void {
        this.taken = true;
        this.node.active = false;
    }
}
