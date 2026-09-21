"""Slice docs/new-map 5x4 sheets into desert tiles and props. Fresh UUIDs only."""
from __future__ import annotations

import json
import shutil
import uuid
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "new-map"
OUT = ROOT / "golden-roll" / "assets" / "resources" / "map" / "desert"
FOLDER_UUID = "3a9d3d92-dea0-4414-86b7-79bdab64dba2"
NS = uuid.UUID("a31c8e70-9d24-4b11-8f06-2e7c1d90b4aa")

# image1: measured sand squares (rounded tiles, keep full art)
TILE_XS = [(28, 251), (274, 496), (516, 738), (758, 983), (1006, 1228)]
TILE_YS = [(97, 319), (341, 565), (589, 807), (838, 1055)]

TILES = [
    "sand-plain",
    "sand-pebbles",
    "sand-tuft",
    "sand-cracks",
    "sand-tracks",
    "sand-rocks",
    "sand-dark",
    "sand-cacti",
    "cliff-corner",
    "path-ns",
    "path-corner",
    "path-cross",
    "path-t",
    "sand-weeds",
    "sand-plates",
    "pit-tile",
    "sand-boulders",
    "cactus-tile",
    "dead-wood-tile",
    "sand-dunes",
]

DECO = [
    "cactus-saguaro",
    "cactus-small",
    "cactus-barrel",
    "cactus-flower",
    "bush",
    "tumbleweed",
    "agave",
    "shrub",
    "dead-branch",
    "stump",
    "fence-h",
    "fence-angle",
    "signpost",
    "lantern",
    "skull-bull",
    "bones",
    "wagon-wheel",
    "banner",
    "rocks-plant",
    "cactus-pads",
]

OBSTACLES = [
    "boulder",
    "stone-ball",
    "rock-pile",
    "spike-fence",
    "spike-ring",
    "cairn",
    "cactus-pair",
    "thorn-bush",
    "tnt",
    "crate",
    "barrels",
    "minecart",
    "rail",
    "cart",
    "fence-wood",
    "snake",
    "skull-post",
    "sinkhole",
    "mud-ball",
    "barrier-x",
]

PICKUPS = [
    "coin",
    "gold-nuggets",
    "gold-sack",
    "heart",
    "magnet",
    "star-badge",
    "shield",
    "snowflake",
    "hourglass",
    "potion",
    "boot",
    "bomb",
    "chest",
    "key",
    "horseshoe",
    "lasso",
    "dust",
    "dust-trail",
    "footprints",
    "hole",
]


def near_white(px) -> bool:
    r, g, b = px[0], px[1], px[2]
    a = px[3] if len(px) > 3 else 255
    return a < 8 or (r > 248 and g > 248 and b > 248)


def uid(name: str) -> str:
    return str(uuid.uuid5(NS, f"dung-beetle/map/desert/{name}"))


def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def image_meta(asset_id: str, name: str, width: int, height: int) -> dict:
    hw = width / 2
    hh = height / 2
    return {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": asset_id,
        "files": [".json", ".png"],
        "subMetas": {
            "6c48a": {
                "importer": "texture",
                "uuid": f"{asset_id}@6c48a",
                "displayName": name,
                "id": "6c48a",
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": asset_id,
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
                "uuid": f"{asset_id}@f9941",
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
                    "imageUuidOrDatabaseUri": f"{asset_id}@6c48a",
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
            "redirect": f"{asset_id}@6c48a",
        },
    }


def clear_white(im: Image.Image) -> Image.Image:
    pix = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if near_white(pix[x, y]):
                pix[x, y] = (0, 0, 0, 0)
    return im


def trim(im: Image.Image, pad: int = 2) -> Image.Image:
    pix = im.load()
    min_x, min_y, max_x, max_y = im.width, im.height, -1, -1
    for y in range(im.height):
        for x in range(im.width):
            if pix[x, y][3] > 8:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < 0:
        return im
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(im.width, max_x + 1 + pad)
    max_y = min(im.height, max_y + 1 + pad)
    return im.crop((min_x, min_y, max_x, max_y))


def grid_cell(im: Image.Image, col: int, row: int, cols: int = 5, rows: int = 4, inset: int = 6) -> Image.Image:
    cw = im.width / cols
    ch = im.height / rows
    box = (
        int(col * cw) + inset,
        int(row * ch) + inset,
        int((col + 1) * cw) - inset,
        int((row + 1) * ch) - inset,
    )
    return im.crop(box)


def save_sprite(im: Image.Image, name: str, catalog: list) -> None:
    png = OUT / f"{name}.png"
    im.save(png)
    asset_id = uid(name)
    write_json(png.with_suffix(".png.meta"), image_meta(asset_id, name, im.width, im.height))
    catalog.append({"id": name, "path": f"map/desert/{name}/spriteFrame", "w": im.width, "h": im.height})
    print(f"{name:16} {im.width:4}x{im.height}")


def slice_tiles(catalog: list) -> None:
    im = Image.open(SRC / "image1.png").convert("RGBA")
    for i, name in enumerate(TILES):
        col, row = i % 5, i // 5
        x0, x1 = TILE_XS[col]
        y0, y1 = TILE_YS[row]
        save_sprite(im.crop((x0, y0, x1, y1)), name, catalog)


def slice_grid(file: str, names: list[str], catalog: list) -> None:
    im = Image.open(SRC / file).convert("RGBA")
    for i, name in enumerate(names):
        col, row = i % 5, i // 5
        cell = clear_white(grid_cell(im, col, row))
        save_sprite(trim(cell), name, catalog)


def main() -> None:
    for sheet in ("image.png", "image1.png", "image2.png", "image3.png"):
        if not (SRC / sheet).exists():
            raise SystemExit(f"missing {SRC / sheet}")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    write_json(
        OUT.parent / "desert.meta",
        {
            "ver": "1.2.0",
            "importer": "directory",
            "imported": True,
            "uuid": FOLDER_UUID,
            "files": [],
            "subMetas": {},
            "userData": {},
        },
    )
    catalog: list = []
    slice_tiles(catalog)
    slice_grid("image2.png", DECO, catalog)
    slice_grid("image3.png", OBSTACLES, catalog)
    slice_grid("image.png", PICKUPS, catalog)
    ids = [uid(item["id"]) for item in catalog]
    if len(ids) != len(set(ids)):
        raise SystemExit("uuid collision inside new catalog")
    write_json(OUT.parent / "catalog.json", {"desert": catalog})
    print("done", len(catalog), "sprites")


if __name__ == "__main__":
    main()
