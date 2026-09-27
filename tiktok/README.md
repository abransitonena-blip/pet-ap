# Memes "pareja de raritos" para TikTok

Carrusel de 2 fotos (y MP4): **foto 1** fondo aesthetic + frase "Cuando me estoy burlando de la pareja de raritos pero…", **foto 2** reacción (emoji + texto, o tu propia imagen).

```bash
pip install pillow numpy imageio-ffmpeg
python tiktok/make_meme.py tiktok/raritos.json
```

Salen en `tiktok/output/`: `raritos_XX_1.png`, `raritos_XX_2.png` (carrusel) y `raritos_XX.mp4` (video).

## Editar `raritos.json`
- `frases`: una por meme; se insertan en `plantilla`.
- `reacciones`: texto + emoji de la foto 2 (se van rotando).
- `fondos`: `noche`, `lluvia`, `neon`, `atardecer`, `grunge` (generados por código, sin derechos).
- `imagen_reaccion`: ruta a tu foto de reacción (ej. `"llorando.jpg"`) para usarla en lugar del emoji.

Consejo: añade el sonido en tendencia desde la app de TikTok.
