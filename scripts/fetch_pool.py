#!/usr/bin/env python3
"""Monta o pool da era Duel Monsters: baixa (YGOPRODeck) as cartas de cada caixa principal, starter e structure deck
de 2002 a 2005 e grava raw/pool/pool.json  {id: {name, tier, set}}.

Raridade (tier) = a da primeira impressão dentro dessas caixas:  N comum, R rara, SR super, UR ultra/secret.
Respostas cruas ficam em raw/pool/sets/ (cache); pausa entre requisições.
"""
import hashlib, json, os, time, urllib.parse, urllib.request
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
POOL = f'{R}/raw/pool'
# (código, nome exato da caixa na API)
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
UR = ('Ultra', 'Ultimate', 'Secret', 'Ghost', 'Gold', 'Starlight', 'Collector', 'Platinum')
def tier(r):
    if any(k in r for k in UR): return 'UR'
    if 'Super' in r: return 'SR'
    if 'Rare' in r or 'Starfoil' in r or 'Parallel' in r: return 'R'
    return 'N'
ORDER = {'N': 0, 'R': 1, 'SR': 2, 'UR': 3}
sets = {s['set_name']: s for s in json.load(open(f'{POOL}/sets.json'))}
os.makedirs(f'{POOL}/sets', exist_ok=True)
pool = {}
for code, name in SETS:
    cache = f'{POOL}/sets/{code}.json'
    if not os.path.exists(cache):
        url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=' + urllib.parse.quote(name)
        req = urllib.request.Request(url, headers={'User-Agent': 'personal-pool-fetch'})
        try: data = urllib.request.urlopen(req, timeout=60).read()
        except Exception as e: print('FALHOU', code, name, e); continue
        open(cache, 'wb').write(data); time.sleep(0.4)
    date = sets.get(name, {}).get('tcg_date', '9999')
    for c in json.load(open(cache)).get('data', []):
        entries = [x for x in c.get('card_sets', []) if x['set_name'] == name]
        t = max((tier(x.get('set_rarity', '')) for x in entries), key=ORDER.get) if entries else 'N'
        cur = pool.get(str(c['id']))
        if cur is None or date < cur['date']:   # primeira impressão manda
            pool[str(c['id'])] = {'name': c['name'], 'tier': t, 'set': code, 'date': date}
    print(code, name, len(pool), flush=True)

# Cartas da campanha (dados copiados do app nativo): decks, pacotes, assinaturas e cartas do laço que não vieram das
# caixas acima, com o id que o nativo usa (ex.: o Dark Magician 46986414, e não a arte alternativa).
CAMP = f'{R}/src/campaign/data'
RAR = {'common': 'N', 'rare': 'R', 'super': 'SR', 'ultra': 'UR'}
extra = {}
if os.path.exists(f'{CAMP}/campaign.json'):
    camp = json.load(open(f'{CAMP}/campaign.json'))
    for e in camp['starterDeck']['main']: extra.setdefault(e['id'], ('N', 'CMP'))
    for d in camp['tier']['duelists']:
        for e in d['deck']['main'] + d['deck'].get('extra', []): extra.setdefault(e['id'], ('N', 'CMP'))
        for k in ('signatureCard', 'bondGift'):
            if d.get(k): extra[d[k]['id']] = ('UR', 'CMP')
    for p in json.load(open(f'{CAMP}/packs.json')):
        for c in p['cards']: extra[c['id']] = (RAR[c['rarity']], p['key'].upper())
missing = sorted(i for i in extra if str(i) not in pool)
for i in range(0, len(missing), 40):
    chunk = missing[i:i + 40]
    cache = f'{POOL}/sets/campaign-' + hashlib.md5(','.join(map(str, chunk)).encode()).hexdigest()[:10] + '.json'
    if not os.path.exists(cache):
        url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?id=' + ','.join(map(str, chunk))
        req = urllib.request.Request(url, headers={'User-Agent': 'personal-pool-fetch'})
        open(cache, 'wb').write(urllib.request.urlopen(req, timeout=60).read()); time.sleep(0.4)
    for c in json.load(open(cache)).get('data', []):
        cid = c['id'] if c['id'] in extra else next((im['id'] for im in c.get('card_images', []) if im['id'] in extra), c['id'])
        t, code = extra.get(cid, ('N', 'CMP'))
        pool[str(cid)] = {'name': c['name'], 'tier': t, 'set': code, 'date': '2002-01-01'}
print('campanha:', len(missing), 'cartas a mais')
json.dump(pool, open(f'{POOL}/pool.json', 'w'), ensure_ascii=False)
from collections import Counter
print(len(pool), 'cartas;', dict(Counter(v['tier'] for v in pool.values())))
