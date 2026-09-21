import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { findNode } from '../core/NodeQuery';
import { NodePool } from '../core/NodePool';
import { PREFAB } from './MapCatalog';
import { MapItem } from './MapItem';
import { cellX, cellY, CHUNK_H, ChunkRecipe, TILE, TILE_DRAW, TILE_DRAW_H } from './MapTypes';

const { ccclass } = _decorator;

@ccclass('ChunkView')
export class ChunkView extends Component {
    recipe: ChunkRecipe | null = null;
    originY = 0;
    pathLeft = 2;
    pathRight = 4;
    readonly items: MapItem[] = [];

    private readonly _tiles: Node[] = [];
    private readonly _props: Node[] = [];

    bind(recipe: ChunkRecipe, originY: number, pool: NodePool, frames: Map<string, SpriteFrame>): void {
        this.release(pool);
        this.recipe = recipe;
        this.originY = originY;
        this.pathLeft = recipe.pathLeft;
        this.pathRight = recipe.pathRight;
        this.node.setPosition(0, originY, 0);
        this.node.active = true;
        for (const tile of recipe.tiles) {
            const node = pool.acquire(PREFAB.tile, this._layer(tile.layer));
            this._paint(node, frames.get(tile.sprite), TILE_DRAW, TILE_DRAW_H);
            node.setPosition(cellX(tile.col), cellY(tile.row), 0);
            this._tiles.push(node);
        }
        for (const prop of recipe.props) {
            const node = pool.acquire(PREFAB.prop, this._layer(prop.layer));
            const frame = frames.get(prop.sprite);
            const scale = prop.scale ?? 1;
            const maxW = TILE * (prop.kind === 'deco' ? 1.35 : 0.98) * scale;
            const maxH = TILE * (prop.kind === 'deco' ? 1.55 : 1.2) * scale;
            const k = frame ? Math.min(1, maxW / frame.width, maxH / frame.height) : 1;
            const w = frame ? Math.max(36, frame.width * k) : 80;
            const h = frame ? Math.max(36, frame.height * k) : 80;
            this._paint(node, frame, w, h);
            node.setPosition(cellX(prop.col), cellY(prop.row), 0);
            const item = node.getComponent(MapItem) ?? node.addComponent(MapItem);
            item.bind(prop.kind, prop.radius);
            this.items.push(item);
            this._props.push(node);
        }
    }

    release(pool: NodePool): void {
        this._tiles.forEach((node) => pool.release(PREFAB.tile, node));
        this._props.forEach((node) => pool.release(PREFAB.prop, node));
        this._tiles.length = 0;
        this._props.length = 0;
        this.items.length = 0;
        this.recipe = null;
        this.node.active = false;
    }

    containsY(y: number): boolean {
        return y >= this.originY && y < this.originY + CHUNK_H;
    }

    private _layer(name: string): Node {
        return findNode(this.node, name) ?? this.node;
    }

    private _paint(node: Node, frame: SpriteFrame | undefined, w: number, h: number): void {
        const sprite = node.getComponent(Sprite);
        if (sprite && frame) {
            sprite.spriteFrame = frame;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        const box = node.getComponent(UITransform);
        box?.setContentSize(w, h);
    }
}
