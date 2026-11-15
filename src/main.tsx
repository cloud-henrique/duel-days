import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Sensação de app nativo: sem zoom por gesto.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault());
navigator.storage?.persist?.().catch(() => {});
createRoot(document.getElementById('root')!).render(<App />);
