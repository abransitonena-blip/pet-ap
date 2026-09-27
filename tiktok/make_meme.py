"""Generador de memes estilo TikTok (carrusel de 2 fotos -> video vertical).

Formato: slide 1 = fondo oscuro + texto centrado ("Cuando..."),
         slide 2 = imagen de reacción (llorando, riendo, etc.).

Uso:
    pip install pillow imageio-ffmpeg
    python tiktok/make_meme.py tiktok/ejemplo.json
"""
import json
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1080, 1920
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


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


def placeholder_bg(seed):
    """Fondo oscuro con rayas diagonales para cuando no hay imagen."""
    img = Image.new("RGB", (W, H), (18, 18, 20))
    d = ImageDraw.Draw(img)
    for x in range(-H, W, 28):
        shade = 34 + (x // 28 + seed) % 3 * 8
        d.line([(x, H), (x + H, 0)], fill=(shade, shade, shade + 2), width=10)
    return img.filter(ImageFilter.GaussianBlur(2))


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


def render_slide(slide, idx, out_dir):
    if slide.get("image"):
        img = fit_cover(Image.open(slide["image"]).convert("RGB"))
    else:
        img = placeholder_bg(idx)
    if slide.get("grayscale"):
        img = img.convert("L").convert("RGB")
    img = ImageEnhance.Brightness(img).enhance(slide.get("brightness", 1.0))

    text = slide.get("text")
    if text:
        draw = ImageDraw.Draw(img)
        font = load_font(slide.get("font_size", 58))
        lines = wrap(text, font, W * 0.62, draw)
        lh = font.size * 1.22
        y = H * slide.get("text_y", 0.5) - lh * len(lines) / 2
        for ln in lines:
            tw = draw.textlength(ln, font=font)
            draw.text(((W - tw) / 2, y), ln, font=font, fill="white",
                      stroke_width=3, stroke_fill="black")
            y += lh

    path = os.path.join(out_dir, f"slide_{idx + 1}.png")
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


def main(config_path):
    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)
    base = os.path.dirname(os.path.abspath(config_path))
    for s in cfg["slides"]:
        if s.get("image"):
            s["image"] = os.path.join(base, s["image"])
    out_dir = os.path.join(base, cfg.get("output_dir", "output"))
    os.makedirs(out_dir, exist_ok=True)

    paths = [render_slide(s, i, out_dir) for i, s in enumerate(cfg["slides"])]
    durations = [s.get("duration", 3) for s in cfg["slides"]]
    audio = os.path.join(base, cfg["audio"]) if cfg.get("audio") else None
    video = os.path.join(out_dir, cfg.get("name", "meme") + ".mp4")
    make_video(paths, durations, audio, video)

    print("Fotos (sube como carrusel):", *paths, sep="\n  ")
    print("Video:", video)
    if cfg.get("caption"):
        print("Descripción:", cfg["caption"])


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "tiktok/ejemplo.json")
