#!/usr/bin/env python3
"""Copia do app nativo a arte e a música da campanha para public/campaign/ e public/music/.

São material da Konami (panorama de Domino e fundos do *Tag Force*, capas dos pacotes, trilha do *Duel Links* e do
*Tag Force*): ficam fora do git, como os sons e a arte das cartas, e vão para produção pelo `dist/` (atrás do Access).
Sem esses arquivos, o jogo funciona com fundos em degradê e em silêncio.

Uso: python3 scripts/copy_campaign_assets.py [caminho do duel-academy]
"""
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NATIVE = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / 'Projects/personal/duel-academy')
ART = NATIVE / 'App/DuelAcademy/GameArt'
SOUNDS = NATIVE / 'App/DuelAcademy/Sounds'

# nome no nativo → nome em public/campaign/
IMAGES = {
    'background-map-domino-morning.jpg': 'map-morning.jpg',
    'background-map-domino-afternoon.jpg': 'map-afternoon.jpg',
    'background-map-domino-evening.jpg': 'map-evening.jpg',
    'background-escola.jpg': 'place-escola.jpg',
    'background-burger.jpg': 'place-burger.jpg',
    'background-fliperama.jpg': 'place-fliperama.jpg',
    'background-parque.jpg': 'place-parque.jpg',
    'background-kame-game.jpg': 'place-kame-game.jpg',
    'background-domino-night.jpg': 'domino-night.jpg',
    'pack-lob.jpg': 'pack-lob.jpg',
    'pack-mrd.jpg': 'pack-mrd.jpg',
    'pack-mrl.jpg': 'pack-mrl.jpg',
    'pack-psv.jpg': 'pack-psv.jpg',
}
MUSIC = ['title', 'map', 'shop', 'encounter', 'duel', 'boss-duel', 'victory', 'defeat']


def main() -> None:
    sources = [(ART / a, ROOT / 'public/campaign' / b) for a, b in IMAGES.items()]
    sources += [(SOUNDS / f'music-{m}.m4a', ROOT / 'public/music' / f'{m}.m4a') for m in MUSIC]
    missing = [str(s) for s, _ in sources if not s.exists()]
    if missing:
        sys.exit('Faltam no nativo:\n  ' + '\n  '.join(missing))
    total = 0
    for src, dst in sources:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        total += dst.stat().st_size
    print(f'ok: {len(IMAGES)} imagens e {len(MUSIC)} músicas ({total / 1024 / 1024:.1f} MB)')


if __name__ == '__main__':
    main()
