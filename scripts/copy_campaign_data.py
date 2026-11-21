#!/usr/bin/env python3
"""Monta os dados da campanha em src/campaign/data/: o Tier 1 do app nativo (duel-academy) e os tiers seguintes do
tiers.json (escrito à mão), com os decks do decks.json (as receitas escolhidas pelo proto/deck-pick.ts) e as falas dos
dialogue-tier*.json (um por tier, escritos à mão).

São texto escrito para o nativo e ids de cartas (metadados), por isso versionados. Rode de novo quando o nativo mudar:

    python3 scripts/copy_campaign_data.py [caminho do duel-academy]

Trocas de cartas que o motor da PWA não aguenta ficam em SWAPS (id do nativo → id da PWA), com o motivo.

As coleções de todos os tiers (LOB, MRD, MRL, PSV; LON, LOD, PGD…) levam as cartas e raridades das caixas TCG reais,
de public/data/boosters.json (gerado por import_dm.py + export_data.py); o dia de cada uma é relativo à abertura do
tier (`offset`, no tiers.json). Os pacotes de personagem continuam vindo do nativo (só o Tier 1 tem).
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


def deck_of(key: str, decks: dict, native: dict | None):
    """O deck da receita escolhida (decks.json); sem ela, o do nativo (Tier 1). Tiers novos exigem a receita."""
    if key in decks:
        d = decks[key]
        return {'name': d['name'], 'main': swap(d['main']), 'extra': swap(d.get('extra', []))}
    if native is None:
        sys.exit(f'falta o deck de {key} em src/campaign/data/decks.json (rode proto/deck-pick.ts)')
    return {**native, 'main': swap(native['main']), 'extra': swap(native.get('extra', []))}


def main():
    camp = json.loads((SRC / 'campaign.json').read_text())
    extra_data = json.loads((OUT / 'tiers.json').read_text())
    decks_file = OUT / 'decks.json'
    decks = json.loads(decks_file.read_text())['decks'] if decks_file.exists() else {}

    t1 = camp['tiers'][0]
    for d in t1['duelists']:
        d['deck'] = deck_of(d['key'], decks, d['deck'])
        d['bond'] = True
        d['scene'] = extra_data['tier1']['scenes'][d['key']]
        d.pop('location', None)
        for k in ('signatureCard', 'bondGift'):
            if d.get(k):
                d[k]['id'] = canon(d[k]['id'])
    tier1 = {k: v for k, v in t1.items() if k != 'locations'}
    tier1['packs'] = extra_data['tier1']['packs']
    tiers = [tier1]
    for t in extra_data['tiers']:
        for d in t['duelists']:
            d['bond'] = False
            d['deck'] = deck_of(d['key'], decks, None)
            d['signatureCard']['id'] = canon(d['signatureCard']['id'])
        tiers.append(t)
    camp['starterDeck']['main'] = swap(camp['starterDeck']['main'])
    # Speed Duel: o deck ativo inicial é o do nativo sem as cartas do starterCut (a coleção fica com as 40).
    camp['starterDeck']['cut'] = swap(extra_data['starterCut']['main'])
    campaign = {'starterDeck': camp['starterDeck'], 'startingPacks': camp['startingPacks'],
                'mapPoints': extra_data['mapPoints'], 'tiers': tiers}

    dialogue = json.loads((SRC / 'dialogue.json').read_text())
    # Falas escritas para a PWA, um arquivo por tier. Cada momento listado (firstWin, bossDefeat…) substitui o do nativo e
    # os outros ficam: o dialogue-tier1.json só corrige algumas cenas do Tier 1.
    for lines in sorted(OUT.glob('dialogue-tier*.json')):
        for key, moments in json.loads(lines.read_text())['duelists'].items():
            dialogue['duelists'].setdefault(key, {}).update(moments)
    for t in tiers[1:]:
        for d in t['duelists']:
            if d['key'] not in dialogue['duelists']:
                sys.exit(f'faltam as falas de {d["key"]} em src/campaign/data/dialogue-tier{t["number"]}.json')

    collections = [p['key'] for t in tiers for p in t['packs']]
    native_packs = {p['key']: p for p in json.loads((SRC / 'packs.json').read_text())}
    boosters_file = ROOT / 'public/data/boosters.json'
    if not boosters_file.exists():
        sys.exit('falta public/data/boosters.json: rode scripts/import_dm.py e scripts/export_data.py')
    boosters = {b['key']: b for b in json.loads(boosters_file.read_text())}
    packs = []
    for key in collections:
        if key not in boosters:
            sys.exit(f'caixa {key} sem lista em boosters.json')
        base = native_packs.get(key) or {'key': key, 'name': extra_data['packNames'].get(key, boosters[key]['name'])}
        packs.append({**base, 'cards': swap([{'id': c['id'], 'rarity': c['rarity']} for c in boosters[key]['cards']])})
    for d in t1['duelists']:  # pacotes de personagem: só os do Tier 1, do nativo
        p = native_packs.get(d['key'])
        if p is None:
            sys.exit(f'pacote de personagem {d["key"]} não encontrado no nativo')
        packs.append({**p, 'cards': swap(p['cards'])})

    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in (('campaign', campaign), ('dialogue', dialogue), ('packs', packs)):
        (OUT / f'{name}.json').write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    if _db is None:
        print('aviso: sem raw/data/BabelCDB/cards.cdb (npm run fetch-data); ids de arte alternativa não trocados')
    if canon_log:
        print('arte alternativa → original:', ', '.join(f'{a}→{b}' for a, b in sorted(canon_log.items())))
    n = sum(len(t['duelists']) for t in tiers)
    print(f'ok: {len(tiers)} tiers, {n} duelistas ({len(decks)} decks de receita), {len(packs)} pacotes → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
