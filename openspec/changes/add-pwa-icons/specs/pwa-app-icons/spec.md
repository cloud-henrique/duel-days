# Spec Delta

## Purpose

Define a identidade visual do app instalado: o ícone do ankh em estilo HUD azul, o favicon, o ícone da tela de início do
iOS, os ícones do manifest (comum e maskable) e as cores de tema, para que o PWA seja instalável e reconhecível no iOS e no Android.

## ADDED Requirements

### Requirement: Desenho do ícone
O ícone SHALL mostrar um ankh em degradê azul liso (`#8cc2ff` → `#2a6fe0`) com contorno claro, sobre uma placa chanfrada com borda azul, brilho radial e fundo escuro do HUD. O ankh MUST ter as pontas dos braços retas, o centro chapado e nenhuma faceta, linha interna ou degrau na junção.

#### Scenario: Ankh liso
- **WHEN** o ícone é renderizado em qualquer tamanho
- **THEN** o ankh aparece como uma única silhueta com degradê vertical, sem traços internos nem entalhes nas pontas dos braços

#### Scenario: Placa no estilo do HUD
- **WHEN** o ícone é renderizado no tamanho de 96 px ou mais
- **THEN** o ankh aparece sobre uma placa de cantos chanfrados (dois cantos diagonais cortados) com borda azul `#2f7fd8`

### Requirement: Versão pequena legível
Os ícones de 48 px ou menos (favicon de 16 e 32 px) SHALL usar uma versão simplificada sem a placa, com o ankh ampliado sobre o fundo escuro.

#### Scenario: Aba do navegador
- **WHEN** o navegador exibe o favicon em 16 ou 32 px
- **THEN** o ankh preenche o quadro e o laço, os braços e a haste continuam distinguíveis

### Requirement: Favicon declarado
O `index.html` SHALL declarar o ícone do app como SVG e como ICO (com 16, 32 e 48 px) para os navegadores.

#### Scenario: Navegador desktop ou Android
- **WHEN** a página é aberta em um navegador
- **THEN** a aba mostra o ankh, via SVG nos navegadores que o suportam ou via ICO nos demais

### Requirement: Ícone da tela de início do iOS
O app SHALL fornecer um `apple-touch-icon` de 180×180 px, opaco (sem transparência) e declarado no `index.html`.

#### Scenario: Adicionar à tela de início no iOS
- **WHEN** o usuário usa "Adicionar à Tela de Início" no Safari do iOS
- **THEN** o ícone na tela de início é o ankh em 180×180, com fundo cheio e sem bordas pretas

### Requirement: Ícones do manifest
O manifest SHALL listar ícones PNG de 192×192 e 512×512 com `purpose: any` e um ícone de 512×512 com `purpose: maskable` em que o ankh e a placa ficam inteiros dentro da zona segura de 80% central.

#### Scenario: Instalação no Android
- **WHEN** o Chrome do Android avalia o app para instalação
- **THEN** o manifest atende ao requisito de ícones 192 e 512 e o navegador oferece instalar o app

#### Scenario: Máscara do launcher
- **WHEN** o Android recorta o ícone maskable em círculo ou arredondado
- **THEN** nenhuma parte do ankh nem da placa é cortada

### Requirement: Cores de tema alinhadas ao HUD
O `theme_color` e o `background_color` do manifest, assim como o `<meta name="theme-color">`, SHALL usar o fundo do HUD (`#050c1f`).

#### Scenario: Abertura do app instalado
- **WHEN** o app instalado abre
- **THEN** a tela de abertura e a barra do sistema usam `#050c1f`, sem faixa de outra cor

### Requirement: Ícones disponíveis offline
Os arquivos de ícone SHALL entrar na pré-carga do service worker, de modo que o ícone apareça mesmo sem rede.

#### Scenario: App aberto sem rede
- **WHEN** o app instalado é aberto offline depois da primeira visita
- **THEN** favicon e ícones são servidos do cache
