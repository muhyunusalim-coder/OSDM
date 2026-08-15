import { ComponentType, lazy } from 'react';

/**
 * Enhanced React.lazy that automatically retries failed dynamic imports
 * due to network timeouts, chunk deployment updates, or stale browser cache.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      console.warn('Dynamic import chunk failed, retrying...', error);
      // Brief pause before retry
      await new Promise(resolve => setTimeout(resolve, 600));
      try {
        return await factory();
      } catch (secondError: any) {
        console.error('Dynamic import second retry failed:', secondError);
        // If second retry fails, unregister service workers, clear cache and hard reload
        const lastReload = Number(sessionStorage.getItem('last_chunk_reload') || '0');
        
        if (Date.now() - lastReload > 10000) {
          sessionStorage.setItem('last_chunk_reload', String(Date.now()));
          
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for(let registration of registrations) {
                registration.unregister();
              }
            });
          }
          if ('caches' in window) {
            caches.keys().then((keyList) => {
              return Promise.all(keyList.map((key) => {
                return caches.delete(key);
              }));
            });
          }
          
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
        throw secondError;
      }
    }
  });
}
