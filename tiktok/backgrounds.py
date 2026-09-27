"""Fondos 'aesthetic' generados por código (sin derechos de autor) para los memes."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920


def _hex(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def gradient(stops):
    """Degradado vertical. stops = [(posición 0-1, '#color'), ...]"""
    y = np.linspace(0, 1, H)
    pos = [p for p, _ in stops]
    cols = np.stack([_hex(c) for _, c in stops])
    rows = np.stack([np.interp(y, pos, cols[:, k]) for k in range(3)], axis=1)
    return np.repeat(rows[:, None, :], W, axis=1)


def glow(arr, x, y, radius, color, strength=1.0):
    yy, xx = np.ogrid[:H, :W]
    d = np.sqrt((xx - x) ** 2 + (yy - y) ** 2) / radius
    arr += np.exp(-d ** 2)[..., None] * _hex(color) * strength
    return arr


def bokeh(img, rng, n, colors, rmin, rmax, blur, alpha=110):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x, y, r = rng.integers(0, W), rng.integers(0, H), rng.integers(rmin, rmax)
        c = tuple(int(v) for v in _hex(colors[rng.integers(len(colors))]))
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (int(rng.integers(alpha // 3, alpha)),))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def finish(img, rng, grain=10, vignette=0.55):
    a = np.asarray(img, dtype=np.float32)
    yy, xx = np.ogrid[:H, :W]
    d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    a *= (1 - vignette * np.clip(d - 0.35, 0, 1))[..., None]
    a += rng.normal(0, grain, (H, W, 1))
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def noche(rng):
    a = gradient([(0, "#05030f"), (0.55, "#140a2e"), (1, "#2a0f3d")])
    glow(a, W * 0.78, H * 0.16, 260, "#8f7cff", 0.35)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for _ in range(420):
        x, y = rng.integers(0, W), rng.integers(0, int(H * 0.85))
        r, b = rng.choice([1, 1, 1, 2, 3]), int(rng.integers(120, 255))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(b, b, min(255, b + 20)))
    d.ellipse([W * 0.78 - 70, H * 0.16 - 70, W * 0.78 + 70, H * 0.16 + 70], fill=(235, 230, 255))
    d.ellipse([W * 0.78 - 40, H * 0.16 - 85, W * 0.78 + 100, H * 0.16 + 55], fill=(20, 12, 45))
    img = bokeh(img, rng, 14, ["#6b4bff", "#c04bff"], 40, 120, 40, 60)
    return finish(img, rng, 8)


def lluvia(rng):
    a = gradient([(0, "#03060f"), (1, "#0b1a2e")])
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img = bokeh(img, rng, 45, ["#ffb347", "#ff6f61", "#4fc3f7", "#fff3c4"], 25, 110, 28, 150)
    rain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(rain)
    for _ in range(700):
        x, y, ln = rng.integers(-200, W), rng.integers(0, H), rng.integers(30, 110)
        d.line([(x, y), (x + ln * 0.25, y + ln)], fill=(200, 220, 255, int(rng.integers(25, 90))), width=2)
    img = Image.alpha_composite(img.convert("RGBA"), rain.filter(ImageFilter.GaussianBlur(1))).convert("RGB")
    return finish(img, rng, 9)


def neon(rng):
    a = np.full((H, W, 3), 6, dtype=np.float32)
    glow(a, W * 0.15, H * 0.2, 520, "#ff2d95", 0.55)
    glow(a, W * 0.9, H * 0.55, 560, "#7b2dff", 0.6)
    glow(a, W * 0.3, H * 0.95, 480, "#00d4ff", 0.35)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img = bokeh(img, rng, 30, ["#ff2d95", "#b44dff", "#00d4ff"], 15, 70, 14, 120)
    return finish(img, rng, 10)


def grunge(rng):
    a = gradient([(0, "#0a0a0a"), (1, "#141010")])
    glow(a, W * 0.5, H * 0.5, 700, "#5a0f14", 0.5)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for _ in range(90):
        x, y = rng.integers(0, W), rng.integers(0, H)
        d.line([(x, y), (x + rng.integers(-60, 60), y + rng.integers(40, 400))],
               fill=(int(rng.integers(40, 80)),) * 3, width=1)
    return finish(img, rng, 22, 0.8)


def atardecer(rng):
    a = gradient([(0, "#1a0b2e"), (0.45, "#5b1f4f"), (0.75, "#a8416b"), (1, "#e27d6a")])
    a *= 0.62
    glow(a, W * 0.5, H * 0.92, 420, "#ffb37a", 0.35)
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img = bokeh(img, rng, 25, ["#ffd1dc", "#ffb37a", "#ff8fab"], 20, 90, 30, 90)
    return finish(img, rng, 9)


STYLES = {"noche": noche, "lluvia": lluvia, "neon": neon, "grunge": grunge, "atardecer": atardecer}


def make(style, seed=0):
    return STYLES[style](np.random.default_rng(seed))
