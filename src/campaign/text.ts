/**
 * Marcação das falas do nativo: `{nome}` vira o nome do jogador e `{a|b|c}` escolhe o trecho pelo tratamento
 * (masculino | feminino | neutro), como em "{Bem-vindo|Bem-vinda|Boas-vindas}".
 */
export type Address = 'he' | 'she' | 'neutral';
const INDEX: Record<Address, number> = { he: 0, she: 1, neutral: 2 };

export function fillText(text: string, name: string, address: Address): string {
  return text.replace(/\{([^{}]*)\}/g, (whole, inner: string) => {
    if (inner === 'nome') return name;
    const parts = inner.split('|');
    return parts.length === 3 ? parts[INDEX[address]] : whole;
  });
}
