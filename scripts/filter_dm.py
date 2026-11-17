"""Mantém só personagens de Duel Monsters (e variações) em assets/characters.

Uso: python3 scripts/filter_dm.py   (rode da raiz do repo)
Não-DM são removidos do disco e do manifest. Para restaurar, re-extraia dos zips em raw/.
"""
import json, os, shutil

ROOT = 'assets/characters'

DM = {
    'yugi_muto','yami_yugi','yami_yugi_street','seto_kaiba','seto_kaiba_dsod','seto_kaiba_urban',
    'joey_wheeler','joey_wheeler_casual','joey_wheeler_dsod','tea_gardner','tea_gardner_casual','tea_gardner_dsod',
    'tristan_taylor','mai_valentine','maximillion_pegasus','duke_devlin','bakura','yami_bakura',
    'marik_ishtar','yami_marik','ishizu_ishtar','odion','mako_tsunami','weevil_underwood','rex_raptor',
    'mokuba_kaiba','mokuba_kaiba_dsod','mokuba_kaiba_princess_adena','noah_kaiba','bandit_keith',
    'espa_roba','arkana','bonz','rare_hunter','serenity_wheeler','solomon_muto','rebecca_hawkins','roland',
}
# Prováveis DM, mas não verificados: conferir no labeler (campo "excluded" remove depois).
UNSURE = {'dox','princess_adena'}

def series(cid):
    if cid in DM: return 'dm'
    if cid in UNSURE: return 'dm?'
    if cid.startswith('npc_duelists_dm__'): return 'dm-npc'
    if cid.startswith('npc_duelists_common__'): return 'common-npc'
    return None

if __name__ == '__main__':
    mf = json.load(open(f'{ROOT}/manifest.json'))
    keep, drop = [], []
    for e in mf['characters']:
        s = series(e['id'])
        (keep if s else drop).append(e)
        if s: e['series'] = s
    for e in drop:
        shutil.rmtree(f"{ROOT}/{e['id']}", ignore_errors=True)
    mf['characters'] = keep
    json.dump(mf, open(f'{ROOT}/manifest.json', 'w'), indent=1, ensure_ascii=False)
    print(f'mantidos {len(keep)}, removidos {len(drop)}')
    from collections import Counter
    print(Counter(e['series'] for e in keep))
