'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isPublicPath } from '@/lib/public-paths';

/**
 * Counts public page views for the admin traffic panel. No cookies or storage;
 * sends only the path, the referring site and a utm_source tag. Honors
 * Do Not Track and Global Privacy Control.
 */
export function PageBeacon() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || !isPublicPath(pathname)) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl) return;

    const isFirst = first.current;
    first.current = false;
    let utm: string | null = null;
    try { utm = isFirst ? new URLSearchParams(window.location.search).get('utm_source') : null; } catch { /* ignore */ }
    const payload = JSON.stringify({
      p: pathname,
      r: isFirst ? document.referrer : window.location.origin,
      u: utm,
    });
    try {
      if (!navigator.sendBeacon?.('/api/track', payload)) {
        fetch('/api/track', { method: 'POST', body: payload, keepalive: true }).catch(() => {});
      }
    } catch { /* never break the page */ }
  }, [pathname]);

  return null;
}
