"""Preview the runtime pose with image1-7 slices."""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(r"C:\big-ball-cocos\golden-roll")
DATA = (ROOT / "assets/scripts/avatar/AvatarSkinData.ts").read_text(encoding="utf-8")
AVATARS = ROOT / "assets/resources/ui/avatars"
OUT = Path(r"C:\big-ball-cocos\tmp-avatar-preview")

SHEETS = {
    "limbs": Image.open(AVATARS / "image1.png").convert("RGBA"),
    "mouth": Image.open(AVATARS / "image2.png").convert("RGBA"),
    "hat": Image.open(AVATARS / "image3.png").convert("RGBA"),
    "arms": Image.open(AVATARS / "arms.png").convert("RGBA"),
    "head": Image.open(AVATARS / "image5.png").convert("RGBA"),
    "eyes": Image.open(AVATARS / "image6.png").convert("RGBA"),
    "body": Image.open(AVATARS / "image7.png").convert("RGBA"),
}

slices = {
    name: (sheet, int(x), int(y), int(w), int(h))
    for name, sheet, x, y, w, h in re.findall(
        r"(\w+): \{ sheet: '(\w+)', rect: \{ x: (\d+), y: (\d+), w: (\d+), h: (\d+) \} \}",
        DATA,
    )
}
poses = {}
for name, x, y, scale, ax, ay, parent, extra in re.findall(
    r"(\w+): \{ x: ([-\d.]+), y: ([-\d.]+), scale: ([-\d.]+), anchorX: ([-\d.]+), anchorY: ([-\d.]+), parent: '(\w+)'([^}]*)\}",
    DATA,
):
    angle = 0.0
    flip = False
    am = re.search(r"angle: ([-\d.]+)", extra)
    if am:
        angle = float(am.group(1))
    if "flipX: true" in extra:
        flip = True
    poses[name] = {
        "x": float(x),
        "y": float(y),
        "scale": float(scale),
        "ax": float(ax),
        "ay": float(ay),
        "parent": parent,
        "angle": angle,
        "flip": flip,
    }


def world_xy(name: str) -> tuple[float, float]:
    pose = poses[name]
    if pose["parent"] == "root":
        return pose["x"], pose["y"]
    px, py = world_xy(pose["parent"])
    return px + pose["x"], py + pose["y"]


def crop(part_id: str) -> Image.Image:
    sheet, x, y, w, h = slices[part_id]
    return SHEETS[sheet].crop((x, y, x + w, y + h))


def paste(canvas: Image.Image, part_id: str, pose_name: str, ox: float, oy: float) -> None:
    pose = poses[pose_name]
    wx, wy = world_xy(pose_name)
    sprite = crop(part_id)
    w = max(1, int(round(sprite.width * pose["scale"])))
    h = max(1, int(round(sprite.height * pose["scale"])))
    sprite = sprite.resize((w, h), Image.Resampling.LANCZOS)
    if pose["flip"]:
        sprite = sprite.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if pose["angle"]:
        sprite = sprite.rotate(pose["angle"], resample=Image.Resampling.BICUBIC, expand=True)
        # rotation expands; keep joint by recentering on original box
    cx = ox + wx
    cy = oy - wy
    # After rotate(expand), PIL rotates around center. Approximate anchor:
    # place so the unrotated anchor stays put. For small angles this is close enough.
    left = int(round(cx - w * pose["ax"] - (sprite.width - w) / 2))
    top = int(round(cy - h * (1 - pose["ay"]) - (sprite.height - h) / 2))
    canvas.alpha_composite(sprite, (left, top))


ZOOM = 3.2
for pose in poses.values():
    pose["x"] *= ZOOM
    pose["y"] *= ZOOM
    pose["scale"] *= ZOOM

W, H = 720, 780
canvas = Image.new("RGBA", (W, H), (245, 220, 170, 255))
ox, oy = W / 2, H * 0.62
paste(canvas, "body", "body", ox, oy)
paste(canvas, "legL", "legL", ox, oy)
paste(canvas, "legR", "legR", ox, oy)
paste(canvas, "head", "head", ox, oy)
paste(canvas, "scarf", "scarf", ox, oy)
paste(canvas, "eyeOpen", "eyeL", ox, oy)
paste(canvas, "eyeOpen2", "eyeR", ox, oy)
paste(canvas, "mouthSmile", "mouth", ox, oy)
paste(canvas, "hat", "hat", ox, oy)
paste(canvas, "armL", "armL", ox, oy)
paste(canvas, "armR", "armR", ox, oy)
paste(canvas, "foreL", "foreL", ox, oy)
paste(canvas, "foreR", "foreR", ox, oy)
paste(canvas, "handL", "handL", ox, oy)
paste(canvas, "handR", "handR", ox, oy)

OUT.mkdir(parents=True, exist_ok=True)
path = OUT / "kit-hands-zoom.png"
canvas.save(path)
print("wrote", path)
