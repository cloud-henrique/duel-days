#!/usr/bin/env python3
"""Grava src/campaign/data/decks.json com a receita vencedora de cada duelista (raw/decks/picks.json, do
proto/deck-pick.ts, sobre raw/decks/candidates.json, do scripts/fetch_deck_recipes.py).

O fetch preenche cada carta fora do pool com outra do próprio deck (para o torneio rodar). Aqui, depois de revisar, cada
furo pode ganhar uma troca melhor em REPLACE (carta que faltava → id da era com o mesmo papel); o comentário da entrada
diz o que foi trocado. O arquivo final é versionado: só ids, nomes, a URL da receita e os comentários.

Uso: python3 scripts/build_decks.py [--provisorio] && python3 scripts/copy_campaign_data.py
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'raw/decks'
OUT = ROOT / 'src/campaign/data/decks.json'

# duelista → {nome da carta fora do pool: id da carta da era que entra no lugar}. Revisado à mão (ver o relatório).
REPLACE: dict[str, dict[str, int]] = {
    'tristan': {
        'Battle Fusion': 70046172,                         # Rush Recklessly: Magia Rápida de ATK, como a Battle Fusion
        'Pot of Greed (cópia acima do limite)': 79571449,  # Graceful Charity: compra, no lugar da 2ª Pot (limitada)
    },
    'joey': {
        'Gearfried the Swordmaster': 423705,  # Gearfried the Iron Knight: o Gearfried da era
        'Release Restraint': 74137509,        # Graceful Dice: a sorte do Joey
        'Roulette Spider': 126218,            # Skull Dice: armadilha de sorte do Joey
    },
    'bakura': {
        'Dark Sanctuary': 59197169,           # Yami: o Campo sombrio da era
        'Multiple Destruction': 12607053,     # Waboku: protege enquanto o Destiny Board avança
    },
    'yugi': {
        'Electromagnetic Turtle': 40640057,   # Kuriboh: proteção contra ataque, a carta do Yugi
        'Bond Between Teacher and Student': 99789342,  # Dark Magic Curtain: invoca o Mago Negro
        'Black Illusion': 81210420,           # Magical Hats: armadilha do Yugi
        'Dark Renewal': 35563539,             # Mystical Refpanel: armadilha de Magia da era
    },
    'rex': {
        'Monster Reborn (cópia acima do limite)': 97077563,  # Call of the Haunted: revive, no lugar do 2º Reborn
    },
    'mako': {
        'Gogiga Gagagigo': 49003308,          # Gagagigo: o Gagagigo da era
    },
    'keith': {
        'Monster Reborn (cópia acima do limite)': 97077563,  # Call of the Haunted
        'Pot of Greed (cópia acima do limite)': 79571449,    # Graceful Charity
    },
    'mai': {
        'Cyber Harpie Lady': 76812113,        # Harpie Lady (a Cyber é tratada como Harpie Lady)
        'Amazoness Trainee': 45547649,        # Birdface: Besta Alada que busca a Harpie Lady
        'Harpie Dancer': 45547649,            # Birdface
    },
    'pegasus': {
        'Card of Sanctity': 79571449,         # Graceful Charity: compra
        'Toon World (cópia acima do limite)': 95492061,  # Manju of the Ten Thousand Hands: busca o Ritual (Toon Table já está em 3)
    },
}

# Ajustes de força depois da receita, para o cenário "Chefe mais forte" (o chefe vence a maioria contra os comuns do
# tier no proto/tier-balance.ts): duelista → [(id que sai, id que entra, motivo)]. Cada um vira comentário no deck.
TUNE: dict[str, list[tuple[int, int, str]]] = {
    # O Ritual (Black Illusion Ritual) e o Ultimate Offering quase nunca saem com a CPU, e o Jar of Greed pouco faz: no
    # lugar, cartas fortes da era que combinam com o controle de mente do Pegasus (antes: 46% contra os comuns do T2).
    'pegasus': [
        (41426869, 4031928, 'Change of Heart no lugar do Black Illusion Ritual (a CPU não monta o Ritual)'),
        (80604091, 44095762, 'Mirror Force no lugar do Ultimate Offering'),
        (83968380, 12580477, 'Raigeki no lugar de um Jar of Greed'),
        (83968380, 53129443, 'Dark Hole no lugar de um Jar of Greed'),
    ],
}


def main() -> None:
    cards = json.loads((ROOT / 'public/data/cards.json').read_text())
    cands = json.loads((RAW / 'candidates.json').read_text())
    picks = json.loads((RAW / 'picks.json').read_text()) if (RAW / 'picks.json').exists() else {}
    if '--provisorio' in sys.argv:  # torneio ainda rodando: a candidata mais vista onde não há vencedora
        for key in cands:
            picks.setdefault(key, {'index': 0, 'name': cands[key][0]['name'], 'url': cands[key][0]['url'], 'rate': None})
    name = lambda i: cards[str(i)]['name']
    out = {}
    for key, p in picks.items():
        c = cands[key][p['index']]
        main = list(c['main'])
        notes: dict[int, list[str]] = {}
        for sw in c['swaps']:
            if sw.get('id') is None:
                continue
            repl = REPLACE.get(key, {}).get(sw['out'] or '')
            if repl is not None:
                main.remove(sw['id'])
                main.append(repl)
                notes.setdefault(repl, []).append(f'no lugar de {sw["out"]} (fora da era)')
            elif sw['out']:
                notes.setdefault(sw['id'], []).append(f'+1 no lugar de {sw["out"]}')
            else:
                notes.setdefault(sw['id'], []).append('+1 para fechar 40')

        for out_id, in_id, why in TUNE.get(key, []):
            main.remove(out_id)
            main.append(in_id)
            notes.setdefault(in_id, []).append(why)

        def entries(ids):
            return [{'id': i, 'count': n, 'comment': '; '.join([name(i), *notes.get(i, [])])}
                    for i, n in Counter(ids).items()]

        out[key] = {
            'name': f'{c["name"]}'.replace('<br>', ' ').strip(),
            'source': c['url'],
            'winRate': p['rate'],
            'main': entries(main),
            'extra': entries(c['extra']),
        }
        total = len(main)
        if total < 40:
            sys.exit(f'{key}: Main com {total}')
    OUT.write_text(json.dumps({
        '_comment': 'Gerado por scripts/build_decks.py: a receita "Anime Decks" do YGOPRODeck que venceu o torneio do '
                    'proto/deck-pick.ts para cada duelista (source = receita original; winRate = taxa no torneio).',
        'decks': out,
    }, ensure_ascii=False, indent=1) + '\n')
    print(f'ok: {len(out)} decks → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
