#!/usr/bin/env python3
"""Copia o logo "Yu-Gi-Oh!" do app nativo para public/brand/ (tela de título).

É arte da Konami: fica fora do git (public/brand/ no .gitignore), como os sprites e os sons. Sem o arquivo, a tela de
título continua completa, só sem o logo.

Uso: python3 scripts/copy_brand.py [GameArt do nativo]
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path.home() / 'Projects/personal/duel-academy/App/DuelAcademy/GameArt'
OUT = ROOT / 'public/brand'


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    logo = src / 'logo-yugioh.png'
    if not logo.exists():
        sys.exit(f'Falta {logo}')
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(logo, OUT / 'logo-yugioh.png')
    print(f'public/brand/logo-yugioh.png ({logo.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
