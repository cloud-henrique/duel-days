#!/usr/bin/env python3
"""Copia do app nativo (duel-academy) os dados da campanha Duel Monsters, Tier 1, para src/campaign/data/.

São texto escrito para o nativo e ids de cartas (metadados), por isso versionados. Rode de novo quando o nativo mudar:

    python3 scripts/copy_campaign_data.py [caminho do duel-academy]

Trocas de cartas que o motor da PWA não aguenta ficam em SWAPS (id do nativo → id da PWA), com o motivo.
"""
import json
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NATIVE = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / 'Projects/personal/duel-academy')
SRC = NATIVE / 'Sources/DuelCampaign/Resources'
OUT = ROOT / 'src/campaign/data'

# id do nativo → id usado na PWA (carta que quebra o ocgcore). Vazio enquanto nada quebrar.
SWAPS: dict[int, int] = {}


# Arte alternativa (ex.: Monster Reborn 83764719) não tem script próprio no ocgcore: vale o id original (alias).
CDB = ROOT / 'raw/data/BabelCDB/cards.cdb'
_db = sqlite3.connect(CDB) if CDB.exists() else None
canon_log: dict[int, int] = {}


def canon(i: int) -> int:
    i = SWAPS.get(i, i)
    if _db is None:
        return i
    r = _db.execute('select alias from datas where id=?', (i,)).fetchone()
    if r and r[0]:
        o = _db.execute('select alias from datas where id=?', (r[0],)).fetchone()
        if o is not None and not o[0]:
            canon_log[i] = r[0]
            return r[0]
    return i


def swap(entries):
    return [{**e, 'id': canon(e['id'])} for e in entries]


def main():
    camp = json.loads((SRC / 'campaign.json').read_text())
    tier = camp['tiers'][0]
    for d in tier['duelists']:
        d['deck']['main'] = swap(d['deck']['main'])
        d['deck']['extra'] = swap(d['deck'].get('extra', []))
        for k in ('signatureCard', 'bondGift'):
            if d.get(k):
                d[k]['id'] = canon(d[k]['id'])
    camp['starterDeck']['main'] = swap(camp['starterDeck']['main'])
    campaign = {'starterDeck': camp['starterDeck'], 'startingPacks': camp['startingPacks'], 'tier': tier}

    dialogue = json.loads((SRC / 'dialogue.json').read_text())

    wanted = set()
    for p in tier['packs']:
        wanted.add(p if isinstance(p, str) else p['key'])
    wanted |= {d['key'] for d in tier['duelists']}
    packs = [p for p in json.loads((SRC / 'packs.json').read_text()) if p['key'] in wanted]
    for p in packs:
        p['cards'] = swap(p['cards'])
    missing = wanted - {p['key'] for p in packs}
    if missing:
        sys.exit(f'pacotes não encontrados no nativo: {sorted(missing)}')

    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in (('campaign', campaign), ('dialogue', dialogue), ('packs', packs)):
        (OUT / f'{name}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    if _db is None:
        print('aviso: sem raw/data/BabelCDB/cards.cdb (npm run fetch-data); ids de arte alternativa não trocados')
    if canon_log:
        print('arte alternativa → original:', ', '.join(f'{a}→{b}' for a, b in sorted(canon_log.items())))
    print(f'ok: {len(tier["duelists"])} duelistas, {len(packs)} pacotes → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
