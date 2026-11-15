#!/usr/bin/env python3
"""Copia os ícones oficiais de carta (atributo, tipo de monstro, Magia/Armadilha, Magia Rápida) do app nativo para public/card-icons/.

São material da Konami e de terceiros (Yugipedia; tipos no estilo do Tag Force 6), por isso ficam fora do git.
Todos saem como `<nome>.svg`, com o nome do asset do nativo (`attribute-earth`, `type-sea-serpent`...): os que no
nativo já são PNG (desfoque convertido) viram um SVG que embute a imagem reduzida em WebP, para a interface só
precisar de uma extensão.

As propriedades de Magia/Armadilha (Rápida, Contínua, Campo, Equipamento, Ritual, Resposta) saem do atlas de ícones
do Tag Force 3 (pacote de texturas do PPSSPP, `cardicons.png`), quando ele existe: o nativo só tem a Rápida.

Uso: .venv/bin/python scripts/copy_card_icons.py [pasta Icons do Assets.xcassets do nativo] [cardicons.png]
"""
import base64
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path.home() / 'Projects/personal/duel-academy/App/DuelAcademy/Assets.xcassets/Icons'
OUT = ROOT / 'public/card-icons'
PREFIXES = ('attribute-', 'type-', 'property-', 'card-')
DEFAULT_ATLAS = Path.home() / '.config/ppsspp/PSP/TEXTURES/ULES01183/database/complementos/cardicons.png'
# Atlas 512×512 em células de 64 px com 4 px de folga; as propriedades ficam na 4ª linha, nesta ordem.
ATLAS_CELL, ATLAS_STEP, PROPERTY_ROW = 64, 68, 3
ATLAS_PROPERTIES = ['counter', 'field', 'equip', 'continuous', 'quick-play', 'ritual']
# Lado do PNG embutido: o ícone aparece com até ~24 px; 96 cobre telas 3x com folga.
RASTER_SIDE = 96


def png_as_svg(png) -> str:
    img = (png if isinstance(png, Image.Image) else Image.open(png)).convert('RGBA')
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
    atlas = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_ATLAS
    if atlas.is_file():
        sheet = Image.open(atlas)
        y = PROPERTY_ROW * ATLAS_STEP
        for k, name in enumerate(ATLAS_PROPERTIES):
            x = k * ATLAS_STEP
            (OUT / f'property-{name}.svg').write_text(png_as_svg(sheet.crop((x, y, x + ATLAS_CELL, y + ATLAS_CELL))))
            count += 1
    else:
        print(f'atlas do Tag Force não encontrado ({atlas}): só a Magia Rápida terá ícone de propriedade')
    print(f'{count} ícones em {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
