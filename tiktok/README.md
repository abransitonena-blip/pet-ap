# Memes para TikTok (formato carrusel "Cuando...")

Genera el formato de 2 fotos: **foto 1** fondo oscuro con texto centrado, **foto 2** imagen de reacción.
Sale en PNG 1080x1920 (para subir como carrusel de fotos) y en MP4 (para subir como video).

```bash
pip install pillow imageio-ffmpeg
python tiktok/make_meme.py tiktok/ejemplo.json
```

Resultados en `tiktok/output/`.

## Cómo hacer uno nuevo
1. Copia `ejemplo.json` y cambia el `text` de la primera foto.
2. Pon tus imágenes en `tiktok/` y escribe su nombre en `"image"` (ej. `"image": "reaccion.jpg"`).
   Sin imagen se usa un fondo oscuro de rayas.
3. Opcional: `"audio": "sonido.mp3"` para el video. En TikTok es mejor añadir un sonido en tendencia desde la app.

Opciones por foto: `grayscale`, `brightness` (0.75 = más oscuro), `font_size`, `text_y` (0.5 = centro), `duration` (segundos).

Consejo: usa fotos propias o libres de derechos; los clips de TV/FIFA pueden provocar que TikTok silencie o baje el video.
