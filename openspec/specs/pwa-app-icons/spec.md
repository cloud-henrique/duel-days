# pwa-app-icons Specification

## Purpose

Define a identidade visual do app instalado: o ícone do redemoinho da Polimerização em ciano sobre o fundo do HUD, o favicon, o ícone da tela de início do
iOS, os ícones do manifest (comum e maskable) e as cores de tema, para que o PWA seja instalável e reconhecível no iOS e no Android.

## Requirements

### Requirement: Versão pequena legível
Os ícones de 48 px ou menos (favicon de 16, 32 e 48 px) SHALL usar um redemoinho simplificado, com menos voltas e faixas mais grossas que o do ícone grande, sobre uma placa escura do HUD que preenche o quadro.

#### Scenario: Aba do navegador
- **WHEN** o navegador exibe o favicon em 16 ou 32 px
- **THEN** as voltas do redemoinho continuam distinguíveis, sem virar uma mancha

#### Scenario: Aba clara e escura
- **WHEN** o favicon aparece numa aba de tema claro ou de tema escuro
- **THEN** o redemoinho se destaca do fundo nos dois casos

### Requirement: Favicon declarado
O `index.html` SHALL declarar o ícone do app como SVG e como ICO (com 16, 32 e 48 px) para os navegadores.

#### Scenario: Navegador desktop ou Android
- **WHEN** a página é aberta em um navegador
- **THEN** a aba mostra o redemoinho, via SVG nos navegadores que o suportam ou via ICO nos demais

### Requirement: Ícone da tela de início do iOS
O app SHALL fornecer um `apple-touch-icon` de 180×180 px, quadrado, opaco (sem transparência), sem cantos arredondados próprios e declarado no `index.html`.

#### Scenario: Adicionar à tela de início no iOS
- **WHEN** o usuário usa "Adicionar à Tela de Início" no Safari do iOS
- **THEN** o ícone na tela de início é o redemoinho em 180×180, com fundo cheio até as bordas da máscara, sem bordas pretas nem cantos duplamente arredondados

### Requirement: Ícones do manifest
O manifest SHALL listar ícones PNG de 192×192 e 512×512 com `purpose: any` e um ícone de 512×512 com `purpose: maskable` em que o redemoinho fica inteiro dentro da zona segura de 80% central.

#### Scenario: Instalação no Android
- **WHEN** o Chrome do Android avalia o app para instalação
- **THEN** o manifest atende ao requisito de ícones 192 e 512 e o navegador oferece instalar o app

#### Scenario: Máscara do launcher
- **WHEN** o Android recorta o ícone maskable em círculo ou arredondado
- **THEN** nenhuma parte do redemoinho é cortada

### Requirement: Cores de tema alinhadas ao HUD
O `theme_color` e o `background_color` do manifest, assim como o `<meta name="theme-color">`, SHALL usar a mesma cor do
fundo das telas (o azul mais escuro da paleta do jogo, nas bordas do degradê). O ícone do app MUST NOT mudar por causa
disso: ele continua sobre o fundo escuro descrito em "Ícone do redemoinho".

#### Scenario: Abertura do app instalado
- **WHEN** o app instalado abre
- **THEN** a tela de abertura e a barra do sistema usam a cor do fundo das telas, sem faixa de outra cor entre a barra e
  a primeira tela

#### Scenario: Ícone inalterado
- **WHEN** as cores de tema mudam para a paleta em azul médio
- **THEN** o ícone instalado continua o redemoinho ciano sobre o fundo escuro

### Requirement: Ícones disponíveis offline
Os arquivos de ícone SHALL entrar na pré-carga do service worker, de modo que o ícone apareça mesmo sem rede.

#### Scenario: App aberto sem rede
- **WHEN** o app instalado é aberto offline depois da primeira visita
- **THEN** favicon e ícones são servidos do cache

### Requirement: Ícone do redemoinho
O ícone SHALL mostrar só o redemoinho da Polimerização (a silhueta da carta do título, recortada num disco), em degradê vertical branco → ciano, com brilho ciano suave, sobre o fundo escuro do HUD em degradê (`#0a1a3a` → `#050c1f`). O ícone MUST NOT mostrar a carta, moldura, caixa de texto nem placa. O glifo MUST ocupar cerca de 72% da largura do quadro, no centro óptico.

#### Scenario: Só o redemoinho
- **WHEN** o ícone é renderizado no tamanho de 96 px ou mais
- **THEN** aparece apenas o redemoinho ciano sobre o fundo escuro, sem carta nem moldura ao redor

#### Scenario: Glifo fechado
- **WHEN** o ícone é renderizado em qualquer tamanho
- **THEN** o redemoinho termina num contorno circular, sem pedaços soltos nos cantos nem braços cortados pela borda do quadro

#### Scenario: Margem do grid
- **WHEN** o ícone é exibido com a máscara arredondada do iOS ou do Android
- **THEN** a máscara não toca o redemoinho e sobra margem de fundo em volta dele
