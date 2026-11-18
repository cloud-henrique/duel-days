#!/usr/bin/env python3
"""Copia os efeitos sonoros do duelo do app nativo e converte para AAC (.m4a) em public/sounds/.

Os efeitos do nativo são do *Yu-Gi-Oh! ARC-V Tag Force Special* (PSP), material da Konami: ficam fora do git, como a
arte das cartas (vão para produção pelo `dist/`, atrás do Access). O Safari e o Chrome tocam AAC; o `.caf` do nativo
não toca no Chrome. A conversão usa o `afconvert` do macOS, com a taxa padrão do AAC (os originais são mono, 22–32 kHz).

Uso: python3 scripts/copy_sounds.py [pasta Sounds do nativo]
"""
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path.home() / 'Projects/personal/duel-academy/App/DuelAcademy/Sounds'
OUT = ROOT / 'public/sounds'
# Os efeitos do duelo e da interface, com o nome do nativo (`sfx-<nome>.caf`); o mesmo nome sai em
# `public/sounds/<nome>.m4a`. Interface: o toque dos botões (`tap`), o voltar (`back`), avançar a fala, a compra e, na
# abertura de pacote, rasgar (`tear`) e o brilho da Super/Ultra (`rare`).
SOUNDS = ['draw', 'summon', 'set', 'flip', 'activate', 'attack', 'damage', 'heal', 'destroy', 'end-turn', 'coin-toss',
          'victory', 'defeat', 'tap', 'back', 'dialogue-advance', 'purchase', 'tear', 'rare']
MAX_TOTAL_BYTES = 3 * 1024 * 1024


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not shutil.which('afconvert'):
        sys.exit('afconvert não encontrado (só existe no macOS).')
    missing = [n for n in SOUNDS if not (src / f'sfx-{n}.caf').exists()]
    if missing:
        sys.exit(f'Faltam em {src}: {", ".join(missing)}')
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name in SOUNDS:
        dst = OUT / f'{name}.m4a'
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', str(src / f'sfx-{name}.caf'), str(dst)], check=True)
        total += dst.stat().st_size
        print(f'{dst.relative_to(ROOT)} ({dst.stat().st_size // 1024} KB)')
    print(f'{len(SOUNDS)} sons, {total // 1024} KB no total')
    if total > MAX_TOTAL_BYTES:
        sys.exit(f'Passou de {MAX_TOTAL_BYTES // 1024 // 1024} MB')


if __name__ == '__main__':
    main()
