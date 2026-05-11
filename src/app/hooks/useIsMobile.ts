import { useEffect, useState } from 'react';

/**
 * Returns true when the viewport width is below `breakpoint` (default 768px,
 * which matches Tailwind's `md` breakpoint).
 *
 * Used by chart components to swap heights, tooltip widths, legend layouts,
 * etc. between mobile and tablet/desktop. Safe to call during SSR — defaults
 * to false until the effect runs on the client.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
