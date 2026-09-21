"""Slice beetle/ball sheets and author the skeletal test Scene + Prefab."""
from __future__ import annotations

import importlib.util
import json
import uuid
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS = HERE.parent / "assets"
OUT = ASSETS / "resources" / "rig-test"

spec = importlib.util.spec_from_file_location("home", HERE / "build-home-structure.py")
H = importlib.util.module_from_spec(spec)
spec.loader.exec_module(H)
slicer_spec = importlib.util.spec_from_file_location("slicer", HERE / "slice-new-map.py")
S = importlib.util.module_from_spec(slicer_spec)
slicer_spec.loader.exec_module(S)

NS = uuid.UUID("c8e41b2a-7d03-4f19-9a6e-1beeb1e00000")
BALL_SRC = ROOT / "image.png"
BEETLE_SRC = ROOT / "image3.png"


def uid(name: str) -> str:
    return str(uuid.uuid5(NS, name))


def compress(u: str) -> str:
    hexid = u.replace("-", "")
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    return hexid[:5] + "".join(
        alphabet[int(hexid[i : i + 3], 16) >> 6] + alphabet[int(hexid[i : i + 3], 16) & 63]
        for i in range(5, 32, 3)
    )


def dir_meta(name: str) -> dict:
    return {
        "ver": "1.2.0",
        "importer": "directory",
        "imported": True,
        "uuid": uid(f"dir-{name}"),
        "files": [],
        "subMetas": {},
        "userData": {},
    }


def is_empty(px) -> bool:
    r, g, b, a = px
    return a < 10 or (r > 248 and g > 248 and b > 248)


def flood(mask, x0, y0, w, h):
    stack = [(x0, y0)]
    mask[y0][x0] = False
    min_x = max_x = x0
    min_y = max_y = y0
    count = 1
    while stack:
        x, y = stack.pop()
        min_x = min(min_x, x)
        max_x = max(max_x, x)
        min_y = min(min_y, y)
        max_y = max(max_y, y)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and mask[ny][nx]:
                mask[ny][nx] = False
                stack.append((nx, ny))
                count += 1
    return min_x, min_y, max_x + 1, max_y + 1, count


def boxes_of(im: Image.Image, min_px=80):
    w, h = im.size
    pix = im.load()
    mask = [[not is_empty(pix[x, y]) for x in range(w)] for y in range(h)]
    boxes = []
    for y in range(h):
        for x in range(w):
            if mask[y][x]:
                box = flood(mask, x, y, w, h)
                if box[4] >= min_px:
                    boxes.append(box)
    boxes.sort(key=lambda b: (b[1] // 40, b[0], b[1]))
    return boxes


def save_part(name: str, im: Image.Image, rect) -> Path:
    crop = S.clear_white(im.crop(rect))
    crop = S.trim(crop, 2)
    path = OUT / f"{name}.png"
    crop.save(path)
    S.write_json(path.with_suffix(".png.meta"), S.image_meta(uid(f"img-{name}"), name, *crop.size))
    print(f"  {name:16} {crop.size[0]:4}x{crop.size[1]:<4}")
    return path


def slice_parts() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    H.write_json(ASSETS / "resources" / "rig-test.meta", dir_meta("rig-test"))

    ball = Image.open(BALL_SRC).convert("RGBA")
    beetle = Image.open(BEETLE_SRC).convert("RGBA")

    rolls = [b for b in boxes_of(ball) if b[3] < 480 and (b[2] - b[0]) > 150]
    if len(rolls) < 16:
        raise RuntimeError(f"expected 16 ball roll frames, got {len(rolls)}")
    for i, (x0, y0, x1, y1, _) in enumerate(rolls[:16]):
        save_part(f"ball-{i:02d}", ball, (x0, y0, x1, y1))

    save_part("hat", beetle, (88, 40, 580, 258))
    save_part("body", beetle, (590, 168, 946, 551))
    save_part("bandana", beetle, (965, 176, 1424, 520))

    legs = [b for b in boxes_of(beetle) if b[0] > 120 and (b[2] - b[0]) > 120]
    front = [b for b in legs if 550 <= b[1] <= 600]
    mid = [b for b in legs if 740 <= b[1] <= 770]
    hind = [b for b in legs if 870 <= b[1] <= 920]
    front.sort(key=lambda b: b[0])
    mid.sort(key=lambda b: b[0])
    hind.sort(key=lambda b: b[0])
    if len(mid) < 6 or len(hind) < 6 or len(front) < 6:
        raise RuntimeError(f"leg counts front={len(front)} mid={len(mid)} hind={len(hind)}")
    for group, items in (("front", front[:6]), ("mid", mid[:6]), ("hind", hind[:6])):
        for i, (x0, y0, x1, y1, _) in enumerate(items):
            save_part(f"{group}-{i}", beetle, (x0, y0, x1, y1))


def script_cid(name: str) -> str:
    meta = ASSETS / "scripts" / "rig" / f"{name}.ts.meta"
    H.write_json(meta, H.script_meta(uid(f"script-{name}")))
    return compress(uid(f"script-{name}"))


def component(b: H.Builder, nid: int, typ: str, **data) -> int:
    cid = b.add(
        {
            "__type__": typ,
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": nid},
            "_enabled": True,
            "__prefab": None,
            **data,
        }
    )
    b.nodes[nid]["_components"].append({"__id__": cid})
    return cid


SCALES = {"ball": 0.7, "body": 0.44, "hat": 0.36, "bandana": 0.26, "front": 0.4, "mid": 0.4, "hind": 0.4}
CLIPS = ("idle", "walk", "push")


def register_parts() -> None:
    for path in sorted(OUT.glob("*.png")):
        meta = json.loads(path.with_suffix(".png.meta").read_text(encoding="utf-8"))
        H.SF[path.stem] = f"{meta['uuid']}@f9941"


def part_size(name: str) -> tuple[float, float]:
    scale = SCALES.get(name.split("-")[0], 0.4)
    image = Image.open(OUT / f"{name}.png")
    return image.width * scale, image.height * scale


def sf_ref(name: str) -> dict:
    return {"__uuid__": H.SF[name], "__expectedType__": "cc.SpriteFrame"}


def clip_ref(name: str) -> dict:
    return {"__uuid__": uid(f"anim-{name}"), "__expectedType__": "cc.AnimationClip"}


def real_kf(value: float) -> dict:
    return {
        "__type__": "cc.RealKeyframeValue",
        "interpolationMode": 0,
        "tangentWeightMode": 0,
        "value": value,
        "rightTangent": 0,
        "rightTangentWeight": 0,
        "leftTangent": 0,
        "leftTangentWeight": 0,
        "easingMethod": 0,
    }


def track_binding(node_path: str, prop: str, component: str | None = None) -> dict:
    paths: list = []
    if node_path:
        paths.append({"__type__": "cc.animation.HierarchyPath", "path": node_path})
    if component:
        paths.append({"__type__": "cc.animation.ComponentPath", "component": component})
    paths.append(prop)
    return {
        "__type__": "cc.animation.TrackBinding",
        "path": {"__type__": "cc.animation.TrackPath", "_paths": paths},
        "proxy": None,
    }


class AnimClip:
    def __init__(self, name: str, duration: float, sample=30):
        self.objects: list[dict] = [
            {
                "__type__": "cc.AnimationClip",
                "_name": name,
                "_objFlags": 0,
                "__editorExtras__": {},
                "_native": "",
                "sample": sample,
                "speed": 1,
                "wrapMode": 2,
                "enableTrsBlending": False,
                "_duration": duration,
                "_hash": 0,
                "_tracks": [],
                "_exoticAnimation": None,
                "_events": [],
                "_embeddedPlayers": [],
                "_additiveSettings": {
                    "__type__": "cc.AnimationClipAdditiveSettings",
                    "enabled": False,
                    "refClip": None,
                },
                "_auxiliaryCurveEntries": [],
            }
        ]

    def add(self, obj: dict) -> int:
        self.objects.append(obj)
        return len(self.objects) - 1

    def channel(self, times: list[float], values: list[float]) -> int:
        return self.add(
            {
                "__type__": "cc.animation.Channel",
                "_curve": {
                    "__type__": "cc.RealCurve",
                    "_times": times,
                    "_values": [real_kf(v) for v in values],
                    "preExtrapolation": 1,
                    "postExtrapolation": 1,
                },
            }
        )

    def vec(self, node_path: str, prop: str, times: list[float], xs: list[float], ys: list[float], zs: list[float] | None = None) -> None:
        zeros = [0.0] * len(times)
        zs = zs or zeros
        tid = self.add(
            {
                "__type__": "cc.animation.VectorTrack",
                "_binding": track_binding(node_path, prop),
                "_channels": [],
                "_nComponents": 3,
            }
        )
        self.objects[tid]["_channels"] = [
            {"__id__": self.channel(times, xs)},
            {"__id__": self.channel(times, ys)},
            {"__id__": self.channel(times, zs)},
            {"__id__": self.channel(times, zeros)},
        ]
        self.objects[0]["_tracks"].append({"__id__": tid})

    def sprites(self, node_path: str, times: list[float], frames: list[str]) -> None:
        tid = self.add(
            {
                "__type__": "cc.animation.ObjectTrack",
                "_binding": track_binding(node_path, "spriteFrame", "cc.Sprite"),
                "_channel": None,
            }
        )
        cid = self.add(
            {
                "__type__": "cc.animation.Channel",
                "_curve": {
                    "__type__": "cc.ObjectCurve",
                    "_times": times,
                    "_values": [sf_ref(name) for name in frames],
                },
            }
        )
        self.objects[tid]["_channel"] = {"__id__": cid}
        self.objects[0]["_tracks"].append({"__id__": tid})


def write_clip(name: str, clip: AnimClip) -> None:
    path = OUT / f"{name}.anim"
    H.write_json(path, clip.objects)
    H.write_json(
        path.with_suffix(".anim.meta"),
        {
            "ver": "2.0.4",
            "importer": "animation-clip",
            "imported": True,
            "uuid": uid(f"anim-{name}"),
            "files": [".json"],
            "subMetas": {},
            "userData": {"name": name},
        },
    )


def build_clips() -> None:
    idle_t = [0.0, 0.3, 0.6, 0.9, 1.2]
    idle = AnimClip("idle", 1.2)
    idle.vec("Beetle", "position", idle_t, [0, 0.6, 0, -0.6, 0], [-40, -36, -40, -36, -40])
    idle.vec("Beetle", "eulerAngles", idle_t, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, -1.4, 0, 1.4, 0])
    idle.vec("Beetle/Hat", "position", idle_t, [0, 1.2, 0, -1.2, 0], [118, 121, 118, 121, 118])
    idle.vec("Beetle/Hat", "eulerAngles", idle_t, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 3, 0, -3, 0])
    idle.vec("Beetle/Bandana", "eulerAngles", idle_t, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 4, 0, -4, 0])
    idle.vec("Beetle/Body", "scale", idle_t, [1, 0.975, 1, 0.975, 1], [1, 1.025, 1, 1.025, 1], [1, 1, 1, 1, 1])
    idle.vec("Beetle/FrontL", "eulerAngles", idle_t, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 4, 0, -4, 0])
    idle.vec("Beetle/FrontR", "eulerAngles", idle_t, [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, -4, 0, 4, 0])
    idle.sprites("Ball", [0.0], ["ball-00"])
    write_clip("idle", idle)

    walk_t = [0.0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75]
    walk = AnimClip("walk", 0.75)
    walk.vec("Beetle", "position", walk_t, [0, 2, 0, -2, 0, 2, 0], [-40, -34, -40, -34, -40, -34, -40])
    walk.vec("Beetle", "eulerAngles", walk_t, [0] * 7, [0] * 7, [0, 3, 0, -3, 0, 3, 0])
    walk.vec("Beetle/Hat", "eulerAngles", walk_t, [0] * 7, [0] * 7, [0, 6, 0, -6, 0, 6, 0])
    walk.vec("Beetle/MidL", "eulerAngles", walk_t, [0] * 7, [0] * 7, [0, 18, 0, -18, 0, 18, 0])
    walk.vec("Beetle/MidR", "eulerAngles", walk_t, [0] * 7, [0] * 7, [0, -18, 0, 18, 0, -18, 0])
    walk.vec("Beetle/HindL", "eulerAngles", walk_t, [0] * 7, [0] * 7, [0, 10, 0, -10, 0, 10, 0])
    walk.vec("Beetle/HindR", "eulerAngles", walk_t, [0] * 7, [0] * 7, [0, -10, 0, 10, 0, -10, 0])
    mid = [f"mid-{i}" for i in range(6)] + ["mid-0"]
    hind = [f"hind-{(i + 1) % 6}" for i in range(6)] + ["hind-1"]
    walk.sprites("Beetle/MidL", walk_t, mid)
    walk.sprites("Beetle/MidR", walk_t, [f"mid-{(i + 3) % 6}" for i in range(6)] + ["mid-3"])
    walk.sprites("Beetle/HindL", walk_t, hind)
    walk.sprites("Beetle/HindR", walk_t, [f"hind-{(i + 4) % 6}" for i in range(6)] + ["hind-4"])
    write_clip("walk", walk)

    push_t = [0.0, 0.2, 0.4, 0.6, 0.8]
    push = AnimClip("push", 0.8)
    push.vec("Beetle", "position", push_t, [0, 1, 0, -1, 0], [-36, -32, -36, -32, -36])
    push.vec("Beetle", "eulerAngles", push_t, [0] * 5, [0] * 5, [-6, -8, -6, -8, -6])
    push.vec("Beetle/Hat", "eulerAngles", push_t, [0] * 5, [0] * 5, [0, 6, 0, -6, 0])
    push.vec("Beetle/FrontL", "eulerAngles", push_t, [0] * 5, [0] * 5, [0, 16, 0, -16, 0])
    push.vec("Beetle/FrontR", "eulerAngles", push_t, [0] * 5, [0] * 5, [0, -16, 0, 16, 0])
    push.vec("Ball", "position", push_t, [0, 4, 0, -4, 0], [236, 239, 236, 239, 236])
    front_t = [i * 0.8 / 6 for i in range(7)]
    push.sprites("Beetle/FrontL", front_t, [f"front-{i % 6}" for i in range(7)])
    push.sprites("Beetle/FrontR", front_t, [f"front-{(i + 2) % 6}" for i in range(7)])
    ball_t = [i * 0.05 for i in range(17)]
    push.sprites("Ball", ball_t, [f"ball-{i % 16:02d}" for i in range(17)])
    write_clip("push", push)


def sprite_node(b: H.Builder, name: str, parent: int, w: float, h: float, x=0.0, y=0.0, ax=0.5, ay=0.5, frame: str | None = None, flip_x=False) -> int:
    nid = b.node(name, parent, w, h, x, y, ax=ax, ay=ay)
    if flip_x:
        b.nodes[nid]["_lscale"] = H.vec3(-1, 1, 1)
    sid = b.sprite(nid, frame)
    b.nodes[sid]["_isTrimmedMode"] = True
    return nid


def part_node(b: H.Builder, name: str, parent: int, art: str, x: float, y: float, ax=0.5, ay=0.5, flip_x=False) -> int:
    w, h = part_size(art)
    return sprite_node(b, name, parent, w, h, x, y, ax, ay, art, flip_x)


def add_animation(b: H.Builder, nid: int) -> None:
    component(
        b,
        nid,
        "cc.Animation",
        playOnLoad=True,
        _clips=[clip_ref(name) for name in CLIPS],
        _defaultClip=clip_ref("push"),
    )


def build_rig_nodes(b: H.Builder, parent: int | None) -> int:
    root = b.node("BeetleRig", parent, 520, 720)
    part_node(b, "Ball", root, "ball-00", 0, 236)
    beetle = b.node("Beetle", root, 360, 360, 0, -40)
    part_node(b, "HindL", beetle, "hind-0", -78, -86, 0.78, 0.42)
    part_node(b, "HindR", beetle, "hind-1", 78, -86, 0.22, 0.42, True)
    part_node(b, "MidL", beetle, "mid-0", -102, -6, 0.82, 0.5)
    part_node(b, "MidR", beetle, "mid-0", 102, -6, 0.18, 0.5, True)
    part_node(b, "Body", beetle, "body", 0, 8)
    part_node(b, "Bandana", beetle, "bandana", 10, 58)
    part_node(b, "Hat", beetle, "hat", 0, 118)
    part_node(b, "FrontL", beetle, "front-0", -72, 86, 0.72, 0.28)
    part_node(b, "FrontR", beetle, "front-0", 72, 86, 0.28, 0.28, True)
    return root


def build_prefab() -> Path:
    b = H.begin_prefab("beetle-rig")
    root = build_rig_nodes(b, None)
    add_animation(b, root)
    component(b, root, script_cid("BeetleRigView"))
    path = OUT / "beetle-rig.prefab"
    H.write_json(path, H.finish_prefab(b))
    H.write_json(path.with_suffix(".prefab.meta"), H.prefab_meta(uid("prefab-beetle-rig")))
    return path


def scene_globals(start_id: int) -> list[dict]:
    old = json.loads((ASSETS / "scenes" / "loading.scene").read_text(encoding="utf-8"))
    globals_obj = next(obj for obj in old if obj.get("__type__") == "cc.SceneGlobals")
    chunk = old[old.index(globals_obj) :]
    mapping = {old.index(globals_obj) + i: start_id + i for i in range(len(chunk))}

    def remap(value):
        if isinstance(value, dict):
            if set(value.keys()) == {"__id__"} and value["__id__"] in mapping:
                return {"__id__": mapping[value["__id__"]]}
            return {k: remap(v) for k, v in value.items()}
        if isinstance(value, list):
            return [remap(v) for v in value]
        return value

    return remap(chunk)


def plaque_button(b: H.Builder, parent: int, name: str, text: str, x: float, y: float) -> int:
    nid = b.node(name, parent, 176, 132, x, y)
    body = b.sprite_node("Body", nid, 176, 132, "plaque")
    del body
    b.label_node("Label", nid, text, 34, (255, 255, 255), 160, 48, y=-20, outline=True)
    component(
        b,
        nid,
        "cc.Button",
        _interactable=True,
        _transition=3,
        _duration=0.1,
        _zoomScale=0.94,
        _target={"__id__": nid},
        clickEvents=[],
    )
    return nid


def build_scene() -> Path:
    objects: list[dict] = [
        {
            "__type__": "cc.SceneAsset",
            "_name": "rig-test",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "scene": {"__id__": 1},
        }
    ]
    b = H.Builder("scene", uid("scene-rig-test"))
    b.nodes = objects
    scene = b.add(
        {
            "__type__": "cc.Scene",
            "_name": "rig-test",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": None,
            "_children": [],
            "_active": True,
            "_components": [],
            "_prefab": None,
            "_lpos": H.vec3(),
            "_lrot": H.quat(),
            "_lscale": H.vec3(1, 1, 1),
            "_mobility": 0,
            "_layer": 1073741824,
            "_euler": H.vec3(),
            "autoReleaseAssets": False,
            "_globals": None,
            "_id": uid("scene-rig-test"),
        }
    )
    canvas = b.add(
        {
            "__type__": "cc.Node",
            "_name": "Canvas",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": {"__id__": scene},
            "_children": [],
            "_active": True,
            "_components": [],
            "_prefab": None,
            "_lpos": H.vec3(375, 667, 0),
            "_lrot": H.quat(),
            "_lscale": H.vec3(1, 1, 1),
            "_mobility": 0,
            "_layer": H.LAYER,
            "_euler": H.vec3(),
            "_id": "rigTestCanvas0000000001",
        }
    )
    objects[scene]["_children"] = [{"__id__": canvas}]
    camera = b.add(
        {
            "__type__": "cc.Node",
            "_name": "Camera",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": {"__id__": canvas},
            "_children": [],
            "_active": True,
            "_components": [],
            "_prefab": None,
            "_lpos": H.vec3(0, 0, 1000),
            "_lrot": H.quat(),
            "_lscale": H.vec3(1, 1, 1),
            "_mobility": 0,
            "_layer": 1073741824,
            "_euler": H.vec3(),
            "_id": "rigTestCamera0000000001",
        }
    )
    objects[canvas]["_children"].append({"__id__": camera})
    cam_comp = b.add(
        {
            "__type__": "cc.Camera",
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": camera},
            "_enabled": True,
            "__prefab": None,
            "_projection": 0,
            "_priority": 0,
            "_fov": 45,
            "_fovAxis": 0,
            "_orthoHeight": 667,
            "_near": 0,
            "_far": 2000,
            "_color": H.color(0, 0, 0, 255),
            "_depth": 1,
            "_stencil": 0,
            "_clearFlags": 7,
            "_rect": {"__type__": "cc.Rect", "x": 0, "y": 0, "width": 1, "height": 1},
            "_aperture": 19,
            "_shutter": 7,
            "_iso": 0,
            "_screenScale": 1,
            "_visibility": 1108344832,
            "_targetTexture": None,
            "_postProcess": None,
            "_usePostProcess": False,
            "_cameraType": -1,
            "_trackingType": 0,
            "_id": "rigTestCamComp000000001",
        }
    )
    objects[camera]["_components"] = [{"__id__": cam_comp}]

    backdrop = b.sprite_node("Backdrop", canvas, 750, 1334, "bg-home")
    b.opacity(backdrop, 255)
    b.widget(backdrop, H.TOP | H.BOTTOM | H.LEFT | H.RIGHT)

    header = b.node("Header", canvas, 680, 160, 0, 520)
    title = b.sprite_node("TitleSign", header, 560, 150, "sign-title")
    b.label_node("Main", title, "骨骼试镜", 52, (255, 226, 140), 480, 80, y=-36, outline=True)

    stage = b.node("Stage", canvas, 520, 720, 0, 36)
    root = build_rig_nodes(b, stage)
    add_animation(b, root)
    component(b, root, script_cid("BeetleRigView"))

    hud = b.node("HUD", canvas, 720, 220, 0, -500)
    b.widget(hud, H.BOTTOM | H.HCENTER, bottom=28)
    plaque_button(b, hud, "BtnIdle", "待机", -210, 16)
    plaque_button(b, hud, "BtnWalk", "行走", 0, 16)
    plaque_button(b, hud, "BtnPush", "推球", 210, 16)
    b.label_node("Status", hud, "推球 · 牛仔分件", 24, (255, 236, 186), 520, 40, 0, -78, outline=True)

    uit = b.add(
        {
            "__type__": "cc.UITransform",
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": canvas},
            "_enabled": True,
            "__prefab": None,
            "_contentSize": H.size(750, 1334),
            "_anchorPoint": H.vec2(0.5, 0.5),
            "_id": "rigTestCanvasUIT0000001",
        }
    )
    canvas_comp = b.add(
        {
            "__type__": "cc.Canvas",
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": canvas},
            "_enabled": True,
            "__prefab": None,
            "_cameraComponent": {"__id__": cam_comp},
            "_alignCanvasWithScreen": True,
            "_id": "rigTestCanvasComp000001",
        }
    )
    widget = b.add(
        {
            "__type__": "cc.Widget",
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": canvas},
            "_enabled": True,
            "__prefab": None,
            "_alignFlags": 45,
            "_target": None,
            "_left": 0,
            "_right": 0,
            "_top": 0,
            "_bottom": 0,
            "_horizontalCenter": 0,
            "_verticalCenter": 0,
            "_isAbsLeft": True,
            "_isAbsRight": True,
            "_isAbsTop": True,
            "_isAbsBottom": True,
            "_isAbsHorizontalCenter": True,
            "_isAbsVerticalCenter": True,
            "_originalWidth": 0,
            "_originalHeight": 0,
            "_alignMode": 2,
            "_lockFlags": 0,
            "_id": "rigTestCanvasWid0000001",
        }
    )
    app = b.add(
        {
            "__type__": script_cid("BeetleRigTest"),
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": canvas},
            "_enabled": True,
            "__prefab": None,
            "_id": "rigTestBoot000000000001",
        }
    )
    objects[canvas]["_components"] = [{"__id__": uit}, {"__id__": canvas_comp}, {"__id__": widget}, {"__id__": app}]

    chunk = scene_globals(len(objects))
    objects[scene]["_globals"] = {"__id__": len(objects)}
    objects.extend(chunk)

    path = ASSETS / "scenes" / "rig-test.scene"
    H.write_json(path, objects)
    H.write_json(
        path.with_suffix(".scene.meta"),
        {
            "ver": "1.1.50",
            "importer": "scene",
            "imported": True,
            "uuid": uid("scene-rig-test"),
            "files": [".json"],
            "subMetas": {},
            "userData": {},
        },
    )
    return path


def write_scripts() -> None:
    folder = ASSETS / "scripts" / "rig"
    folder.mkdir(parents=True, exist_ok=True)
    H.write_json(ASSETS / "scripts" / "rig.meta", dir_meta("scripts-rig"))
    H.write_json((folder / "BeetleRigData.ts").with_suffix(".ts.meta"), H.script_meta(uid("script-BeetleRigData")))
    script_cid("BeetleRigView")
    script_cid("BeetleRigTest")


def main() -> None:
    print("slice")
    if not (OUT / "ball-00.png").exists():
        slice_parts()
    else:
        print("slice skipped")
    register_parts()
    build_clips()
    write_scripts()
    prefab = build_prefab()
    scene = build_scene()
    print("prefab", prefab)
    print("scene", scene)


if __name__ == "__main__":
    main()
