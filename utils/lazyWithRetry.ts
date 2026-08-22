import { ComponentType, lazy } from 'react';

/**
 * Enhanced React.lazy that automatically retries failed dynamic imports
 * with backoff and automatic chunk reload handling.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const result = await factory();
        // Clear reload count on success
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('chunk_reload_count');
        }
        return result;
      } catch (error: any) {
        console.warn(`Dynamic import attempt ${attempts} failed:`, error);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempts * 350));
        } else {
          // Check if we should do a clean reload
          if (typeof window !== 'undefined') {
            const reloadCount = parseInt(sessionStorage.getItem('chunk_reload_count') || '0', 10);
            if (reloadCount < 2) {
              sessionStorage.setItem('chunk_reload_count', String(reloadCount + 1));
              console.info('Reloading page to fetch updated chunks...');
              window.location.reload();
            }
          }
          throw error;
        }
      }
    }
    return await factory();
  });
}
