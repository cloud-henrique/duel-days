#!/usr/bin/env python3
"""Gera assets/characters/characters.json (manifesto de runtime) a partir de manifest.json + labels.json.

Regras: só variante chara007; corpo base = full_chara007.png (#0, sem _alt); só rostos rotulados
(exceto 'skip'); personagens marcados 'excluded' ficam de fora.
"""
import json, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'characters')
M = json.load(open(f'{D}/manifest.json', encoding='utf-8'))
M = M['characters'] if isinstance(M, dict) else M
L = json.load(open(f'{D}/labels.json', encoding='utf-8'))
out, skipped = [], []
for c in M:
    lab = L.get(c['id'], {})
    if lab.get('excluded'):
        skipped.append((c['id'], 'excluded')); continue
    bodies = [b for b in c['bodies'] if b['variant'] == 'chara007']
    bodies.sort(key=lambda b: ('_alt' in b['file'], b['file']))
    faces = {}
    for f in c['faces']:
        if f['variant'] != 'chara007': continue
        e = lab.get('faces', {}).get(f['file'])
        if e and e != 'skip':
            faces.setdefault(e, []).append(f['file'])
    if not bodies or 'neutral' not in faces:
        skipped.append((c['id'], 'sem corpo/neutral')); continue
    out.append({'id': c['id'], 'name': c['name'], 'body': bodies[0]['file'], 'faces': faces})
json.dump({'characters': out}, open(f'{D}/characters.json', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
print(len(out), 'personagens;', 'ignorados:', skipped)
