"""List connected-component boxes on the new desert sheet."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SRC = Path(r"e:/dung-beetle/docs/map-other-material/image.png")


def near_white(px) -> bool:
    r, g, b = px[0], px[1], px[2]
    a = px[3] if len(px) > 3 else 255
    return a < 8 or (r > 248 and g > 248 and b > 248)


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
    if max_x - min_x < 10 or max_y - min_y < 10:
        return None
    return min_x, min_y, max_x + 1, max_y + 1


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    pix = im.load()
    mask = [[not near_white(pix[x, y]) for x in range(w)] for y in range(h)]
    boxes = []
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                box = bbox_of(mask, x, y, w, h)
                if box:
                    boxes.append(box)
    boxes.sort(key=lambda b: (b[1] // 32, b[0], b[1]))
    print("count", len(boxes))
    for i, (x0, y0, x1, y1) in enumerate(boxes):
        print(f"{i:03} {x1-x0:4}x{y1-y0:<4} @ ({x0:4},{y0:4})-({x1:4},{y1:4})")


if __name__ == "__main__":
    main()
