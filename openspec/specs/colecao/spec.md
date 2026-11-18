# colecao Specification

## Purpose
TBD - created by archiving change editor-nativo. Update Purpose after archive.

## Requirements

### Requirement: Tela Coleção
A tela Coleção SHALL mostrar quantas cartas diferentes o jogador tem e quantas no total, e a grade da coleção com a
mesma ordenação, os mesmos filtros e a mesma busca da maleta do editor, cada cópia como uma miniatura. Tocar numa carta
SHALL abrir o zoom, sem botões de pôr ou tirar. A tela SHALL abrir pelo atalho Coleção do mapa e pelo "Ver a coleção" do
fim da campanha, e MUST NOT gastar período.

#### Scenario: Totais
- **WHEN** o jogador tem 28 cartas diferentes, 45 no total, e abre a Coleção
- **THEN** a tela mostra "28 cartas diferentes" e "45 no total" e 45 miniaturas na grade

#### Scenario: Só ver
- **WHEN** o jogador toca numa carta na Coleção
- **THEN** abre o zoom da carta, sem "Pôr no deck"
