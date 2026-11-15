import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

// Atualiza sozinho: quando há versão nova, o service worker assume e a página recarrega (sem precisar abrir duas vezes).
registerSW({ immediate: true });

// Sensação de app nativo: sem zoom por gesto.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
navigator.storage?.persist?.().catch(() => {});
const root = createRoot(document.getElementById('root')!);
// Desenvolvimento: ?cardfaces abre a página de conferência da face das cartas.
if (import.meta.env.DEV && location.search.includes('cardfaces')) import('./dev/CardFaceGallery').then(({ CardFaceGallery }) => root.render(<CardFaceGallery />));
else root.render(<App />);
