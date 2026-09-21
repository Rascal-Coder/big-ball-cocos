import {
    CACTUS,
    COINS,
    FENCES,
    HAZARDS,
    LANDMARKS,
    MUD,
    PATH_TILES,
    ROCKS,
    SIDE_DECO,
    SPRITE,
    SpriteId,
} from './MapCatalog';
import { ChunkRecipe, ChunkType, COLS, ItemKind, PropSpec, ROWS, TileSpec } from './MapTypes';

class Rng {
    private s: number;

    constructor(seed: number) {
        this.s = seed >>> 0 || 1;
    }

    next(): number {
        this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0;
        return this.s / 4294967296;
    }

    chance(p: number): boolean {
        return this.next() < p;
    }

    pick<T>(list: readonly T[]): T {
        return list[Math.floor(this.next() * list.length) % list.length];
    }

    int(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min + 1));
    }
}

const TYPE_WEIGHT: Record<Exclude<ChunkType, 'start'>, number> = {
    normal: 52,
    reward: 16,
    trap: 22,
    event: 10,
};

export class MapRules {
    private readonly rng: Rng;
    private prev: ChunkType | null = null;
    private lastEvent = -99;
    private pathLeft = 2;
    private pathRight = 4;
    private index = 0;

    constructor(seed: number) {
        this.rng = new Rng(seed);
    }

    nextRecipe(): ChunkRecipe {
        const type = this._pickType();
        const [left, right] = this._nextPath(type);
        const recipe = this._build(type, left, right);
        this.prev = type;
        this.pathLeft = left;
        this.pathRight = right;
        if (type === 'event') {
            this.lastEvent = this.index;
        }
        this.index += 1;
        return recipe;
    }

    private _pickType(): ChunkType {
        if (this.index === 0) {
            return 'start';
        }
        if (this.index < 3) {
            return 'normal';
        }
        const w = { ...TYPE_WEIGHT };
        if (this.prev === 'trap') {
            w.trap = 0;
        }
        if (this.prev === 'reward') {
            w.reward = 0;
        }
        if (this.index - this.lastEvent < 4) {
            w.event = 0;
        }
        if (this.index > 8) {
            w.trap += 8;
        }
        let roll = this.rng.next() * (w.normal + w.reward + w.trap + w.event);
        for (const type of ['normal', 'reward', 'trap', 'event'] as const) {
            roll -= w[type];
            if (roll <= 0) {
                return type;
            }
        }
        return 'normal';
    }

    private _nextPath(type: ChunkType): [number, number] {
        const want = type === 'trap' ? 3 : type === 'reward' ? 5 : type === 'start' ? 3 : this.rng.chance(0.35) ? 4 : 3;
        let left = this.pathLeft;
        let right = left + want - 1;
        if (right > COLS - 2) {
            right = COLS - 2;
            left = right - want + 1;
        }
        if (left < 1) {
            left = 1;
            right = left + want - 1;
        }
        if (this.index > 0) {
            left = Math.max(1, Math.min(left, this.pathRight - 1));
            right = Math.max(left + want - 1, Math.min(COLS - 2, Math.max(right, this.pathLeft + 1)));
        }
        return [left, right];
    }

    private _build(type: ChunkType, left: number, right: number): ChunkRecipe {
        const tiles: TileSpec[] = [];
        const props: PropSpec[] = [];
        for (let row = 0; row < ROWS; row += 1) {
            for (let col = 0; col < COLS; col += 1) {
                const onPath = col >= left && col <= right;
                tiles.push({
                    col,
                    row,
                    sprite: onPath ? SPRITE[this.rng.pick(PATH_TILES)] : SPRITE[this.rng.pick(SAND_TILES)],
                    layer: onPath ? 'Path' : 'Ground',
                });
            }
        }
        this._placeProps(type, left, right, props);
        return {
            id: `${type}-${this.index}`,
            type,
            pathLeft: left,
            pathRight: right,
            tiles,
            props,
        };
    }

    private _placeProps(type: ChunkType, left: number, right: number, props: PropSpec[]): void {
        if (type === 'start') {
            props.push(this._prop(3, 1, 'sign', 'deco', 14, 'Decor', 1.1));
            this._scatter(props, left, right, 0.2, SIDE_DECO, 'deco', 14, 'Decor', false);
            return;
        }
        if (type === 'event') {
            const landmark = this.rng.pick(LANDMARKS);
            props.push(this._prop(this.rng.chance(0.5) ? left - 1 : right + 1, 3, landmark, 'deco', 18, 'Decor', 1.2));
            props.push(this._prop(3, 4, 'skull', 'deco', 16, 'Decor'));
            if (this.rng.chance(0.45)) {
                props.push(this._prop(left, 2, 'banner', 'deco', 14, 'Decor'));
            }
            this._scatter(props, left, right, 0.2, CACTUS, 'obstacle', 28, 'Obstacle', true);
            this._scatter(props, left, right, 0.22, COINS, 'coin', 20, 'Pickup', true);
            this._scatter(props, left, right, 0.24, SIDE_DECO, 'deco', 14, 'Decor', false);
            return;
        }
        const cactusP = type === 'trap' ? 0.42 : type === 'reward' ? 0.1 : 0.22;
        const rockP = type === 'trap' ? 0.28 : 0.14;
        const coinP = type === 'reward' ? 0.58 : type === 'trap' ? 0.1 : 0.22;
        const mudP = type === 'reward' ? 0.3 : 0.12;
        const hazardP = type === 'trap' ? 0.2 : 0.05;
        this._scatter(props, left, right, cactusP, CACTUS, 'obstacle', 28, 'Obstacle', true);
        this._scatter(props, left, right, rockP, ROCKS, 'obstacle', 24, 'Obstacle', true);
        this._scatter(props, left, right, coinP, COINS, 'coin', 20, 'Pickup', true);
        this._scatter(props, left, right, mudP, MUD, 'mud', 22, 'Pickup', true);
        if (type === 'reward' && this.rng.chance(0.55)) {
            props.push(this._prop(this.rng.int(left, right), this.rng.int(1, ROWS - 2), 'chest', 'coin', 22, 'Pickup'));
        }
        if (this.rng.chance(type === 'reward' ? 0.28 : 0.08)) {
            props.push(this._prop(this.rng.int(left, right), this.rng.int(1, ROWS - 2), 'heart', 'life', 18, 'Pickup'));
        }
        if (this.rng.chance(hazardP)) {
            const sprite = this.rng.pick(HAZARDS);
            const col = this.rng.int(left, right);
            const radius = sprite === 'sinkhole' ? 36 : 26;
            props.push(this._prop(col, this.rng.int(1, ROWS - 2), sprite, 'hazard', radius, 'Obstacle'));
        }
        if (type === 'trap' && this.rng.chance(0.5)) {
            props.push(this._prop(left, this.rng.int(1, ROWS - 2), 'spikes', 'obstacle', 26, 'Obstacle'));
            props.push(this._prop(right, this.rng.int(1, ROWS - 2), this.rng.pick(FENCES), 'obstacle', 22, 'Obstacle'));
        }
        this._scatter(props, left, right, 0.28, SIDE_DECO, 'deco', 14, 'Decor', false);
    }

    private _scatter(
        props: PropSpec[],
        left: number,
        right: number,
        chance: number,
        sprites: readonly SpriteId[],
        kind: ItemKind,
        radius: number,
        layer: PropSpec['layer'],
        onPath: boolean,
    ): void {
        for (let row = 0; row < ROWS; row += 1) {
            if (!this.rng.chance(chance)) {
                continue;
            }
            const cols: number[] = [];
            for (let col = 0; col < COLS; col += 1) {
                const path = col >= left && col <= right;
                if (path !== onPath) {
                    continue;
                }
                if (onPath && kind === 'obstacle' && col > left && col < right) {
                    continue;
                }
                if (props.some((p) => p.col === col && p.row === row)) {
                    continue;
                }
                cols.push(col);
            }
            if (cols.length === 0) {
                continue;
            }
            props.push(this._prop(this.rng.pick(cols), row, this.rng.pick(sprites), kind, radius, layer));
        }
    }

    private _prop(
        col: number,
        row: number,
        sprite: SpriteId,
        kind: ItemKind,
        radius: number,
        layer: PropSpec['layer'],
        scale = 1,
    ): PropSpec {
        const safeCol = Math.max(0, Math.min(COLS - 1, col));
        return { col: safeCol, row, sprite: SPRITE[sprite], kind, radius, layer, scale };
    }
}
