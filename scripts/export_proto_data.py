#!/usr/bin/env python3
"""Exporta o pool de cartas do protótipo: public/data/cards.json + public/scripts/*.lua.
Requer raw/data/{BabelCDB,CardScripts} (veja scripts/fetch_data.sh)."""
import json, os, shutil, sqlite3, glob
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CDB = f'{R}/raw/data/BabelCDB/cards.cdb'; SCR = f'{R}/raw/data/CardScripts'
NAMES = ["Blue-Eyes White Dragon","Dark Magician","Red-Eyes Black Dragon","Summoned Skull","Celtic Guardian",
 "Mystical Elf","Giant Soldier of Stone","Gaia The Fierce Knight","Curse of Dragon","Feral Imp","Silver Fang",
 "Mammoth Graveyard","Hitotsu-Me Giant","Pot of Greed","Dian Keto the Cure Master","Raigeki","Monster Reborn",
 "Swords of Revealing Light","Mystical Space Typhoon","Dark Hole","Fissure","Trap Hole","Mirror Force",
 "Man-Eater Bug","Kuriboh","Beaver Warrior","Battle Ox","La Jinn the Mystical Genie of the Lamp","Dragon Capture Jar"]
db = sqlite3.connect(CDB)
cards = {}
for n in NAMES:
    r = db.execute("select d.id,d.alias,d.setcode,d.type,d.atk,d.def,d.level,d.race,d.attribute,t.name,t.desc "
                   "from datas d join texts t on t.id=d.id where t.name=? collate nocase and d.alias=0 order by d.id", (n,)).fetchone()
    if not r: print('FALTA', n); continue
    id_, alias, sc, ty, atk, df, lv, race, attr, name, desc = r
    lm = 0
    if ty & 0x4000000: lm, df = df, 0
    cards[str(id_)] = dict(code=id_, alias=alias, setcodes=[(sc >> (16*i)) & 0xffff for i in range(4) if (sc >> (16*i)) & 0xffff],
        type=ty, level=lv & 0xff, attribute=attr, race=str(race), attack=atk, defense=df,
        lscale=(lv >> 24) & 0xff, rscale=(lv >> 16) & 0xff, link_marker=lm, name=name, desc=desc)
os.makedirs(f'{R}/public/data', exist_ok=True); os.makedirs(f'{R}/public/scripts', exist_ok=True)
json.dump(cards, open(f'{R}/public/data/cards.json', 'w'), ensure_ascii=False, indent=0)
names = []
for f in glob.glob(f'{SCR}/*.lua'):
    shutil.copy(f, f'{R}/public/scripts/'); names.append(os.path.basename(f))
for c in cards.values():
    for code in {c['code'], c['alias']} - {0}:
        s = f'{SCR}/official/c{code}.lua'
        if os.path.exists(s): shutil.copy(s, f'{R}/public/scripts/'); names.append(f'c{code}.lua')
        else: print('sem script', code)
json.dump(sorted(names), open(f'{R}/public/scripts/index.json', 'w'))
print(len(cards), 'cartas,', len(names), 'scripts')
