#!/usr/bin/env python3
"""Grava src/campaign/data/decks.json com a receita vencedora de cada duelista (raw/decks/picks.json, do
proto/deck-pick.ts, sobre raw/decks/candidates.json, do scripts/fetch_deck_recipes.py).

O fetch preenche cada carta fora do pool com outra do próprio deck (para o torneio rodar). Aqui, depois de revisar, cada
furo pode ganhar uma troca melhor em REPLACE (carta que faltava → id da era com o mesmo papel); o comentário da entrada
diz o que foi trocado. O arquivo final é versionado: só ids, nomes, a URL da receita e os comentários.

Speed Duel (change speed-duel): depois das trocas, o deck é cortado para 30 cartas no principal e 5 no Extra por `cut`
(regra fixa, abaixo). A assinatura do duelista (`signatureCard` da campanha) e as cartas do KEEP nunca saem. O torneio
roda sobre as candidatas já cortadas: `--candidatas` grava raw/decks/candidates-speed.json para o proto/deck-pick.ts.

Uso: python3 scripts/build_decks.py --candidatas && npx tsx proto/deck-pick.ts 12
     python3 scripts/build_decks.py [--provisorio] && python3 scripts/copy_campaign_data.py
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'raw/decks'
OUT = ROOT / 'src/campaign/data/decks.json'
MAIN_MAX, EXTRA_MAX = 30, 5  # Speed Duel (src/game/format.ts)

# duelista → nomes de cartas que o corte para 30 nunca tira (além da assinatura): a condição de vitória do deck.
KEEP: dict[str, list[str]] = {
    'rarehunter': ['Exodia the Forbidden One', 'Right Arm of the Forbidden One', 'Left Arm of the Forbidden One',
                   'Right Leg of the Forbidden One', 'Left Leg of the Forbidden One', 'Pot of Greed', 'Jar of Greed'],
}
# duelista → nomes de cartas de que o corte não tira nenhuma cópia. O Rare Hunter: com só 2 cópias de cada peça do Exodia
# em 30 cartas, o deck acabava antes de juntar as 5 (25–40% contra a meta de 78%).
KEEP_ALL: dict[str, list[str]] = {
    'rarehunter': ['Exodia the Forbidden One', 'Right Arm of the Forbidden One', 'Left Arm of the Forbidden One',
                   'Right Leg of the Forbidden One', 'Left Leg of the Forbidden One'],
}

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
    'rarehunter': {
        'Obliterate!!!': 26202165,                   # Sangan: busca uma peça do Exodia (o Obliterate!!! é da era GX)
        'The Legendary Exodia Incarnate': 78010363,  # Witch of the Black Forest: idem
    },
}

# Lista final escrita à mão (change speed-duel), para o deck cuja composição a regra de corte não acerta: substitui o
# principal depois do REPLACE/TUNE/corte; cada entrada vira comentário. O Rare Hunter (Exodia): com o corte, ficava em
# 40–53% contra a meta de 78% (muralhas cortadas; trava de armadilhas contínuas deu 15%, a CPU as usa mal). Fica: as 15
# peças, 9 muralhas de DEF 2000+ (os atacantes do deck inicial têm 1400–2100), 4 de compra e 2 de proteção. Com a CPU
# guardando as peças (`EXODIA_PIECES`): 8 muralhas e 4 de compra deram 63%; 7 e 6, 53%.
FINAL: dict[str, list[tuple[str, int, str]]] = {
    'rarehunter': [
        ('Exodia the Forbidden One', 3, 'peça do Exodia'), ('Right Arm of the Forbidden One', 3, 'idem'),
        ('Left Arm of the Forbidden One', 3, 'idem'), ('Right Leg of the Forbidden One', 3, 'idem'),
        ('Left Leg of the Forbidden One', 3, 'idem'),
        ('Big Shield Gardna', 3, 'muralha de 2600 de DEF'), ('Marshmallon', 2, 'não é destruído em batalha'),
        ('Gear Golem the Moving Fortress', 3, 'muralha de 2200'), ('Stone Statue of the Aztecs', 1, 'muralha de 2000'),
        ('Pot of Greed', 1, 'compra'), ('Upstart Goblin', 2, 'compra'), ('Graceful Charity', 1, 'compra'),
        ('Messenger of Peace', 1, 'ATK 1500 ou mais não ataca'), ('Swords of Revealing Light', 1, 'três turnos sem ataque'),
    ],
}

# Reforço de cada deck (change `cpu-estrategica`): com a CPU nova dos dois lados, as receitas de anime perdiam para o
# deck inicial (combos que não saem, cartas de efeito fraco). Duelista → [(nome que sai, nome que entra, motivo)], dentro
# do tema do personagem; a meta de cada um contra o deck inicial está no proto/difficulty.ts (Tier 1 ~55%, Tier 2 ~70%,
# chefes ~85%). Cada troca vira comentário no deck.
TUNE: dict[str, list[tuple[str, str, str]]] = {
    'tristan': [
        ('Robolady', 'Marauding Captain', 'guerreiro de nível 4 que traz outro'),
        # No lugar do Science Soldier (800), o deck foi de 57% a 70%: troca por outro monstro grande de tributo.
        ('Sword Hunter', 'Sengenjin', 'a carta-assinatura do Tristan (a receita escolhida não tinha)'),
        ('Axe of Despair', 'Science Soldier', 'compensa o Sengenjin: só com ele, o deck foi de 57% a 70%'),
        # Speed Duel (change speed-duel): 43% contra a meta de 55%; a Fusão quase nunca sai e há atacantes de 450 a 900
        ('Fusion Weapon', 'Sakuretsu Armor', 'só serve à Fusão, que a CPU quase nunca faz'),
        ('Fusion Weapon', 'Trap Hole', 'idem'),
        ('Polymerization', 'Gearfried the Iron Knight', 'a Fusão quase nunca sai; guerreiro de 1800'),
        ('Cyber Commander', 'Mechanicalchaser', 'máquina de 1850 no lugar de 750'),
    ],
    'joey': [  # Speed Duel (change speed-duel): 35% contra a meta de 55%; atacantes de 500 a 700 e cartas de sorte demais
        ('Swordsman of Landstar', 'Axe Raider', 'guerreiro de 1700 no lugar de 500'),
        ('Battle Warrior', 'Gearfried the Iron Knight', 'guerreiro de 1800 no lugar de 700'),
        ('Gamble', 'Sakuretsu Armor', 'sorte demais; ficam os dados (Graceful e Skull Dice)'),
        ('Polymerization', 'Trap Hole', 'a Fusão quase nunca sai'),
        ('Shield & Sword', 'Mirror Force', 'efeito fraco'),
        ('Stray Lambs', 'Dark Hole', 'efeito fraco'),
    ],
    'bakura': [
        ('Spirit Message "L"', 'Ryu Kokki', 'as Spirit Messages só servem ao Destiny Board, que quase nunca completa'),
        ('Spirit Message "A"', 'Archfiend Soldier', 'idem'),
        ('Spirit Message "N"', 'Archfiend Soldier', 'idem'),
        ('Spirit Message "I"', 'Spirit Reaper', 'idem'),
        ('Destiny Board', 'Pyramid Turtle', 'idem'),
        ('Jowgen the Spiritualist', 'Sakuretsu Armor', 'efeito fraco no deck'),
        ('Puppet Master', 'Trap Hole', 'nível 6 de 0 ATK'),
        # No lugar do Souls of the Forgotten (900), o deck foi de 63% a 73%: troca remoção por remoção.
        ('Sakuretsu Armor', 'Man-Eater Bug', 'a carta-assinatura do Bakura (a receita escolhida não tinha)'),
    ],
    'yugi': [
        ('Multiply', 'Change of Heart', 'combo com o Kuriboh, que a CPU quase nunca monta'),
        ('Kuriboh', 'Sakuretsu Armor', 'idem'),
        ('Sage\'s Stone', 'Raigeki', 'só com a Maga Negra em campo'),
        ('Berfomet', 'Sakuretsu Armor', 'nível 5 de 1400; a Fusão quase nunca sai'),
        ('Polymerization', 'Trap Hole', 'a Fusão quase nunca sai'),
        # Speed Duel (change speed-duel): em 30 cartas, monstros de tributo demais (68% contra a meta de 85%)
        ('Valkyrion the Magna Warrior', 'Breaker the Magical Warrior', 'pede os três Magnet: no Speed quase nunca sai'),
        ('Archfiend of Gilfer', 'Skilled Dark Magician', 'nível 6: monstro de tributo demais em 30 cartas'),
        ("Jack's Knight", "Magician's Valkyria", 'nível 5 de 1900 pede tributo'),
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
        ('Behegon', 'The Legendary Fisherman', 'a carta-assinatura do Mako (a receita escolhida não tinha); combina com os 3 Umi'),
        # Speed Duel: 55% contra a meta de 70%
        ('Polymerization', 'Dark Hole', 'a Fusão quase nunca sai'),
        ('Polymerization', 'Fissure', 'idem'),
        ('Jellyfish', 'Giant Red Seasnake', 'aqua de 1800 no lugar de 1200'),
        ('Fiend Kraken', 'Gagagigo', 'réptil de 1850 no lugar de 1200'),
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
        # Speed Duel: 45% contra a meta de 70%; sete monstros de tributo em 30 cartas
        ('Garnecia Elefantis', 'Ground Attacker Bugroth', 'nível 7: monstro de tributo demais em 30 cartas'),
        ('Launcher Spider', 'Mechanicalchaser', 'idem'),
        ('Stop Defense', 'Dark Hole', 'efeito fraco'),
        ('Magic Jammer', 'Mirror Force', 'a CPU quase nunca guarda a resposta'),
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
    # Tier 3 (change `tier3-batalha-da-cidade`)
    'strings': [  # receita de Fusão e combos de Slime: 8% contra o deck inicial; fica o Revival Jam com aqua e répteis
        ('Jam Breeding Machine', 'Swords of Revealing Light', 'a CPU não espera os Slimes da máquina'),
        ('Infinite Cards', 'Jam Defender', 'efeito fraco; o 3º Jam Defender protege o Revival Jam'),
        ('Behegon', 'Gagagigo', 'aqua/réptil de 1850 no lugar de 1350'),
        ('Gruesome Goo', 'Gagagigo', 'idem'),
        ('Liquid Beast', 'Giant Red Seasnake', 'aqua de 1800'),
        ('Change Slime', 'Giant Red Seasnake', 'idem'),
        ('Humanoid Slime', 'Mirror Force', 'a Fusão com o Worm Drake quase nunca sai'),
        ('Humanoid Slime', 'Sakuretsu Armor', 'idem'),
        ('Worm Drake', 'Torrential Tribute', 'idem'),
        ('Worm Drake', 'Trap Hole', 'idem'),
        ('Polymerization', 'Dark Hole', 'a Fusão quase nunca sai'),
        ('Polymerization', 'Change of Heart', 'idem'),
        ('Polymerization', 'Trap Hole', 'idem'),
        ('Fusion Sage', 'Mystical Space Typhoon', 'idem'),
        ('Ameba', 'Penguin Soldier', 'combo com a Creature Swap que a CPU não monta'),
        ('Ameba', 'Penguin Soldier', 'idem'),
        ('Mucus Yolk', 'Granadora', 'aqua/réptil de 1900'),
        ('Return of the Doomed', 'Call of the Haunted', 'revive o Slime e os aqua'),
        ('Emergency Provisions', 'Magic Cylinder', 'efeito fraco'),
        ('Ekibyo Drakmord', 'Shrink', 'efeito lento'),
        ('Senri Eye', 'Nobleman of Crossout', 'efeito fraco'),
        ('Mass Driver', 'Smashing Ground', 'depende do combo do Revival Jam'),
        # 2ª rodada (57% com as trocas acima; com mais monstros e o Levia/Snatch Steal foi a 90–93%)
        ('Card of Safe Return', 'Book of Moon', 'só compra com monstro revivido'),
        ("Nightmare's Steelcage", 'Magic Cylinder', 'só adia'),
        ("Nightmare's Steelcage", 'Waboku', 'idem'),
        ('Jar of Greed', 'Graceful Charity', 'compra mais'),
    ],
    'kaiba': [  # 50% contra o deck inicial; meta de chefe 85%
        ('Cost Down', 'Dark Hole', 'a CPU quase nunca aproveita o Cost Down'),
        ('Cost Down', 'Raigeki', 'idem'),
        ('Cost Down', 'Change of Heart', 'idem'),
        ('The Flute of Summoning Dragon', 'Mirror Force', 'combo com o Lord of D. que a CPU raramente monta; fica 1'),
        ('The Flute of Summoning Dragon', 'Trap Hole', 'idem'),
        ('Lord of D.', 'Sakuretsu Armor', 'idem'),
        ('Lord of D.', 'Trap Hole', 'idem'),
        ('Silent Doom', 'Swords of Revealing Light', 'revive só em defesa'),
        ('Final Attack Orders', 'Torrential Tribute', 'efeito fraco'),
        ('Interdimensional Matter Transporter', 'Mystical Space Typhoon', 'efeito fraco'),
        ('Saggi the Dark Clown', 'Kaiser Sea Horse', '600 de ATK; o Kaiser ajuda a invocar o Olhos Azuis'),
        # 2ª rodada: 83% contra o deck inicial, mas só 38% contra os comuns do T3 (perde para as armadilhas de Arkana e Strings)
        ('Shrink', 'Heavy Storm', 'limpa as armadilhas dos comuns do T3'),
        ('Cloning', "Harpie's Feather Duster", 'idem'),
        ('Soul Exchange', 'Snatch Steal', 'a CPU quase nunca usa a Soul Exchange'),
        ('Des Feral Imp', 'Luster Dragon', 'dragão de 1900'),
        ('Ryu-Kishin Powered', 'Spear Dragon', 'dragão de 1900 com perfuração'),
        ('Battle Ox', 'Luster Dragon', 'dragão de 1900'),
        ('Crush Card Virus', 'Mystical Space Typhoon', 'pede tributo de trevas que a CPU raramente tem; tira armadilhas'),
        ('Crush Card Virus', 'Dust Tornado', 'idem'),
    ],
}


def cut(main: list[int], extra: list[int], keep: set[int], cards: dict, keep_all: frozenset[int] = frozenset()) -> tuple[list[int], list[int], list[str]]:
    """Corta o deck para o Speed Duel. Cada tipo (monstro, magia, armadilha) fica com a parte proporcional de 30
    (maiores restos). Dentro do tipo, sai uma cópia por vez da carta com mais cópias, a mais ao fim da receita primeiro;
    assim as 3ªs cópias saem antes das 2ªs, e as cartas únicas por último. Das cartas do `keep` sempre fica ao menos uma
    cópia, e das do `keep_all` nenhuma sai. As trocas do REPLACE e do TUNE entram no começo da lista, então saem por último. O Extra fica com as 5
    primeiras (as do `keep` antes). Devolve o principal, o Extra e as notas do que saiu."""
    main, notes = list(main), []
    kind = lambda i: 'm' if cards[str(i)]['type'] & 1 else 's' if cards[str(i)]['type'] & 2 else 't'
    if len(main) > MAIN_MAX:
        total = len(main)
        have = Counter(kind(i) for i in main)
        quota = {k: n * MAIN_MAX // total for k, n in have.items()}
        for k in sorted(have, key=lambda k: -(have[k] * MAIN_MAX % total))[:MAIN_MAX - sum(quota.values())]:
            quota[k] += 1
        order = list(dict.fromkeys(main))
        for k in have:
            while sum(1 for i in main if kind(i) == k) > quota[k]:
                pool = [i for i in reversed(order) if kind(i) == k and i in main and i not in keep_all and (i not in keep or main.count(i) > 1)]
                if not pool:
                    break
                worst = max(pool, key=lambda i: main.count(i))  # max() fica com o primeiro do empate: o mais ao fim
                main.reverse(); main.remove(worst); main.reverse()
                notes.append(cards[str(worst)]['name'])
        while len(main) > MAIN_MAX:  # tipo todo protegido: tira de qualquer tipo
            pool = [i for i in reversed(order) if i in main and i not in keep_all and (i not in keep or main.count(i) > 1)]
            worst = max(pool, key=lambda i: main.count(i))
            main.reverse(); main.remove(worst); main.reverse()
            notes.append(cards[str(worst)]['name'])
    ex = sorted(extra, key=lambda i: i not in keep)[:EXTRA_MAX]
    notes += [cards[str(i)]['name'] + ' (Extra)' for i in (Counter(extra) - Counter(ex)).elements()]
    return main, ex, notes


def keep_for(key: str, cards: dict, by_name: dict) -> set[int]:
    camp = json.loads((ROOT / 'src/campaign/data/campaign.json').read_text())
    sig = {d['key']: (d.get('signatureCard') or {}).get('id') for t in camp['tiers'] for d in t['duelists']}
    ids = {sig[key]} if sig.get(key) else set()
    for n in KEEP.get(key, []):
        if n not in by_name:
            sys.exit(f'{key}: KEEP {n!r} não está no pool')
        ids.add(by_name[n])
    return ids


def keep_all_for(key: str, by_name: dict) -> frozenset[int]:
    return frozenset(by_name[n] for n in KEEP_ALL.get(key, []))


def write_candidates(cards: dict, by_name: dict) -> None:
    """As candidatas do torneio já cortadas para o Speed Duel (raw/decks/candidates-speed.json)."""
    cands = json.loads((RAW / 'candidates.json').read_text())
    out = {}
    for key, cs in cands.items():
        keep = keep_for(key, cards, by_name)
        out[key] = []
        for c in cs:
            main, extra, _ = cut(c['main'], c['extra'], keep, cards, keep_all_for(key, by_name))
            out[key].append({**c, 'main': main, 'extra': extra})
    (RAW / 'candidates-speed.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f'ok: {sum(len(v) for v in out.values())} candidatas cortadas → raw/decks/candidates-speed.json')


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
    if '--candidatas' in sys.argv:
        write_candidates(cards, by_name)
        return
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
                main.insert(0, repl)  # no começo: o corte para 30 tira do fim da receita, e o reforço fica
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
            main.insert(0, in_id)  # idem
            notes.setdefault(in_id, []).append(f'no lugar de {out_name}: {why}')

        main, extra, cutted = cut(main, c['extra'], keep_for(key, cards, by_name), cards, keep_all_for(key, by_name))
        for n, k in Counter(cutted).items():
            print(f'  {key}: sai {k}× {n}')

        if key in FINAL:
            main, notes = [], {}
            for n, k, why in FINAL[key]:
                if n not in by_name:
                    sys.exit(f'{key}: FINAL põe {n!r}, que não está no pool')
                main += [by_name[n]] * k
                notes.setdefault(by_name[n], []).append(f'lista final do Speed: {why}')

        def entries(ids):
            return [{'id': i, 'count': n, 'comment': '; '.join([name(i), *notes.get(i, [])])}
                    for i, n in Counter(ids).items()]

        out[key] = {
            'name': f'{c["name"]}'.replace('<br>', ' ').strip(),
            'source': c['url'],
            'winRate': p['rate'],
            'main': entries(main),
            'extra': entries(extra),
        }
        if not 20 <= len(main) <= MAIN_MAX:
            sys.exit(f'{key}: Main com {len(main)}')
    OUT.write_text(json.dumps({
        '_comment': 'Gerado por scripts/build_decks.py: a receita "Anime Decks" do YGOPRODeck que venceu o torneio do '
                    'proto/deck-pick.ts para cada duelista (source = receita original; winRate = taxa no torneio).',
        'decks': out,
    }, ensure_ascii=False, indent=1) + '\n')
    print(f'ok: {len(out)} decks → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
