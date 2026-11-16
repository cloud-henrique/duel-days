# Proposta

## Why

Hoje o duelo "pula" de um estado para outro. O motor resolve o turno inteiro do oponente de uma vez e a tela recebe só o
tabuleiro final, então o jogador não vê o que aconteceu: o que foi invocado, quem atacou quem, o que foi destruído.
O app nativo (Duel Days) mostra cada acontecimento com animações curtas, e o usuário quer o mesmo, "um pouco além" do
nativo nos momentos de virar e destruir. Este change depende do `polir-hud-duelo` (métricas, face da carta, placas).

## What Changes

- **Linha do tempo do duelo**: o motor passa a devolver, junto com o tabuleiro final, a sequência de acontecimentos
  ("beats"). Cada beat tem origem, destino e o estado do tabuleiro logo depois:
  - compra, invocação, baixa, virada, mudança de posição;
  - ativação, elos de corrente, ataque, dano/LP;
  - destruição, envio ao cemitério, banimento, equipamento, retorno à mão/deck;
  - moeda e dado, turno e fase.
- **Fila de animação na tela**: os beats tocam em ordem, e o jogador só volta a agir quando a fila termina. O turno do
  oponente vira uma sequência legível.
- **Animações**, com os tempos do nativo e alguns extras:
  - voo da carta entre a origem e o destino (mão, campo, cemitério, deck);
  - pilar de luz ao invocar e equipar;
  - **giro 3D** ao virar uma carta (extra em relação ao nativo);
  - giro de 90° ao mudar de posição;
  - destaque central com halo ao ativar Magia, Armadilha ou efeito;
  - pilha da corrente com o elo que está resolvendo em destaque;
  - ataque com recuo, avanço até o alvo, flash e tremida da tela;
  - **quebra curta** antes de a carta destruída voar ao cemitério (extra);
  - fade ao banir;
  - moeda e dado girando.
- **Abertura e fim do duelo**:
  - abertura com moeda, faixas dos dois duelistas entrando e "DUELO!" (um toque pula);
  - fim com "VITÓRIA!", "DERROTA" ou "EMPATE" e o vencedor dando um pulinho.
- **Ritmo**:
  - um toque na tela acelera a fila em andamento;
  - ajuste "Animações: normal / rápida / desligada", salvo no progresso;
  - o "reduzir movimento" do sistema é respeitado (sem avanço, tremida nem escalas grandes).
- **Sons**: os efeitos do nativo (do Tag Force, fora do git), convertidos para a web: comprar, invocar, baixar, virar, ativar, atacar,
  dano, cura, destruir, fim de turno, moeda, vitória e derrota. Têm volume e opção de silenciar. Não há vibração no
  iPhone, porque o Safari do iOS não oferece essa API.

## Capabilities

### New Capabilities

- `duel-animacoes`: como a tela de duelo encena os acontecimentos do motor, isto é:
  - ordem e ritmo das animações;
  - o que cada acontecimento mostra;
  - aceleração e desligamento;
  - acessibilidade de movimento;
  - sons;
  - abertura e fim do duelo.

### Modified Capabilities

(nenhuma; `duel-hud` nasce no change `polir-hud-duelo` e não muda de requisito aqui)

## Impact

- Motor:
  - `src/engine/driver.ts` e `src/engine/narrator.ts`: geram os beats;
  - `src/engine/protocol.ts`: novo campo `beats` nas mensagens `prompt` e `end`, que substitui `shows`;
  - `proto/monkey.ts` e `proto/smoke.ts`: validam os beats.
- Tela:
  - `src/screens/DuelScreen.tsx`: fila e camada de animação;
  - novos componentes de efeito (voo, pilar, destaque, ataque, quebra, moeda, abertura, fim);
  - `src/styles.css`: keyframes.
- Save:
  - `src/story/progress.ts`: preferências de animação e de som, com valor padrão para saves antigos.
- Assets:
  - `public/sounds/*.m4a` (~110 KB, fora do git: são do Tag Force, via app nativo; `scripts/copy_sounds.py`);
  - os retratos dos duelistas que já existem em `public/characters`.
- Dependência: talvez seja preciso ler o motivo do movimento (destruição, tributo, descarte), que o `ocgcore-wasm`
  descarta no `MSG_MOVE`. Ver `design.md`.
