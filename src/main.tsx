import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Manage Service Worker lifecycle safely
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  const isDevOrPreview =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('run.app') ||
    window.location.hostname.includes('aistudio') ||
    window.location.port !== '';

  if (isDevOrPreview) {
    // Unregister any stale service workers in dev/preview environments to prevent white screen crashes
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});

    // Clear any obsolete caches in dev or preview to guarantee fresh bundle
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const k of keys) {
          if (k.startsWith('arzontj-')) {
            caches.delete(k);
          }
        }
      }).catch(() => {});
    }
  } else if (window.location.protocol === 'https:') {
    // Only register service worker in pure production custom domain
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
