import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Start with null to indicate "not yet determined" in SSR
  const [matches, setMatches] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);

    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener('change', listener);

    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  // Return false during SSR and initial render to ensure consistent hydration
  // Components using this hook should handle the initial render gracefully
  if (!hasMounted) {
    return false;
  }

  return matches ?? false;
}