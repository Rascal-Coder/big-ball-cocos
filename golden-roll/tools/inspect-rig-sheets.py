"""List connected-component boxes on the beetle/ball rig sheets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCES = {
    "ball": ROOT / "image.png",
    "beetle": ROOT / "image3.png",
}


def is_empty(px) -> bool:
    r, g, b, a = px
    return a < 10 or (r > 250 and g > 250 and b > 250)


def flood(mask, x0, y0, w, h):
    stack = [(x0, y0)]
    mask[y0][x0] = False
    min_x = max_x = x0
    min_y = max_y = y0
    count = 1
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
                count += 1
    return min_x, min_y, max_x + 1, max_y + 1, count


def inspect(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    pix = im.load()
    mask = [[not is_empty(pix[x, y]) for x in range(w)] for y in range(h)]
    boxes = []
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                box = flood(mask, x, y, w, h)
                if box[4] >= 80:
                    boxes.append(box)
    boxes.sort(key=lambda b: (b[1] // 40, b[0], b[1]))
    print(path.name, im.size, "count", len(boxes))
    for i, (x0, y0, x1, y1, count) in enumerate(boxes):
        print(f"{i:03} {x1-x0:4}x{y1-y0:<4} @ ({x0:4},{y0:4})-({x1:4},{y1:4}) px={count}")


def main() -> None:
    for name, path in SOURCES.items():
        print("====", name)
        inspect(path)


if __name__ == "__main__":
    main()
