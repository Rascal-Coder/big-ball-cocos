"""Slice docs/map-other-material/image.png into desert tiles + props."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "map-other-material" / "image.png"
OUT = ROOT / "golden-roll" / "assets" / "resources" / "map" / "desert"

SAND_CELLS = [
    (16, 11, 129, 125),
    (133, 11, 247, 125),
    (252, 11, 367, 125),
    (371, 11, 487, 125),
    (493, 11, 609, 125),
    (16, 126, 129, 240),
    (133, 126, 247, 240),
    (252, 126, 367, 240),
    (371, 126, 487, 240),
    (493, 126, 609, 240),
    (16, 241, 129, 355),
    (133, 241, 247, 355),
    (252, 241, 367, 355),
    (371, 241, 487, 355),
    (493, 241, 609, 355),
]

SAND_NAMES = [
    "sand-plain",
    "sand-soft",
    "sand-grass",
    "sand-pebbles",
    "sand-tuft",
    "sand-flat",
    "sand-weed",
    "sand-cracks",
    "sand-stones",
    "sand-dots",
    "sand-tracks",
    "sand-brush",
    "sand-open",
    "sand-grit",
    "sand-sparse",
]


def near_white(px) -> bool:
    r, g, b = px[0], px[1], px[2]
    a = px[3] if len(px) > 3 else 255
    return a < 8 or (r > 248 and g > 248 and b > 248)


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


def uid(index: int) -> str:
    return f"7c1a4002-5555-4e02-8cde-{index:012x}"


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def save_sprite(im: Image.Image, box, name: str, index: int, catalog: list, clear_white: bool) -> None:
    crop = im.crop(box)
    if clear_white:
        pix = crop.load()
        for y in range(crop.height):
            for x in range(crop.width):
                if near_white(pix[x, y]):
                    pix[x, y] = (0, 0, 0, 0)
    png = OUT / f"{name}.png"
    crop.save(png)
    uuid = uid(index)
    write_json(png.with_suffix(".png.meta"), image_meta(uuid, name, crop.width, crop.height))
    catalog.append(
        {
            "id": name,
            "path": f"map/desert/{name}/spriteFrame",
            "w": crop.width,
            "h": crop.height,
        }
    )
    print(f"{index:03} {name:16} {crop.width:4}x{crop.height:<4} {box}")


def bbox_of(mask, x0, y0, w, h):
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
    if max_x - min_x < 36 or max_y - min_y < 36:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def extract_props(im: Image.Image) -> list[tuple[int, int, int, int]]:
    w, h = im.size
    pix = im.load()
    mask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if x < 615 and y < 358:
                continue
            mask[y][x] = not near_white(pix[x, y])
    boxes = []
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                box = bbox_of(mask, x, y, w, h)
                if box:
                    boxes.append(box)
    boxes.sort(key=lambda b: (b[1] // 48, b[0], b[1]))
    return boxes


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing {SRC}")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    write_json(
        OUT.parent / "desert.meta",
        folder_meta("7c1a4002-5555-4e02-8cde-000000000011"),
    )
    im = Image.open(SRC).convert("RGBA")
    catalog = []
    index = 1
    for name, box in zip(SAND_NAMES, SAND_CELLS):
        save_sprite(im, box, name, index, catalog, clear_white=False)
        index += 1
    props = extract_props(im)
    print("props", len(props))
    for i, box in enumerate(props):
        save_sprite(im, box, f"prop-{i:02d}", index, catalog, clear_white=True)
        index += 1
    write_json(OUT.parent / "catalog.json", {"desert": catalog})
    print("done", len(catalog), "sprites")


if __name__ == "__main__":
    main()
