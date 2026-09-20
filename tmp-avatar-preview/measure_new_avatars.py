from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(r"C:\big-ball-cocos\tmp-avatar-preview\newkit")
OUT.mkdir(parents=True, exist_ok=True)


def measure(path: Path, min_px: int, prefix: str) -> None:
    img = Image.open(path).convert("RGBA")
    a = np.array(img)
    alpha = a[:, :, 3]
    h, w = alpha.shape
    print("====", path.name, w, h)
    vis = np.zeros((h, w), dtype=bool)
    comps = []
    for y in range(h):
        for x in range(w):
            if vis[y, x] or alpha[y, x] < 20:
                continue
            q = deque([(x, y)])
            vis[y, x] = True
            minx = maxx = x
            miny = maxy = y
            n = 0
            while q:
                cx, cy = q.popleft()
                n += 1
                if cx < minx:
                    minx = cx
                if cx > maxx:
                    maxx = cx
                if cy < miny:
                    miny = cy
                if cy > maxy:
                    maxy = cy
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not vis[ny, nx] and alpha[ny, nx] >= 20:
                        vis[ny, nx] = True
                        q.append((nx, ny))
            if n >= min_px:
                comps.append((miny, minx, maxx - minx + 1, maxy - miny + 1, n))
    comps.sort()
    for i, (y, x, bw, bh, n) in enumerate(comps):
        print(f"{prefix}{i:02d}: x={x} y={y} w={bw} h={bh} px={n}")
        img.crop((x, y, x + bw, y + bh)).save(OUT / f"{prefix}{i:02d}.png")


measure(Path(r"C:\big-ball-cocos\docs\avatars\image.png"), 2500, "skin_")
measure(Path(r"C:\big-ball-cocos\docs\avatars\image1.png"), 400, "face_")
