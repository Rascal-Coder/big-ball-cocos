from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

src = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\image.png")
img = Image.open(src).convert("RGBA")
a = np.array(img)
alpha = a[:, :, 3]
h, w = alpha.shape
print("size", w, h)

vis = np.zeros((h, w), dtype=bool)
comps = []
for y in range(h):
    row = alpha[y]
    for x in range(w):
        if vis[y, x] or row[x] < 24:
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
                if 0 <= nx < w and 0 <= ny < h and not vis[ny, nx] and alpha[ny, nx] >= 24:
                    vis[ny, nx] = True
                    q.append((nx, ny))
        if n > 400:
            comps.append((miny, minx, maxx - minx + 1, maxy - miny + 1, n))

comps.sort()
out = Path(r"C:\big-ball-cocos\tmp-avatar-preview\arms")
out.mkdir(parents=True, exist_ok=True)
for i, (y, x, bw, bh, n) in enumerate(comps):
    print(f"part{i}: x={x} y={y} w={bw} h={bh} px={n}")
    img.crop((x, y, x + bw, y + bh)).save(out / f"part{i}.png")
