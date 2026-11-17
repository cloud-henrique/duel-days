import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { installUnlock } from './audio/sfx';

// Atualiza sozinho: quando há versão nova, o service worker assume e a página recarrega (sem precisar abrir duas vezes).
registerSW({ immediate: true });

// Sensação de app nativo: sem zoom por gesto.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
navigator.storage?.persist?.().catch(() => {});
// O cache de arte antigo (cartas inteiras em inglês, até a change colecao-dm) não é mais usado: libera o espaço.
globalThis.caches?.delete('card-art').catch(() => {});
// O iOS só libera o áudio num gesto: qualquer toque no app (já na história) deixa os sons do duelo prontos.
installUnlock();
const root = createRoot(document.getElementById('root')!);
// Desenvolvimento: ?cardfaces abre a conferência da face das cartas; ?choices, a das escolhas de cartas no duelo;
// ?coins, a da moeda e do dado.
if (import.meta.env.DEV && location.search.includes('cardfaces')) import('./dev/CardFaceGallery').then(({ CardFaceGallery }) => root.render(<CardFaceGallery />));
else if (import.meta.env.DEV && location.search.includes('coins')) import('./dev/CoinGallery').then(({ CoinGallery }) => root.render(<CoinGallery />));
else if (import.meta.env.DEV && location.search.includes('choices')) import('./dev/ChoiceGallery').then(({ ChoiceGallery }) => root.render(<ChoiceGallery />));
else root.render(<App />);
