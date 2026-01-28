'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    let timeoutId: NodeJS.Timeout;

    const startLoading = () => {
      handleStart();
      timeoutId = setTimeout(() => {
        handleComplete();
      }, 1000);
    };

    const originalPush = router.push;
    const originalReplace = router.replace;

    router.push = (...args: Parameters<typeof originalPush>) => {
      startLoading();
      return originalPush.apply(router, args);
    };

    router.replace = (...args: Parameters<typeof originalReplace>) => {
      startLoading();
      return originalReplace.apply(router, args);
    };

    return () => {
      router.push = originalPush;
      router.replace = originalReplace;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router]);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-500 animate-pulse">
        <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
      </div>
    </div>
  );
}

export function PageLoader({ loading }: { loading: boolean }) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}