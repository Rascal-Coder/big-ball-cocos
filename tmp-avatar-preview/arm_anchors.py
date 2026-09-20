from pathlib import Path

import numpy as np
from PIL import Image

parts = {
    "armL": (356, 31, 249, 253),
    "armR": (649, 31, 249, 254),
    "foreL": (353, 340, 195, 261),
    "foreR": (706, 340, 195, 261),
    "handL": (320, 652, 233, 257),
    "handR": (701, 652, 233, 257),
}
img = Image.open(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\image.png").convert("RGBA")
a = np.array(img)
for name, (x, y, w, h) in parts.items():
    sl = a[y : y + h, x : x + w]
    r, g, b, al = sl[:, :, 0].astype(int), sl[:, :, 1].astype(int), sl[:, :, 2].astype(int), sl[:, :, 3]
    # pale cream joint ball, not gold cuff
    ball = (al > 200) & (r > 225) & (g > 195) & (b > 150) & (g - b < 80) & (r - g < 50)
    ys, xs = np.where(ball)
    print(name, "pale", len(xs))
    if len(xs) == 0:
        continue
    # take the cluster nearest the top of the sprite
    top_idx = ys < (ys.min() + 40)
    if top_idx.any():
        xs, ys = xs[top_idx], ys[top_idx]
    cx = float(xs.mean())
    cy = float(ys.mean())
    print(f"  top-ball=({cx:.1f},{cy:.1f}) anchor=({cx/w:.3f},{1 - cy/h:.3f})")
