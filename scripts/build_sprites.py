#!/usr/bin/env python3
"""Gera public/characters/ a partir de assets/characters (variante c007 + rótulos).

O corpo vem com o rosto em branco; o rosto de 240x240 se sobrepõe sempre em (260, 120) (medido por
correspondência de pixels nos 44 personagens, todos no mesmo ponto). Converte tudo para WebP e escreve
public/characters/index.json.
Requer Pillow:  python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
"""
import json, os
from PIL import Image

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = f'{R}/assets/characters'; OUT = f'{R}/public/characters'
FACE = {'x': 260, 'y': 120, 'w': 240, 'h': 240}

chars = json.load(open(f'{SRC}/characters.json', encoding='utf-8'))['characters']
index = []
for c in chars:
    body = Image.open(f"{SRC}/{c['body']}").convert('RGBA')
    d = f"{OUT}/{c['id']}"; os.makedirs(d, exist_ok=True)
    body.save(f'{d}/body.webp', quality=88, method=6)
    for e, files in c['faces'].items():
        Image.open(f'{SRC}/{files[0]}').convert('RGBA').save(f'{d}/{e}.webp', quality=88, method=6)
    index.append({'id': c['id'], 'name': c['name'], 'body': {'w': body.width, 'h': body.height},
                  'face': FACE, 'expressions': list(c['faces'])})
json.dump({'characters': index}, open(f'{OUT}/index.json', 'w'), ensure_ascii=False, indent=1)
print(len(index), 'personagens em', OUT)
