"""Build home Scene nodes and reusable UI Prefabs. Do not new Node the home page."""
from __future__ import annotations

import json
from pathlib import Path

LAYER = 33554432
FONT = "7c1a2001-3333-4c01-8cde-000000000010"
NUM_FONT = "7c1a2001-3333-4c01-8cde-000000000010"
GAME_APP = "45512bqsiBCJ7sTMTtvU6Sl"
DESIGN = (750.0, 1334.0)

SF = {
    "bg-loading": "60ee5732-5fc5-4294-a804-372f88b508b2@f9941",
    "bg-home": "f0aa8889-6749-4d2b-a1bc-6d2bc4e2cbf2@f9941",
    "sign-title": "6d57621c-bea8-4193-87fa-c6422e80b4a8@f9941",
    "beetle": "acfdfec5-7bdd-41a3-9f8a-8a06c7d24d79@f9941",
    "progress": "cc179507-a398-4d34-bbc3-9c1e6c7c2e20@f9941",
    "plaque": "5e0be8b0-9154-455f-ac0b-4852502ff506@f9941",
    "gold": "28d32751-8ffe-4272-821d-738099fe4843@f9941",
    "start": "70ade6b8-727c-41f0-8d97-c70f639d9a19@f9941",
    "home-title": "9d16990f-8e14-49d0-b5d0-4f92485f2685@f9941",
    "skin": "a9b8c7d6-e5f4-4321-8a09-1234567890ab@f9941",
    "load-fill": "7c1a3001-4444-4d01-8cde-000000000008@f9941",
    "load-track": "7c1a3001-4444-4d01-8cde-000000000007@f9941",
    "decor-l": "c5073dc4-ad5c-40d3-bebe-54f425fb7fab@f9941",
    "decor-r": "722b01b6-11c6-4c52-b94e-77f3111e8811@f9941",
    "cactus": "84c4b443-93c1-4874-8b28-c7f2fb9df1ab@f9941",
    "skull": "8b74bf4a-f571-416e-9b9e-91ec8980bc94@f9941",
    "rock-lg": "8c1a8f39-e6dd-4b97-8ab3-a3dee3285b82@f9941",
    "rock-sm": "57cfffd9-48ef-46d3-b8e8-e7d6cd8e0dcc@f9941",
    "tumbleweed": "fa10e895-a417-46a9-838b-444ab2901f98@f9941",
    "sage": "cc7b09f1-a68b-458a-945b-5f45bc2105f7@f9941",
}

PREFABS = {
    "bar-gold": "7c1a0001-1111-4a01-8cde-000000000001",
    "btn-plaque": "7c1a0001-1111-4a01-8cde-000000000002",
    "loading": "7c1a0001-1111-4a01-8cde-000000000003",
    "modal-skin": "7c1a0001-1111-4a01-8cde-000000000004",
    "toast": "7c1a0001-1111-4a01-8cde-000000000005",
    "confirm": "7c1a0001-1111-4a01-8cde-000000000006",
    "red-dot": "7c1a0001-1111-4a01-8cde-000000000007",
    "skin-cell": "7c1a0001-1111-4a01-8cde-000000000008",
}

SCRIPTS = {
    "NodeQuery": "7c1a1001-2222-4b01-8cde-000000000001",
    "AssetService": "7c1a1001-2222-4b01-8cde-000000000002",
    "CurrencyBar": "7c1a1001-2222-4b01-8cde-000000000003",
    "PlaqueButton": "7c1a1001-2222-4b01-8cde-000000000004",
    "RedDot": "7c1a1001-2222-4b01-8cde-000000000005",
    "LoadingView": "7c1a1001-2222-4b01-8cde-000000000006",
    "ToastView": "7c1a1001-2222-4b01-8cde-000000000007",
    "ConfirmView": "7c1a1001-2222-4b01-8cde-000000000008",
    "SkinCell": "7c1a1001-2222-4b01-8cde-000000000009",
    "SkinModalView": "7c1a1001-2222-4b01-8cde-00000000000a",
    "OverlayService": "7c1a1001-2222-4b01-8cde-00000000000b",
    "HomeController": "7c1a1001-2222-4b01-8cde-00000000000c",
    "Format": "7c1a1001-2222-4b01-8cde-000000000010",
}

TOP = 1
VCENTER = 2
BOTTOM = 4
LEFT = 8
HCENTER = 16
RIGHT = 32


def vec2(x=0.0, y=0.0):
    return {"__type__": "cc.Vec2", "x": x, "y": y}


def vec3(x=0.0, y=0.0, z=0.0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}


def quat(z=0.0):
    import math
    rad = math.radians(z)
    return {"__type__": "cc.Quat", "x": 0, "y": 0, "z": math.sin(rad / 2), "w": math.cos(rad / 2)}


def size(w, h):
    return {"__type__": "cc.Size", "width": w, "height": h}


def color(r=255, g=255, b=255, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}


def sf(key: str):
    return {"__uuid__": SF[key], "__expectedType__": "cc.SpriteFrame"}


def font_ref():
    return {"__uuid__": FONT, "__expectedType__": "cc.TTFFont"}


def num_font_ref():
    return {"__uuid__": NUM_FONT, "__expectedType__": "cc.TTFFont"}


class Builder:
    def __init__(self, mode: str, asset_uuid: str | None = None):
        self.mode = mode
        self.nodes: list[dict] = []
        self.root_id: int | None = None
        self.asset_ref = {"__id__": 0} if mode == "prefab" else {"__uuid__": asset_uuid}

    def add(self, obj: dict) -> int:
        self.nodes.append(obj)
        return len(self.nodes) - 1

    def make_id(self, name: str) -> str:
        if self.mode == "prefab":
            return ""
        seed = abs(hash(f"nbdx-{name}"))
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        chars = []
        n = seed
        for _ in range(22):
            chars.append(alphabet[n % 64])
            n = n // 64 + 17 * (n % 7 + 1)
        return "".join(chars)

    def prefab_info(self, file_id: str, root: int) -> int:
        return self.add(
            {
                "__type__": "cc.PrefabInfo",
                "root": {"__id__": root},
                "asset": self.asset_ref,
                "fileId": file_id,
                "instance": None,
                "targetOverrides": None,
                "nestedPrefabInstanceRoots": None,
            }
        )

    def node(self, name: str, parent: int | None, w: float, h: float, x=0.0, y=0.0, file_id="", ax=0.5, ay=0.5) -> int:
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
                "_id": self.make_id(f"node-{name}-{parent}"),
            }
        )
        if self.root_id is None:
            self.root_id = nid
        uit = self.add(
            {
                "__type__": "cc.UITransform",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_contentSize": size(w, h),
                "_anchorPoint": vec2(ax, ay),
                "_id": self.make_id(f"uit-{name}-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": uit})
        if self.mode == "prefab":
            info = self.prefab_info(file_id or f"{name}0000000001", nid if self.root_id == nid else self.root_id)
            self.nodes[nid]["_prefab"] = {"__id__": info}
            self.nodes[info]["root"] = {"__id__": self.root_id}
        if parent is not None:
            self.nodes[parent]["_children"].append({"__id__": nid})
        return nid

    def sprite(self, nid: int, frame: str | None = None, col=(255, 255, 255, 255), typ=0) -> int:
        cid = self.add(
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
                "_color": color(*col),
                "_spriteFrame": sf(frame) if frame else None,
                "_type": typ,
                "_fillType": 0,
                "_sizeMode": 0,
                "_fillCenter": vec2(),
                "_fillStart": 0,
                "_fillRange": 0,
                "_isTrimmedMode": False,
                "_useGrayscale": False,
                "_atlas": None,
                "_id": self.make_id(f"sp-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def label(
        self,
        nid: int,
        text: str,
        font_size: int,
        col,
        outline=False,
        spacing_x=0,
        overflow=0,
        system_font=False,
        font_family="Arial",
        number=False,
    ) -> int:
        cid = self.add(
            {
                "__type__": "cc.Label",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_customMaterial": None,
                "_srcBlendFactor": 2,
                "_dstBlendFactor": 4,
                "_color": color(*col),
                "_string": text,
                "_horizontalAlign": 1,
                "_verticalAlign": 1,
                "_actualFontSize": font_size,
                "_fontSize": font_size,
                "_fontFamily": font_family,
                "_lineHeight": font_size + 16,
                "_overflow": overflow,
                "_enableWrapText": False,
                "_font": None if system_font else (num_font_ref() if number else font_ref()),
                "_isSystemFontUsed": system_font,
                "_spacingX": spacing_x,
                "_isItalic": False,
                "_isBold": False,
                "_isUnderline": False,
                "_underlineHeight": 2,
                "_cacheMode": 1 if outline else 2,
                "_enableOutline": outline,
                "_outlineColor": color(40, 22, 10, 180),
                "_outlineWidth": 2,
                "_enableShadow": False,
                "_shadowColor": color(0, 0, 0, 255),
                "_shadowOffset": vec2(2, 2),
                "_shadowBlur": 2,
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def opacity(self, nid: int, value=255) -> int:
        cid = self.add(
            {
                "__type__": "cc.UIOpacity",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_opacity": value,
                "_id": self.make_id(f"op-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def widget(self, nid: int, flags: int, top=0.0, bottom=0.0, left=0.0, right=0.0, cx=0.0, cy=0.0) -> int:
        cid = self.add(
            {
                "__type__": "cc.Widget",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_alignFlags": flags,
                "_target": None,
                "_left": left,
                "_right": right,
                "_top": top,
                "_bottom": bottom,
                "_horizontalCenter": cx,
                "_verticalCenter": cy,
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
                "_id": self.make_id(f"wg-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def layout(
        self,
        nid: int,
        typ=1,
        resize=0,
        cell_w=40.0,
        cell_h=40.0,
        pad_l=4.0,
        pad_r=4.0,
        pad_t=0.0,
        pad_b=0.0,
        gap_x=4.0,
        gap_y=0.0,
        constraint=0,
        constraint_num=2,
    ) -> int:
        cid = self.add(
            {
                "__type__": "cc.Layout",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_resizeMode": resize,
                "_layoutType": typ,
                "_cellSize": size(cell_w, cell_h),
                "_startAxis": 0,
                "_paddingLeft": pad_l,
                "_paddingRight": pad_r,
                "_paddingTop": pad_t,
                "_paddingBottom": pad_b,
                "_spacingX": gap_x,
                "_spacingY": gap_y,
                "_verticalDirection": 1,
                "_horizontalDirection": 0,
                "_constraint": constraint,
                "_constraintNum": constraint_num,
                "_affectedByScale": False,
                "_isAlign": False,
                "_id": self.make_id(f"ly-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def mask(self, nid: int) -> int:
        cid = self.add(
            {
                "__type__": "cc.Mask",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "_materials": [],
                "__prefab": None,
                "_visFlags": 0,
                "_srcBlendFactor": 2,
                "_dstBlendFactor": 4,
                "_color": color(),
                "_type": 0,
                "_inverted": False,
                "_segments": 64,
                "_id": self.make_id(f"mk-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def scroll_bar(self, nid: int, handle_sprite_id: int, scroll_id: int) -> int:
        cid = self.add(
            {
                "__type__": "cc.ScrollBar",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "_scrollView": {"__id__": scroll_id},
                "_handle": {"__id__": handle_sprite_id},
                "_direction": 1,
                "_enableAutoHide": False,
                "_autoHideTime": 1,
                "_id": self.make_id(f"sb-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def scroll_view(self, nid: int, content_id: int) -> int:
        cid = self.add(
            {
                "__type__": "cc.ScrollView",
                "_name": "",
                "_objFlags": 0,
                "__editorExtras__": {},
                "node": {"__id__": nid},
                "_enabled": True,
                "__prefab": None,
                "bounceDuration": 0.23,
                "brake": 0.75,
                "elastic": False,
                "inertia": True,
                "horizontal": False,
                "vertical": True,
                "cancelInnerEvents": True,
                "scrollEvents": [],
                "_content": {"__id__": content_id},
                "_horizontalScrollBar": None,
                "_verticalScrollBar": None,
                "_id": self.make_id(f"sv-{nid}"),
            }
        )
        self.nodes[nid]["_components"].append({"__id__": cid})
        return cid

    def rotate_z(self, nid: int, deg: float) -> None:
        self.nodes[nid]["_euler"] = vec3(0, 0, deg)
        self.nodes[nid]["_lrot"] = quat(deg)

    def sprite_node(self, name: str, parent: int | None, w: float, h: float, frame: str, x=0.0, y=0.0, file_id="") -> int:
        nid = self.node(name, parent, w, h, x, y, file_id)
        self.sprite(nid, frame)
        return nid

    def label_node(
        self,
        name: str,
        parent: int,
        text: str,
        font_size: int,
        col,
        w: float,
        h: float,
        x=0.0,
        y=0.0,
        outline=False,
        file_id="",
        spacing_x=0,
        overflow=0,
        system_font=False,
        font_family="Arial",
        number=False,
    ) -> int:
        nid = self.node(name, parent, w, h, x, y, file_id)
        self.label(nid, text, font_size, col, outline, spacing_x, overflow, system_font, font_family, number)
        return nid


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def prefab_meta(uuid: str) -> dict:
    return {
        "ver": "1.1.50",
        "importer": "prefab",
        "imported": True,
        "uuid": uuid,
        "files": [".json"],
        "subMetas": {},
        "userData": {"syncNodeName": True},
    }


def script_meta(uuid: str) -> dict:
    return {
        "ver": "4.0.24",
        "importer": "typescript",
        "imported": True,
        "uuid": uuid,
        "files": [],
        "subMetas": {},
        "userData": {},
    }


def begin_prefab(name: str) -> Builder:
    b = Builder("prefab")
    b.add(
        {
            "__type__": "cc.Prefab",
            "_name": name,
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "data": {"__id__": 1},
            "optimizationPolicy": 0,
            "persistent": False,
        }
    )
    return b


def finish_prefab(b: Builder) -> list[dict]:
    if b.root_id is not None:
        b.nodes[0]["data"] = {"__id__": b.root_id}
        for obj in b.nodes:
            if obj.get("__type__") == "cc.PrefabInfo":
                obj["root"] = {"__id__": b.root_id}
    return b.nodes


def build_bar_gold() -> list[dict]:
    b = begin_prefab("bar-gold")
    root = b.node("GoldBoard", None, 368, 236, file_id="goldboard0000001")
    b.sprite_node("Body", root, 368, 236, "gold", file_id="goldbody00000002")
    b.label_node(
        "GoldText",
        root,
        "9.9k",
        56,
        (92, 58, 28),
        240,
        88,
        x=52,
        y=18,
        outline=True,
        file_id="goldtext00000003",
        spacing_x=2,
        overflow=2,
        number=True,
    )
    return finish_prefab(b)


def build_btn_plaque() -> list[dict]:
    b = begin_prefab("btn-plaque")
    root = b.node("BtnPlaque", None, 182, 148, file_id="btnplaque0000001")
    b.sprite_node("Body", root, 182, 148, "plaque", file_id="btnbody000000002")
    b.label_node("Label", root, "签到", 34, (255, 255, 255), 168, 48, y=-22, outline=True, file_id="btnlabel00000003")
    return finish_prefab(b)


def build_loading() -> list[dict]:
    b = begin_prefab("loading")
    root = b.node("Loading", None, 750, 1334, file_id="loadingroot00001")
    b.opacity(root, 255)
    header = b.node("Header", root, 680, 200, y=487, file_id="loadheader000002")
    title = b.sprite_node("TitleSign", header, 640, 188, "sign-title", file_id="loadtitle0000003")
    b.label_node("Main", title, "泥球大侠", 64, (255, 226, 140), 560, 90, y=-48, outline=True, file_id="loadmain00000004")
    hero = b.node("Hero", root, 640, 430, file_id="loadhero00000005")
    b.sprite_node("Beetle", hero, 620, 380, "beetle", file_id="loadbeetle000006")
    footer = b.node("Footer", root, 700, 220, y=-513, file_id="loadfooter000007")
    panel = b.sprite_node("ProgressPanel", footer, 680, 200, "progress", file_id="loadpanel0000008")
    b.label_node("Tip", panel, "正在滚向荒原……", 28, (90, 58, 28), 520, 56, y=52, file_id="loadtip000000009")
    track = b.node("Track", panel, 500, 16, y=4, file_id="loadtrack0000010")
    b.node("Bar", track, 12, 14, file_id="loadbar000000011")
    b.label_node("Percent", panel, "0%", 28, (90, 58, 28), 160, 56, y=-50, file_id="loadpct000000012")
    return finish_prefab(b)


def build_modal_skin() -> list[dict]:
    b = begin_prefab("modal-skin")
    root = b.node("SkinModal", None, 750, 1334, file_id="skinmodal0000001")
    b.node("Dim", root, 750, 1334, file_id="skindim000000002")
    # 原图 1536x1024，按 3:2 放下，避免竖向拉变形
    panel = b.sprite_node("SkinPanel", root, 720, 480, "skin", y=36, file_id="skinpanel0000003")
    b.label_node("SkinTitle", panel, "选择皮肤", 34, (232, 196, 96), 300, 48, y=178, outline=True, file_id="skintitle000004")
    scroll = b.node("SkinScroll", panel, 488, 268, y=6, file_id="skinscroll000007")
    view = b.node("view", scroll, 460, 268, x=-14, file_id="skinscrollview08")
    b.mask(view)
    grid = b.node("SkinGrid", view, 460, 268, y=134, file_id="skingrid00000005", ay=1)
    sv = b.scroll_view(scroll, grid)
    # 饼干槽原图 1376x172，转到竖槽且不拉伸；放在羊皮纸内侧，避开右侧木柱
    track = b.sprite_node("SkinBarTrack", panel, 268, 34, "load-track", x=208, y=6, file_id="skinscrolltrack")
    b.rotate_z(track, 90)
    bar = b.node("SkinBar", panel, 14, 220, x=208, y=6, file_id="skinscrollbar09")
    handle = b.node("bar", bar, 10, 64, file_id="skinscrollhandle", ax=0, ay=0)
    handle_sp = b.sprite(handle, "load-fill", (232, 185, 35, 255), 1)
    bar_comp = b.scroll_bar(bar, handle_sp, sv)
    b.nodes[sv]["_verticalScrollBar"] = {"__id__": bar_comp}
    b.label_node("SkinClose", panel, "点空白处关闭", 22, (232, 196, 96), 320, 40, y=-196, outline=True, file_id="skinclose000006")
    return finish_prefab(b)


def build_toast() -> list[dict]:
    b = begin_prefab("toast")
    root = b.node("Toast", None, 520, 120, y=220, file_id="toastroot0000001")
    b.opacity(root, 255)
    panel = b.sprite_node("Panel", root, 420, 120, "plaque", file_id="toastpanel000002")
    b.label_node("Label", panel, "", 28, (255, 255, 255), 360, 56, y=-8, outline=True, file_id="toastlabel00003")
    return finish_prefab(b)


def build_confirm() -> list[dict]:
    b = begin_prefab("confirm")
    root = b.node("Confirm", None, 750, 1334, file_id="confirmroot00001")
    b.node("Dim", root, 750, 1334, file_id="confirmdim000002")
    panel = b.sprite_node("Panel", root, 520, 360, "skin", file_id="confirmpanel0003")
    b.label_node("Title", panel, "确认", 36, (232, 196, 96), 360, 52, y=110, outline=True, file_id="confirmtitle004")
    b.label_node("Body", panel, "", 28, (90, 58, 28), 400, 80, y=20, file_id="confirmbody00005")
    b.label_node("Ok", panel, "好", 30, (90, 58, 28), 160, 48, x=-90, y=-100, file_id="confirmok0000006")
    b.label_node("Cancel", panel, "再想想", 28, (107, 63, 31), 160, 48, x=90, y=-100, file_id="confirmcancel007")
    return finish_prefab(b)


def build_red_dot() -> list[dict]:
    b = begin_prefab("red-dot")
    b.node("RedDot", None, 18, 18, file_id="reddotroot000001")
    return finish_prefab(b)


def build_skin_cell() -> list[dict]:
    b = begin_prefab("skin-cell")
    root = b.node("SkinCell", None, 200, 196, file_id="skincellroot0001")
    mini = b.node("MiniAvatar", root, 168, 168, y=14, file_id="skincellmini0002")
    b.nodes[mini]["_lscale"] = vec3(1, 1, 1)
    name = b.label_node("SkinName", root, "", 22, (90, 58, 28), 190, 36, y=-70, file_id="skincellname0003")
    for obj in b.nodes:
        if obj.get("__type__") == "cc.Label" and obj.get("node", {}).get("__id__") == name:
            obj["_overflow"] = 2
            obj["_enableWrapText"] = False
            break
    return finish_prefab(b)


def add_plaque(b: Builder, name: str, parent: int, text: str, w=182.0, h=148.0, x=0.0, y=0.0, label_name="") -> int:
    root = b.node(name, parent, w, h, x, y)
    b.sprite_node("Body", root, w, h, "plaque")
    b.label_node(
        label_name or "Label",
        root,
        text,
        34,
        (255, 255, 255),
        w - 8,
        48,
        y=-22,
        outline=True,
        spacing_x=-4 if len(text) > 2 else 0,
    )
    return root


def build_home(b: Builder, parent: int) -> int:
    home = b.node("Home", parent, *DESIGN)
    b.opacity(home, 255)
    b.widget(home, TOP | BOTTOM | LEFT | RIGHT)
    b.nodes[home]["_active"] = False

    props = [
        ("DecorLeft", 248, 454, "decor-l", LEFT | BOTTOM, {"left": -8, "bottom": 92}),
        ("DecorRight", 236, 288, "decor-r", RIGHT | BOTTOM, {"right": -4, "bottom": 88}),
        ("Cactus", 112, 230, "cactus", RIGHT | BOTTOM, {"right": 18, "bottom": 246}),
        ("Sage", 86, 66, "sage", RIGHT | BOTTOM, {"right": 112, "bottom": 196}),
        ("Tumbleweed", 96, 70, "tumbleweed", LEFT | BOTTOM, {"left": 28, "bottom": 196}),
        ("Skull", 168, 118, "skull", LEFT | BOTTOM, {"left": 2, "bottom": 164}),
        ("RockLg", 126, 84, "rock-lg", LEFT | BOTTOM, {"left": 20, "bottom": 0}),
        ("RockSm", 78, 40, "rock-sm", RIGHT | BOTTOM, {"right": 64, "bottom": 2}),
    ]
    for name, w, h, frame, flags, edges in props:
        nid = b.sprite_node(name, home, w, h, frame)
        b.widget(nid, flags, **edges)

    top = b.node("TopBar", home, 750, 148)
    b.widget(top, TOP | HCENTER, top=-14)
    b.layout(top)
    for i, text in enumerate(("签到", "属性", "排行榜", "设置")):
        add_plaque(b, f"Icon{i}", top, text, label_name=f"IconLabel{i}")

    info = b.node("InfoRow", home, 700, 360)
    b.widget(info, TOP | HCENTER, top=148)
    gold = b.node("GoldBoard", info, 368, 236, x=-168, y=36)
    b.sprite_node("Body", gold, 368, 236, "gold")
    b.label_node(
        "GoldText",
        gold,
        "9.9k",
        56,
        (92, 58, 28),
        240,
        88,
        x=52,
        y=18,
        outline=True,
        spacing_x=2,
        overflow=2,
        number=True,
    )

    side = b.node("PortraitCol", info, 220, 340, x=208, y=-4)
    b.node("AvatarSlot", side, 204, 202, y=72)
    add_plaque(b, "Shop", side, "商店", 196, 128, y=-58, label_name="ShopLabel")

    b.sprite_node("StartBtn", home, 388, 384, "start", y=-48)

    bottom = b.node("Bottom", home, 700, 196)
    b.widget(bottom, BOTTOM | HCENTER, bottom=10)
    title = b.sprite_node("HomeTitle", bottom, 640, 177, "home-title")
    b.label_node("Main", title, "泥球大侠", 64, (255, 226, 140), 560, 90, y=4, outline=True)
    return home


def build_loading_page(b: Builder, parent: int) -> int:
    page = b.node("Loading", parent, *DESIGN)
    b.opacity(page, 255)
    b.widget(page, TOP | BOTTOM | LEFT | RIGHT)
    header = b.node("Header", page, 680, 200)
    b.widget(header, TOP | HCENTER, top=36)
    title = b.sprite_node("TitleSign", header, 640, 188, "sign-title")
    b.label_node("Main", title, "泥球大侠", 64, (255, 226, 140), 560, 90, y=-48, outline=True)
    hero = b.node("Hero", page, 640, 430)
    b.sprite_node("Beetle", hero, 620, 380, "beetle")
    footer = b.node("Footer", page, 700, 220)
    b.widget(footer, BOTTOM | HCENTER, bottom=28)
    panel = b.sprite_node("ProgressPanel", footer, 680, 200, "progress")
    b.label_node("Tip", panel, "正在滚向荒原……", 28, (90, 58, 28), 520, 56, y=52)
    track = b.node("Track", panel, 500, 16, y=4)
    b.node("Bar", track, 12, 14)
    b.label_node("Percent", panel, "0%", 28, (90, 58, 28), 160, 56, y=-50)
    return page


def scene_globals(start_id: int) -> list[dict]:
    old = json.loads(Path(r"e:\dung-beetle\golden-roll\assets\scenes\main.scene").read_text(encoding="utf-8"))
    globals_obj = None
    for obj in old:
        if obj.get("__type__") == "cc.SceneGlobals":
            globals_obj = obj
            break
    if not globals_obj:
        raise RuntimeError("missing SceneGlobals")
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


def build_scene() -> list[dict]:
    objects: list[dict] = [
        {
            "__type__": "cc.SceneAsset",
            "_name": "main",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_native": "",
            "scene": {"__id__": 1},
        }
    ]
    b = Builder("scene")
    b.nodes = objects
    scene = b.add(
        {
            "__type__": "cc.Scene",
            "_name": "main",
            "_objFlags": 0,
            "__editorExtras__": {},
            "_parent": None,
            "_children": [],
            "_active": True,
            "_components": [],
            "_prefab": None,
            "_lpos": vec3(),
            "_lrot": quat(),
            "_lscale": vec3(1, 1, 1),
            "_mobility": 0,
            "_layer": 1073741824,
            "_euler": vec3(),
            "autoReleaseAssets": False,
            "_globals": None,
            "_id": "8f128e7c-3830-41db-9053-75d632c776af",
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
            "_lpos": vec3(375.00000000000006, 667, 0),
            "_lrot": quat(),
            "_lscale": vec3(1, 1, 1),
            "_mobility": 0,
            "_layer": LAYER,
            "_euler": vec3(),
            "_id": "f5UROc+WtCXIQLbf2inLqi",
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
            "_lpos": vec3(0, 0, 1000),
            "_lrot": quat(),
            "_lscale": vec3(1, 1, 1),
            "_mobility": 0,
            "_layer": 1073741824,
            "_euler": vec3(),
            "_id": "e3ysRpHTpEVaO/b84b0aXn",
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
            "_color": color(0, 0, 0, 255),
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
            "_id": "1dw4/7AJ1ItYySEmIPpGQW",
        }
    )
    objects[camera]["_components"] = [{"__id__": cam_comp}]

    backdrop = b.node("Backdrop", canvas, *DESIGN)
    b.opacity(backdrop, 255)
    b.widget(backdrop, TOP | BOTTOM | LEFT | RIGHT)
    bg_l = b.sprite_node("LoadingBg", backdrop, *DESIGN, "bg-loading")
    b.opacity(bg_l, 255)
    b.widget(bg_l, TOP | BOTTOM | LEFT | RIGHT)
    bg_h = b.sprite_node("HomeBg", backdrop, *DESIGN, "bg-home")
    b.opacity(bg_h, 0)
    b.widget(bg_h, TOP | BOTTOM | LEFT | RIGHT)

    build_loading_page(b, canvas)
    build_home(b, canvas)

    game = b.node("Game", canvas, *DESIGN)
    b.opacity(game, 255)
    b.widget(game, TOP | BOTTOM | LEFT | RIGHT)
    objects[game]["_active"] = False
    result = b.node("Result", canvas, *DESIGN)
    b.opacity(result, 255)
    b.widget(result, TOP | BOTTOM | LEFT | RIGHT)
    objects[result]["_active"] = False
    overlay = b.node("Overlay", canvas, *DESIGN)
    b.opacity(overlay, 255)
    b.widget(overlay, TOP | BOTTOM | LEFT | RIGHT)

    uit = b.add(
        {
            "__type__": "cc.UITransform",
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": canvas},
            "_enabled": True,
            "__prefab": None,
            "_contentSize": size(*DESIGN),
            "_anchorPoint": vec2(0.5, 0.5),
            "_id": "b0YQOFGGZBZbzI/ZenZVdt",
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
            "_id": "ab6hlTD11CSLkQaYyI+ND/",
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
            "_top": 5.684341886080802e-14,
            "_bottom": 5.684341886080802e-14,
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
            "_id": "e6GZZiOldBF4XWOHeUOtvd",
        }
    )
    app = b.add(
        {
            "__type__": GAME_APP,
            "_name": "",
            "_objFlags": 0,
            "__editorExtras__": {},
            "node": {"__id__": canvas},
            "_enabled": True,
            "__prefab": None,
            "_id": "24fD4/qaNGx7oIpH2E0Gp+",
        }
    )
    objects[canvas]["_components"] = [{"__id__": uit}, {"__id__": canvas_comp}, {"__id__": widget}, {"__id__": app}]

    globals_chunk = scene_globals(len(objects))
    objects[scene]["_globals"] = {"__id__": len(objects)}
    objects.extend(globals_chunk)
    return objects


def write_scripts(root: Path) -> None:
    mapping = {
        "NodeQuery": root / "core" / "NodeQuery.ts",
        "AssetService": root / "core" / "AssetService.ts",
        "CurrencyBar": root / "ui" / "CurrencyBar.ts",
        "PlaqueButton": root / "ui" / "PlaqueButton.ts",
        "RedDot": root / "ui" / "RedDot.ts",
        "LoadingView": root / "ui" / "LoadingView.ts",
        "ToastView": root / "ui" / "ToastView.ts",
        "ConfirmView": root / "ui" / "ConfirmView.ts",
        "SkinCell": root / "ui" / "SkinCell.ts",
        "SkinModalView": root / "ui" / "SkinModalView.ts",
        "OverlayService": root / "ui" / "OverlayService.ts",
        "HomeController": root / "ui" / "HomeController.ts",
    }
    for name, path in mapping.items():
        write_json(path.with_suffix(".ts.meta"), script_meta(SCRIPTS[name]))


def main() -> None:
    assets = Path(r"e:\dung-beetle\golden-roll\assets")
    prefab_dir = assets / "resources" / "ui" / "prefabs"
    prefab_dir.mkdir(parents=True, exist_ok=True)
    write_json(
        assets / "resources" / "ui" / "prefabs.meta",
        {
            "ver": "1.2.0",
            "importer": "directory",
            "imported": True,
            "uuid": "7c1a0001-1111-4a01-8cde-000000000010",
            "files": [],
            "subMetas": {},
            "userData": {},
        },
    )

    builders = {
        "bar-gold": build_bar_gold,
        "btn-plaque": build_btn_plaque,
        "loading": build_loading,
        "modal-skin": build_modal_skin,
        "toast": build_toast,
        "confirm": build_confirm,
        "red-dot": build_red_dot,
        "skin-cell": build_skin_cell,
    }
    for name, fn in builders.items():
        write_json(prefab_dir / f"{name}.prefab", fn())
        write_json(prefab_dir / f"{name}.prefab.meta", prefab_meta(PREFABS[name]))
        print("prefab", name, "objects", len(fn()))

    scene = build_scene()
    write_json(assets / "scenes" / "main.scene", scene)
    print("scene objects", len(scene), "canvas children", len(scene[2]["_children"]))
    write_scripts(assets / "scripts")
    print("scripts metas written")


if __name__ == "__main__":
    main()
