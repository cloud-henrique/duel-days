#!/usr/bin/env python3
"""Exporta a base importada para o app: public/data/{cards,pool,boosters,text.pt}.json e public/scripts.json (todos os
scripts Lua), e escreve o relatório da importação em raw/import/report.md.

Só entra carta que o motor consegue rodar: tem script oficial em CardScripts/official, ou é monstro Normal sem efeito.
Os boosters só levam cartas exportadas. O texto em português (raw/import/text.pt.json) recebe por cima as correções de
raw/overrides/text.pt.json ({id: {name?, desc?}}), que valem também para cartas sem tradução.
Requer raw/data/{BabelCDB,CardScripts} (npm run fetch-data) e a importação (python3 scripts/import_dm.py).
"""
import glob, json, os, shutil, sqlite3
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CDB = f'{R}/raw/data/BabelCDB/cards.cdb'; SCR = f'{R}/raw/data/CardScripts'
TOKEN, NORMAL, SPELL, TRAP = 0x4000, 0x10, 0x2, 0x4
pool = json.load(open(f'{R}/raw/pool/pool.json'))
# Cartas que o motor não aguenta (laço/erro no teste em massa): raw/pool/blocklist.json  [passcode, ...]
block = set(json.load(open(f'{R}/raw/pool/blocklist.json'))) if os.path.exists(f'{R}/raw/pool/blocklist.json') else set()
db = sqlite3.connect(CDB)
# Artes alternativas: o YGOPRODeck às vezes lista o id da arte alternativa (ex.: Monster Reborn 83764719), que no banco
# do motor é um `alias` sem script. Todo id vira o da carta original (a mesma regra dos dados da campanha).
def canon(i, name=None):
    r = db.execute('select alias from datas where id=?', (int(i),)).fetchone()
    if r is None and name:  # id que o banco não conhece: procura a carta original pelo nome em inglês
        r2 = db.execute('select d.id from datas d join texts t on t.id=d.id where t.name=? and d.alias=0', (name,)).fetchone()
        return str(r2[0]) if r2 else str(i)
    return str(r[0]) if r and r[0] and db.execute('select 1 from datas where id=?', (r[0],)).fetchone() else str(i)
merged = {}
for id_, meta in pool.items():
    c = canon(id_, meta['name'])
    if c not in merged or id_ == c: merged[c] = {**meta, 'tier': merged.get(c, meta)['tier'] if id_ != c and c in merged else meta['tier']}
pool_names = {i: m['name'] for i, m in pool.items()}
pool = merged
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

# Boosters: só cartas exportadas (as que o motor joga).
boosters_raw = json.load(open(f'{R}/raw/pool/boosters.json')) if os.path.exists(f'{R}/raw/pool/boosters.json') else []
boosters, motor_cut = [], {}
for b in boosters_raw:
    seen, keep = set(), []
    for c in b['cards']:
        i = canon(c['id'], pool_names.get(str(c['id'])))
        if i in tiers and i not in seen: seen.add(i); keep.append({'id': int(i), 'rarity': c['rarity']})
    motor_cut[b['code']] = len(b['cards']) - len(keep)
    if keep: boosters.append({'key': b['key'], 'code': b['code'], 'name': b['name'], 'date': b['date'], 'cards': keep})
json.dump(boosters, open(f'{R}/public/data/boosters.json', 'w'), ensure_ascii=False)

# Texto em português + correções.
pt_raw = json.load(open(f'{R}/raw/import/text.pt.json')) if os.path.exists(f'{R}/raw/import/text.pt.json') else {}
over = json.load(open(f'{R}/raw/overrides/text.pt.json', encoding='utf-8')) if os.path.exists(f'{R}/raw/overrides/text.pt.json') else {}
text = {}
for i, t in pt_raw.items():
    c = canon(i, pool_names.get(i))
    if c in cards and (c not in text or i == c): text[c] = t
orphans = [i for i in over if i not in cards]
for i, t in over.items():
    if i in cards: text[i] = {'name': t.get('name') or text.get(i, cards[i])['name'], 'desc': t.get('desc') or text.get(i, cards[i])['desc']}
json.dump(text, open(f'{R}/public/data/text.pt.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(text), 'textos em português |', len(over), 'correções |', len(boosters), 'boosters')

# Relatório.
st = json.load(open(f'{R}/raw/import/stats.json')) if os.path.exists(f'{R}/raw/import/stats.json') else {}
def lst(rows): return '\n'.join(f'- {" · ".join(map(str, r))}' for r in rows) or '- (nenhuma)'
L = [f"# Relatório da importação (corte OCG {st.get('cutoff', '?')})", '',
     f"Base importada: **{st.get('total', len(pool))}** cartas; exportadas para o jogo: **{len(tiers)}** "
     f"(fichas fora da coleção: {st.get('tokens_excluidas', '?')}).", '', '## Por tipo (base importada)', '',
     *[f'- {k}: {v}' for k, v in sorted(st.get('por_tipo', {}).items(), key=lambda kv: -kv[1])], '',
     '## Boosters TCG', '', '| Caixa | Cartas no jogo | Fora pelo corte | Fora pelo motor |', '|---|---:|---:|---:|',
     *[f"| {b['code']} {b['name']} | {len(b['cards']) - motor_cut[b['code']]} | {len(b['cut'])} | {motor_cut[b['code']]} |" for b in boosters_raw], '',
     f"## Sem suporte do motor ({len(dropped['sem_cdb']) + len(dropped['sem_script']) + len(block)})", '',
     '### Sem script (efeito não implementado)', '', lst([[n] for n in sorted(dropped['sem_script'])]), '',
     '### Fora do banco do motor', '', lst([[n] for n in sorted(dropped['sem_cdb'])]), '',
     '### Bloqueadas (travam o motor: raw/pool/blocklist.json)', '', lst([[i, pool.get(str(i), {}).get('name', '?')] for i in sorted(block)]), '',
     f"## Sem data OCG ({len(st.get('sem_data_ocg', []))}), fora da base (incluir por raw/import/incluir.json)", '', lst(st.get('sem_data_ocg', [])), '',
     f"## Das caixas TCG, com data OCG depois do corte ({len(st.get('depois_do_corte', []))})", '', lst(st.get('depois_do_corte', [])), '',
     f"## Sem tradução em português ({len(st.get('sem_portugues', []))}), aparecem em inglês", '', lst(st.get('sem_portugues', [])), '',
     f"## Correções sem carta ({len(orphans)})", '', lst([[i] for i in orphans]), '',
     f"## Mais de uma raridade na mesma caixa ({len(st.get('varias_raridades', []))}), vale a menor", '',
     lst([[i, c, pool.get(str(i), {}).get('name', '?')] for i, c in st.get('varias_raridades', [])]), '',
     f"## Incluídas à mão (raw/import/incluir.json), nunca em booster ({len(st.get('incluidas', []))})", '',
     lst([[i, pool.get(str(i), {}).get('name', '?')] for i in st.get('incluidas', [])]), '',
     f"## Cartas da campanha fora do corte, incluídas mesmo assim ({len(st.get('da_campanha_fora_do_corte', []))})", '',
     lst([[i, pool.get(str(i), {}).get('name', '?')] for i in st.get('da_campanha_fora_do_corte', [])]), '']
open(f'{R}/raw/import/report.md', 'w', encoding='utf-8').write('\n'.join(L))
print('relatório: raw/import/report.md')
