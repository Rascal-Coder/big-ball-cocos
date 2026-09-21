"""Build reusable map Prefabs: tile / prop / chunk."""
from __future__ import annotations

import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("home_struct", HERE / "build-home-structure.py")
HOME = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(HOME)

OUT = HERE.parent / "assets" / "resources" / "map" / "prefabs"
PREFABS = {
    "map-tile": "7c1a0001-1111-4a01-8cde-000000000011",
    "map-prop": "7c1a0001-1111-4a01-8cde-000000000012",
    "map-chunk": "7c1a0001-1111-4a01-8cde-000000000013",
}


def build_tile() -> list:
    b = HOME.begin_prefab("map-tile")
    root = b.node("map-tile", None, 108, 108, file_id="maptile000000001")
    b.sprite(root, None)
    return HOME.finish_prefab(b)


def build_prop() -> list:
    b = HOME.begin_prefab("map-prop")
    root = b.node("map-prop", None, 96, 96, file_id="mapprop0000000001")
    b.sprite(root, None)
    return HOME.finish_prefab(b)


def build_chunk() -> list:
    b = HOME.begin_prefab("map-chunk")
    root = b.node("map-chunk", None, 756, 648, file_id="mapchunk00000001")
    for name, fid in (
        ("Ground", "mapground0000001"),
        ("Path", "mappath0000000001"),
        ("Decor", "mapdecor000000001"),
        ("Obstacle", "mapobstacle00001"),
        ("Pickup", "mappickup0000001"),
    ):
        b.node(name, root, 756, 648, file_id=fid)
    return HOME.finish_prefab(b)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    HOME.write_json(
        OUT.parent / "prefabs.meta",
        {
            "ver": "1.2.0",
            "importer": "directory",
            "imported": True,
            "uuid": "7c1a4001-5555-4e01-8cde-000000000019",
            "files": [],
            "subMetas": {},
            "userData": {},
        },
    )
    builders = {
        "map-tile": build_tile,
        "map-prop": build_prop,
        "map-chunk": build_chunk,
    }
    for name, fn in builders.items():
        HOME.write_json(OUT / f"{name}.prefab", fn())
        HOME.write_json(OUT / f"{name}.prefab.meta", HOME.prefab_meta(PREFABS[name]))
        print("prefab", name)


if __name__ == "__main__":
    main()
