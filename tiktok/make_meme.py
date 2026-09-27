"""Generador de memes estilo TikTok (carrusel de 2 fotos -> video vertical).

Formato: foto 1 = fondo aesthetic + texto centrado ("Cuando..."),
         foto 2 = reacción (tu imagen, o texto + emoji si no pones imagen).

Uso:
    pip install pillow numpy imageio-ffmpeg
    python tiktok/make_meme.py tiktok/raritos.json
"""
import json
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

import backgrounds

W, H = backgrounds.W, backgrounds.H
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"


def load_font(size):
    for path in (FONT, "arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def fit_cover(img):
    """Recorta la imagen para llenar 1080x1920 sin deformarla."""
    scale = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left, top = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((left, top, left + W, top + H))


def wrap(text, font, max_w, draw):
    lines = []
    for para in text.split("\n"):
        line = ""
        for word in para.split():
            test = f"{line} {word}".strip()
            if draw.textlength(test, font=font) <= max_w:
                line = test
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def draw_text(img, text, size, center_y):
    draw = ImageDraw.Draw(img)
    font = load_font(size)
    lines = wrap(text, font, W * 0.64, draw)
    lh = size * 1.22
    y = H * center_y - lh * len(lines) / 2
    for ln in lines:
        tw = draw.textlength(ln, font=font)
        draw.text(((W - tw) / 2, y), ln, font=font, fill="white",
                  stroke_width=3, stroke_fill="black")
        y += lh


def paste_emoji(img, emoji, size, center_y):
    try:
        font = ImageFont.truetype(EMOJI_FONT, 109)  # único tamaño que admite la fuente
    except OSError:
        return
    tile = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(tile).text((80, 80), emoji, font=font, embedded_color=True, anchor="mm")
    tile = tile.crop(tile.getbbox()).resize((size, size), Image.LANCZOS)
    img.paste(tile, ((W - size) // 2, int(H * center_y - size / 2)), tile)


def background(slide, seed):
    if slide.get("image"):
        img = fit_cover(Image.open(slide["image"]).convert("RGB"))
    else:
        img = backgrounds.make(slide.get("background", "noche"), seed)
    if slide.get("grayscale"):
        img = img.convert("L").convert("RGB")
    if slide.get("blur"):
        img = img.filter(ImageFilter.GaussianBlur(slide["blur"]))
    return ImageEnhance.Brightness(img).enhance(slide.get("brightness", 1.0))


def render_slide(slide, path, seed):
    img = background(slide, seed)
    if slide.get("emoji"):
        paste_emoji(img, slide["emoji"], slide.get("emoji_size", 360), slide.get("emoji_y", 0.56))
    if slide.get("text"):
        draw_text(img, slide["text"], slide.get("font_size", 58), slide.get("text_y", 0.5))
    img.save(path)
    return path


def make_video(paths, durations, audio, out_path):
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ff, "-y"]
    for p, d in zip(paths, durations):
        cmd += ["-loop", "1", "-t", str(d), "-i", p]
    if audio:
        cmd += ["-i", audio]
    n = len(paths)
    filt = "".join(f"[{i}:v]scale={W}:{H},setsar=1,fps=30[v{i}];" for i in range(n))
    filt += "".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0,format=yuv420p[v]"
    cmd += ["-filter_complex", filt, "-map", "[v]"]
    if audio:
        cmd += ["-map", f"{n}:a", "-c:a", "aac", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-movflags", "+faststart", out_path]
    subprocess.run(cmd, check=True, capture_output=True)


def build(meme, base, out_dir, seed):
    name = meme.get("name", f"meme_{seed}")
    paths = []
    for i, s in enumerate(meme["slides"]):
        if s.get("image"):
            s["image"] = os.path.join(base, s["image"])
        paths.append(render_slide(s, os.path.join(out_dir, f"{name}_{i + 1}.png"), seed))
    durations = [s.get("duration", 3) for s in meme["slides"]]
    audio = os.path.join(base, meme["audio"]) if meme.get("audio") else None
    video = os.path.join(out_dir, name + ".mp4")
    make_video(paths, durations, audio, video)
    print(f"{name}: {video}")


def expand_series(cfg):
    """Convierte una serie {plantilla, frases, reacciones, fondos} en memes individuales."""
    memes = []
    for i, frase in enumerate(cfg["frases"]):
        reac = cfg["reacciones"][i % len(cfg["reacciones"])]
        fondo = cfg["fondos"][i % len(cfg["fondos"])]
        memes.append({
            "name": f"{cfg.get('name', 'meme')}_{i + 1:02d}",
            "slides": [
                {"background": fondo, "text": cfg["plantilla"].format(frase=frase),
                 "duration": cfg.get("duracion_texto", 4)},
                {"background": fondo, "blur": 12, "brightness": 0.7,
                 "image": cfg.get("imagen_reaccion"),
                 "text": reac["texto"], "text_y": 0.36, "font_size": 72,
                 "emoji": None if cfg.get("imagen_reaccion") else reac.get("emoji"),
                 "duration": cfg.get("duracion_reaccion", 2.5)},
            ],
        })
    return memes


def main(config_path):
    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)
    base = os.path.dirname(os.path.abspath(config_path))
    out_dir = os.path.join(base, cfg.get("output_dir", "output"))
    os.makedirs(out_dir, exist_ok=True)

    if "frases" in cfg:
        memes = expand_series(cfg)
    else:
        memes = cfg.get("memes", [cfg])
    for seed, meme in enumerate(memes):
        build(meme, base, out_dir, seed)
    if cfg.get("caption"):
        print("Descripción:", cfg["caption"])


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "tiktok/raritos.json")
