'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RouterBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: 'SHELL_NAVIGATE', path: pathname }, '*');
  }, [pathname]);

  return null;
}
