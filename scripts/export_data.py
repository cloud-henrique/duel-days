#!/usr/bin/env python3
"""Exporta o pool (raw/pool/pool.json) para o app:  public/data/cards.json, public/data/pool.json e public/scripts.json (todos os scripts Lua).

Só entra carta que o motor consegue rodar: tem script oficial em CardScripts/official, ou é monstro Normal sem efeito.
Requer raw/data/{BabelCDB,CardScripts} (npm run fetch-data) e raw/pool/pool.json (python3 scripts/fetch_pool.py).
"""
import glob, json, os, shutil, sqlite3
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CDB = f'{R}/raw/data/BabelCDB/cards.cdb'; SCR = f'{R}/raw/data/CardScripts'
TOKEN, NORMAL, SPELL, TRAP = 0x4000, 0x10, 0x2, 0x4
pool = json.load(open(f'{R}/raw/pool/pool.json'))
# Cartas que o motor não aguenta (laço/erro no teste em massa): raw/pool/blocklist.json  [passcode, ...]
block = set(json.load(open(f'{R}/raw/pool/blocklist.json'))) if os.path.exists(f'{R}/raw/pool/blocklist.json') else set()
db = sqlite3.connect(CDB)
cards, tiers, dropped = {}, {}, {'sem_cdb': [], 'sem_script': []}
for id_, meta in pool.items():
    if int(id_) in block: continue
    r = db.execute("select d.id,d.alias,d.setcode,d.type,d.atk,d.def,d.level,d.race,d.attribute,t.name,t.desc "
                   "from datas d join texts t on t.id=d.id where d.id=?", (int(id_),)).fetchone()
    if not r: dropped['sem_cdb'].append(meta['name']); continue
    code, alias, sc, ty, atk, df, lv, race, attr, name, desc = r
    if ty & TOKEN: continue
    has_script = os.path.exists(f'{SCR}/official/c{code}.lua')
    vanilla = (ty & NORMAL) and not (ty & (SPELL | TRAP))
    if not has_script and not vanilla: dropped['sem_script'].append(name); continue
    lm = 0
    if ty & 0x4000000: lm, df = df, 0
    cards[str(code)] = dict(code=code, alias=alias, setcodes=[(sc >> (16*i)) & 0xffff for i in range(4) if (sc >> (16*i)) & 0xffff],
        type=ty, level=lv & 0xff, attribute=attr, race=str(race), attack=atk, defense=df,
        lscale=(lv >> 24) & 0xff, rscale=(lv >> 16) & 0xff, link_marker=lm, name=name, desc=desc)
    tiers[str(code)] = meta['tier']
# Fichas (tokens) criadas por efeitos: o motor precisa delas no banco, mas elas não entram no pool/coleção.
for code in list(map(int, cards)):
    for t in range(code + 1, code + 9):
        r = db.execute("select d.id,d.alias,d.setcode,d.type,d.atk,d.def,d.level,d.race,d.attribute,t.name,t.desc "
                       "from datas d join texts t on t.id=d.id where d.id=?", (t,)).fetchone()
        if r and (r[3] & TOKEN) and str(r[0]) not in cards:
            tc, alias, sc, ty, atk, df, lv, race, attr, name, desc = r
            cards[str(tc)] = dict(code=tc, alias=alias, setcodes=[], type=ty, level=lv & 0xff, attribute=attr, race=str(race),
                attack=atk, defense=df, lscale=0, rscale=0, link_marker=0, name=name, desc=desc)
os.makedirs(f'{R}/public/data', exist_ok=True)
json.dump(cards, open(f'{R}/public/data/cards.json', 'w'), ensure_ascii=False)
json.dump(tiers, open(f'{R}/public/data/pool.json', 'w'))
# Todos os scripts num único arquivo (1 requisição em vez de ~1400): {nome: texto}
shutil.rmtree(f'{R}/public/scripts', ignore_errors=True)
bundle = {os.path.basename(f): open(f, encoding='utf-8', errors='replace').read() for f in glob.glob(f'{SCR}/*.lua')}
for c in cards.values():
    s = f"{SCR}/official/c{c['code']}.lua"
    if os.path.exists(s): bundle[f"c{c['code']}.lua"] = open(s, encoding='utf-8', errors='replace').read()
json.dump(bundle, open(f'{R}/public/scripts.json', 'w', encoding='utf-8'), ensure_ascii=False)
from collections import Counter
print(len(cards), 'cartas exportadas de', len(pool), '|', len(bundle), 'scripts |', dict(Counter(tiers.values())))
print('fora do cdb:', len(dropped['sem_cdb']), '| sem script (efeito não implementado):', len(dropped['sem_script']))
