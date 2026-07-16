#!/usr/bin/env python3
"""Genera los iconos PWA para EUSKAL34."""
from PIL import Image, ImageDraw, ImageFont
import math

def crear_icono(size, maskable=False):
    padding = int(size * 0.1) if maskable else 0
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fondo con gradiente simulado
    bg_color = (15, 20, 40)
    draw.rectangle([0, 0, size, size], fill=bg_color)

    # Círculo exterior decorativo
    margin = padding + int(size * 0.05)
    accent = (0, 180, 255)
    draw.ellipse([margin, margin, size - margin, size - margin],
                 outline=accent, width=max(2, int(size * 0.02)))

    # Círculo interior relleno
    inner = padding + int(size * 0.12)
    draw.ellipse([inner, inner, size - inner, size - inner],
                 fill=(20, 30, 60))

    # Texto "E34"
    cx = size // 2
    cy = size // 2

    font_size_main = int(size * 0.30)
    font_size_sub  = int(size * 0.14)

    try:
        font_main = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_main)
        font_sub  = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_sub)
    except Exception:
        font_main = ImageFont.load_default()
        font_sub  = font_main

    # "E" grande
    bbox = draw.textbbox((0, 0), "E", font=font_main)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2 - int(size * 0.04)), "E",
              font=font_main, fill=(0, 200, 255))

    # "34" pequeño debajo
    bbox2 = draw.textbbox((0, 0), "34", font=font_sub)
    tw2 = bbox2[2] - bbox2[0]
    draw.text((cx - tw2 // 2, cy + th // 2 - int(size * 0.02)), "34",
              font=font_sub, fill=(180, 220, 255))

    # Puntos decorativos en las esquinas del círculo
    dot_r = max(2, int(size * 0.025))
    r = size // 2 - margin - dot_r
    for angle in [45, 135, 225, 315]:
        rad = math.radians(angle)
        dx = cx + int(r * math.cos(rad))
        dy = cy + int(r * math.sin(rad))
        draw.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=accent)

    return img

# icon-192.png
img192 = crear_icono(192)
img192.save("/home/ubuntu/EUSKAL34/icons/icon-192.png", "PNG")

# icon-512.png
img512 = crear_icono(512)
img512.save("/home/ubuntu/EUSKAL34/icons/icon-512.png", "PNG")

# maskable-512.png (con padding safe zone)
imgm = crear_icono(512, maskable=True)
imgm.save("/home/ubuntu/EUSKAL34/icons/maskable-512.png", "PNG")

print("Iconos generados correctamente.")
