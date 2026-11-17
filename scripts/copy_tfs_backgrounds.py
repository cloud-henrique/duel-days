#!/usr/bin/env python3
"""Copia os fundos das cenas da campanha do zip "Events" do Tag Force Special para public/campaign/bg-*.jpg.

O zip (The Spriters Resource, PSP › Yu-Gi-Oh! ARC-V Tag Force Special › Miscellaneous › Events) é baixado à mão, porque
o site barra download por script, e fica em raw/tfs/events.zip. É arte da Konami: os fundos ficam fora do git, como o
resto de public/campaign/, e vão para produção pelo `dist/`. Sem eles, a cena usa um degradê.

Os fundos da era Duel Monsters são `evs1_36` a `evs1_99` (480×272). A tabela abaixo é a do design da change
`campanha-tiers` (Decisão 4): a chave vira `bg-<chave>.jpg` e é o `scene.bg` do duelista no `campaign.json`.

Uso: .venv/bin/python scripts/copy_tfs_backgrounds.py [caminho do zip]
"""
import io
import sys
import zipfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ZIP = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'raw/tfs/events.zip'
OUT = ROOT / 'public/campaign'

BACKGROUNDS = {
    # Tier 1: Domino antes do Reino dos Duelistas
    'escola': 'evs1_70',          # Escola Domino (Tristan)
    'rua-domino': 'evs1_62',      # Rua de Domino (Téa)
    'parque': 'evs1_65',          # Parque (Joey)
    'rua-arborizada': 'evs1_81',  # Rua arborizada (Bakura)
    'loja-de-jogos': 'evs1_72',   # Loja de Jogos do Vovô (Yugi)
    # Tier 2: Reino dos Duelistas
    'floresta-ilha': 'evs1_92',   # Weevil
    'ilha': 'evs1_67',            # Rex
    'praia-ilha': 'evs1_83',      # Mako
    'caverna-ilha': 'evs1_93',    # Bandit Keith
    'conves-navio': 'evs1_54',    # Mai
    'castelo-pegasus': 'evs1_50', # Pegasus
    # Tier 3: Batalha da Cidade
    'praca-museu': 'evs1_77',     # Espa Roba
    'beco': 'evs1_69',            # Rare Hunter
    'palco': 'evs1_46',           # Arkana
    'rua-neblina': 'evs1_60',     # Strings
    'museu': 'evs1_78',           # Kaiba
    # Tier 4: Finais
    'kaiba-corp': 'evs1_79',      # Ishizu
    'arena-dirigivel': 'evs1_58', # Odion
    'cabine-dirigivel': 'evs1_75',# Yami Bakura
    'cais': 'evs1_82',            # Marik
    'reino-das-sombras': 'evs1_45',  # Yami Marik
    'arena-torre': 'evs1_59',     # Yami Yugi
}


def main() -> None:
    if not ZIP.exists():
        sys.exit(f'falta {ZIP.relative_to(ROOT)} (baixe o zip "Events" do Tag Force Special no The Spriters Resource)')
    with zipfile.ZipFile(ZIP) as z:
        names = {Path(n).stem.removesuffix('out'): n for n in z.namelist() if n.endswith('.png')}
        missing = [v for v in BACKGROUNDS.values() if v not in names]
        if missing:
            sys.exit(f'faltam no zip: {missing}')
        OUT.mkdir(parents=True, exist_ok=True)
        total = 0
        for key, evs in BACKGROUNDS.items():
            im = Image.open(io.BytesIO(z.read(names[evs]))).convert('RGB')
            dst = OUT / f'bg-{key}.jpg'
            im.save(dst, quality=88, optimize=True, progressive=True)
            total += dst.stat().st_size
    print(f'ok: {len(BACKGROUNDS)} fundos ({total / 1024:.0f} KB) → {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
