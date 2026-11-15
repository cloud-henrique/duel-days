#!/usr/bin/env python3
"""Busca nome e efeito em português (YGOPRODeck) para as cartas de public/data/cards.json
e grava public/data/text.pt.json. Cartas sem tradução ficam de fora (o app cai para o inglês)."""
import json, os, urllib.request
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ids = [int(k) for k in json.load(open(f'{R}/public/data/cards.json', encoding='utf-8'))]
out = {}
for i in range(0, len(ids), 40):
    chunk = ','.join(map(str, ids[i:i + 40]))
    req = urllib.request.Request(f'https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&id={chunk}', headers={'User-Agent': 'personal-card-text-fetch'})
    for c in json.load(urllib.request.urlopen(req, timeout=60)).get('data', []):
        out[str(c['id'])] = {'name': c['name'], 'desc': c['desc']}
json.dump(out, open(f'{R}/public/data/text.pt.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(out), 'de', len(ids), 'cartas com texto em português; sem tradução:', [i for i in ids if str(i) not in out])
