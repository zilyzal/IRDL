"""Builds IRDL's art from the two supplied pictures (packaging/brand/source/logo.jpg and background.jpg).

    python3 packaging/brand/make_new_art.py          (from the repository root, with Pillow and numpy)

Writes app/assets/logo.png (the mark cropped, black turned into transparency), app/sce_sys/icon0.png (512x512),
pic0/pic1 .png (1920x1080) and .dds (3840x2160 BC7, via make_home_art's encoder), and .github/readme/logo*.svg.
"""
import base64, io, sys
from pathlib import Path
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_home_art as home  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent / "source"
SCE = ROOT / "app/sce_sys"


def cut_logo(im):
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    m = a.max(axis=2)
    alpha = np.clip((m - 18) * 12, 0, 255)
    # JPEG noise leaves isolated bright specks: keep only regions of the mask that belong to the mark itself.
    from scipy import ndimage
    labels, count = ndimage.label(ndimage.binary_dilation(alpha > 40, iterations=3))
    if count:
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, count + 1))
        keep = np.isin(labels, [i + 1 for i, n in enumerate(sizes) if n >= 0.02 * sizes.max()])
        alpha = np.where(keep, alpha, 0)
    # and inside that region, drop detached fragments: only the mark's own body stays
    labels, count = ndimage.label(alpha > 0)
    if count > 1:
        sizes = ndimage.sum(np.ones_like(labels), labels, range(1, count + 1))
        alpha = np.where(labels == 1 + int(np.argmax(sizes)), alpha, 0)
    out = Image.fromarray(np.dstack([a, alpha]).astype(np.uint8), "RGBA")
    box = out.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    pad = 24
    box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
    return out.crop(box)


def small(im, size):
    """Resize without Lanczos ringing: faint alpha specks around the edge are what showed as white points."""
    r = np.array(im.resize(size, Image.LANCZOS))
    a = r[..., 3]
    a[a < 12] = 0
    r[a == 0, :3] = 0
    return Image.fromarray(r, "RGBA")


def main():
    logo = Image.open(SRC / "logo.jpg").convert("RGB")
    bg = Image.open(SRC / "background.jpg").convert("RGB")
    mark = cut_logo(logo)
    s = 512 / max(mark.size)
    mark_small = small(mark, (round(mark.width * s), round(mark.height * s)))
    mark_small.save(ROOT / "app/assets/logo.png", optimize=True)
    # icon: the supplied square, cropped to its centre so the mark fills the tile
    w = logo.width
    c = logo.crop((int(w * .2), int(w * .2), int(w * .8), int(w * .8))).resize((512, 512), Image.LANCZOS)
    c.save(SCE / "icon0.png", optimize=True)
    # backgrounds: cover-crop to 16:9
    def cover(size):
        tw, th = size
        k = max(tw / bg.width, th / bg.height)
        r = bg.resize((round(bg.width * k), round(bg.height * k)), Image.LANCZOS)
        x, y = (r.width - tw) // 2, (r.height - th) // 2
        return r.crop((x, y, x + tw, y + th))
    big = cover((3840, 2160))
    for name in ("pic0", "pic1"):
        home.write_dds(SCE / f"{name}.dds", np.asarray(big))
        big.resize((1920, 1080), Image.LANCZOS).save(SCE / f"{name}.png", optimize=True)
    # README logos: the mark as an embedded PNG
    buf = io.BytesIO(); small(mark, (round(mark.width * 256 / mark.height), 256)).save(buf, "PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    mw = round(mark.width * 256 / mark.height)
    svg = lambda col, wm: (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{mw*72//256 + (130 if wm else 0)}" height="72" '
        f'viewBox="0 0 {mw*72//256 + (130 if wm else 0)} 72" role="img" aria-label="IRDL"><image width="{mw*72//256}" height="72" xlink:href="data:image/png;base64,{b64}"/>'
        + (f'<text x="{mw*72//256 + 14}" y="49" font-family="\'Exo 2\', Segoe UI, Helvetica, Arial, sans-serif" font-size="34" font-weight="600" letter-spacing="1.2" fill="{col}">IRDL</text>' if wm else "") + '</svg>\n')
    rd = ROOT / ".github/readme"
    (rd / "logo.svg").write_text(svg("", False)); (rd / "logo-dark.svg").write_text(svg("#f3f6fb", True)); (rd / "logo-light.svg").write_text(svg("#0f1520", True))
    print("logo", mark.size)

main()
