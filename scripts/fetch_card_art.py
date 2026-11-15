#!/usr/bin/env python3
"""Baixa a arte das cartas de public/data/cards.json (YGOPRODeck, uso pessoal) e converte para WebP.

raw/cards/{small,large}/<id>.jpg  (originais, não versionados)  ->  public/cards/{small,large}/<id>.webp
Pausa entre requisições para respeitar o limite do serviço. Pula o que já existe.
Requer Pillow (scripts/requirements.txt).
"""
import json, os, sys, time, urllib.request
from PIL import Image

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CARDS = json.load(open(f'{R}/public/data/pool.json'))  # só cartas da coleção
VARIANTS = {'small': ('cards_small', 200), 'large': ('cards', 380)}
fail = []
for code in CARDS:
    for name, (path, width) in VARIANTS.items():
        raw = f'{R}/raw/cards/{name}/{code}.jpg'; out = f'{R}/public/cards/{name}/{code}.webp'
        os.makedirs(os.path.dirname(raw), exist_ok=True); os.makedirs(os.path.dirname(out), exist_ok=True)
        if not os.path.exists(raw):
            try:
                req = urllib.request.Request(f'https://images.ygoprodeck.com/images/{path}/{code}.jpg', headers={'User-Agent': 'personal-card-art-fetch'})
                open(raw, 'wb').write(urllib.request.urlopen(req, timeout=30).read())
            except Exception as e:  # noqa: BLE001
                fail.append((code, name, str(e))); continue
            time.sleep(0.2)
        if not os.path.exists(out):
            im = Image.open(raw).convert('RGB')
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
            im.save(out, quality=68, method=4)
print(len(CARDS), 'cartas;', 'falhas:', fail)
sys.exit(1 if fail else 0)
