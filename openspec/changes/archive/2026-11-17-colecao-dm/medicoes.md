# Medições (colecao-dm)

Build de produção (`npx vite build`), pré-carga lida do `dist/sw.js`. FPS e memória no simulador do iPhone 17 Pro.

## Antes (base atual, 1.738 cartas) (2026-11-17 04:27)

### Bundle

| Arquivo | Bruto | gzip |
|---|---:|---:|
| worker.js | 2589.0 KB | 921.1 KB |
| ocgcore.jspi-6EJJOY3Y.js | 1252.3 KB | 446.0 KB |
| ocgcore.sync-OBPMIIOW.js | 1251.3 KB | 445.6 KB |
| index.js | 753.7 KB | 222.0 KB |
| index.css | 57.0 KB | 13.7 KB |
| ocgcore.sync-VACWSK37.js | 20.5 KB | 8.2 KB |
| ocgcore.jspi-V6S5ZB3O.js | 7.0 KB | 3.1 KB |
| workbox-window.prod.es5.js | 5.5 KB | 2.1 KB |
| chunk-6GYI7QPM.js | 0.0 KB | 0.1 KB |

### Pré-carga: 416 entradas, 17.27 MB

| Pasta | Entradas | Tamanho |
|---|---:|---:|
| characters/ | 337 | 6703.7 KB |
| assets/ | 10 | 5942.8 KB |
| scripts.json | 1 | 2287.1 KB |
| data/ | 3 | 1036.4 KB |
| card-icons/ | 36 | 769.2 KB |
| icons/ | 10 | 568.6 KB |
| brand/ | 1 | 245.1 KB |
| sounds/ | 13 | 111.4 KB |
| favicon.ico | 2 | 13.6 KB |
| fonts/ | 1 | 7.5 KB |
| index.html | 1 | 1.0 KB |
| manifest.webmanifest | 1 | 0.4 KB |

### Rolagem e memória (antes): simulador do iPhone 17 Pro (iOS 26.5), build de preview

Coleção cheia (`?campaign=all-cards`): 1.738 cartas × 3 = 5.214 cópias, todas montadas na grade (imagem `small`).
Medidor `?perf` (rolagem automática a 3.000 pt/s de ponta a ponta). Memória = RSS do processo WebContent da aba.

| Momento | Memória da aba |
|---|---:|
| Título (Safari recém-aberto) | 236 MB |
| Editor aberto (grade no topo) | 372 MB |
| Depois de rolar a coleção inteira | 468 MB |

| Rolagem | Valor |
|---|---:|
| FPS médio | 23 |
| Quadros | 1.323 em 58,1 s |
| Quadros longos (> 50 ms) | 381 (pior 104 ms) |
| Células na página | 5.214 |
| Altura da grade | 174.610 px |

Obs.: no "antes" não há como voltar ao topo sem rolar tudo de novo (sem virtualização a memória só cresce); o
simulador usa a memória do Mac, então um iPhone real fecharia a aba bem antes.

### Arte nova (thumb 200 px q70, full 512 px q75, a partir do recorte de 624 px)

| Tamanho | Arquivos | Média | Total |
|---|---:|---:|---:|
| thumb | 1.939 | 8,4 KB | 16,0 MB |
| full | 1.939 | 30,5 KB | 57,7 MB |
| **Antes** (small + large + cropped, 1.738 cartas) | 5.214 | 18,4 KB | 96 MB |

## Depois (base nova, 1.939 cartas) (2026-11-17 04:50)

### Bundle

| Arquivo | Bruto | gzip |
|---|---:|---:|
| worker.js | 2589.0 KB | 921.1 KB |
| ocgcore.jspi-6EJJOY3Y.js | 1252.3 KB | 446.0 KB |
| ocgcore.sync-OBPMIIOW.js | 1251.3 KB | 445.6 KB |
| index.js | 758.8 KB | 224.0 KB |
| index.css | 57.3 KB | 13.7 KB |
| ocgcore.sync-VACWSK37.js | 20.5 KB | 8.2 KB |
| ocgcore.jspi-V6S5ZB3O.js | 7.0 KB | 3.1 KB |
| workbox-window.prod.es5.js | 5.5 KB | 2.1 KB |
| chunk-6GYI7QPM.js | 0.0 KB | 0.1 KB |

### Pré-carga: 252 entradas, 12.20 MB

| Pasta | Entradas | Tamanho |
|---|---:|---:|
| assets/ | 8 | 4688.9 KB |
| characters/ | 148 | 2544.3 KB |
| scripts.json | 1 | 2193.5 KB |
| data/ | 4 | 1144.4 KB |
| card-icons/ | 36 | 769.2 KB |
| icons/ | 10 | 568.6 KB |
| brand/ | 1 | 245.1 KB |
| cards/ | 26 | 204.4 KB |
| sounds/ | 13 | 111.4 KB |
| favicon.ico | 2 | 13.6 KB |
| fonts/ | 1 | 7.5 KB |
| index.html | 1 | 1.0 KB |
| manifest.webmanifest | 1 | 0.4 KB |

### Rolagem e memória (depois): simulador do iPhone 17 Pro (iOS 26.5), build de preview

Coleção cheia (`?campaign=all-cards`): 1.939 cartas × 3 = 5.817 cópias, grade virtualizada com a face desenhada e
`thumb`. Mesmo medidor (`?perf`, rolagem por `scrollTop` na thread principal). Parado, a página dá 60 FPS.

| Momento | Antes | Depois |
|---|---:|---:|
| Título (Safari recém-aberto) | 236 MB | 235 MB |
| Editor aberto (grade no topo) | 372 MB | 289 MB |
| Depois de rolar a coleção inteira | 468 MB | ~495 MB |
| De volta ao topo | (sem como medir) | ~494 MB |

| Rolagem | Antes (3.000 pt/s) | Depois (3.000 pt/s) | Depois (1.000 pt/s) |
|---|---:|---:|---:|
| FPS médio | 23 | 29 (27 com as imagens já em cache) | 45 |
| Quadros longos (> 50 ms) | 381 (pior 104 ms) | 353 (pior 84 ms) | 1.019 em 194 s (pior 160 ms) |
| Células na página | 5.214 | 21 | 21 |

Leitura:
- A virtualização resolve o DOM (5.214 → 21 células) e a memória com o editor aberto (−83 MB).
- O FPS melhora pouco, e a 1.000 pt/s há um quadro longo a cada linha nova: o custo é montar as 4 faces desenhadas
  de cada linha, e não baixar nem decodificar a arte (com o cache cheio o número não muda).
- A memória ainda sobe durante a rolagem e não desce ao voltar ao topo: o WebKit guarda as imagens decodificadas no
  cache dele, e o simulador usa a memória do Mac (sem pressão de memória, nada é liberado). Num iPhone real o sistema
  libera esse cache sob pressão; falta confirmar no aparelho.
- O medidor rola pela thread principal. No iOS, a rolagem com o dedo é feita pelo compositor (não espera a thread
  principal), então este número é um teto pessimista. A conferência que vale é rolar com o dedo no iPhone.

### iPhone físico (iOS 27.2, Safari, pelo túnel para o preview), 17/11/2026

Coleção cheia (5.817 cópias), mesmo medidor a 3.000 pt/s:

| Rolagem | Valor |
|---|---:|
| FPS parado | 61 |
| FPS rolando | **60** |
| Quadros | 3.595 em 60,0 s |
| Quadros longos (> 50 ms) | 2 (pior 63 ms) |
| Células na página | 17 |

Rolagem com o dedo (arrastos e jogadas rápidas, descendo e voltando): lisa, sem travar e sem o Safari recarregar a
página. A meta de ~60 FPS vale no aparelho; o simulador (29 FPS) desenha bem mais devagar que o iPhone. A memória do
processo não dá para ler no aparelho; o sinal de falta dela (a página recarregar sozinha) não apareceu.
