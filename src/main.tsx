import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Manage Service Worker lifecycle safely and prevent Android WebView crashes
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const isNativeCapacitor = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      (window as any).Capacitor?.getPlatform?.() === 'android' ||
      (window as any).Capacitor?.getPlatform?.() === 'ios' ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:'
    );

    const isDevOrPreview =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('run.app') ||
      window.location.hostname.includes('aistudio') ||
      window.location.port !== '';

    if (isNativeCapacitor || isDevOrPreview) {
      // In Native Android / Dev / Preview environments, actively unregister any stale service workers
      // to guarantee zero interference with local bundled assets
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().catch(() => {});
          }
        })
        .catch(() => {});

      if ('caches' in window) {
        caches.keys()
          .then((keys) => {
            for (const k of keys) {
              if (k.startsWith('arzontj-')) {
                caches.delete(k).catch(() => {});
              }
            }
          })
          .catch(() => {});
      }
    } else if (window.location.protocol === 'https:') {
      // Only register service worker in pure production custom web domain
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }
} catch (swErr) {
  console.warn('ServiceWorker lifecycle check bypassed:', swErr);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
