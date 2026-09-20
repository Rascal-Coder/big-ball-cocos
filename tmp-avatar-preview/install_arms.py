import json
import shutil
from pathlib import Path

src = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\image.png")
dst_dir = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui\avatars")
dst = dst_dir / "arms.png"
shutil.copy2(src, dst)

template = json.loads((dst_dir / "image1.png.meta").read_text(encoding="utf-8"))
old = "71a8c2d4-15f6-4a1b-9c3d-0e4f5a6b7c81"
new = "f92a405c-9d7e-4293-b4b5-86c7d24354a9"
text = json.dumps(template, indent=2)
text = text.replace(old, new).replace("image1", "arms")
(dst_dir / "arms.png.meta").write_text(text + "\n", encoding="utf-8")
print("wrote", dst, dst.stat().st_size)
