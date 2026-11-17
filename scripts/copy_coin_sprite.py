"""Moeda do Yu-Gi-Oh! WCT 2004 (GBA), da folha do spriters-resource baixada à mão em raw/wct2004/coin.png.

Recorta os 17 quadros num strip horizontal de células 32×32, fundo transparente, em public/sprites/coin.png (fora do
git, como o resto da arte da Konami). Ordem (a mesma de COIN_FRAMES em src/ui/coin.tsx):
  0–5   cara, com o brilho passando;
  6–11  coroa, com o brilho passando;
  12    cara inclinada (clara), 13 coroa inclinada (clara), 14 de lado (fio),
  15    cara inclinada (escura, por baixo), 16 coroa inclinada (escura).
Uso: .venv/bin/python scripts/copy_coin_sprite.py
"""
from pathlib import Path
from PIL import Image

SRC = Path('raw/wct2004/coin.png')
OUT = Path('public/sprites/coin.png')
CELL = 32
# (x0, y0, x1, y1) inclusivos, medidos na folha de 230×150.
ROW1 = [(17 + 33 * i, 34, 47 + 33 * i, 64) for i in range(6)]
ROW2 = [(17 + 33 * i, 71, 48 + 33 * i, 101) for i in range(6)]
TILT = [(33, 110, 63, 127), (66, 110, 96, 127), (99, 117, 130, 119), (133, 110, 163, 127), (166, 110, 196, 127)]


def main() -> None:
    sheet = Image.open(SRC).convert('RGBA')
    bg = sheet.getpixel((0, 0))
    px = sheet.load()
    for y in range(sheet.height):
        for x in range(sheet.width):
            if px[x, y] == bg:
                px[x, y] = (0, 0, 0, 0)
    boxes = ROW1 + ROW2 + TILT
    strip = Image.new('RGBA', (CELL * len(boxes), CELL), (0, 0, 0, 0))
    for i, (x0, y0, x1, y1) in enumerate(boxes):
        frame = sheet.crop((x0, y0, x1 + 1, y1 + 1))
        ox = i * CELL + (CELL - frame.width) // 2
        oy = (CELL - frame.height) // 2
        strip.paste(frame, (ox, oy), frame)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    strip.save(OUT)
    print(f'{OUT}: {len(boxes)} quadros de {CELL}×{CELL}')


if __name__ == '__main__':
    main()
