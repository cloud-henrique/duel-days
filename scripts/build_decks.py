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
    },
}

# Reforço de cada deck (change `cpu-estrategica`): com a CPU nova dos dois lados, as receitas de anime perdiam para o
# deck inicial (combos que não saem, cartas de efeito fraco). Duelista → [(nome que sai, nome que entra, motivo)], dentro
# do tema do personagem; a meta de cada um contra o deck inicial está no proto/difficulty.ts (Tier 1 ~55%, Tier 2 ~70%,
# chefes ~85%). Cada troca vira comentário no deck.
TUNE: dict[str, list[tuple[str, str, str]]] = {
    'tristan': [
        ('Robolady', 'Marauding Captain', 'guerreiro de nível 4 que traz outro'),
    ],
    'bakura': [
        ('Spirit Message "L"', 'Ryu Kokki', 'as Spirit Messages só servem ao Destiny Board, que quase nunca completa'),
        ('Spirit Message "A"', 'Archfiend Soldier', 'idem'),
        ('Spirit Message "N"', 'Archfiend Soldier', 'idem'),
        ('Spirit Message "I"', 'Spirit Reaper', 'idem'),
        ('Destiny Board', 'Pyramid Turtle', 'idem'),
        ('Jowgen the Spiritualist', 'Sakuretsu Armor', 'efeito fraco no deck'),
        ('Puppet Master', 'Trap Hole', 'nível 6 de 0 ATK'),
    ],
    'yugi': [
        ('Multiply', 'Change of Heart', 'combo com o Kuriboh, que a CPU quase nunca monta'),
        ('Kuriboh', 'Sakuretsu Armor', 'idem'),
        ('Sage\'s Stone', 'Raigeki', 'só com a Maga Negra em campo'),
        ('Berfomet', 'Sakuretsu Armor', 'nível 5 de 1400; a Fusão quase nunca sai'),
        ('Polymerization', 'Trap Hole', 'a Fusão quase nunca sai'),
    ],
    'weevil': [
        ('Parasite Paracide', 'Girochin Kuwagata', 'inseto de 1700'),
        ('Parasite Paracide', 'Girochin Kuwagata', 'idem'),
        ('Petit Moth', 'Man-Eater Bug', 'a evolução da Moth leva turnos que a CPU não espera'),
        ('Cocoon of Evolution', 'Man-Eater Bug', 'idem'),
        ('Cocoon of Evolution', 'Flying Kamakiri #1', 'idem'),
        ('Perfectly Ultimate Great Moth', 'Insect Princess', 'idem'),
        ('Great Moth', 'Mirror Force', 'idem'),
        ('Kiseitai', 'Raigeki', 'efeito fraco'),
        ('Leghul', 'Change of Heart', 'atacante de 300'),
        ('Needle Worm', 'Sakuretsu Armor', 'efeito lento'),
        ('Insect Barrier', 'Sakuretsu Armor', 'só barra insetos'),
        ('Insect Barrier', 'Trap Hole', 'idem'),
        ('Jade Insect Whistle', 'Trap Hole', 'efeito fraco'),
        ('Insect Imitation', 'Torrential Tribute', 'combo que a CPU não monta'),
        ('Laser Cannon Armor', 'Magic Cylinder', 'repete o Insect Armor'),
        ('Multiplication of Ants', 'Shrink', 'efeito fraco'),
        ('Skull-Mark Ladybug', 'Smashing Ground', 'atacante de 500'),
        ('Cockroach Knight', 'Swords of Revealing Light', 'atacante de 800'),
    ],
    'rex': [
        ('Tomozaurus', 'Spear Dragon', 'dragão de nível 4 com perfuração'),
        ('Tomozaurus', 'Spear Dragon', 'idem'),
        ('Little D', 'Luster Dragon', 'dragão de 1900'),
        ('Trakodon', 'Luster Dragon', 'idem'),
        ('Trakodon', 'Mad Sword Beast', 'dinossauro com perfuração'),
        ('Crawling Dragon', 'Mad Sword Beast', 'nível 5 de 1600 pede tributo'),
        ('Crawling Dragon', 'Gilasaurus', 'dinossauro rápido'),
        ('Sword Arm of Dragon', 'Black Tyranno', 'dinossauro de 2600'),
        ('Terraforming', 'Sakuretsu Armor', 'a Wasteland já está em 3'),
        ('Terraforming', 'Sakuretsu Armor', 'idem'),
        ('Raise Body Heat', 'Trap Hole', 'efeito fraco'),
        ('Raise Body Heat', 'Trap Hole', 'idem'),
        ('Polymerization', 'Fissure', 'Fusões quase nunca saem'),
    ],
    'mako': [
        ('Mystic Lamp', 'Kaiser Sea Horse', 'serpente marinha de 1700'),
        ('Yormungarde', 'Kaiser Sea Horse', 'idem'),
        ('Gruesome Goo', 'Amphibious Bugroth MK-3', 'ataque direto com Umi'),
        ('Sea Kamen', 'Amphibious Bugroth MK-3', 'idem'),
        ('Jellyfish', 'Penguin Soldier', 'efeito de devolver'),
        ('Fiend Kraken', 'Levia-Dragon - Daedalus', 'limpa o campo com Umi'),
        ('Terraforming', 'Sakuretsu Armor', 'o Umi já está em 3'),
        ('Terraforming', 'Sakuretsu Armor', 'idem'),
        ('Salvage', 'Trap Hole', 'efeito lento'),
        ('Salvage', 'Trap Hole', 'idem'),
        ('Power of Kaishin', 'Torrential Tribute', 'efeito fraco'),
    ],
    'keith': [
        ('Zera Ritual', 'Jinzo', 'o Ritual quase nunca sai'),
        ('Zera the Mant', 'X-Head Cannon', 'idem'),
        ('7 Completed', 'X-Head Cannon', 'efeito fraco'),
        ('7 Completed', 'Robotic Knight', 'idem'),
        ('7 Completed', 'Robotic Knight', 'idem'),
        ('Curse of Fiend', 'Mechanicalchaser', 'efeito fraco'),
        ('Curse of Fiend', 'Cannon Soldier', 'idem'),
        ('Pendulum Machine', 'Sakuretsu Armor', 'nível 6 de 1750 pede tributo'),
        ('Slot Machine', 'Sakuretsu Armor', 'nível 7 de 2000 pede dois tributos'),
        ('Giganto', 'Trap Hole', 'nível 5 de 1700 pede tributo'),
        ('Gatekeeper', 'Torrential Tribute', 'nível 5 de 1500 pede tributo'),
    ],
    'mai': [
        ('Dramatic Rescue', 'Amazoness Paladin', 'efeito que quase nunca vale'),
        ('Dramatic Rescue', 'Amazoness Paladin', 'idem'),
        ('Dramatic Rescue', 'Raigeki', 'idem'),
        ('Amazoness Spellcaster', 'Change of Heart', 'efeito fraco'),
        ('Amazoness Spellcaster', 'Mirror Force', 'idem'),
        ('Elegant Egotist', 'Sakuretsu Armor', 'três é demais'),
        ('Mirror Wall', 'Trap Hole', 'três é demais'),
    ],
    'pegasus': [
        ('Relinquished', 'Change of Heart', 'o Ritual quase nunca sai com a CPU'),
        ('Black Illusion Ritual', 'Raigeki', 'idem'),
        ('Thousand-Eyes Idol', 'Mirror Force', 'a Fusão quase nunca sai'),
        ('Polymerization', 'Magic Cylinder', 'idem'),
        ('Manju of the Ten Thousand Hands', 'Magic Cylinder', 'buscava o Ritual'),
        ('Jar of Greed', 'Sakuretsu Armor', 'efeito fraco'),
        ('Jar of Greed', 'Sakuretsu Armor', 'idem'),
        ('Ultimate Offering', 'Trap Hole', 'idem'),
        ('Cost Down', 'Trap Hole', 'idem'),
        ('Toon Alligator', 'Swords of Revealing Light', 'atacante de 800'),
        ('Heavy Storm', 'Torrential Tribute', 'três Heavy Storm destroem o próprio Toon World'),
        ('Heavy Storm', 'Book of Moon', 'idem'),
        ('Toon Masked Sorcerer', 'Snatch Steal', 'Toon de 900'),
        ('Toon Masked Sorcerer', 'Nobleman of Crossout', 'idem'),
        ('Toon Defense', 'Ring of Destruction', 'efeito fraco'),
        ('Premature Burial', 'Smashing Ground', 'o segundo quase nunca tem alvo'),
        ('Toon Cannon Soldier', 'Summoned Skull', 'Toon de 1400 que depende do Toon World'),
        ('Toon Mermaid', 'Gemini Elf', 'idem'),
        ('Manga Ryu-Ran', 'Gemini Elf', 'nível 7: dois tributos e o Toon World'),
        ('Manga Ryu-Ran', 'Vorse Raider', 'idem'),
        ('Blue-Eyes Toon Dragon', 'Archfiend Soldier', 'nível 8: dois tributos e o Toon World'),
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
    pool = json.loads((ROOT / 'public/data/pool.json').read_text())
    by_name = {cards[i]['name']: int(i) for i in pool if i in cards}
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

        for out_name, in_name, why in TUNE.get(key, []):
            out_id = next((i for i in main if cards[str(i)]['name'] == out_name), None)
            if out_id is None:
                sys.exit(f'{key}: TUNE tira {out_name!r}, que não está no deck')
            in_id = by_name.get(in_name)
            if in_id is None:
                sys.exit(f'{key}: TUNE põe {in_name!r}, que não está no pool')
            main.remove(out_id)
            main.append(in_id)
            notes.setdefault(in_id, []).append(f'no lugar de {out_name}: {why}')

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
