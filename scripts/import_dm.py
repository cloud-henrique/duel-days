#!/usr/bin/env python3
"""Importa a coleção da era Duel Monsters (YGOPRODeck) e substitui o fetch_pool.py.

Base = monstros, Magias e Armadilhas com data OCG até 2004-09-30 (sem fichas), mais os ids de raw/import/incluir.json e
os ids que a campanha usa. Grava (tudo fora do git):
  raw/pool/pool.json         {id: {name, tier, set, date}}   (formato que o export_data.py lê)
  raw/pool/boosters.json     caixas TCG da era: [{key, code, name, date, cards: [{id, rarity}], cut: [ids]}]
  raw/import/text.pt.json    {id: {name, desc}} das cartas com tradução oficial em português
  raw/import/stats.json      números para o relatório (o export_data.py escreve raw/import/report.md)
Respostas cruas da API ficam em cache (raw/import/, raw/pool/sets/); pausa entre requisições. Rode de novo à vontade.
Uso: python3 scripts/import_dm.py && python3 scripts/export_data.py
"""
import hashlib, json, os, time, urllib.parse, urllib.request
from collections import Counter

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
UA = {'User-Agent': 'personal-dm-import'}
CUTOFF = '2004-09-30'
IMP, POOL = f'{R}/raw/import', f'{R}/raw/pool'
os.makedirs(f'{IMP}/pt', exist_ok=True); os.makedirs(f'{IMP}/ids', exist_ok=True); os.makedirs(f'{POOL}/sets', exist_ok=True)

# Caixas TCG da era (código, nome exato na API). A raridade de uma carta no pool é a da primeira impressão nessas caixas.
SETS = [
 ('LOB', 'Legend of Blue Eyes White Dragon'), ('SDK', 'Starter Deck: Kaiba'), ('SDY', 'Starter Deck: Yugi'), ('MRD', 'Metal Raiders'),
 ('MRL', 'Magic Ruler'), ('SRL', 'Spell Ruler'), ('PSV', "Pharaoh's Servant"), ('LON', 'Labyrinth of Nightmare'),
 ('SDJ', 'Starter Deck: Joey'), ('SDP', 'Starter Deck: Pegasus'), ('LOD', 'Legacy of Darkness'), ('PGD', 'Pharaonic Guardian'),
 ('MFC', "Magician's Force"), ('DCR', 'Dark Crisis'), ('IOC', 'Invasion of Chaos'), ('SKE', 'Starter Deck: Kaiba Evolution'),
 ('SYE', 'Starter Deck: Yugi Evolution'), ('AST', 'Ancient Sanctuary'), ('SOD', 'Soul of the Duelist'), ('DB1', 'Dark Beginning 1'),
 ('RDS', 'Rise of Destiny'), ('SD1', "Structure Deck: Dragon's Roar"), ('SD2', 'Structure Deck: Zombie Madness'),
 ('FET', 'Flaming Eternity'), ('DR1', 'Dark Revelation Volume 1'), ('SD3', 'Structure Deck: Blaze of Destruction'),
 ('SD4', 'Structure Deck: Fury from the Deep'), ('TLM', 'The Lost Millennium'), ('DB2', 'Dark Beginning 2'),
 ('CRV', 'Cybernetic Revolution'), ('DR2', 'Dark Revelation Volume 2'), ('SD5', "Structure Deck: Warrior's Triumph"),
 ('EEN', 'Elemental Energy'),
]
# Os boosters (caixas de pacotes) da era, em ordem cronológica: viram dados para a loja. A chave é a do nativo
# (lob, mrd, mrl, psv); o MRL junta "Magic Ruler" e a reedição "Spell Ruler" (mesmas cartas).
BOOSTERS = [('lob', ['LOB']), ('mrd', ['MRD']), ('mrl', ['MRL', 'SRL']), ('psv', ['PSV']), ('lon', ['LON']), ('lod', ['LOD']),
            ('pgd', ['PGD']), ('mfc', ['MFC']), ('dcr', ['DCR']), ('ioc', ['IOC']), ('ast', ['AST']), ('sod', ['SOD']),
            ('rds', ['RDS']), ('fet', ['FET']), ('tlm', ['TLM']), ('crv', ['CRV']), ('een', ['EEN'])]
SET_NAME = dict(SETS)

UR = ('Ultra', 'Ultimate', 'Secret', 'Ghost', 'Gold', 'Starlight', 'Collector', 'Platinum')
ORDER = {'N': 0, 'R': 1, 'SR': 2, 'UR': 3}
RARITY = {'N': 'common', 'R': 'rare', 'SR': 'super', 'UR': 'ultra'}
def tier(r):
    if any(k in r for k in UR): return 'UR'
    if 'Super' in r: return 'SR'
    if 'Rare' in r or 'Starfoil' in r or 'Parallel' in r: return 'R'
    return 'N'

def get(url, cache):
    """GET com cache em disco (JSON)."""
    if not os.path.exists(cache):
        data = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90).read()
        open(cache, 'wb').write(data); time.sleep(0.3)
    return json.load(open(cache))

def by_ids(ids, extra=''):
    """Cartas por id, em lotes de 40 (cache por lote)."""
    out = []
    ids = sorted(set(ids))
    for i in range(0, len(ids), 40):
        chunk = ','.join(map(str, ids[i:i + 40]))
        h = hashlib.md5((chunk + extra).encode()).hexdigest()[:12]
        d = get(f'{API}?id={chunk}{extra}', f'{IMP}/{"pt" if "language" in extra else "ids"}/{h}.json')
        out += d.get('data', [])
    return out

ocg = lambda c: (c.get('misc_info') or [{}])[0].get('ocg_date')
GAME = ('Monster', 'Spell Card', 'Trap Card')
is_game = lambda c: any(k in c['type'] for k in GAME) and c['type'] != 'Token' and 'Skill' not in c['type']

# 1. Cartas com data OCG até o corte
era = get(f'{API}?startdate=1999-01-01&enddate={CUTOFF}&dateregion=ocg_date&misc=yes', f'{IMP}/era.json')['data']
base = {c['id']: c for c in era if is_game(c)}
tokens = sum(1 for c in era if c['type'] == 'Token')

# 2. Cartas das caixas TCG da era (raridade e o que ficou de fora do corte)
set_cards = {}  # código -> [cartas da resposta]
for code, name in SETS:
    d = get(f'{API}?cardset=' + urllib.parse.quote(name), f'{POOL}/sets/{code}.json')
    set_cards[code] = d.get('data', [])
in_sets = {c['id'] for cs in set_cards.values() for c in cs if is_game(c)}
outside = sorted(in_sets - set(base))
info = {c['id']: c for c in by_ids(outside, '&misc=yes')}
no_ocg = sorted((i for i in outside if i in info and not ocg(info[i])), key=lambda i: info[i]['name'])
late = sorted((i for i in outside if i in info and ocg(info[i])), key=lambda i: info[i]['name'])

# 3. Incluídas à mão e as que a campanha usa
include = set(json.load(open(f'{IMP}/incluir.json'))) if os.path.exists(f'{IMP}/incluir.json') else set()
CAMP = f'{R}/src/campaign/data'
camp_ids = set()
if os.path.exists(f'{CAMP}/campaign.json'):
    camp = json.load(open(f'{CAMP}/campaign.json'))
    camp_ids |= {e['id'] for e in camp['starterDeck']['main']}
    for d in camp['tier']['duelists']:
        camp_ids |= {e['id'] for e in d['deck']['main'] + d['deck'].get('extra', [])}
        camp_ids |= {d[k]['id'] for k in ('signatureCard', 'bondGift') if d.get(k)}
camp_extra = sorted(i for i in camp_ids if i not in base)
for c in by_ids(sorted((include | set(camp_extra)) - set(base)), '&misc=yes'):
    base[c['id']] = c
# a campanha usa o id original: uma arte alternativa pedida aponta para a carta principal
missing_camp = [i for i in camp_extra if i not in base]

# 4. Raridade (primeira impressão) e boosters
first = {}  # id -> (data TCG da caixa, tier, código)
multi = []
sets_meta = {s['set_name']: s for s in json.load(open(f'{POOL}/sets.json'))} if os.path.exists(f'{POOL}/sets.json') else {}
def rarity_in(c, code):
    rs = [tier(x.get('set_rarity', '')) for x in c.get('card_sets', []) if x['set_name'] == SET_NAME[code]]
    if len(set(rs)) > 1: multi.append((c['id'], code))
    return min(rs, key=ORDER.get) if rs else 'N'
for code, name in SETS:
    date = sets_meta.get(name, {}).get('tcg_date', '9999')
    for c in set_cards[code]:
        if c['id'] in base and (c['id'] not in first or date < first[c['id']][0]):
            first[c['id']] = (date, rarity_in(c, code), code)
boosters = []
for key, codes in BOOSTERS:
    cards, cut, seen = [], [], set()
    for code in codes:
        for c in set_cards[code]:
            if not is_game(c) or c['id'] in seen: continue
            seen.add(c['id'])
            (cards if c['id'] in base else cut).append(c['id'] if c['id'] not in base else {'id': c['id'], 'rarity': RARITY[rarity_in(c, code)]})
    name = SET_NAME[codes[0]]
    boosters.append({'key': key, 'code': codes[0], 'name': name, 'date': sets_meta.get(name, {}).get('tcg_date'), 'cards': cards, 'cut': cut})

pool = {str(i): {'name': c['name'], 'tier': first.get(i, ('', 'N', ''))[1], 'set': first.get(i, ('', '', 'OCG'))[2],
                 'date': ocg(c) or ''} for i, c in base.items()}
json.dump(pool, open(f'{POOL}/pool.json', 'w'), ensure_ascii=False)
json.dump(boosters, open(f'{POOL}/boosters.json', 'w'), ensure_ascii=False)

# 5. Texto em português (por id: o language=pt na lista omite quem não tem tradução)
pt = {str(c['id']): {'name': c['name'], 'desc': c['desc']} for c in by_ids(list(base), '&language=pt')}
json.dump(pt, open(f'{IMP}/text.pt.json', 'w'), ensure_ascii=False)

# 6. Números para o relatório
def kind(t):
    if 'Spell' in t: return 'Magias'
    if 'Trap' in t: return 'Armadilhas'
    if 'Fusion' in t: return 'Monstros de Fusão'
    if 'Ritual' in t: return 'Monstros de Ritual'
    if t == 'Normal Monster': return 'Monstros Normais'
    return 'Monstros de Efeito'
stats = {
    'cutoff': CUTOFF, 'total': len(base), 'tokens_excluidas': tokens,
    'por_tipo': dict(Counter(kind(c['type']) for c in base.values())),
    'sem_data_ocg': [[i, info[i]['name']] for i in no_ocg],
    'depois_do_corte': [[i, info[i]['name'], ocg(info[i])] for i in late],
    'sem_portugues': sorted([[i, c['name']] for i, c in base.items() if str(i) not in pt], key=lambda x: x[1]),
    'incluidas': sorted(include), 'da_campanha_fora_do_corte': camp_extra, 'campanha_sem_carta': missing_camp,
    'varias_raridades': sorted({(i, code) for i, code in multi}),
}
json.dump(stats, open(f'{IMP}/stats.json', 'w'), ensure_ascii=False, indent=1)
print(f"{len(base)} cartas (corte {CUTOFF}); {dict(stats['por_tipo'])}")
print(f"sem data OCG: {len(no_ocg)} | depois do corte: {len(late)} | sem português: {len(stats['sem_portugues'])} | campanha fora do corte: {len(camp_extra)}")
for b in boosters: print(f"  {b['code']}: {len(b['cards'])} cartas, {len(b['cut'])} fora do corte")
