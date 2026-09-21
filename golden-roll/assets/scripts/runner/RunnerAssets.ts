import { Asset, AssetManager, assetManager, Constructor, Material, SpriteFrame } from 'cc';
import { AssetService } from '../core/AssetService';

/** Heavy character PNGs/Spine files live in the on-demand runner-art Asset Bundle. */
export class RunnerAssets {
    private static bundle: Promise<AssetManager.Bundle> | null = null;
    static frames = new Map<string, SpriteFrame>();
    static warp: Material | null = null;
    static loadBundle(): Promise<AssetManager.Bundle> {
        return this.bundle ?? (this.bundle = new Promise<AssetManager.Bundle>((resolve, reject) => {
            assetManager.loadBundle('runner-art', (error, bundle) => error ? reject(error) : resolve(bundle));
        }).catch(error => { this.bundle = null; throw error; }));
    }
    static async load<T extends Asset>(path: string, type: Constructor<T>): Promise<T> {
        const bundle = await this.loadBundle();
        return new Promise<T>((resolve, reject) => bundle.load(path, type, (error, asset) => error ? reject(error) : resolve(asset)));
    }
    static async prepare(_skin: string): Promise<void> {
        const map = ['sand-plain', 'sand-cracks', 'path-ns', 'cactus-saguaro', 'agave', 'bush', 'skull-post', 'fence-h', 'rock-pile', 'stone-ball', 'tnt', 'cart', 'crate', 'spike-fence', 'coin', 'heart', 'magnet', 'shield', 'boot'];
        try {
            const revised = new Set(['sand-plain', 'path-ns', 'cactus-saguaro', 'agave', 'bush', 'skull-post', 'fence-h', 'rock-pile', 'cart']);
            await Promise.all([
                ...map.map(async id => this.frames.set(id, revised.has(id)
                    ? await this.load('rear-v2/' + id + '/spriteFrame', SpriteFrame)
                    : await AssetService.load('runner-map/' + id + '/spriteFrame', SpriteFrame))),
                ...['beetle-body', 'hat-cowboy'].map(async id => this.frames.set(id, await this.load('rear-v2/' + id + '/spriteFrame', SpriteFrame))),
                ...['earth', 'gold', 'cactus', 'crystal'].map(async id => this.frames.set('ball-' + id, await this.load('balls/ball-' + id + '/spriteFrame', SpriteFrame))),
            ]);
            this.warp = await AssetService.load('runner-ui/ground-warp', Material);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            throw new Error(detail);
        }
    }
}
