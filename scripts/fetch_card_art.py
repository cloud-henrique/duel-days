#!/usr/bin/env python3
"""Baixa a arte das cartas de public/data/pool.json (YGOPRODeck, uso pessoal) e converte para WebP.

raw/cards/<variante>/<id>.jpg  (originais, não versionados)  ->  public/cards/<variante>/<id>.webp
Variantes: small e large (carta inteira, usadas na folha e no deck builder) e cropped (só a ilustração, usada pela
face própria da carta no duelo). Também baixa o verso para public/cards/back.webp.
Pausa entre requisições para respeitar o limite do serviço. Pula o que já existe.
Requer Pillow (scripts/requirements.txt). Uso: .venv/bin/python scripts/fetch_card_art.py [variante ...]
"""
import json, os, sys, time, urllib.request
from PIL import Image

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CARDS = json.load(open(f'{R}/public/data/pool.json'))  # só cartas da coleção
BASE_URL = 'https://images.ygoprodeck.com/images'
# variante -> (pasta no YGOPRODeck, largura final em px)
VARIANTS = {'small': ('cards_small', 200), 'large': ('cards', 380), 'cropped': ('cards_cropped', 256)}
BACK = ('cards/back.jpg', 200)
WEBP_QUALITY = 68
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


def to_webp(raw: str, out: str, width: int) -> None:
    """Converte `raw` para WebP com a largura dada, se `out` ainda não existe."""
    if os.path.exists(out):
        return
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im = Image.open(raw).convert('RGB')
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out, quality=WEBP_QUALITY, method=4)


def main(names: list[str]) -> int:
    fail = []
    for code in CARDS:
        for name in names:
            path, width = VARIANTS[name]
            raw = f'{R}/raw/cards/{name}/{code}.jpg'
            try:
                fetch(f'{BASE_URL}/{path}/{code}.jpg', raw)
                to_webp(raw, f'{R}/public/cards/{name}/{code}.webp', width)
            except Exception as e:  # noqa: BLE001
                fail.append((code, name, str(e)))
    path, width = BACK
    fetch(f'{BASE_URL}/{path}', f'{R}/raw/cards/back.jpg')
    to_webp(f'{R}/raw/cards/back.jpg', f'{R}/public/cards/back.webp', width)
    print(len(CARDS), 'cartas; variantes:', ', '.join(names), '; falhas:', len(fail))
    for f in fail:
        print('FALTA', *f)
    return 1 if fail else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:] or list(VARIANTS)))
