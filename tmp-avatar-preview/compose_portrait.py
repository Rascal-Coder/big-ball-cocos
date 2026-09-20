from pathlib import Path

from PIL import Image

ROOT = Path(r"C:\big-ball-cocos")
skins = Image.open(ROOT / "golden-roll/assets/resources/ui/avatars/skins.png").convert("RGBA")
faces = Image.open(ROOT / "golden-roll/assets/resources/ui/avatars/faces.png").convert("RGBA")
cowboy = skins.crop((23, 15, 23 + 212, 15 + 188))
eye_l = faces.crop((514, 225, 581, 307))
eye_r = faces.crop((601, 225, 668, 307))
brow_l = faces.crop((35, 772, 107, 808))
brow_r = faces.crop((142, 770, 214, 808))
mouth = faces.crop((66, 947, 179, 974))

scale = 0.7
cw, ch = int(cowboy.width * scale), int(cowboy.height * scale)
cowboy = cowboy.resize((cw, ch), Image.Resampling.LANCZOS)

W, H = 420, 420
canvas = Image.new("RGBA", (W, H), (245, 220, 170, 255))
ox, oy = W // 2, int(H * 0.58)
# portrait anchor 0.5, 0.42
left = int(ox - cw * 0.5)
top = int(oy - ch * (1 - 0.42))
canvas.alpha_composite(cowboy, (left, top))

# face root at portrait local (0, 18); portrait origin at (ox, oy)
face_cx, face_cy = ox, oy + 6


def paste(part: Image.Image, x: float, y: float, sc: float) -> None:
    w = max(1, int(part.width * sc))
    h = max(1, int(part.height * sc))
    sprite = part.resize((w, h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(sprite, (int(face_cx + x - w * 0.5), int(face_cy - y - h * 0.5)))


paste(brow_l, -13, 18, 0.34)
paste(brow_r, 13, 18, 0.34)
paste(eye_l, -13, 8, 0.38)
paste(eye_r, 13, 8, 0.38)
paste(mouth, 0, -8, 0.38)

out = ROOT / "tmp-avatar-preview/portrait-check.png"
canvas.save(out)
cowboy.save(ROOT / "tmp-avatar-preview/cowboy-crop.png")
print("wrote", out)
