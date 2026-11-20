# Spec Delta

## MODIFIED Requirements

### Requirement: Tier sem conteúdo
Enquanto o próximo tier não tiver duelistas no jogo, ele MUST NOT abrir: o tier atual continua até o dia 30, e o
progresso SHALL dizer que o próximo tier chega numa próxima atualização. Vencer o chefe nesse caso SHALL dar o
pacote-prêmio normalmente (se dentro da janela).

#### Scenario: Pegasus vencido sem Tier 3
- **WHEN** o jogador vence o Pegasus no dia 12 e o Tier 3 ainda não existe
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 2 e o progresso avisa que o Tier 3 chega numa
  próxima atualização

#### Scenario: Kaiba vencido sem Tier 4
- **WHEN** o jogador vence o Kaiba no dia 20 e o Tier 4 ainda não existe
- **THEN** ganha o pacote-prêmio, o tier atual continua sendo o Tier 3 e o progresso avisa que o Tier 4 chega numa
  próxima atualização

#### Scenario: Prazo do Tier 3 sem Tier 4
- **WHEN** chega a manhã do dia 23 e o Tier 4 ainda não existe
- **THEN** o tier atual continua sendo o Tier 3 até o fim da campanha

#### Scenario: Save parado no Tier 2
- **WHEN** o jogador abre um save do dia 17, de antes desta mudança, que estava no Tier 2 por falta de conteúdo
- **THEN** o tier atual passa a ser o Tier 3, aberto no dia 15 (ou no dia em que o Pegasus foi vencido, se antes), e as
  caixas do Tier 3 contam a partir desse dia
