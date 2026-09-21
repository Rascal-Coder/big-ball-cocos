import { Rect, Size, SpriteFrame, Texture2D, Vec2, resources } from 'cc';
import { AssetService } from '../core/AssetService';
import {
    AVATAR_FACE_SLICES,
    AVATAR_SHEET_PATHS,
    AVATAR_SKINS,
    AvatarPartId,
    AvatarPartSet,
    AvatarSheetId,
    resolveAvatarSkin,
} from './AvatarSkinData';

type LoadCallback = (ok: boolean) => void;

/** 整身皮肤 + 表情表切片。 */
export class AvatarSkinManager {
    static readonly instance = new AvatarSkinManager();

    private _ready = false;
    private _loading = false;
    private readonly _sheets: Partial<Record<AvatarSheetId, SpriteFrame>> = {};
    private readonly _portraits = new Map<string, SpriteFrame>();
    private _faces: Partial<Record<AvatarPartId, SpriteFrame>> = {};
    private readonly _waiters: LoadCallback[] = [];

    get ready(): boolean {
        return this._ready;
    }

    loadAsync(): Promise<boolean> {
        return new Promise((resolve) => this.load(resolve));
    }

    load(onDone?: LoadCallback): void {
        if (this._ready && this._portraits.size > 0) {
            onDone?.(true);
            return;
        }
        if (onDone) {
            this._waiters.push(onDone);
        }
        if (this._loading) {
            return;
        }
        this._loading = true;
        const ids = Object.keys(AVATAR_SHEET_PATHS) as AvatarSheetId[];
        let left = ids.length;
        let failed = false;
        const done = (): void => {
            left -= 1;
            if (left > 0) {
                return;
            }
            this._loading = false;
            const missing = ids.some((id) => !this._sheets[id]?.texture);
            if (failed || missing) {
                this._flush(false);
                return;
            }
            this._slice();
            this._flush(true);
        };
        ids.forEach((id) => {
            const path = AVATAR_SHEET_PATHS[id];
            const apply = (sheet: SpriteFrame | null): void => {
                if (sheet?.texture) {
                    this._sheets[id] = sheet;
                } else {
                    failed = true;
                }
                done();
            };
            const hit = AssetService.get(path, SpriteFrame);
            if (hit) {
                apply(hit);
                return;
            }
            resources.load(path, SpriteFrame, (err: Error | null, sheet: SpriteFrame) => {
                apply(err || !sheet ? null : sheet);
            });
        });
    }

    bindSheets(skins?: SpriteFrame | null, faces?: SpriteFrame | null): void {
        if (skins) {
            this._sheets.skins = skins;
        }
        if (faces) {
            this._sheets.faces = faces;
        }
        const ids = Object.keys(AVATAR_SHEET_PATHS) as AvatarSheetId[];
        if (ids.every((id) => this._sheets[id]?.texture)) {
            this._slice();
            this._flush(true);
        }
    }

    get(id?: string | null): AvatarPartSet | null {
        if (!this._ready) {
            return null;
        }
        const skin = resolveAvatarSkin(id);
        const portrait = this._portraits.get(skin.id);
        if (!portrait) {
            return null;
        }
        return {
            id: skin.id,
            portrait,
            parts: this._faces,
        };
    }

    ids(): string[] {
        return AVATAR_SKINS.map((skin) => skin.id);
    }

    release(): void {
        this._portraits.clear();
        this._faces = {};
        (Object.keys(this._sheets) as AvatarSheetId[]).forEach((id) => {
            delete this._sheets[id];
        });
        this._ready = false;
        this._loading = false;
        this._waiters.length = 0;
    }

    private _slice(): void {
        const skinsTex = this._sheets.skins?.texture as Texture2D | undefined;
        const facesTex = this._sheets.faces?.texture as Texture2D | undefined;
        if (!skinsTex || !facesTex) {
            this._ready = false;
            return;
        }
        this._portraits.clear();
        for (let i = 0; i < AVATAR_SKINS.length; i++) {
            const skin = AVATAR_SKINS[i];
            this._portraits.set(skin.id, this._makeFrame(skinsTex, skin.rect));
        }
        const faces: Partial<Record<AvatarPartId, SpriteFrame>> = {};
        const keys = Object.keys(AVATAR_FACE_SLICES) as AvatarPartId[];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            faces[key] = this._makeFrame(facesTex, AVATAR_FACE_SLICES[key]);
        }
        this._faces = faces;
        this._ready = true;
    }

    private _makeFrame(texture: Texture2D, rect: { x: number; y: number; w: number; h: number }): SpriteFrame {
        const texW = texture.width;
        const texH = texture.height;
        const w = Math.max(1, Math.min(rect.w, texW));
        const h = Math.max(1, Math.min(rect.h, texH));
        const x = Math.max(0, Math.min(texW - w, rect.x));
        const y = Math.max(0, Math.min(texH - h, rect.y));
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

    private _flush(ok: boolean): void {
        const waiters = this._waiters.splice(0, this._waiters.length);
        for (let i = 0; i < waiters.length; i++) {
            waiters[i](ok);
        }
    }
}
