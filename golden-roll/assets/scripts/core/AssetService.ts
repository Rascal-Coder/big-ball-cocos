import { Asset, Constructor, Prefab, assetManager, resources } from 'cc';

/** 资源入口。第一期走 resources，后续可换成 AssetBundle。 */
export class AssetService {
    static get<T extends Asset>(path: string, type: Constructor<T>): T | null {
        return resources.get(path, type) ?? null;
    }

    static load<T extends Asset>(path: string, type: Constructor<T>): Promise<T> {
        const hit = this.get(path, type);
        if (hit) {
            return Promise.resolve(hit);
        }
        return new Promise((resolve, reject) => {
            resources.load(path, type, (err: Error | null, asset: T) => {
                if (err || !asset) {
                    reject(err ?? new Error(`AssetService.load failed: ${path}`));
                    return;
                }
                resolve(asset);
            });
        });
    }

    static loadPrefab(path: string): Promise<Prefab> {
        return this.load(path, Prefab);
    }

    static preload(
        items: Array<readonly [string, Constructor<Asset>]>,
        onProgress?: (t: number) => void,
    ): Promise<void> {
        if (items.length === 0) {
            onProgress?.(1);
            return Promise.resolve();
        }
        let done = 0;
        return Promise.all(
            items.map(([path, type]) =>
                this.load(path, type)
                    .catch((err) => {
                        console.warn('[AssetService] preload', path, err);
                        return null;
                    })
                    .then(() => {
                        done += 1;
                        onProgress?.(done / items.length);
                    }),
            ),
        ).then(() => undefined);
    }

    static release(asset: Asset): void {
        assetManager.releaseAsset(asset);
    }
}
