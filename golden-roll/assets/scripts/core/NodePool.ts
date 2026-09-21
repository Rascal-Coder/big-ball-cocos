import { instantiate, Node, Prefab } from 'cc';

/** 按预制体路径回收节点。 */
export class NodePool {
    private readonly buckets = new Map<string, Node[]>();
    private readonly prefabs = new Map<string, Prefab>();

    register(key: string, prefab: Prefab): void {
        this.prefabs.set(key, prefab);
        if (!this.buckets.has(key)) {
            this.buckets.set(key, []);
        }
    }

    acquire(key: string, parent?: Node | null): Node {
        const bag = this.buckets.get(key) ?? [];
        const node = bag.pop() ?? this._create(key);
        if (!node?.isValid) {
            throw new Error(`NodePool.acquire failed: ${key}`);
        }
        node.active = true;
        if (parent) {
            parent.addChild(node);
        }
        return node;
    }

    release(key: string, node: Node | null): void {
        if (!node?.isValid) {
            return;
        }
        node.active = false;
        node.removeFromParent();
        const bag = this.buckets.get(key) ?? [];
        bag.push(node);
        this.buckets.set(key, bag);
    }

    clear(): void {
        this.buckets.forEach((bag) => bag.forEach((node) => node.destroy()));
        this.buckets.clear();
    }

    private _create(key: string): Node {
        const prefab = this.prefabs.get(key);
        if (!prefab) {
            throw new Error(`NodePool missing prefab: ${key}`);
        }
        return instantiate(prefab);
    }
}
