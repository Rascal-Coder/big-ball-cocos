"""Slice Kenney-style map sheets into individual sprites and Cocos metas."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "map-other-material"
OUT = ROOT / "golden-roll" / "assets" / "resources" / "map"

THEMES = {
    "image1.png": "desert",
    "image2.png": "canyon",
    "image3.png": "volcano",
    "image4.png": "ice",
    "image5.png": "swamp",
    "image6.png": "ruins",
    "image7.png": "mine",
    "image8.png": "graveyard",
}

DESERT_NAMES = [
    "sand-plain",
    "sand-dots",
    "sand-cracks",
    "sand-dark",
    "path-ns",
    "path-corner",
    "path-t",
    "path-cross",
    "path-fork",
    "path-round",
    "path-wide",
    "cliff-cap",
    "cliff-inner",
    "cliff-n",
    "cliff-block",
    "bridge",
    "pond",
    "mud-pit",
    "bones-tile",
    "trail",
    "stone-plate",
    "cactus-tall",
    "cactus-bloom",
    "cactus-barrel",
    "cactus-small",
    "cactus-tiny",
    "agave",
    "agave-bloom",
    "bush",
    "tumbleweed",
    "dead-tree",
    "grass",
    "pebbles",
    "rocks",
    "boulder",
    "rock",
    "gravel",
    "fence-post",
    "fence",
    "spikes",
    "skull-bull",
    "bones",
    "wheel",
    "plank",
    "crate",
    "barrel",
    "campfire",
    "cookpot",
    "tent",
    "mine-door",
    "grave-cross",
    "grave-stone",
    "coin",
    "flag",
    "skull-gate",
    "warning",
]


def near_white(px: tuple[int, ...]) -> bool:
    r, g, b = px[0], px[1], px[2]
    a = px[3] if len(px) > 3 else 255
    return a < 8 or (r > 248 and g > 248 and b > 248)


def bbox_of(mask: list[list[bool]], x0: int, y0: int, w: int, h: int) -> tuple[int, int, int, int] | None:
    stack = [(x0, y0)]
    mask[y0][x0] = False
    min_x = max_x = x0
    min_y = max_y = y0
    while stack:
        x, y = stack.pop()
        min_x = min(min_x, x)
        max_x = max(max_x, x)
        min_y = min(min_y, y)
        max_y = max(max_y, y)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and mask[ny][nx]:
                mask[ny][nx] = False
                stack.append((nx, ny))
    if max_x - min_x < 8 or max_y - min_y < 8:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def extract_boxes(im: Image.Image) -> list[tuple[int, int, int, int]]:
    rgba = im.convert("RGBA")
    w, h = rgba.size
    pix = rgba.load()
    mask = [[not near_white(pix[x, y]) for x in range(w)] for y in range(h)]
    boxes: list[tuple[int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                box = bbox_of(mask, x, y, w, h)
                if box:
                    boxes.append(box)
    boxes.sort(key=lambda b: (b[1] // 40, b[0], b[1]))
    return boxes


def folder_meta(uuid: str) -> dict:
    return {
        "ver": "1.2.0",
        "importer": "directory",
        "imported": True,
        "uuid": uuid,
        "files": [],
        "subMetas": {},
        "userData": {},
    }


def image_meta(uuid: str, name: str, width: int, height: int) -> dict:
    hw = width / 2
    hh = height / 2
    return {
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
                    "width": width,
                    "height": height,
                    "rawWidth": width,
                    "rawHeight": height,
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
                        "uv": [0, height, width, height, 0, 0, width, 0],
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


THEME_CODE = {
    "desert": 1,
    "canyon": 2,
    "volcano": 3,
    "ice": 4,
    "swamp": 5,
    "ruins": 6,
    "mine": 7,
    "graveyard": 8,
}


def theme_uuid(theme: str, index: int) -> str:
    code = THEME_CODE.get(theme, 9)
    return f"7c1a4001-5555-4e01-8cde-{code:04x}{index:08x}"


def dir_uuid(key: str) -> str:
    codes = {
        "map-root": 0x10,
        "desert": 0x11,
        "canyon": 0x12,
        "volcano": 0x13,
        "ice": 0x14,
        "swamp": 0x15,
        "ruins": 0x16,
        "mine": 0x17,
        "graveyard": 0x18,
        "prefabs": 0x19,
    }
    return f"7c1a4001-5555-4e01-8cde-{codes.get(key, 0x1F):012x}"


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def slice_theme(src: Path, theme: str, names: list[str] | None) -> list[dict]:
    im = Image.open(src)
    print(f"{src.name} {im.size} {im.mode} -> {theme}")
    boxes = extract_boxes(im)
    print(f"  sprites: {len(boxes)}")
    dest = OUT / theme
    dest.mkdir(parents=True, exist_ok=True)
    write_json(OUT / f"{theme}.meta", folder_meta(dir_uuid(theme)))
    catalog: list[dict] = []
    rgba = im.convert("RGBA")
    for i, box in enumerate(boxes):
        name = names[i] if names and i < len(names) else f"sprite-{i:02d}"
        crop = rgba.crop(box)
        pixels = crop.load()
        for y in range(crop.height):
            for x in range(crop.width):
                if near_white(pixels[x, y]):
                    pixels[x, y] = (0, 0, 0, 0)
        png = dest / f"{name}.png"
        crop.save(png)
        uid = theme_uuid(theme, i + 1)
        write_json(png.with_suffix(".png.meta"), image_meta(uid, name, crop.width, crop.height))
        catalog.append(
            {
                "id": name,
                "path": f"map/{theme}/{name}/spriteFrame",
                "w": crop.width,
                "h": crop.height,
                "uuid": f"{uid}@f9941",
            }
        )
        print(f"  {i:02d} {name:16} {crop.width:4}x{crop.height:<4} @ {box}")
    return catalog


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    write_json(ROOT / "golden-roll" / "assets" / "resources" / "map.meta", folder_meta(dir_uuid("map-root")))
    only = sys.argv[1] if len(sys.argv) > 1 else "desert"
    catalogs: dict[str, list[dict]] = {}
    for file_name, theme in THEMES.items():
        if only != "all" and theme != only:
            continue
        src = SRC / file_name
        if not src.exists():
            print("missing", src)
            continue
        names = DESERT_NAMES if theme == "desert" else None
        catalogs[theme] = slice_theme(src, theme, names)
    write_json(OUT / "catalog.json", catalogs)
    print("wrote", OUT / "catalog.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
