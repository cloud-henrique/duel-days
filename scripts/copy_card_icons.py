#!/usr/bin/env python3
"""Copia os ícones oficiais de carta (atributo, tipo de monstro, Magia Rápida) do app nativo para public/card-icons/.

São material da Konami e de terceiros (Yugipedia; tipos no estilo do Tag Force 6), por isso ficam fora do git.
Todos saem como `<nome>.svg`, com o nome do asset do nativo (`attribute-earth`, `type-sea-serpent`...): os que no
nativo já são PNG (desfoque convertido) viram um SVG que embute a imagem reduzida em WebP, para a interface só
precisar de uma extensão.

Uso: .venv/bin/python scripts/copy_card_icons.py [pasta Icons do Assets.xcassets do nativo]
"""
import base64
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path.home() / 'Projects/personal/duel-academy/App/DuelAcademy/Assets.xcassets/Icons'
OUT = ROOT / 'public/card-icons'
PREFIXES = ('attribute-', 'type-', 'property-')
# Lado do PNG embutido: o ícone aparece com até ~24 px; 96 cobre telas 3x com folga.
RASTER_SIDE = 96


def png_as_svg(png: Path) -> str:
    img = Image.open(png).convert('RGBA')
    img.thumbnail((RASTER_SIDE, RASTER_SIDE), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=90, method=6)
    data = base64.b64encode(buf.getvalue()).decode()
    w, h = img.size
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<image href="data:image/webp;base64,{data}" width="{w}" height="{h}"/></svg>')


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.is_dir():
        sys.exit(f'pasta de ícones não encontrada: {src}')
    OUT.mkdir(parents=True, exist_ok=True)
    count = 0
    for imageset in sorted(src.glob('*.imageset')):
        name = imageset.stem
        if not name.startswith(PREFIXES):
            continue
        files = [f for f in imageset.iterdir() if f.suffix in ('.svg', '.png')]
        if not files:
            continue
        f = files[0]
        target = OUT / f'{name}.svg'
        target.write_text(f.read_text() if f.suffix == '.svg' else png_as_svg(f))
        count += 1
    print(f'{count} ícones em {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
