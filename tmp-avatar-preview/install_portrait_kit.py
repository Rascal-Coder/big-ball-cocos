import json
import shutil
from pathlib import Path

SRC = Path(r"C:\big-ball-cocos\docs\avatars")
DST = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\avatars")
TPL = json.loads((DST / "image1.png.meta").read_text(encoding="utf-8"))


def write_meta(name: str, uuid: str, w: int, h: int) -> None:
    half_w = w / 2
    half_h = h / 2
    data = json.loads(json.dumps(TPL).replace("71a8c2d4-15f6-4a1b-9c3d-0e4f5a6b7c81", uuid).replace("image1", name))
    sf = data["subMetas"]["f9941"]["userData"]
    sf.update(
        {
            "width": w,
            "height": h,
            "rawWidth": w,
            "rawHeight": h,
            "vertices": {
                "rawPosition": [-half_w, -half_h, 0, half_w, -half_h, 0, -half_w, half_h, 0, half_w, half_h, 0],
                "indexes": [0, 1, 2, 2, 1, 3],
                "uv": [0, h, w, h, 0, 0, w, 0],
                "nuv": [0, 0, 1, 0, 0, 1, 1, 1],
                "minPos": [-half_w, -half_h, 0],
                "maxPos": [half_w, half_h, 0],
            },
        }
    )
    (DST / f"{name}.png.meta").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


shutil.copy2(SRC / "image.png", DST / "skins.png")
shutil.copy2(SRC / "image1.png", DST / "faces.png")
write_meta("skins", "c3d4e5f6-0718-4a01-9cde-334455667788", 1536, 1024)
write_meta("faces", "d4e5f607-1829-4b12-ade0-445566778899", 1254, 1254)
print("installed skins.png and faces.png")
