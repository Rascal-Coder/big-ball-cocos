"""Slice cowboy + idle face parts into real sprite assets and assign them on scene/prefab."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\avatars")
SKINS = ROOT / "skins.png"
FACES = ROOT / "faces.png"
OUT = ROOT / "parts"
SCENE = Path(r"C:\big-ball-cocos\golden-roll\assets\scenes\main.scene")
PREFAB = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\avatar-cowboy.prefab")

PARTS = {
    "cowboy": {
        "src": SKINS,
        "rect": (23, 15, 212, 188),
        "uuid": "e1a2b3c4-1111-4d01-9cde-aaa000000001",
        "scale": 0.7,
        "anchor": (0.5, 0.42),
    },
    "brow-l": {
        "src": FACES,
        "rect": (35, 772, 72, 36),
        "uuid": "e1a2b3c4-1111-4d01-9cde-aaa000000002",
        "scale": 0.34,
        "anchor": (0.5, 0.5),
    },
    "brow-r": {
        "src": FACES,
        "rect": (142, 770, 72, 38),
        "uuid": "e1a2b3c4-1111-4d01-9cde-aaa000000003",
        "scale": 0.34,
        "anchor": (0.5, 0.5),
    },
    "eye-l": {
        "src": FACES,
        "rect": (514, 225, 67, 82),
        "uuid": "e1a2b3c4-1111-4d01-9cde-aaa000000004",
        "scale": 0.38,
        "anchor": (0.5, 0.5),
    },
    "eye-r": {
        "src": FACES,
        "rect": (601, 225, 67, 82),
        "uuid": "e1a2b3c4-1111-4d01-9cde-aaa000000005",
        "scale": 0.38,
        "anchor": (0.5, 0.5),
    },
    "mouth": {
        "src": FACES,
        "rect": (66, 947, 113, 27),
        "uuid": "e1a2b3c4-1111-4d01-9cde-aaa000000006",
        "scale": 0.38,
        "anchor": (0.5, 0.5),
    },
}

NODE_PART = {
    "Portrait": "cowboy",
    "BrowL": "brow-l",
    "BrowR": "brow-r",
    "EyeL": "eye-l",
    "EyeR": "eye-r",
    "Mouth": "mouth",
}

SKINS_SF = "c3d4e5f6-0718-4a01-9cde-334455667788@f9941"
FACES_SF = "d4e5f607-1829-4b12-ade0-445566778899@f9941"
FRAME_SF = "bd165d97-2c19-4b1e-ab76-5210c6930251@f9941"


def sf_ref(uuid: str) -> dict:
    return {"__uuid__": uuid, "__expectedType__": "cc.SpriteFrame"}


def write_meta(path: Path, name: str, uuid: str, w: int, h: int) -> None:
    hw, hh = w / 2, h / 2
    meta = {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": uuid,
        "files": [".json", ".png"],
        "subMetas": {
            "6c48a": {
                "importer": "texture",
                "uuid": f"{uuid}@6c48a",
                "displayName": name,
                "id": "6c48a",
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": uuid,
                    "isUuid": True,
                    "visible": False,
                    "minfilter": "linear",
                    "magfilter": "linear",
                    "mipfilter": "none",
                    "anisotropy": 0,
                },
                "ver": "1.0.22",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
            "f9941": {
                "importer": "sprite-frame",
                "uuid": f"{uuid}@f9941",
                "displayName": name,
                "id": "f9941",
                "name": "spriteFrame",
                "userData": {
                    "trimThreshold": 1,
                    "rotated": False,
                    "offsetX": 0,
                    "offsetY": 0,
                    "trimX": 0,
                    "trimY": 0,
                    "width": w,
                    "height": h,
                    "rawWidth": w,
                    "rawHeight": h,
                    "borderTop": 0,
                    "borderBottom": 0,
                    "borderLeft": 0,
                    "borderRight": 0,
                    "packable": False,
                    "pixelsToUnit": 100,
                    "pivotX": 0.5,
                    "pivotY": 0.5,
                    "meshType": 0,
                    "vertices": {
                        "rawPosition": [-hw, -hh, 0, hw, -hh, 0, -hw, hh, 0, hw, hh, 0],
                        "indexes": [0, 1, 2, 2, 1, 3],
                        "uv": [0, h, w, h, 0, 0, w, 0],
                        "nuv": [0, 0, 1, 0, 0, 1, 1, 1],
                        "minPos": [-hw, -hh, 0],
                        "maxPos": [hw, hh, 0],
                    },
                    "isUuid": True,
                    "imageUuidOrDatabaseUri": f"{uuid}@6c48a",
                    "atlasUuid": "",
                    "trimType": "none",
                },
                "ver": "1.0.12",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
        },
        "userData": {
            "type": "sprite-frame",
            "fixAlphaTransparencyArtifacts": True,
            "hasAlpha": True,
            "redirect": f"{uuid}@6c48a",
        },
    }
    path.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")


def crop_parts() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cache: dict[Path, Image.Image] = {}
    for name, spec in PARTS.items():
        src = spec["src"]
        if src not in cache:
            cache[src] = Image.open(src).convert("RGBA")
        x, y, w, h = spec["rect"]
        img = cache[src].crop((x, y, x + w, y + h))
        png = OUT / f"{name}.png"
        img.save(png)
        write_meta(png.with_suffix(".png.meta"), name, spec["uuid"], w, h)
        print("wrote", png, img.size)


def patch_doc(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    sprites = 0
    for obj in data:
        if obj.get("__type__") != "cc.Node":
            continue
        name = obj.get("_name")
        part = NODE_PART.get(name)
        frame_uuid = FRAME_SF if name == "AvatarFrame" else None
        if part:
            spec = PARTS[part]
            x, y, w, h = spec["rect"]
            dw, dh = w * spec["scale"], h * spec["scale"]
            ax, ay = spec["anchor"]
            frame_uuid = f"{spec['uuid']}@f9941"
        if not frame_uuid:
            continue
        for ref in obj.get("_components", []):
            cid = ref["__id__"]
            comp = data[cid]
            if comp.get("__type__") == "cc.Sprite":
                comp["_spriteFrame"] = sf_ref(frame_uuid)
                sprites += 1
            if comp.get("__type__") == "cc.UITransform" and part:
                spec = PARTS[part]
                x, y, w, h = spec["rect"]
                comp["_contentSize"] = {"__type__": "cc.Size", "width": w * spec["scale"], "height": h * spec["scale"]}
                ax, ay = spec["anchor"]
                comp["_anchorPoint"] = {"__type__": "cc.Vec2", "x": ax, "y": ay}
        if obj.get("__type__") == "cc.Node":
            pass
    for obj in data:
        if str(obj.get("__type__", "")).startswith("8dbcc"):
            obj["skinsSheet"] = sf_ref(SKINS_SF)
            obj["facesSheet"] = sf_ref(FACES_SF)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("patched", path, "sprites", sprites)


if __name__ == "__main__":
    crop_parts()
    patch_doc(SCENE)
    patch_doc(PREFAB)
