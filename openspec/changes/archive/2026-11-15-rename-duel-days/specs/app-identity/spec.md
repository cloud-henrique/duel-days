# Spec Delta

## Purpose

Garantir que o produto se apresente sempre como "Duel Days": na interface, na aba do navegador, no nome do atalho
instalado e no pacote, sem restos do nome antigo "YGO Story".

## ADDED Requirements

### Requirement: Nome exibido na interface
A tela inicial do app SHALL exibir o título "Duel Days" e o título da aba (`<title>`) MUST ser "Duel Days".

#### Scenario: Tela inicial
- **WHEN** o app abre na tela inicial
- **THEN** o título mostrado é "Duel Days"

#### Scenario: Aba do navegador
- **WHEN** a página está aberta no navegador
- **THEN** o título da aba é "Duel Days"

### Requirement: Nome do app instalado
O manifest SHALL declarar `name` e `short_name` como "Duel Days", e o `index.html` SHALL declarar `apple-mobile-web-app-title` como "Duel Days".

#### Scenario: Instalação no iOS
- **WHEN** o usuário adiciona o app à Tela de Início no iOS
- **THEN** o nome sugerido e gravado para o atalho é "Duel Days"

#### Scenario: Instalação no Android
- **WHEN** o Chrome do Android instala o app
- **THEN** o launcher mostra "Duel Days"

### Requirement: Nome do pacote e do armazenamento local
O pacote npm SHALL se chamar `duel-days` e o banco local do jogo SHALL se chamar `duel-days`.

#### Scenario: Primeiro uso após a renomeação
- **WHEN** o app abre num navegador sem dados anteriores
- **THEN** o save é gravado no banco `duel-days` e nenhum banco `ygo-story` é criado

### Requirement: Sem o nome antigo nos artefatos ativos
Os arquivos versionados fora do histórico arquivado do OpenSpec MUST NOT conter "YGO Story", `ygo-story` nem `ygo-story-pwa`.

#### Scenario: Busca textual
- **WHEN** se busca por "ygo-story" e "YGO Story" nos arquivos versionados, exceto `openspec/changes/archive/`
- **THEN** não há nenhuma ocorrência
