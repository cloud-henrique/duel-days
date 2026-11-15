/** Rótulos em português para os campos numéricos do banco de cartas. */
const ATTR: Record<number, string> = { 1: 'TERRA', 2: 'ÁGUA', 4: 'FOGO', 8: 'VENTO', 16: 'LUZ', 32: 'TREVAS', 64: 'DIVINO' };
const RACE: [bigint, string][] = [
  [0x1n, 'Guerreiro'], [0x2n, 'Mago'], [0x4n, 'Fada'], [0x8n, 'Demônio'], [0x10n, 'Zumbi'], [0x20n, 'Máquina'], [0x40n, 'Aqua'],
  [0x80n, 'Piro'], [0x100n, 'Rocha'], [0x200n, 'Besta Alada'], [0x400n, 'Planta'], [0x800n, 'Inseto'], [0x1000n, 'Trovão'],
  [0x2000n, 'Dragão'], [0x4000n, 'Besta'], [0x8000n, 'Besta-Guerreiro'], [0x10000n, 'Dinossauro'], [0x20000n, 'Peixe'],
  [0x40000n, 'Serpente Marinha'], [0x80000n, 'Réptil'], [0x100000n, 'Psíquico'], [0x200000n, 'Divindade'],
  [0x400000n, 'Deus Criador'], [0x800000n, 'Wyrm'], [0x1000000n, 'Ciberso'],
];
export const attrName = (a: number) => ATTR[a] ?? '';
export const raceName = (r: string) => { const v = BigInt(r || 0); return RACE.find(([bit]) => v & bit)?.[1] ?? ''; };

export function typeLine(type: number) {
  if (type & 0x2) return type & 0x80000 ? 'Magia de Equipamento' : type & 0x10000 ? 'Magia de Campo' : type & 0x20000 ? 'Magia Rápida' : type & 0x80 ? 'Magia de Ritual' : type & 0x40000 ? 'Magia Contínua' : 'Magia';
  if (type & 0x4) return type & 0x20000 ? 'Armadilha de Contra-Ataque' : type & 0x100000 ? 'Armadilha Contínua' : 'Armadilha';
  const sub = type & 0x40 ? 'Fusão' : type & 0x80 ? 'Ritual' : type & 0x2000 ? 'Sincro' : type & 0x800000 ? 'Xyz' : type & 0x20 ? 'Efeito' : 'Normal';
  return `Monstro · ${sub}`;
}
export const isMonster = (type: number) => (type & 0x1) !== 0;
