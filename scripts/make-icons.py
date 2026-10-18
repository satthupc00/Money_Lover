# Xuất toàn bộ icon app từ build/icon.png (logo ví ôm đồng xu, dùng chung với app Money Tracking).
# Chạy: python3 scripts/make-icons.py   (cần Pillow)
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
P = lambda *a: os.path.join(ROOT, *a)
BG = (0xFF, 0xF8, 0xEC, 255)  # nền kem, trùng màu ic_launcher_background
src = Image.open(P('build', 'icon.png')).convert('RGBA')
src = src.crop(src.getbbox())


def fit(size, scale):
    """logo nằm giữa khung vuông size, cạnh dài = size * scale"""
    w, h = src.size
    k = size * scale / max(w, h)
    im = src.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.alpha_composite(im, ((size - im.width) // 2, (size - im.height) // 2))
    return out


def white(im, lines=False):
    """bản trắng 1 màu; lines=True thì khoét các nét viền tối để còn thấy chi tiết (icon 1 màu theo theme)"""
    a = im.getchannel('A')
    if lines:
        lum = im.convert('L').point(lambda v: 255 if v > 110 else 0)
        a = Image.composite(a, Image.new('L', im.size, 0), lum)
    out = Image.new('RGBA', im.size, (255, 255, 255, 0))
    out.putalpha(a)
    return out


def on_bg(size, scale, shape):
    base = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    m = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(m)
    if shape == 'circle':
        d.ellipse((0, 0, size - 1, size - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(size * .22), fill=255)
    base.paste(Image.new('RGBA', (size, size), BG), (0, 0), m)
    base.alpha_composite(fit(size, scale))
    return base


def save(im, *path):
    os.makedirs(os.path.dirname(P(*path)), exist_ok=True)
    im.save(P(*path), optimize=True)


# Windows / Electron
fit(256, 1.0).save(P('build', 'icon.ico'), sizes=[(s, s) for s in (16, 24, 32, 48, 64, 128, 256)])
save(fit(256, 1.0), 'electron', 'icon.png')

# Android
res = ('android', 'app', 'src', 'main', 'res')
for d, k in {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}.items():
    s108, s48, s24 = round(108 * k), round(48 * k), round(24 * k)
    fg = fit(s108, 0.5)  # nằm gọn trong vùng an toàn 66dp của icon thích ứng
    save(fg, *res, f'mipmap-{d}', 'ic_launcher_foreground.png')
    save(white(fg, lines=True), *res, f'mipmap-{d}', 'ic_launcher_monochrome.png')
    save(on_bg(s48, 0.8, 'rounded'), *res, f'mipmap-{d}', 'ic_launcher.png')
    save(on_bg(s48, 0.74, 'circle'), *res, f'mipmap-{d}', 'ic_launcher_round.png')
    save(white(fit(s24, 1.0)), *res, f'drawable-{d}', 'ic_stat_notify.png')
save(fit(480, 1.0), *res, 'drawable', 'splash_logo.png')
print('ok')
