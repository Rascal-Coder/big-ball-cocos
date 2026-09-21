import { Asset, AssetManager, assetManager, Constructor, sp, SpriteFrame } from 'cc';
import { AssetService } from '../core/AssetService';

/** Heavy character PNGs/Spine files live in the on-demand runner-art Asset Bundle. */
export class RunnerAssets {
    private static bundle: Promise<AssetManager.Bundle> | null = null;
    static frames = new Map<string, SpriteFrame>();
    static loadBundle(): Promise<AssetManager.Bundle> {
        return this.bundle ?? (this.bundle = new Promise<AssetManager.Bundle>((resolve, reject) => {
            assetManager.loadBundle('runner-art', (error, bundle) => error ? reject(error) : resolve(bundle));
        }).catch(error => { this.bundle = null; throw error; }));
    }
    static async load<T extends Asset>(path: string, type: Constructor<T>): Promise<T> {
        const bundle = await this.loadBundle();
        return new Promise<T>((resolve, reject) => bundle.load(path, type, (error, asset) => error ? reject(error) : resolve(asset)));
    }
    static async prepare(skin: string): Promise<sp.SkeletonData> {
        const map = ['sand-plain', 'sand-cracks', 'path-ns', 'cactus-saguaro', 'agave', 'bush', 'skull-post', 'fence-h', 'rock-pile', 'stone-ball', 'tnt', 'cart', 'crate', 'spike-fence', 'coin', 'heart', 'magnet', 'shield', 'boot'];
        const [skeleton] = await Promise.all([
            this.load('characters/' + skin + '/' + skin, sp.SkeletonData),
            ...map.map(async id => this.frames.set(id, await AssetService.load('runner-map/' + id + '/spriteFrame', SpriteFrame))),
            ...['earth', 'gold', 'cactus', 'crystal'].map(async id => this.frames.set('ball-' + id, await this.load('balls/ball-' + id + '/spriteFrame', SpriteFrame))),
        ]);
        return skeleton;
    }
}
