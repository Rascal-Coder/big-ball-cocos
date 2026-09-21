"""Find exact sand-tile grid on the new sheet."""
from pathlib import Path
from PIL import Image

SRC = Path(r"e:/dung-beetle/docs/map-other-material/image.png")


def near_white(px) -> bool:
    r, g, b, a = px
    return a < 8 or (r > 248 and g > 248 and b > 248)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    pix = im.load()
    w, h = im.size
    # row occupancy in left 620px
    for y in range(0, 380):
        filled = sum(1 for x in range(0, 620) if not near_white(pix[x, y]))
        if filled < 8 or filled > 600:
            mark = "GAP" if filled < 8 else ""
            if mark or y % 20 == 0:
                print(f"y={y:4} filled={filled:4} {mark}")
    print("--- col occupancy y=20..120 ---")
    for x in range(0, 640):
        filled = sum(1 for y in range(20, 120) if not near_white(pix[x, y]))
        if filled < 4 or x % 20 == 0:
            print(f"x={x:4} filled={filled:4}")


if __name__ == "__main__":
    main()
