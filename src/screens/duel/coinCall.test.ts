import { describe, expect, it } from 'vitest';
import { OcgMessageType, type OcgMessage } from 'ocgcore-wasm';
import { coinCallLabel, coinCallOptions } from './coinCall';

const option = (options: bigint[]) => ({ type: OcgMessageType.SELECT_OPTION, player: 0, options }) as unknown as OcgMessage;

describe('coinCallOptions', () => {
  it('reconhece o cara ou coroa (descrições 60 e 61), na ordem do motor', () => {
    expect(coinCallOptions(option([60n, 61n]))).toEqual(['heads', 'tails']);
    expect(coinCallOptions(option([61n, 60n]))).toEqual(['tails', 'heads']);
  });
  it('outras opções não são cara ou coroa', () => {
    expect(coinCallOptions(option([1234n, 60n]))).toBeNull();
    expect(coinCallOptions(option([]))).toBeNull();
    expect(coinCallOptions({ type: OcgMessageType.SELECT_YESNO } as unknown as OcgMessage)).toBeNull();
    expect(coinCallOptions(null)).toBeNull();
  });
  it('rótulos', () => {
    expect(coinCallLabel('heads')).toBe('Cara');
    expect(coinCallLabel('tails')).toBe('Coroa');
  });
});
