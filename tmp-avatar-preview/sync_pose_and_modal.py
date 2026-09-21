"""Copy modal art and sync hardcoded face poses into scene/prefab."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from bake_editor_parts import write_meta

ROOT = Path(r"C:\big-ball-cocos")
SRC = ROOT / "docs" / "modal" / "modal1.png"
OUT = ROOT / "golden-roll" / "assets" / "resources" / "ui" / "modal-skin.png"
SCENE = ROOT / "golden-roll" / "assets" / "scenes" / "main.scene"
PREFAB = ROOT / "golden-roll" / "assets" / "resources" / "ui" / "avatar-cowboy.prefab"
MODAL_UUID = "a9b8c7d6-e5f4-4321-8a09-1234567890ab"

POSES = {
    "BrowL": {"x": -33, "y": 12.5, "sx": 1, "sy": 1},
    "BrowR": {"x": -3, "y": 12.5, "sx": 1, "sy": 1},
    "EyeL": {"x": -33, "y": -5, "sx": 0.8, "sy": 0.8},
    "EyeR": {"x": -3, "y": -5, "sx": 0.8, "sy": 0.8},
    "Mouth": {"x": -18, "y": -22, "sx": 0.4, "sy": 0.4},
}


def sync_poses(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for obj in data:
        if obj.get("__type__") != "cc.Node":
            continue
        pose = POSES.get(obj.get("_name"))
        if not pose:
            continue
        obj["_lpos"]["x"] = pose["x"]
        obj["_lpos"]["y"] = pose["y"]
        obj["_lscale"]["x"] = pose["sx"]
        obj["_lscale"]["y"] = pose["sy"]
        n += 1
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("poses", path.name, n)


def main() -> None:
    shutil.copyfile(SRC, OUT)
    from PIL import Image

    w, h = Image.open(OUT).size
    write_meta(OUT.with_suffix(".png.meta"), "modal-skin", MODAL_UUID, w, h)
    print("modal", OUT, w, h)
    sync_poses(SCENE)
    sync_poses(PREFAB)


if __name__ == "__main__":
    main()
