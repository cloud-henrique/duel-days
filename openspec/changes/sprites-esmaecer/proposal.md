# Proposal

## Why

Nas cenas da campanha, o personagem entra subindo de baixo (o `actor-in` anima `translate` e opacidade), quando deveria
só esmaecer. Além disso, a cada fase do encontro (saudação, conversa, fala de antes do duelo, de depois, escolha) o palco
é montado de novo: o personagem some e entra outra vez. Como a fase seguinte quase sempre começa com outra expressão, o
que se vê é o personagem descendo e subindo só porque mudou de rosto.

## What Changes

- A entrada de um personagem no palco passa a ser só um esmaecimento (opacidade), sem deslocamento vertical. Vale para
  todo uso do `Sprite`, inclusive o vovô da loja.
- Quem já está no palco continua nele de uma fase para outra do mesmo encontro: a entrada toca só na primeira aparição
  do personagem naquela cena.
- A troca de expressão troca só o rosto, sem animação (como já acontece dentro de uma mesma fala a fala).
- O deslize do duelista do centro para o lado quando o jogador entra em cena continua como está.
- Fora do escopo: a tela de vitória/derrota continua mostrando só o rosto do oponente (só 9 figurinos têm Cutin, nenhum
  usado na campanha).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `campanha`: o requisito "Falas da campanha" passa a dizer como os personagens entram (esmaecendo), que continuam em
  cena entre as fases do encontro e que a troca de expressão troca só o rosto.

## Impact

- `src/screens/campaign/campaign.css` (`@keyframes actor-in`, `.actor`).
- `src/screens/campaign/Dialogue.tsx` (`Sprite`, `Dialogue`) e `src/screens/campaign/EncounterScreen.tsx` (as `key` de
  cada fase); possivelmente `src/App.tsx` (a `key` das cenas avulsas).
- `src/screens/shop/ShopCounter.tsx` herda a entrada nova pelo `Sprite`.
- Testes em `src/screens/campaign/campaign.test.tsx`.
