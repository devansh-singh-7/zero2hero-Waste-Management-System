import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useOptimizedNavigation() {
  const router = useRouter();

  const navigateTo = useCallback((path: string, options?: {
    replace?: boolean;
    prefetch?: boolean;
  }) => {
    if (options?.prefetch !== false) {
      // Prefetch the route for faster navigation
      router.prefetch(path);
    }
    
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);

  const navigateWithDelay = useCallback((path: string, delay: number = 100) => {
    setTimeout(() => {
      navigateTo(path);
    }, delay);
  }, [navigateTo]);

  return {
    navigateTo,
    navigateWithDelay,
    prefetch: router.prefetch,
    refresh: router.refresh,
  };
}