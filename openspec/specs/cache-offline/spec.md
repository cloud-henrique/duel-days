# cache-offline Specification

## Purpose

Define o que o PWA guarda para funcionar offline: o que entra na pré-carga da instalação, o que fica em cache conforme
é visto (com limite e expiração) e como o jogo se recupera quando o iOS apaga o cache.

## Requirements

### Requirement: Pré-carga só do essencial
A pré-carga da instalação SHALL conter só o necessário para abrir o app e jogar o começo da campanha offline: a página,
o JavaScript e o CSS do app, o motor de duelo (só o build usado), fontes, ícones, sons, o verso da carta, os dados das
cartas e dos scripts, a arte `thumb` do deck inicial, e os sprites dos avatares do jogador e dos duelistas do Tier 1.

#### Scenario: Instalação
- **WHEN** o PWA é instalado pela primeira vez
- **THEN** a pré-carga não contém a arte das cartas fora do deck inicial, nem a arte `full`, nem sprites de personagens
  que o Tier 1 não usa, nem a arte e a música da campanha

#### Scenario: Primeiro duelo offline
- **WHEN** o jogador instala o app, fica offline e começa o primeiro duelo da campanha com o deck inicial
- **THEN** o duelo funciona e as cartas do jogador aparecem com a arte

### Requirement: Pré-carga não cresce com a coleção
O tamanho da pré-carga MUST NOT crescer com o número de cartas da base, exceto pelos arquivos de dados (lista de cartas,
textos e scripts).

#### Scenario: Coleção dobrada
- **WHEN** a base passa de 1.700 para 2.000 cartas
- **THEN** a pré-carga só cresce pelo aumento dos arquivos de dados

### Requirement: Cache de execução com limite
A arte das cartas e os sprites fora da pré-carga SHALL ser guardados conforme aparecem, em caches com número máximo de
entradas e expiração. Ao bater no limite, as entradas mais antigas SHALL sair primeiro, e um erro de cota do aparelho
SHALL esvaziar esses caches em vez de quebrar o app.

#### Scenario: Limite atingido
- **WHEN** o cache de miniaturas atinge o limite de entradas
- **THEN** a miniatura usada há mais tempo sai do cache e a nova entra

#### Scenario: Sem espaço
- **WHEN** o aparelho recusa gravar por falta de espaço
- **THEN** os caches de arte são esvaziados e o app continua funcionando

### Requirement: Cache apagado pelo sistema
Se o iOS apagar os caches do PWA, o app SHALL abrir de novo online e baixar outra vez tudo o que precisar, sem perder o
save e sem tela de erro. Qualquer arte apagada SHALL poder ser baixada de novo quando aparecer.

#### Scenario: Cache apagado
- **WHEN** o sistema apaga os caches e o jogador abre o app com internet
- **THEN** o app abre com o save intacto e as artes voltam a aparecer conforme são vistas
