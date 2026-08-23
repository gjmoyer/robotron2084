#!/usr/bin/env python3
"""Key dark backgrounds, crop, and emit engine-ready PNGs."""
from pathlib import Path
from PIL import Image, ImageFilter

SRC = Path(
    "/Users/greg/.grok/sessions/%2FUsers%2Fgreg%2Frobotron/"
    "01a03021-f9b4-7231-b955-a84caa17e014/images"
)
DST = Path("/Users/greg/robotron/assets")


def key_and_crop(im: Image.Image, pad: int = 16, max_side: int = 720) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size

    def sample(x0, y0, x1, y1):
        rs = gs = bs = n = 0
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b, _ = px[x, y]
                rs += r
                gs += g
                bs += b
                n += 1
        return rs / n, gs / n, bs / n

    corners = [
        sample(0, 0, 14, 14),
        sample(w - 14, 0, w, 14),
        sample(0, h - 14, 14, h),
        sample(w - 14, h - 14, w, h),
    ]
    br = sum(c[0] for c in corners) / 4
    bg_ = sum(c[1] for c in corners) / 4
    bb = sum(c[2] for c in corners) / 4

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            dist = ((r - br) ** 2 + (g - bg_) ** 2 + (b - bb) ** 2) ** 0.5
            lum = (r + g + b) / 3
            if dist < 18 and lum < 42:
                a = 0
            elif dist < 38:
                a = int(max(0.0, min(1.0, (dist - 16) / 22.0)) * 255)
                # keep neon glow
                if lum > 50:
                    a = max(a, int(min(255, (lum - 40) * 4)))
            else:
                a = 255
            opx[x, y] = (r, g, b, a)

    # slight blur on alpha to soften key fringe
    rgb = out.convert("RGB")
    alpha = out.getchannel("A").filter(ImageFilter.GaussianBlur(0.6))
    out = Image.merge("RGBA", (*rgb.split(), alpha))

    bbox = out.getbbox()
    if not bbox:
        return out
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    cropped = out.crop((x0, y0, x1, y1))
    cw, ch = cropped.size
    scale = max_side / max(cw, ch)
    if scale < 0.999:
        cropped = cropped.resize(
            (max(1, int(cw * scale)), max(1, int(ch * scale))),
            Image.Resampling.LANCZOS,
        )
    return cropped


def save(rel: str, im: Image.Image) -> None:
    path = DST / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    print(f"{rel} {im.size[0]}x{im.size[1]}")


JOBS = [
    ("sprites/player_s.png", "5.jpg"),
    ("sprites/player_s_w0.png", "16.jpg"),
    ("sprites/player_s_w1.png", "17.jpg"),
    ("sprites/player_e.png", "9.jpg"),
    ("sprites/player_n.png", "8.jpg"),
    ("sprites/grunt_s.png", "4.jpg"),
    ("sprites/grunt_s_w0.png", "21.jpg"),
    ("sprites/grunt_s_w1.png", "15.jpg"),
    ("sprites/grunt_n.png", "12.jpg"),
    ("sprites/mommy_s.png", "10.jpg"),
    ("sprites/mommy_s_w0.png", "20.jpg"),
    ("sprites/mommy_e.png", "14.jpg"),
    ("sprites/daddy_s.png", "1.jpg"),
    ("sprites/daddy_s_w0.png", "19.jpg"),
    ("sprites/daddy_e.png", "13.jpg"),
]


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for dest, src in JOBS:
        save(dest, key_and_crop(Image.open(SRC / src)))

    save("sprites/player_w.png", Image.open(DST / "sprites/player_e.png").transpose(Image.FLIP_LEFT_RIGHT))
    save("sprites/mommy_w.png", Image.open(DST / "sprites/mommy_e.png").transpose(Image.FLIP_LEFT_RIGHT))
    save("sprites/daddy_w.png", Image.open(DST / "sprites/daddy_e.png").transpose(Image.FLIP_LEFT_RIGHT))
    # second walk frame for civilians: mirrored stride
    save("sprites/mommy_s_w1.png", Image.open(DST / "sprites/mommy_s_w0.png").transpose(Image.FLIP_LEFT_RIGHT))
    save("sprites/daddy_s_w1.png", Image.open(DST / "sprites/daddy_s_w0.png").transpose(Image.FLIP_LEFT_RIGHT))

    Image.open(SRC / "7.jpg").convert("RGB").save(DST / "title.jpg", quality=93)
    Image.open(SRC / "3.jpg").convert("RGB").save(DST / "floor.jpg", quality=93)
    print("done")


if __name__ == "__main__":
    main()
