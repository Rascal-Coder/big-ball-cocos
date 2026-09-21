import { instantiate, Node, Prefab } from 'cc';
import { AssetService } from '../core/AssetService';
import { ConfirmView } from './ConfirmView';
import { ToastView } from './ToastView';

/** 跨页面 Toast / Confirm。弹窗 Prefab 动态打开关闭。 */
export class OverlayService {
    private static _layer: Node | null = null;
    private static _toast: ToastView | null = null;
    private static _confirm: ConfirmView | null = null;
    private static _toastPrefab: Prefab | null = null;
    private static _confirmPrefab: Prefab | null = null;

    static bind(layer: Node | null): void {
        this._layer = layer;
    }

    static async showToast(message: string): Promise<void> {
        try {
            const view = await this._toastView();
            view?.show(message);
        } catch (err) {
            console.warn('[OverlayService] toast', err);
        }
    }

    static async showConfirm(title: string, body: string, onOk?: () => void, onCancel?: () => void): Promise<void> {
        try {
            const view = await this._confirmView();
            view?.open(title, body, onOk, onCancel);
        } catch (err) {
            console.warn('[OverlayService] confirm', err);
        }
    }

    private static async _toastView(): Promise<ToastView | null> {
        if (this._toast?.isValid) {
            return this._toast;
        }
        const node = await this._mount('ui/prefabs/toast', 'Toast');
        if (!node) {
            return null;
        }
        this._toast = node.getComponent(ToastView) ?? node.addComponent(ToastView);
        return this._toast;
    }

    private static async _confirmView(): Promise<ConfirmView | null> {
        if (this._confirm?.isValid) {
            return this._confirm;
        }
        const node = await this._mount('ui/prefabs/confirm', 'Confirm');
        if (!node) {
            return null;
        }
        this._confirm = node.getComponent(ConfirmView) ?? node.addComponent(ConfirmView);
        node.active = false;
        return this._confirm;
    }

    private static async _mount(path: string, name: string): Promise<Node | null> {
        if (!this._layer?.isValid) {
            return null;
        }
        const existing = this._layer.getChildByName(name);
        if (existing) {
            return existing;
        }
        const prefab = path.endsWith('toast')
            ? (this._toastPrefab ??= await AssetService.loadPrefab(path))
            : (this._confirmPrefab ??= await AssetService.loadPrefab(path));
        const node = instantiate(prefab);
        node.name = name;
        this._layer.addChild(node);
        return node;
    }
}
