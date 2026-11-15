#!/usr/bin/env python3
"""Recorta cada ícone do atlas de ações do Tag Force 3 (pacote de texturas do PPSSPP, `actions.png`).

Gera assets/action-icons/<id>.png (material da Konami: fora do git) e assets/action-icons/manifest.json (posições e
tamanhos, versionado). O ícone de cada significado (Ativar, Baixar, Cemitério…) é escolhido no labeler (`npm run icon-labeler`) e fica em
assets/action-icons/labels.json; `scripts/copy_card_icons.py` usa os rótulos para gerar `public/card-icons/action-*.svg`.

Os ícones são achados pelo canal alfa: regiões ligadas, juntando as que ficam a poucos pixels umas das outras (partes
soltas do mesmo desenho, como a carta e a espada).

Uso: .venv/bin/python scripts/extract_action_icons.py [actions.png]
"""
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_ATLAS = Path.home() / '.config/ppsspp/PSP/TEXTURES/ULES01183/database/complementos/actions.png'
OUT = ROOT / 'assets/action-icons'
ALPHA_MIN = 200     # pixel que conta como parte do desenho (alto: as sombras suaves ligariam ícones vizinhos)
MERGE_GAP = 1       # regiões a esta distância (px) ou menos são o mesmo ícone
PAD = 3             # margem do recorte, para levar junto a borda suave e a sombra
MIN_AREA = 60       # regiões menores são ruído
# Um ícone ocupa até ~68 px; caixa maior (fora as barras largas e baixas) são ícones que se encostam no atlas, e
# voltam a ser separados só pelo miolo opaco.
MAX_SIDE, SPLIT_ALPHA = 72, 250


def regions(img: Image.Image, alpha_min: int = ALPHA_MIN) -> list[list[int]]:
    alpha = img.getchannel('A').load()
    w, h = img.size
    seen = bytearray(w * h)
    boxes = []
    for y in range(h):
        for x in range(w):
            if seen[y * w + x] or alpha[x, y] < alpha_min:
                continue
            stack = [(x, y)]
            seen[y * w + x] = 1
            x0 = x1 = x
            y0 = y1 = y
            n = 0
            while stack:
                cx, cy = stack.pop()
                n += 1
                x0, x1, y0, y1 = min(x0, cx), max(x1, cx), min(y0, cy), max(y1, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and alpha[nx, ny] >= alpha_min:
                        seen[ny * w + nx] = 1
                        stack.append((nx, ny))
            if n >= MIN_AREA:
                boxes.append([x0, y0, x1 + 1, y1 + 1])
    return boxes


def merge(boxes: list[list[int]]) -> list[list[int]]:
    """Junta caixas que se tocam ou ficam a até MERGE_GAP px, até não haver mais o que juntar."""
    changed = True
    while changed:
        changed = False
        out: list[list[int]] = []
        for b in boxes:
            for o in out:
                if b[0] <= o[2] + MERGE_GAP and o[0] <= b[2] + MERGE_GAP and b[1] <= o[3] + MERGE_GAP and o[1] <= b[3] + MERGE_GAP:
                    o[:] = [min(o[0], b[0]), min(o[1], b[1]), max(o[2], b[2]), max(o[3], b[3])]
                    changed = True
                    break
            else:
                out.append(list(b))
        boxes = out
    return boxes


def split_oversized(img: Image.Image, boxes: list[list[int]]) -> list[list[int]]:
    out = []
    for b in boxes:
        w, h = b[2] - b[0], b[3] - b[1]
        if max(w, h) <= MAX_SIDE or h < MAX_SIDE:
            out.append(b)
            continue
        parts = regions(img.crop(b), SPLIT_ALPHA)
        out += [[b[0] + p[0], b[1] + p[1], b[0] + p[2], b[1] + p[3]] for p in parts] or [b]
    return out


def main() -> None:
    atlas = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_ATLAS
    if not atlas.is_file():
        sys.exit(f'atlas não encontrado: {atlas}')
    img = Image.open(atlas).convert('RGBA')
    # Ordem de leitura: linhas de cima para baixo (pela faixa de 16 px do topo), da esquerda para a direita.
    boxes = sorted(split_oversized(img, merge(regions(img))), key=lambda b: (b[1] // 16, b[0]))
    OUT.mkdir(parents=True, exist_ok=True)
    icons = []
    for k, (x0, y0, x1, y1) in enumerate(boxes):
        icon_id = f'a{k:03d}'
        x0, y0, x1, y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(img.width, x1 + PAD), min(img.height, y1 + PAD)
        img.crop((x0, y0, x1, y1)).save(OUT / f'{icon_id}.png')
        icons.append({'id': icon_id, 'file': f'{icon_id}.png', 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0})
    (OUT / 'manifest.json').write_text(json.dumps({'atlas': atlas.name, 'icons': icons}, indent=1))
    print(f'{len(icons)} ícones em {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
