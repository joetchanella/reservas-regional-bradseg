import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA offline capabilities and installability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA: Nova versão disponível.');
  },
  onOfflineReady() {
    console.log('PWA: Pronto para operação offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
