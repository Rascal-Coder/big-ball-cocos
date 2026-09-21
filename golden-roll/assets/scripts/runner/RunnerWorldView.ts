import { _decorator, Component, Node, Prefab } from 'cc';
import { NodePool } from '../core/NodePool';
import { RunnerAssets } from './RunnerAssets';
import { RunnerItemView } from './RunnerItemView';
import { PLAYER_Y, RunnerModel } from './RunnerModel';

const { ccclass, property } = _decorator;

const TILE = 145;
const COLS = [-2, -1, 0, 1, 2] as const;
const SLOTS = 14;
const ORIGIN_Y = -900;
const SIDE_DECO = ['cactus-saguaro', 'agave', 'bush', 'skull-post', 'fence-h', 'rock-pile'] as const;
const SIDE_GROUND = ['sand-plain', 'sand-cracks'] as const;

type Slot = {
    col: number;
    index: number;
    tile: RunnerItemView;
    deco: RunnerItemView;
    tileArt: string;
    decoArt: string;
};

function cellHash(col: number, row: number, salt = 0): number {
    let n = (row + 19) * 374761393 + (col + 7) * 668265263 + salt * 1274126177;
    n = Math.imul(n ^ (n >>> 15), 2246822519);
    return n >>> 0;
}

function tileArt(col: number, row: number): string {
    if (Math.abs(col) < 2) {
        return 'path-ns';
    }
    return SIDE_GROUND[cellHash(col, row) % SIDE_GROUND.length];
}

function decoArt(col: number, row: number): string {
    if (Math.abs(col) !== 2) {
        return '';
    }
    const n = cellHash(col, row, 91);
    if (n % 100 > 58) {
        return '';
    }
    return SIDE_DECO[n % SIDE_DECO.length];
}

function decoSize(id: string): { w: number; h: number } {
    if (id === 'cactus-saguaro') {
        return { w: 98, h: 148 };
    }
    if (id === 'skull-post') {
        return { w: 72, h: 118 };
    }
    if (id === 'fence-h') {
        return { w: 92, h: 70 };
    }
    return { w: 73, h: 86 };
}

@ccclass('RunnerWorldView')
export class RunnerWorldView extends Component {
    @property(Node) terrainRoot: Node = null!;
    @property(Node) itemRoot: Node = null!;
    @property(Prefab) itemPrefab: Prefab = null!;
    private pool = new NodePool();
    private slots: Slot[] = [];
    private active = new Map<number, RunnerItemView>();
    private initialized = false;

    private acquire(parent: Node): RunnerItemView {
        return this.pool.acquire('item', parent).getComponent(RunnerItemView)!;
    }

    reset(): void {
        if (!this.initialized) {
            this.pool.register('item', this.itemPrefab);
            const pending: Array<{ col: number; index: number; tile: RunnerItemView }> = [];
            for (let index = 0; index < SLOTS; index += 1) {
                for (const col of COLS) {
                    pending.push({ col, index, tile: this.acquire(this.terrainRoot) });
                }
            }
            for (const cell of pending) {
                this.slots.push({
                    col: cell.col,
                    index: cell.index,
                    tile: cell.tile,
                    deco: this.acquire(this.terrainRoot),
                    tileArt: '',
                    decoArt: '',
                });
            }
            this.initialized = true;
        }
        this.active.forEach((view) => this.pool.release('item', view.node));
        this.active.clear();
        this.slots.forEach((slot) => {
            slot.tileArt = '';
            slot.decoArt = '';
        });
    }

    render(run: RunnerModel): void {
        const scroll = ((run.travel % TILE) + TILE) % TILE;
        const base = Math.floor(run.travel / TILE);
        for (const slot of this.slots) {
            const row = base + slot.index;
            const x = slot.col * TILE;
            const y = slot.index * TILE + ORIGIN_Y - scroll;
            slot.tile.setPosition(x, y);
            this._paintTile(slot, tileArt(slot.col, row));
            const art = decoArt(slot.col, row);
            if (!art) {
                slot.deco.node.active = false;
                slot.decoArt = '';
                continue;
            }
            slot.deco.node.active = true;
            slot.deco.setPosition(x, y + 8);
            this._paintDeco(slot, art);
        }
        const alive = new Set<number>();
        for (const item of run.items) {
            const y = PLAYER_Y + item.y - run.travel;
            if (y > 780 || y < -780) {
                continue;
            }
            alive.add(item.id);
            let view = this.active.get(item.id);
            if (!view) {
                view = this.acquire(this.itemRoot);
                const size = item.kind === 'obstacle' ? (item.art === 'cart' ? 120 : 106) : item.kind === 'coin' ? 42 : 54;
                view.setData(RunnerAssets.frames.get(item.art)!, size, item.kind === 'coin' ? 48 : size, item.kind === 'coin');
                this.active.set(item.id, view);
            }
            view.setPosition(item.x, y);
        }
        for (const [id, view] of this.active) {
            if (!alive.has(id)) {
                this.pool.release('item', view.node);
                this.active.delete(id);
            }
        }
    }

    setPaused(paused: boolean): void {
        this.active.forEach((view) => view.setPaused(paused));
    }

    onDestroy(): void {
        this.pool.clear();
    }

    private _paintTile(slot: Slot, art: string): void {
        if (slot.tileArt === art) {
            return;
        }
        const frame = RunnerAssets.frames.get(art);
        if (!frame) {
            return;
        }
        slot.tile.setData(frame, 148, 149);
        slot.tileArt = art;
    }

    private _paintDeco(slot: Slot, art: string): void {
        if (slot.decoArt === art) {
            return;
        }
        const frame = RunnerAssets.frames.get(art);
        if (!frame) {
            slot.deco.node.active = false;
            return;
        }
        const size = decoSize(art);
        slot.deco.setData(frame, size.w, size.h);
        slot.decoArt = art;
    }
}
