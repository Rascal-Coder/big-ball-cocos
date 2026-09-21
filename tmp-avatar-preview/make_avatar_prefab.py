"""Generate avatar-cowboy.prefab and mount AvatarRoot under Canvas in main.scene."""
from __future__ import annotations

import json
from pathlib import Path

B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
LAYER = 33554432
ANIM = None
PREFAB_UUID = "e8a91b02-3c4d-4e5f-9012-3456789abcde"


def compress_uuid(uuid: str) -> str:
    raw = uuid.replace("-", "")
    head, rest = raw[:5], raw[5:]
    out = [head]
    i = 0
    while i < len(rest):
        chunk = rest[i : i + 3].ljust(3, "0")
        i += 3
        n = int(chunk, 16)
        out.append(B64[(n >> 6) & 63])
        out.append(B64[n & 63])
    return "".join(out)


ANIM = compress_uuid("8dbccedb-e5e0-43ab-b8f2-5c50cc748bf6")


def vec3(x=0.0, y=0.0, z=0.0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def quat():
    return {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1}


def size(w, h):
    return {"__type__": "cc.Size", "width": w, "height": h}


def color(r=255, g=255, b=255, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


class Builder:
    def __init__(self, mode: str):
        self.mode = mode  # prefab | scene
        self.nodes: list[dict] = []
        self.root_id: int | None = None
        self.asset_ref = {"__id__": 0} if mode == "prefab" else {"__uuid__": PREFAB_UUID}

    def add(self, obj: dict) -> int:
        self.nodes.append(obj)
        return len(self.nodes) - 1

    def make_id(self, name: str) -> str:
        if self.mode == "prefab":
            return ""
        seed = abs(hash(f"scene-{name}"))
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        chars = []
        n = seed
        for _ in range(22):
            chars.append(alphabet[n % 64])
            n = n // 64 + 17 * (n % 7 + 1)
        return "".join(chars)

    def prefab_info(self, file_id: str) -> int:
        return self.add(
            {
                "__type__": "cc.PrefabInfo",
                "root": {"__id__": 1} if self.root_id is None else {"__id__": self.root_id},
                "asset": self.asset_ref,
                "fileId": file_id,
                "instance": None,
                "targetOverrides": None,
                "nestedPrefabInstanceRoots": None,
            }
        )

    def ui_transform(self, nid: int, w: float, h: float, ax=0.5, ay=0.5) -> int:
        return self.add(
            {
                "__type__": "cc.UITransform",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_contentSize": size(w, h),
                "_anchorPoint": {"__type__": "cc.Vec2", "x": ax, "y": ay},
                "_id": self.make_id(f"uit-{nid}"),
            }
        )

    def sprite(self, nid: int) -> int:
        return self.add(
            {
                "__type__": "cc.Sprite",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_customMaterial": None,
                "_srcBlendFactor": 2,
                "_dstBlendFactor": 4,
                "_color": color(),
                "_spriteFrame": None,
                "_type": 0,
                "_fillType": 0,
                "_sizeMode": 0,
                "_isTrimmedMode": False,
                "_useGrayscale": False,
                "_fillCenter": {"__type__": "cc.Vec2", "x": 0, "y": 0},
                "_fillStart": 0,
                "_fillRange": 0,
                "_atlas": None,
                "_id": self.make_id(f"sp-{nid}"),
            }
        )

    def node(self, name: str, x: float, y: float, w: float, h: float, file_id: str, parent: int | None, with_sprite=False, ay=0.5):
        nid = self.add(
            {
                "__type__": "cc.Node",
                "_name": name,
                "_objFlags": 0,
                "__editorExtras__": {},
                "_parent": {"__id__": parent} if parent is not None else None,
                "_children": [],
                "_active": True,
                "_components": [],
                "_prefab": None,
                "_lpos": vec3(x, y, 0),
                "_lrot": quat(),
                "_lscale": vec3(1, 1, 1),
                "_mobility": 0,
                "_layer": LAYER,
                "_euler": vec3(),
                "_id": self.make_id(name),
            }
        )
        if self.root_id is None:
            self.root_id = nid
        uit = self.ui_transform(nid, w, h, 0.5, ay)
        comps = [uit]
        if with_sprite:
            comps.append(self.sprite(nid))
        self.nodes[nid]["_components"] = [{"__id__": c} for c in comps]
        if self.mode == "prefab":
            info = self.prefab_info(file_id)
            self.nodes[nid]["_prefab"] = {"__id__": info}
        if parent is not None:
            self.nodes[parent]["_children"].append({"__id__": nid})
        return nid

    def animator(self, nid: int) -> int:
        return self.add(
            {
                "__type__": ANIM,
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "skinId": "cowboy",
                "playMode": 0,
                "clickEnabled": True,
                "partsOverride": None,
                "keepScenePose": True,
                "_id": self.make_id(f"anim-{nid}"),
            }
        )


def build_tree(mode: str) -> Builder:
    b = Builder(mode)
    if mode == "prefab":
        b.add(
            {
                "__type__": "cc.Prefab",
                "_name": "avatar-cowboy",
                "_objFlags": 0,
                "__editorExtras__": {},
                "_native": "",
                "data": {"__id__": 1},
                "optimizationPolicy": 0,
                "persistent": False,
            }
        )
    root = b.node("AvatarRoot", 0, 0, 204, 202, "12a0avatarroot01", None)
    anim = b.animator(root)
    b.nodes[root]["_components"].append({"__id__": anim})
    b.node("Shade", 0, -88, 148, 20, "12a1shadexxxxx02", root)
    b.node("Shadow", 4, -64, 78, 18, "12a2shadowxxxx03", root)
    rig = b.node("CharacterRoot", 0, 8, 160, 160, "12a3charrootxx04", root)
    portrait = b.node("Portrait", 0, -4, 32, 32, "12a4portraitxx05", rig, with_sprite=True, ay=0.42)
    face = b.node("Face", 0, -6, 80, 80, "12a5facexxxxxx06", portrait)
    b.node("BrowL", -13, 18, 32, 32, "12a6browlxxxxx07", face, with_sprite=True)
    b.node("BrowR", 13, 18, 32, 32, "12a7browrxxxxx08", face, with_sprite=True)
    b.node("EyeL", -13, 8, 32, 32, "12a8eyelxxxxxx09", face, with_sprite=True)
    b.node("EyeR", 13, 8, 32, 32, "12a9eyerxxxxxx10", face, with_sprite=True)
    b.node("Mouth", 0, -8, 32, 32, "12aamouthxxxx11", face, with_sprite=True)
    b.node("AvatarFrame", 0, 0, 204, 202, "12abframexxxxx12", root, with_sprite=True)
    if mode == "prefab":
        for obj in b.nodes:
            if obj.get("__type__") == "cc.PrefabInfo":
                obj["root"] = {"__id__": root}
        b.nodes[0]["data"] = {"__id__": root}
    return b


def remap(objects: list[dict], offset: int) -> list[dict]:
    def fix(value):
        if isinstance(value, dict):
            if set(value.keys()) == {"__id__"}:
                return {"__id__": value["__id__"] + offset}
            return {k: fix(v) for k, v in value.items()}
        if isinstance(value, list):
            return [fix(v) for v in value]
        return value

    return [fix(obj) for obj in objects]


def main() -> None:
    ui_dir = Path(r"C:\big-ball-cocos\golden-roll\assets\resources\ui")
    scene_path = Path(r"C:\big-ball-cocos\golden-roll\assets\scenes\main.scene")

    prefab = build_tree("prefab")
    prefab_path = ui_dir / "avatar-cowboy.prefab"
    prefab_path.write_text(json.dumps(prefab.nodes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    meta = {
        "ver": "1.1.50",
        "importer": "prefab",
        "imported": True,
        "uuid": PREFAB_UUID,
        "files": [".json"],
        "subMetas": {},
        "userData": {"syncNodeName": True},
    }
    (ui_dir / "avatar-cowboy.prefab.meta").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")

    scene = json.loads(scene_path.read_text(encoding="utf-8"))
    # drop a previous generated AvatarRoot if re-run
    keep = []
    drop_ids = set()
    for i, obj in enumerate(scene):
        if obj.get("__type__") == "cc.Node" and obj.get("_name") == "AvatarRoot":
            drop_ids.add(i)
    # also drop orphaned objects that only belonged to that tree is hard; first run only
    if drop_ids:
        print("scene already has AvatarRoot ids", drop_ids, "- skip scene patch")
    else:
        tree = build_tree("scene")
        tree.nodes[tree.root_id]["_lpos"] = vec3(0, 72, 0)
        offset = len(scene)
        mapped = remap(tree.nodes, offset)
        mapped[tree.root_id]["_parent"] = {"__id__": 2}
        scene[2]["_children"].append({"__id__": tree.root_id + offset})
        scene.extend(mapped)
        scene_path.write_text(json.dumps(scene, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("scene patched, root", tree.root_id + offset, "count", len(mapped))

    print("prefab", prefab_path, "anim", ANIM, "root", prefab.root_id, "count", len(prefab.nodes))


if __name__ == "__main__":
    main()
