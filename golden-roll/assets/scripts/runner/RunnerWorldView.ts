import { _decorator, Component, Node, Prefab } from 'cc';
import { NodePool } from '../core/NodePool';
import { RunnerAssets } from './RunnerAssets';
import { RunnerItemView } from './RunnerItemView';
import { GROUND_STEP, hazeColor, projectBand, projectSprite, TILE } from './RunnerProjection';
import { RunnerModel } from './RunnerModel';

const { ccclass, property } = _decorator;

const SLOTS = 64;
const BACK_ROWS = 7;
const PATH_HALF = TILE * 1.28;
const SAND_OUTER = TILE * 5.2;
const DECO_COLS = [-3, -2, 2, 3] as const;
const SIDE_DECO = ['cactus-saguaro', 'agave', 'bush', 'skull-post', 'fence-h', 'rock-pile'] as const;

type Band = { view: RunnerItemView; art: string };
type Deco = { col: number; view: RunnerItemView; art: string };
type Row = { index: number; left: Band; path: Band; right: Band; decos: Deco[] };

function cellHash(col: number, row: number, salt = 0): number {
    let n = (row + 19) * 374761393 + (col + 7) * 668265263 + salt * 1274126177;
    n = Math.imul(n ^ (n >>> 15), 2246822519);
    return n >>> 0;
}

function decoArt(col: number, row: number): string {
    const n = cellHash(col, row, 91);
    if (n % 100 > (Math.abs(col) === 2 ? 52 : 70)) {
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

function itemSize(kind: string, art: string): { w: number; h: number; lift: number } {
    if (kind === 'coin') {
        return { w: 42, h: 48, lift: 22 };
    }
    if (art === 'cart') {
        return { w: 120, h: 120, lift: 36 };
    }
    if (kind === 'obstacle') {
        return { w: 106, h: 106, lift: 32 };
    }
    return { w: 54, h: 54, lift: 24 };
}

@ccclass('RunnerWorldView')
export class RunnerWorldView extends Component {
    @property(Node) terrainRoot: Node = null!;
    @property(Node) itemRoot: Node = null!;
    @property(Prefab) itemPrefab: Prefab = null!;
    private pool = new NodePool();
    private rows: Row[] = [];
    private active = new Map<number, RunnerItemView>();
    private initialized = false;

    private acquire(parent: Node): RunnerItemView {
        return this.pool.acquire('item', parent).getComponent(RunnerItemView)!;
    }

    reset(): void {
        if (this.rows.length && this.rows.length !== SLOTS) {
            this.rows.forEach((row) => {
                this.pool.release('item', row.left.view.node);
                this.pool.release('item', row.path.view.node);
                this.pool.release('item', row.right.view.node);
                row.decos.forEach((deco) => this.pool.release('item', deco.view.node));
            });
            this.rows = [];
            this.initialized = false;
        }
        if (!this.initialized) {
            this.pool.register('item', this.itemPrefab);
            for (let index = SLOTS - 1; index >= 0; index -= 1) {
                this.rows.push({
                    index,
                    left: { view: this.acquire(this.terrainRoot), art: '' },
                    path: { view: this.acquire(this.terrainRoot), art: '' },
                    right: { view: this.acquire(this.terrainRoot), art: '' },
                    decos: DECO_COLS.map((col) => ({ col, view: this.acquire(this.terrainRoot), art: '' })),
                });
            }
            this.initialized = true;
            this.node.parent?.children.forEach((child) => {
                if (child.name === 'CanyonEdge') {
                    child.active = false;
                }
            });
        }
        this.active.forEach((view) => this.pool.release('item', view.node));
        this.active.clear();
        this.rows.forEach((row) => {
            row.left.art = '';
            row.path.art = '';
            row.right.art = '';
            row.decos.forEach((deco) => { deco.art = ''; });
        });
    }

    render(run: RunnerModel): void {
        const scroll = ((run.travel % GROUND_STEP) + GROUND_STEP) % GROUND_STEP;
        for (const row of this.rows) {
            const strip = Math.floor(run.travel / GROUND_STEP) + row.index - BACK_ROWS;
            const worldRow = Math.floor(strip / 4);
            const depth = row.index * GROUND_STEP - scroll - BACK_ROWS * GROUND_STEP;
            const path = projectBand(-PATH_HALF, PATH_HALF, depth);
            const left = projectBand(-SAND_OUTER, -PATH_HALF + 3, depth);
            const right = projectBand(PATH_HALF - 3, SAND_OUTER, depth);
            const visible = path.z > 0.16 && path.bl.y < 380;
            const v = ((strip % 32) + 32) % 32 / 16;
            const uv = { u0: 0, v0: 1 - v - 1 / 16, u1: 1, v1: 1 - v };
            this._paintBand(row.path, 'path-ns', path, depth, visible, uv, true);
            this._paintBand(row.left, 'sand-plain', left, depth, visible, uv, false);
            this._paintBand(row.right, 'sand-plain', right, depth, visible, uv, false);
            for (const deco of row.decos) {
                const art = visible && strip % 4 === 0 && path.z > 0.18 ? decoArt(deco.col, worldRow) : '';
                if (!art) {
                    deco.view.node.active = false;
                    deco.art = '';
                    continue;
                }
                const size = decoSize(art);
                const pose = projectSprite(deco.col * TILE, depth + TILE * 0.35, size.h * 0.5);
                deco.view.node.active = true;
                this._paintDeco(deco, art);
                deco.view.setPose(pose.x, pose.y, pose.s, pose.s, depth + 1);
                const tint = hazeColor(pose.z);
                deco.view.setTint(tint.r, tint.g, tint.b, tint.a);
            }
        }
        const alive = new Set<number>();
        for (const item of run.items) {
            const depth = item.y - run.travel;
            if (depth < -90 || depth > 2100) {
                continue;
            }
            const size = itemSize(item.kind, item.art);
            const pulse = item.kind === 'coin' ? 0.86 + Math.sin(run.time * 8 + item.id) * 0.14 : 1;
            const pose = projectSprite(item.x, depth, item.kind === 'obstacle' ? size.h * 0.5 : size.lift);
            if (pose.z < 0.14 || pose.y > 380) {
                continue;
            }
            alive.add(item.id);
            let view = this.active.get(item.id);
            if (!view) {
                view = this.acquire(this.itemRoot);
                view.setData(RunnerAssets.frames.get(item.art)!, size.w, size.h);
                this.active.set(item.id, view);
            }
            const tint = hazeColor(pose.z);
            view.setPose(pose.x, pose.y, pose.s * pulse, pose.s * pulse, depth);
            view.setTint(tint.r, tint.g, tint.b, tint.a);
        }
        for (const [id, view] of this.active) {
            if (!alive.has(id)) {
                this.pool.release('item', view.node);
                this.active.delete(id);
            }
        }
        const ordered = [...this.active.values()].sort((a, b) => b.depth - a.depth);
        ordered.forEach((view, index) => view.node.setSiblingIndex(index));
    }

    setPaused(paused: boolean): void {
        this.active.forEach((view) => view.setPaused(paused));
    }

    onDestroy(): void {
        this.pool.clear();
    }

    private _paintBand(
        band: Band,
        art: string,
        quad: ReturnType<typeof projectBand>,
        depth: number,
        visible: boolean,
        uv: { u0: number; v0: number; u1: number; v1: number },
        isPath = false,
    ): void {
        band.view.node.active = visible;
        if (!visible) {
            return;
        }
        if (band.art !== art) {
            const frame = RunnerAssets.frames.get(art);
            if (!frame) {
                return;
            }
            band.view.setData(frame, 148, 149);
            band.art = art;
        }
        const tint = hazeColor(quad.z, isPath);
        band.view.setTrapezoid(quad.bl, quad.br, quad.tl, quad.tr, depth, uv);
        band.view.setTint(tint.r, tint.g, tint.b, tint.a);
    }

    private _paintDeco(deco: Deco, art: string): void {
        if (deco.art === art) {
            return;
        }
        const frame = RunnerAssets.frames.get(art);
        if (!frame) {
            deco.view.node.active = false;
            return;
        }
        const size = decoSize(art);
        deco.view.setData(frame, size.w, size.h);
        deco.art = art;
    }
}
