import { _decorator, Color, Component, EventTouch, Graphics, instantiate, Layout, Node, Prefab, ScrollView, Sprite, UITransform } from 'cc';
import { AVATAR_SKINS } from '../avatar/AvatarSkinData';
import { AssetService } from '../core/AssetService';
import { GameModel } from '../core/GameModel';
import { findNode } from '../core/NodeQuery';
import { SkinCell } from './SkinCell';

const { ccclass } = _decorator;

const KEEP_OPEN = new Set([
    'SkinScroll',
    'view',
    'SkinGrid',
    'SkinBar',
    'SkinBarTrack',
    'bar',
    'SkinTitle',
]);

const COLS = 2;
const CELL_W = 200;
const CELL_H = 196;
const GAP_X = 18;
const GAP_Y = 14;
const PAD_T = 8;
const PAD_B = 16;

@ccclass('SkinModalView')
export class SkinModalView extends Component {
    private _model: GameModel | null = null;
    private _onPicked: (() => void) | null = null;
    private _cellPrefab: Prefab | null = null;
    private _pressOnContent = false;

    onLoad(): void {
        const dim = findNode(this.node, 'Dim');
        const t = dim?.getComponent(UITransform);
        if (dim && t && !dim.getComponent(Graphics)) {
            const g = dim.addComponent(Graphics);
            g.fillColor = new Color(48, 28, 14, 170);
            g.rect(-t.width / 2, -t.height / 2, t.width, t.height);
            g.fill();
        }
    }

    onEnable(): void {
        for (const name of ['Dim', 'SkinPanel'] as const) {
            const node = findNode(this.node, name);
            node?.on(Node.EventType.TOUCH_START, this._onBlankStart, this);
            node?.on(Node.EventType.TOUCH_END, this._onBlankEnd, this);
        }
    }

    onDisable(): void {
        for (const name of ['Dim', 'SkinPanel'] as const) {
            const node = findNode(this.node, name);
            node?.off(Node.EventType.TOUCH_START, this._onBlankStart, this);
            node?.off(Node.EventType.TOUCH_END, this._onBlankEnd, this);
        }
    }

    async open(model: GameModel, onPicked?: () => void): Promise<void> {
        this._model = model;
        this._onPicked = onPicked ?? null;
        this.node.active = true;
        if (!this._cellPrefab) {
            this._cellPrefab = await AssetService.loadPrefab('ui/prefabs/skin-cell');
        }
        this._fillGrid();
    }

    close(): void {
        this.node.active = false;
    }

    private _onBlankStart(event: EventTouch): void {
        this._pressOnContent = this._isContentTarget(event.target as Node);
    }

    private _onBlankEnd(event: EventTouch): void {
        event.propagationStopped = true;
        const onContent = this._pressOnContent || this._isContentTarget(event.target as Node);
        this._pressOnContent = false;
        if (onContent) {
            return;
        }
        this.close();
    }

    private _isContentTarget(target: Node | null): boolean {
        let node = target;
        while (node?.isValid && node !== this.node) {
            if (node.name.startsWith('Skin_') || KEEP_OPEN.has(node.name) || node.getComponent(SkinCell)) {
                return true;
            }
            node = node.parent;
        }
        return false;
    }

    private _fillGrid(): void {
        const grid = findNode(this.node, 'SkinGrid');
        if (!grid || !this._cellPrefab || !this._model) {
            return;
        }
        const layout = grid.getComponent(Layout);
        if (layout) {
            layout.enabled = false;
        }
        grid.removeAllChildren();
        const current = this._model.skinId;
        AVATAR_SKINS.forEach((skin, index) => {
            const node = instantiate(this._cellPrefab!);
            node.name = `Skin_${skin.id}`;
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            node.setPosition(
                (col - (COLS - 1) / 2) * (CELL_W + GAP_X),
                -PAD_T - row * (CELL_H + GAP_Y) - CELL_H / 2,
                0,
            );
            const cell = node.getComponent(SkinCell) ?? node.addComponent(SkinCell);
            cell.bind(skin.id, skin.name, skin.id === current);
            cell.onPick = (id) => this._pick(id);
            grid.addChild(node);
        });
        this._sizeContent(grid, AVATAR_SKINS.length);
        this._clipScrollBar();
        findNode(this.node, 'SkinScroll')?.getComponent(ScrollView)?.scrollToTop(0);
    }

    private _sizeContent(grid: Node, count: number): void {
        const view = grid.parent?.getComponent(UITransform);
        const content = grid.getComponent(UITransform);
        if (!view || !content) {
            return;
        }
        const rows = Math.ceil(count / COLS);
        const height = PAD_T + PAD_B + rows * CELL_H + Math.max(0, rows - 1) * GAP_Y;
        content.setAnchorPoint(0.5, 1);
        content.setContentSize(view.width, height);
        grid.setPosition(0, view.height / 2, 0);
    }

    private _clipScrollBar(): void {
        const leftoverRail = findNode(this.node, 'SkinBarRail');
        if (leftoverRail) {
            leftoverRail.active = false;
        }
        const leftoverCap = findNode(this.node, 'SkinBarCap');
        if (leftoverCap) {
            leftoverCap.active = false;
        }
        const panel = findNode(this.node, 'SkinPanel');
        const track = findNode(this.node, 'SkinBarTrack');
        const bar = findNode(this.node, 'SkinBar');
        const handle = findNode(bar, 'bar');
        if (track) {
            track.active = true;
            const trackTf = track.getComponent(UITransform);
            trackTf?.setContentSize(268, 34);
            track.setRotationFromEuler(0, 0, 90);
            track.setPosition(208, 6, 0);
            const trackSprite = track.getComponent(Sprite);
            if (trackSprite) {
                trackSprite.enabled = true;
                trackSprite.sizeMode = Sprite.SizeMode.CUSTOM;
                trackSprite.type = Sprite.Type.SIMPLE;
                trackSprite.trim = false;
            }
            if (panel && track.parent === panel) {
                const close = findNode(panel, 'SkinClose');
                track.setSiblingIndex(Math.max(0, (close?.getSiblingIndex() ?? panel.children.length) - 1));
            }
        }
        if (!bar || !handle) {
            return;
        }
        bar.active = true;
        const barTf = bar.getComponent(UITransform);
        barTf?.setContentSize(14, 220);
        bar.setPosition(208, 6, 0);
        const handleTf = handle.getComponent(UITransform);
        const sprite = handle.getComponent(Sprite);
        if (sprite) {
            sprite.enabled = true;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            sprite.type = Sprite.Type.SLICED;
            sprite.trim = false;
        }
        if (barTf && handleTf) {
            handleTf.setContentSize(10, Math.min(64, barTf.height - 40));
        }
        if (panel && bar.parent === panel && track) {
            bar.setSiblingIndex(track.getSiblingIndex() + 1);
        }
    }

    private _pick(id: string): void {
        this._model?.setSkin(id);
        this._onPicked?.();
        this.close();
    }
}
