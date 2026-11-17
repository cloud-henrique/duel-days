#!/usr/bin/env python3
"""Baixa a ilustração recortada das cartas de public/data/pool.json (YGOPRODeck, uso pessoal) e gera dois tamanhos WebP.

raw/cards/cropped/<id>.jpg (original ~624 px, não versionado) -> public/cards/thumb/<id>.webp (200 px: grades, mão,
campo, loja) e public/cards/full/<id>.webp (512 px: zoom da carta). Também baixa o verso para public/cards/back.webp.
A carta inteira com moldura e texto em inglês não é mais usada: a interface desenha a face em português.
Pausa entre requisições para respeitar o limite do serviço. Pula o que já existe.
Requer Pillow (scripts/requirements.txt).
Uso: .venv/bin/python scripts/fetch_card_art.py            # todas as cartas
     .venv/bin/python scripts/fetch_card_art.py --amostra 20   # só as 20 primeiras (conferir tamanho e nitidez)
     .venv/bin/python scripts/fetch_card_art.py --conferir     # só confere se toda carta tem thumb e full
"""
import json, os, sys, time, urllib.request
from PIL import Image

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CARDS = list(json.load(open(f'{R}/public/data/pool.json')))  # cartas da coleção (sem fichas)
BASE_URL = 'https://images.ygoprodeck.com/images'
# tamanho -> (largura em px, qualidade WebP)
SIZES = {'thumb': (200, 70), 'full': (512, 75)}
BACK = ('cards/back.jpg', 200)
PAUSE_S = 0.2
UA = {'User-Agent': 'personal-card-art-fetch'}


def fetch(url: str, raw: str) -> None:
    """Baixa `url` para `raw` se ainda não existe."""
    if os.path.exists(raw):
        return
    os.makedirs(os.path.dirname(raw), exist_ok=True)
    data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
    open(raw, 'wb').write(data)
    time.sleep(PAUSE_S)


def to_webp(raw: str, out: str, width: int, quality: int) -> None:
    """Converte `raw` para WebP com a largura dada, se `out` ainda não existe."""
    if os.path.exists(out):
        return
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im = Image.open(raw).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out, quality=quality, method=6)


def missing() -> list[tuple[str, str]]:
    return [(c, s) for c in CARDS for s in SIZES if not os.path.exists(f'{R}/public/cards/{s}/{c}.webp')]


def main(args: list[str]) -> int:
    if '--conferir' in args:
        m = missing()
        print(len(CARDS), 'cartas;', 'faltando:', len(m))
        for c, s in m[:50]:
            print('FALTA', c, s)
        return 1 if m else 0
    ids = CARDS[:int(args[args.index('--amostra') + 1])] if '--amostra' in args else CARDS
    fail = []
    for code in ids:
        raw = f'{R}/raw/cards/cropped/{code}.jpg'
        try:
            fetch(f'{BASE_URL}/cards_cropped/{code}.jpg', raw)
            for size, (width, quality) in SIZES.items():
                to_webp(raw, f'{R}/public/cards/{size}/{code}.webp', width, quality)
        except Exception as e:  # noqa: BLE001
            fail.append((code, str(e)))
    fetch(f'{BASE_URL}/{BACK[0]}', f'{R}/raw/cards/back.jpg')
    to_webp(f'{R}/raw/cards/back.jpg', f'{R}/public/cards/back.webp', BACK[1], 70)
    for size in SIZES:
        files = [f'{R}/public/cards/{size}/{c}.webp' for c in ids if os.path.exists(f'{R}/public/cards/{size}/{c}.webp')]
        total = sum(os.path.getsize(f) for f in files)
        print(f'{size}: {len(files)} arquivos, média {total / max(len(files), 1) / 1024:.1f} KB, total {total / 1024 / 1024:.1f} MB')
    print(len(ids), 'cartas; falhas:', len(fail))
    for f in fail:
        print('FALTA', *f)
    return 1 if fail else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
