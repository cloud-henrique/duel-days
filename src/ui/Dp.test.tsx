// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { Dp } from './Dp';

afterEach(cleanup);

describe('Dp', () => {
  it('saldo: ícone de moedas, número e "DP"', () => {
    const { container } = render(<Dp value={450} />);
    expect(container.textContent).toBe('450DP');
    expect(container.querySelector('[aria-label="450 DP"] svg')).toBeTruthy();
  });

  it('ganho com sinal', () => {
    expect(render(<Dp value={30} delta />).container.querySelector('[aria-label="+30 DP"]')).toBeTruthy();
  });
});

describe('sem "moedas" na interface', () => {
  // O dinheiro é DP; "moeda" só no sentido de cara ou coroa (a abertura e os efeitos).
  it.each(['src/screens/ShopScreen.tsx', 'src/screens/campaign/MapScreen.tsx', 'src/screens/campaign/StatusScreen.tsx', 'src/screens/campaign/CampaignEnd.tsx', 'src/screens/duel/anim/Outro.tsx', 'src/App.tsx'])('%s', (file) => {
    const visible = readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    expect(visible).not.toMatch(/moedas|◎/i);
  });
});
