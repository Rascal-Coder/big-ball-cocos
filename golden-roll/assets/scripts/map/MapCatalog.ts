/** docs/new-map 四张 5×4 图：地砖 / 装饰 / 障碍 / 道具。 */
export const MAP_THEME = 'desert';

const P = (file: string) => `map/${MAP_THEME}/${file}/spriteFrame`;

export const SPRITE = {
    sandPlain: P('sand-plain'),
    sandPebbles: P('sand-pebbles'),
    sandTuft: P('sand-tuft'),
    sandCracks: P('sand-cracks'),
    sandTracks: P('sand-tracks'),
    sandRocks: P('sand-rocks'),
    sandDark: P('sand-dark'),
    sandCacti: P('sand-cacti'),
    cliffCorner: P('cliff-corner'),
    pathNs: P('path-ns'),
    pathCorner: P('path-corner'),
    pathCross: P('path-cross'),
    pathT: P('path-t'),
    sandWeeds: P('sand-weeds'),
    sandPlates: P('sand-plates'),
    pitTile: P('pit-tile'),
    sandBoulders: P('sand-boulders'),
    cactusTile: P('cactus-tile'),
    deadWoodTile: P('dead-wood-tile'),
    sandDunes: P('sand-dunes'),

    cactusSaguaro: P('cactus-saguaro'),
    cactusSmall: P('cactus-small'),
    cactusBarrel: P('cactus-barrel'),
    cactusFlower: P('cactus-flower'),
    bush: P('bush'),
    tumbleweed: P('tumbleweed'),
    agave: P('agave'),
    shrub: P('shrub'),
    deadBranch: P('dead-branch'),
    stump: P('stump'),
    fenceH: P('fence-h'),
    fenceAngle: P('fence-angle'),
    sign: P('signpost'),
    lantern: P('lantern'),
    skull: P('skull-bull'),
    bones: P('bones'),
    wagonWheel: P('wagon-wheel'),
    banner: P('banner'),
    rocksPlant: P('rocks-plant'),
    cactusPads: P('cactus-pads'),

    boulder: P('boulder'),
    stoneBall: P('stone-ball'),
    rockPile: P('rock-pile'),
    spikeFence: P('spike-fence'),
    spikes: P('spike-ring'),
    cairn: P('cairn'),
    cactusPair: P('cactus-pair'),
    thornBush: P('thorn-bush'),
    tnt: P('tnt'),
    crate: P('crate'),
    barrels: P('barrels'),
    minecart: P('minecart'),
    rail: P('rail'),
    cart: P('cart'),
    fenceWood: P('fence-wood'),
    snake: P('snake'),
    skullPost: P('skull-post'),
    sinkhole: P('sinkhole'),
    mudBall: P('mud-ball'),
    barrierX: P('barrier-x'),

    coin: P('coin'),
    goldNugget: P('gold-nuggets'),
    goldSack: P('gold-sack'),
    heart: P('heart'),
    magnet: P('magnet'),
    star: P('star-badge'),
    shield: P('shield'),
    boot: P('boot'),
    bomb: P('bomb'),
    chest: P('chest'),
    horseshoe: P('horseshoe'),
    hole: P('hole'),
} as const;

export type SpriteId = keyof typeof SPRITE;

export const SAND_TILES: SpriteId[] = [
    'sandPlain',
    'sandPebbles',
    'sandTuft',
    'sandCracks',
    'sandRocks',
    'sandDark',
    'sandCacti',
    'sandWeeds',
    'sandPlates',
    'sandBoulders',
    'sandDunes',
];

/** 路面用沙地变体，不用十字/丁字路口砖乱铺。 */
export const PATH_FLOOR: SpriteId[] = ['sandTracks', 'sandPlain', 'sandPebbles', 'sandTuft', 'sandWeeds'];

export const TILE_SPIN: readonly SpriteId[] = [
    'sandPlain',
    'sandPebbles',
    'sandTuft',
    'sandCracks',
    'sandRocks',
    'sandWeeds',
    'sandPlates',
    'sandDark',
    'sandDunes',
];

export const SAND_WEIGHT: Partial<Record<SpriteId, number>> = {
    sandPlain: 26,
    sandPebbles: 18,
    sandTuft: 14,
    sandWeeds: 12,
    sandCracks: 8,
    sandRocks: 7,
    sandDunes: 6,
    sandPlates: 5,
    sandDark: 4,
    sandCacti: 2,
    sandBoulders: 2,
};

export const PATH_WEIGHT: Partial<Record<SpriteId, number>> = {
    sandTracks: 36,
    sandPlain: 22,
    sandPebbles: 16,
    sandTuft: 14,
    sandWeeds: 12,
};

export const CACTUS: SpriteId[] = [
    'cactusSaguaro',
    'cactusSmall',
    'cactusBarrel',
    'cactusFlower',
    'cactusPair',
    'cactusPads',
    'thornBush',
];

export const ROCKS: SpriteId[] = ['boulder', 'stoneBall', 'rockPile', 'rocksPlant', 'cairn', 'crate', 'barrels'];

export const SIDE_DECO: SpriteId[] = [
    'bush',
    'tumbleweed',
    'agave',
    'shrub',
    'deadBranch',
    'stump',
    'bones',
    'wagonWheel',
    'skull',
    'lantern',
];

export const FENCES: SpriteId[] = ['fenceH', 'fenceAngle', 'fenceWood', 'spikeFence', 'barrierX'];

export const HAZARDS: SpriteId[] = ['sinkhole', 'spikes', 'bomb', 'tnt', 'snake', 'hole'];

export const COINS: SpriteId[] = ['coin', 'goldSack', 'goldNugget', 'star', 'chest', 'horseshoe'];

export const MUD: SpriteId[] = ['mudBall'];

export const LANDMARKS: SpriteId[] = ['minecart', 'cart', 'banner', 'skullPost', 'sign'];

export const PREFAB = {
    tile: 'map/prefabs/map-tile',
    prop: 'map/prefabs/map-prop',
    chunk: 'map/prefabs/map-chunk',
} as const;
