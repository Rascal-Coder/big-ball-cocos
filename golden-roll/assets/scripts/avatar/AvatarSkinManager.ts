import { Rect, Size, SpriteFrame, Texture2D, Vec2, resources } from 'cc';
import {
    AVATAR_SHEET_CELL_W,
    AVATAR_SHEET_GROUPS,
    AVATAR_SHEET_PATH,
    AVATAR_SHEET_ROWS,
    AVATAR_SHEET_SLICE_VERSION,
    AVATAR_SKINS,
    DEFAULT_AVATAR_SKIN_ID,
    resolveAvatarSkin,
    SkinAnimationData,
} from './AvatarSkinData';

type LoadCallback = (ok: boolean) => void;

/**
 * 所有皮肤共用一份 SpriteSheet，运行时按行切帧并缓存。
 * 新皮肤只需在 AvatarSkinData.AVATAR_SKINS 加一行，不要改动画代码。
 */
export class AvatarSkinManager {
    static readonly instance = new AvatarSkinManager();

    private _ready = false;
    private _loading = false;
    private _sliceVersion = -1;
    private _sheet: SpriteFrame | null = null;
    private readonly _skins = new Map<string, SkinAnimationData>();
    private readonly _waiters: LoadCallback[] = [];

    get ready(): boolean {
        return this._ready;
    }

    load(onDone?: LoadCallback): void {
        if (this._ready && this._sliceVersion === AVATAR_SHEET_SLICE_VERSION) {
            onDone?.(true);
            return;
        }
        if (this._sheet && this._sliceVersion !== AVATAR_SHEET_SLICE_VERSION) {
            if (onDone) {
                this._waiters.push(onDone);
            }
            this.bindSheet(this._sheet);
            return;
        }
        if (onDone) {
            this._waiters.push(onDone);
        }
        if (this._loading) {
            return;
        }
        this._loading = true;
        resources.load(AVATAR_SHEET_PATH, SpriteFrame, (err: Error | null, sheet: SpriteFrame) => {
            this._loading = false;
            if (err || !sheet || !sheet.texture) {
                this._flush(false);
                return;
            }
            this.bindSheet(sheet);
        });
    }

    /** Inspector 手动拖入整表时走这里，跳过 resources.load。 */
    bindSheet(sheet: SpriteFrame): void {
        this._release();
        this._sheet = sheet;
        const texture = sheet.texture as Texture2D;
        for (const def of AVATAR_SKINS) {
            this._skins.set(def.id, this._sliceSkin(texture, def.id, def.row, def.hatSwayMax));
        }
        this._sliceVersion = AVATAR_SHEET_SLICE_VERSION;
        this._ready = true;
        this._flush(true);
    }

    get(id: string | null | undefined): SkinAnimationData | null {
        if (!this._ready) {
            return null;
        }
        return this._skins.get(resolveAvatarSkin(id).id) ?? this._skins.get(DEFAULT_AVATAR_SKIN_ID) ?? null;
    }

    ids(): string[] {
        return AVATAR_SKINS.map((skin) => skin.id);
    }

    release(): void {
        this._release();
        this._ready = false;
        this._loading = false;
        this._waiters.length = 0;
    }

    private _flush(ok: boolean): void {
        const waiters = this._waiters.splice(0, this._waiters.length);
        for (let i = 0; i < waiters.length; i++) {
            waiters[i](ok);
        }
    }

    private _release(): void {
        this._skins.clear();
        this._sheet = null;
        this._ready = false;
        this._sliceVersion = -1;
    }

    private _sliceSkin(texture: Texture2D, id: string, row: number, hatSwayMax: number): SkinAnimationData {
        const band = AVATAR_SHEET_ROWS[row] ?? AVATAR_SHEET_ROWS[0];
        const bubble = this._sliceGroup(texture, AVATAR_SHEET_GROUPS[0], band);
        const sway = this._sliceGroup(texture, AVATAR_SHEET_GROUPS[1], band);
        const blink = this._sliceGroup(texture, AVATAR_SHEET_GROUPS[2], band);
        const click = this._sliceGroup(texture, AVATAR_SHEET_GROUPS[3], band);
        const idle = blink[0] ?? bubble[0];
        return {
            id,
            idleFrames: idle ? [idle] : [],
            bubbleFrames: this._withIdleEnds(bubble, idle),
            swayFrames: this._withIdleEnds(sway, idle),
            blinkFrames: this._blinkCycle(blink, idle),
            happyFrames: this._holdCycle(blink, 4, idle),
            surprisedFrames: this._holdCycle(blink, 5, idle),
            clickFrames: this._withIdleEnds(click, idle),
            hatSwayMax,
            bubbleInSheet: true,
        };
    }

    private _sliceGroup(
        texture: Texture2D,
        group: { x: number; w: number },
        band: { y: number; h: number },
        frames = 6,
    ): SpriteFrame[] {
        const out: SpriteFrame[] = [];
        const cell = group.w / frames;
        const texW = texture.width;
        const texH = texture.height;
        const h = Math.min(band.h, texH);
        const y = Math.max(0, Math.min(band.y, texH - h));
        for (let i = 0; i < frames; i++) {
            const left = group.x + cell * i;
            const right = group.x + cell * (i + 1);
            const crop = Math.min(AVATAR_SHEET_CELL_W, Math.max(1, right - left));
            const x = Math.max(0, Math.min(texW - crop, Math.round((left + right - crop) / 2)));
            out.push(this._makeFrame(texture, x, y, Math.round(crop), h));
        }
        return out;
    }

    private _makeFrame(texture: Texture2D, x: number, y: number, w: number, h: number): SpriteFrame {
        const sf = new SpriteFrame();
        sf.reset({
            texture,
            rect: new Rect(x, y, w, h),
            originalSize: new Size(w, h),
            offset: new Vec2(0, 0),
            isRotate: false,
        });
        sf.packable = false;
        return sf;
    }

    private _blinkCycle(frames: SpriteFrame[], idle: SpriteFrame | undefined): SpriteFrame[] {
        if (frames.length < 4) {
            return this._withIdleEnds(frames, idle);
        }
        const open = idle ?? frames[0];
        return [open, frames[1], frames[2], frames[3], frames[2], frames[1], open];
    }

    private _holdCycle(frames: SpriteFrame[], index: number, idle: SpriteFrame | undefined): SpriteFrame[] | undefined {
        const pose = frames[index];
        const rest = idle ?? frames[0];
        if (!pose || !rest) {
            return undefined;
        }
        return [rest, pose, pose, pose, rest];
    }

    private _withIdleEnds(frames: SpriteFrame[], idle: SpriteFrame | undefined): SpriteFrame[] {
        if (!idle || frames.length === 0) {
            return frames.slice();
        }
        const out = frames.slice();
        if (out[0] !== idle) {
            out.unshift(idle);
        }
        if (out[out.length - 1] !== idle) {
            out.push(idle);
        }
        return out;
    }
}
