import numpy as np
from PIL import Image

parts = {
    "armL": (356, 31, 249, 253),
    "armR": (649, 31, 249, 254),
    "foreL": (353, 340, 195, 261),
    "foreR": (706, 340, 195, 261),
}
img = Image.open(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\image.png").convert("RGBA")
a = np.array(img)
for name, (x, y, w, h) in parts.items():
    sl = a[y : y + h, x : x + w]
    r, g, b, al = sl[:, :, 0].astype(int), sl[:, :, 1].astype(int), sl[:, :, 2].astype(int), sl[:, :, 3]
    gold = (al > 180) & (r > 190) & (g > 140) & (g < 210) & (b < 130) & (r - b > 70)
    ys, xs = np.where(gold)
    print(name, "gold", len(xs))
    if len(xs) == 0:
        continue
    # cuff is the lower gold cluster
    bot = ys > (ys.max() - 50)
    xs2, ys2 = xs[bot], ys[bot]
    cx, cy = float(xs2.mean()), float(ys2.mean())
    ax, ay = cx / w, 1 - cy / h
    print(f"  cuff=({cx:.1f},{cy:.1f}) frac=({ax:.3f},{ay:.3f})")
