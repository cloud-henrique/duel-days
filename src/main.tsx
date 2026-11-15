import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

// Atualiza sozinho: quando há versão nova, o service worker assume e a página recarrega (sem precisar abrir duas vezes).
registerSW({ immediate: true });

// Sensação de app nativo: sem zoom por gesto.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
navigator.storage?.persist?.().catch(() => {});
createRoot(document.getElementById('root')!).render(<App />);
