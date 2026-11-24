#!/usr/bin/env python3
"""Busca no YGOPRODeck as receitas "Anime Decks" de cada duelista da campanha e separa as candidatas para o torneio.

A API documentada (v7) não tem decks; o site tem `ygoprodeck.com/api/decks/getDecks.php` (não documentado: `name`,
`format`, `limit` até 20 e `offset`). Só este script o consulta; o jogo usa o `src/campaign/data/decks.json`
versionado, escolhido pelo `proto/deck-pick.ts`.

Para cada duelista: receitas cujo nome bate com o personagem (sem as variantes de outro tier nem as do filme DSoD), ids
de arte alternativa trocados pelo original, e candidatas = as mais vistas entre as que têm ao menos 85% do Main no pool.
Cartas fora do pool viram um "furo" preenchido por outra carta do próprio deck do mesmo tipo (monstro, magia,
armadilha); cópias acima do limite também. Cada troca fica registrada (`swaps`) para revisão.

Saída (fora do git: são receitas de terceiros): raw/decks/recipes.json (tudo) e raw/decks/candidates.json.

Uso: python3 scripts/fetch_deck_recipes.py [--cache] [--only=chave,chave]
  --cache reaproveita o recipes.json já baixado; --only busca e refaz só esses duelistas e mantém os outros no
  recipes.json e no candidates.json (os índices das vencedoras em picks.json continuam valendo).
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'raw/decks'
API = 'https://ygoprodeck.com/api/decks/getDecks.php'
CARDINFO = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
UA = {'User-Agent': 'duel-days/1.0 (projeto pessoal)'}
MIN_COVER, MAX_CANDIDATES = 0.85, 6
LIMITED = {55144522, 12580477, 53129443, 83764718, 44095762, 10000000, 10000010, 10000020}  # src/game/decks.ts (+ Deuses)

# chave do duelista → (termos de busca, nome tem que bater, nome não pode bater)
NOT_ALWAYS = r'dsod|dark side|modern|genesys|202\d|zexal|arc-?v|vrains|sevens|5d|\bgx\b|rush'
CHARACTERS = {
    'tristan': (['Tristan', 'Honda'], r'tristan|honda', r''),
    'tea': (['Tea', 'Téa', 'Anzu'], r'\bt[eé]a\b|anzu', r''),
    'joey': (['Joey', 'Jonouchi'], r'joey|jonouchi|katsuya', r''),
    'bakura': (['Bakura'], r'bakura|ryou?\b', r'yami|thief|zorc|dark bakura'),
    'yugi': (['Yugi'], r'yugi', r'yami|atem|pharaoh|battle city|tag team'),
    'weevil': (['Weevil', 'Haga'], r'weevil|haga', r''),
    'rex': (['Rex', 'Ryuzaki'], r'rex\b|raptor|ryuzaki', r''),
    'mako': (['Mako', 'Kajiki'], r'mako|kajiki', r''),
    'keith': (['Keith'], r'keith', r'posses|marik'),
    'mai': (['Mai', 'Kujaku'], r'\bmai\b|kujaku', r''),
    'pegasus': (['Pegasus'], r'pegasus|pegasus', r'kaiba'),
    # Tier 3 (change `tier3-batalha-da-cidade`)
    'espa': (['Espa Roba', 'Esper Roba'], r'esp[ae]r? ?roba', r''),
    'rarehunter': (['Rare Hunter'], r'rare ?hunter', r'umbra|lumis|strings|pantomim'),  # só o do Exodia
    'arkana': (['Arkana', 'Pandora'], r'arkana|pandora', r''),
    'strings': (['Strings'], r'strings', r''),
    'kaiba': (['Kaiba', 'Seto'], r'kaiba|\bseto\b', r'mokuba|noah|legendary|duelists? kingdom|\bdk\b|1st|pyramid|pegasus|ozzy|gozaburo'),
    # Tier 4 (change tier4-finais). O Yami Bakura e o Yami Yugi não são o Bakura e o Yugi do Tier 1 (e vice-versa).
    'ishizu': (['Ishizu', 'Isis'], r'ishizu|\bisis\b', r''),
    'odion': (['Odion', 'Rishid'], r'odion|rishid', r''),
    'yamibakura': (['Yami Bakura', 'Dark Bakura', 'Thief King'], r'yami bakura|dark bakura|thief king', r'zorc|kul elna|memor'),
    'marik': (['Marik', 'Malik'], r'marik|malik', r'yami|dark|odion|rishid|ishizu|keith|posses'),
    'yamimarik': (['Yami Marik', 'Dark Marik', 'Yami Malik'], r'yami mal?rik|dark mal?rik|yami malik', r''),
    'yamiyugi': (['Yami Yugi', 'Atem', 'Pharaoh'], r'yami yugi|\batem\b|pharaoh', r'memor|world|ceremonial|duelists? kingdom|\bdk\b|tag|pyramid|zorc'),
}


def get(url: str):
    req = urllib.request.Request(url, headers=UA)
    return json.load(urllib.request.urlopen(req, timeout=30))


def fetch_all(keys) -> dict:
    terms = sorted({t for k in keys for t in CHARACTERS[k][0]})
    out = {}
    for t in terms:
        decks = []
        for page in range(15):
            q = urllib.parse.urlencode({'name': t, 'format': 'Anime Decks', 'limit': 20, 'offset': page * 20})
            try:
                d = get(f'{API}?{q}')
            except Exception as e:  # noqa: BLE001
                print(f'  {t} p{page}: {e}')
                break
            if not d:
                break
            decks += [{k: x.get(k) for k in ('deck_name', 'main_deck', 'extra_deck', 'deck_views', 'pretty_url', 'deckNum')}
                      for x in d]
            time.sleep(0.4)
            if len(d) < 20:
                break
        out[t] = decks
        print(f'  {t}: {len(decks)} receitas', flush=True)
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    raw_file = OUT / 'recipes.json'
    only = next((a.split('=', 1)[1].split(',') for a in sys.argv if a.startswith('--only=')), None)
    keys = only or list(CHARACTERS)
    if '--cache' in sys.argv and raw_file.exists():
        raw = json.loads(raw_file.read_text())
    else:
        raw = json.loads(raw_file.read_text()) if only and raw_file.exists() else {}
        raw.update(fetch_all(keys))
        raw_file.write_text(json.dumps(raw))

    cards = json.loads((ROOT / 'public/data/cards.json').read_text())
    era = json.loads((ROOT / 'raw/import/era.json').read_text())
    era = era['data'] if 'data' in era else next(iter(era.values()))
    # Cada id (principal ou de arte) → o id que existe no cards.json (o YGOPRODeck às vezes usa a arte alternativa como
    # principal, ex.: Monster Reborn 83764719, e o pool tem o original 83764718).
    canon = {}
    for c in era:
        ids = [c['id'], *(im['id'] for im in c.get('card_images', []))]
        target = next((i for i in ids if str(i) in cards), c['id'])
        for i in ids:
            canon[i] = target
    for k, v in cards.items():
        canon[int(k)] = int(k)
        if v.get('alias') and str(v['alias']) in cards:
            canon.setdefault(int(v['alias']), int(v['alias']))

    def norm(i):
        c = canon.get(int(i))
        return c if c is not None and str(c) in cards else None

    kind = lambda cid: 'monster' if cards[str(cid)]['type'] & 1 else 'spell' if cards[str(cid)]['type'] & 2 else 'trap'
    is_extra = lambda cid: (cards[str(cid)]['type'] & (0x40 | 0x2000 | 0x800000 | 0x4000000)) != 0

    names_needed: set[int] = set()
    chosen = {}
    for key in keys:
        terms, must, mustnt = CHARACTERS[key]
        seen, rows = set(), []
        for t in terms:
            for d in raw.get(t, []):
                name = d['deck_name'] or ''
                if d['deckNum'] in seen or not re.search(must, name, re.I):
                    continue
                if re.search(NOT_ALWAYS, name, re.I) or (mustnt and re.search(mustnt, name, re.I)):
                    continue
                seen.add(d['deckNum'])
                main = [int(x) for x in json.loads(d['main_deck'] or '[]')]
                extra = [int(x) for x in json.loads(d['extra_deck'] or '[]')]
                if len(main) < 40:
                    continue
                cover = sum(1 for i in main if norm(i)) / len(main)
                if cover >= MIN_COVER:
                    rows.append((cover, d, main, extra))
        rows.sort(key=lambda r: -(r[1]['deck_views'] or 0))
        chosen[key] = rows[:MAX_CANDIDATES]
        for _, _, main, extra in chosen[key]:
            names_needed |= {i for i in main + extra if not norm(i)}
        print(f'{key}: {len(rows)} receitas com ≥{MIN_COVER:.0%} no pool → {len(chosen[key])} candidatas')

    # Nome e tipo das cartas fora do pool (para o furo e para o relatório).
    info = {}
    ids = sorted(names_needed)
    for i in range(0, len(ids), 40):
        try:
            for c in get(f'{CARDINFO}?id={",".join(map(str, ids[i:i + 40]))}')['data']:
                for im in c.get('card_images', [{'id': c['id']}]):
                    info[im['id']] = (c['name'], c['type'])
        except Exception as e:  # noqa: BLE001
            print('  cardinfo:', e)
        time.sleep(0.2)

    def fix(main_raw, extra_raw):
        """Deck jogável: ids canônicos, extra no Extra, cópias no limite e furos preenchidos dentro do próprio deck."""
        swaps, main, extra, holes = [], [], [], []
        for i in main_raw + extra_raw:
            c = norm(i)
            if c is None:
                nm, tp = info.get(i, (str(i), ''))
                if any(x in tp for x in ('Fusion', 'Synchro', 'XYZ', 'Link')):
                    swaps.append({'out': nm, 'in': None, 'why': 'fora do pool (Extra, sem troca)'})
                    continue
                holes.append(('monster' if 'Monster' in tp else 'spell' if 'Spell' in tp else 'trap', nm))
                continue
            (extra if is_extra(c) else main).append(c)
        cnt = Counter(main)
        for c, n in list(cnt.items()):
            cap = 1 if c in LIMITED else 3
            for _ in range(n - cap):
                main.remove(c)
                holes.append((kind(c), f'{cards[str(c)]["name"]} (cópia acima do limite)'))
        extra = list(dict.fromkeys(extra))[:15] if len(set(extra)) != len(extra) else extra[:15]
        for k, nm in holes:
            cnt = Counter(main)
            pool = [c for c in cnt if kind(c) == k and cnt[c] < (1 if c in LIMITED else 3)] or \
                   [c for c in cnt if cnt[c] < (1 if c in LIMITED else 3)]
            pool.sort(key=lambda c: -cnt[c])
            if pool:
                main.append(pool[0])
                swaps.append({'out': nm, 'in': cards[str(pool[0])]['name'], 'id': pool[0], 'why': 'furo preenchido'})
        while len(main) < 40:  # Main que ficou curto (ex.: fusões que estavam no Main foram para o Extra)
            cnt = Counter(main)
            room = [c for c in cnt if cnt[c] < (1 if c in LIMITED else 3)]
            if not room:
                return None  # todas no limite: a receita não fecha 40 sem cartas de fora
            c = max(room, key=lambda c: cnt[c])
            main.append(c)
            swaps.append({'out': None, 'in': cards[str(c)]['name'], 'id': c, 'why': 'Main com menos de 40'})
        return main, extra, swaps

    cand_file = OUT / 'candidates.json'
    out = json.loads(cand_file.read_text()) if only and cand_file.exists() else {}
    for key, rows in chosen.items():
        out[key] = []
        for cover, d, main_raw, extra_raw in rows:
            fixed = fix(main_raw, extra_raw)
            if fixed is None:
                print(f'  {key}: "{d["deck_name"]}" descartada (não fecha 40 cartas)')
                continue
            main, extra, swaps = fixed
            out[key].append({'name': d['deck_name'], 'url': f'https://ygoprodeck.com/deck/{d["pretty_url"]}',
                             'views': d['deck_views'], 'cover': round(cover, 3), 'main': main, 'extra': extra, 'swaps': swaps})
    (OUT / 'candidates.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f'ok → {(OUT / "candidates.json").relative_to(ROOT)}')


if __name__ == '__main__':
    main()
