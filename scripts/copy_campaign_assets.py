#!/usr/bin/env python3
"""Copia do app nativo a arte e a música da campanha para public/campaign/ e public/music/.

São material da Konami (panorama de Domino e fundos do *Tag Force*, capas dos pacotes, trilha do *Duel Links* e do
*Tag Force*): ficam fora do git, como os sons e a arte das cartas, e vão para produção pelo `dist/` (atrás do Access).
Sem esses arquivos, o jogo funciona com fundos em degradê e em silêncio.

Uso: python3 scripts/copy_campaign_assets.py [caminho do duel-academy]
"""
import shutil
import subprocess
import sys
import tempfile
import urllib.request
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
    'pack-lod.jpg': 'pack-lod.jpg',  # Tier 2 (o nativo não tem a do LON: vem do Yugipedia, em COVERS)
    'pack-pgd.jpg': 'pack-pgd.jpg',
    'pack-mfc.jpg': 'pack-mfc.jpg',  # Tier 3 (o nativo não tem a do DCR: vem do Yugipedia, em COVERS)
    'pack-ioc.jpg': 'pack-ioc.jpg',
}
# Capas que o nativo não tem: baixadas do Yugipedia (a página do arquivo fica atrás do desafio do Cloudflare; o
# endereço direto vem da API: api.php?action=query&titles=File:<nome>&prop=imageinfo&iiprop=url) e reduzidas para 600 px
# de altura em JPEG, como as outras.
COVERS = {
    'pack-lon.jpg': 'https://img.yugipedia.com/8/8e/LON-BoosterEN.jpg',
    'pack-dcr.jpg': 'https://img.yugipedia.com/6/68/DCR-BoosterEN.png',
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
    for name, url in COVERS.items():
        dst = ROOT / 'public/campaign' / name
        if dst.exists():
            continue
        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp) / Path(url).name
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (projeto pessoal)'})
            raw.write_bytes(urllib.request.urlopen(req, timeout=60).read())
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', '--resampleHeight', '600',
                            str(raw), '--out', str(dst)], check=True, capture_output=True)  # macOS
        total += dst.stat().st_size
    print(f'ok: {len(IMAGES)} imagens, {len(COVERS)} capas do Yugipedia e {len(MUSIC)} músicas ({total / 1024 / 1024:.1f} MB)')


if __name__ == '__main__':
    main()
