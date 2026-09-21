import { _decorator, Component, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { AssetService } from '../core/AssetService';
import { NodePool } from '../core/NodePool';
import { PREFAB, SPRITE } from './MapCatalog';
import { ChunkView } from './ChunkView';
import { MapItem } from './MapItem';
import { MapRules } from './MapRules';
import { cellX, CHUNK_H, KEEP_AHEAD, KEEP_BEHIND, TILE } from './MapTypes';

const { ccclass } = _decorator;

@ccclass('MapStreamer')
export class MapStreamer extends Component {
    pathHalfWidth = 160;

    private readonly pool = new NodePool();
    private readonly frames = new Map<string, SpriteFrame>();
    private readonly active: ChunkView[] = [];
    private rules: MapRules | null = null;
    private nextY = 0;
    private ready = false;
    private bed: Node | null = null;

    async setup(): Promise<void> {
        if (this.ready) {
            return;
        }
        const [tile, prop, chunk] = await Promise.all([
            AssetService.loadPrefab(PREFAB.tile),
            AssetService.loadPrefab(PREFAB.prop),
            AssetService.loadPrefab(PREFAB.chunk),
        ]);
        this.pool.register(PREFAB.tile, tile);
        this.pool.register(PREFAB.prop, prop);
        this.pool.register(PREFAB.chunk, chunk);
        await this._loadSprites();
        this._ensureBed();
        this.ready = true;
    }

    reset(seed: number): void {
        this._recycleAll();
        this.rules = new MapRules(seed);
        this.nextY = -CHUNK_H * 2;
        this.pathHalfWidth = 160;
        this._paintBed(0);
        this.tick(0);
    }

    tick(ballY: number): void {
        if (!this.ready || !this.rules) {
            return;
        }
        while (this.nextY < ballY + KEEP_AHEAD) {
            this._spawn();
        }
        for (let i = this.active.length - 1; i >= 0; i -= 1) {
            const chunk = this.active[i];
            if (chunk.originY + CHUNK_H < ballY - KEEP_BEHIND) {
                chunk.release(this.pool);
                this.pool.release(PREFAB.chunk, chunk.node);
                this.active.splice(i, 1);
            }
        }
        this._paintBed(ballY);
        const here = this.active.find((chunk) => chunk.containsY(ballY));
        if (here) {
            const span = cellX(here.pathRight) - cellX(here.pathLeft) + TILE;
            this.pathHalfWidth = Math.max(90, span * 0.5 - 46);
        }
    }

    collect(x: number, y: number, radius: number): MapItem[] {
        const hits: MapItem[] = [];
        for (const chunk of this.active) {
            for (const item of chunk.items) {
                if (item.taken || item.kind === 'deco') {
                    continue;
                }
                const lx = item.node.position.x;
                const ly = chunk.originY + item.node.position.y;
                const dx = lx - x;
                const dy = ly - y;
                const hit = radius + item.radius;
                if (dx * dx + dy * dy <= hit * hit) {
                    hits.push(item);
                }
            }
        }
        return hits;
    }

    clear(): void {
        this._recycleAll();
        this.pool.clear();
        this.ready = false;
    }

    private _spawn(): void {
        if (!this.rules) {
            return;
        }
        const recipe = this.rules.nextRecipe();
        const node = this.pool.acquire(PREFAB.chunk, this.node);
        const view = node.getComponent(ChunkView) ?? node.addComponent(ChunkView);
        view.bind(recipe, this.nextY, this.pool, this.frames);
        this.active.push(view);
        this.nextY += CHUNK_H;
    }

    private _recycleAll(): void {
        this.active.forEach((chunk) => {
            chunk.release(this.pool);
            this.pool.release(PREFAB.chunk, chunk.node);
        });
        this.active.length = 0;
    }

    private _ensureBed(): void {
        if (this.bed?.isValid) {
            return;
        }
        const node = this.pool.acquire(PREFAB.tile, this.node);
        node.name = 'SandBed';
        node.setSiblingIndex(0);
        const frame = this.frames.get(SPRITE.sandPlain);
        const sprite = node.getComponent(Sprite);
        if (sprite && frame) {
            frame.texture?.setWrapMode(Texture2D.WrapMode.REPEAT, Texture2D.WrapMode.REPEAT);
            sprite.spriteFrame = frame;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.type = Sprite.Type.TILED;
        }
        node.getComponent(UITransform)?.setContentSize(2400, 6400);
        this.bed = node;
    }

    private _paintBed(ballY: number): void {
        this.bed?.setPosition(0, ballY + 800, 0);
    }

    private async _loadSprites(): Promise<void> {
        const paths = [...new Set(Object.values(SPRITE))];
        await Promise.all(
            paths.map(async (path) => {
                try {
                    this.frames.set(path, await AssetService.load(path, SpriteFrame));
                } catch (err) {
                    console.warn('[MapStreamer] sprite', path, err);
                }
            }),
        );
    }
}
