"""Fail if the portrait kit still uses split body parts."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "assets" / "scripts" / "avatar" / "AvatarSkinData.ts"
ANIM = ROOT / "assets" / "scripts" / "avatar" / "AvatarAnimator.ts"
MGR = ROOT / "assets" / "scripts" / "avatar" / "AvatarSkinManager.ts"


def _src(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_portrait_kit_is_wired() -> None:
    data = _src(DATA)
    anim = _src(ANIM)
    mgr = _src(MGR)
    assert "ui/avatars/skins/spriteFrame" in data, "整身皮肤表没有进路径"
    assert "ui/avatars/faces/spriteFrame" in data, "表情表没有进路径"
    assert "id: 'cowboy'" in data and "rect:" in data, "皮肤没有整身切图矩形"
    for leftover in ("armL", "foreL", "handL", "legL", "scarf"):
        assert leftover not in data, f"整身方案不应再保留 {leftover}"
    assert "portrait" in anim and "this.face" in anim, "Animator 没有整身/表情根"
    assert "this.eyeL" in anim and "this.mouth" in anim, "Animator 没有表情骨骼"
    assert "_portraits" in mgr, "SkinManager 没有按皮肤切整身"


def test_expression_bones_only() -> None:
    data = _src(DATA)
    assert "eyeOpenL" in data and "mouthSmile" in data
    assert "AVATAR_FACE_SLICES" in data


def test_face_grid_is_the_pose_source() -> None:
    data = _src(DATA)
    assert "AVATAR_FACE_ELLIPSE_PX" in data, "没有脸椭圆测图基准"
    assert "AVATAR_FACE_GRID" in data and "AVATAR_FACE_CELLS" in data, "没有脸格"
    assert "faceCellLocal" in data, "五官坐标没有从格子计算"


if __name__ == "__main__":
    failed = 0
    for fn in (test_portrait_kit_is_wired, test_expression_bones_only, test_face_grid_is_the_pose_source):
        try:
            fn()
            print(f"PASS {fn.__name__}")
        except Exception as exc:
            failed += 1
            print(f"FAIL {fn.__name__}: {exc}")
    sys.exit(1 if failed else 0)
