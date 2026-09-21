"""Inspect the new desert sheet: size, tile grid, sprite boxes."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SRC = Path(r"e:/dung-beetle/docs/map-other-material/image.png")


def near_white(px) -> bool:
    r, g, b = px[0], px[1], px[2]
    a = px[3] if len(px) > 3 else 255
    return a < 8 or (r > 248 and g > 248 and b > 248)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    print("size", im.size, im.mode)
    w, h = im.size
    pix = im.load()
    # sample first 400x400 for grid
    for y in range(0, min(400, h), 20):
        row = []
        for x in range(0, min(600, w), 20):
            p = pix[x, y]
            row.append("." if near_white(p) else "#")
        print(f"{y:4}", "".join(row))


if __name__ == "__main__":
    main()
