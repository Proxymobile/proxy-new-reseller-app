'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import Link from 'next/link';
import { isPublicPath } from '@/lib/public-paths';

const ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';
const ENABLED = /^G-[A-Z0-9]+$/.test(ID);
const STORAGE_KEY = 'proxymobile-analytics-consent';
type Consent = 'accepted' | 'rejected' | null;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

// Never send account paths, query strings, access codes, or wallet details.
function publicPage(path: string) {
  return isPublicPath(path);
}

export function SiteAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const initialized = useRef(false);
  const lastPage = useRef<string | null>(null);
  const allowed = publicPage(pathname);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'accepted' || saved === 'rejected') setConsent(saved);
    } catch { /* A blocked storage API must not prevent the page loading. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ENABLED || !ready) return;
    const w = window;
    const active = consent === 'accepted' && allowed;
    w[`ga-disable-${ID}`] = !active;
    if (!active) {
      lastPage.current = null;
      return;
    }
    w.dataLayer ??= [];
    w.gtag ??= function () { w.dataLayer!.push(arguments); };
    if (!initialized.current) {
      w.gtag('consent', 'default', {
        analytics_storage: 'granted', ad_storage: 'denied',
        ad_user_data: 'denied', ad_personalization: 'denied',
      });
      w.gtag('js', new Date());
      w.gtag('config', ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: 60 * 60 * 24 * 180,
        page_location: window.location.origin + pathname,
        page_referrer: '',
      });
      initialized.current = true;
    }
    const location = window.location.origin + pathname;
    w.gtag('set', { page_location: location, page_referrer: '' });
    if (lastPage.current !== pathname) {
      w.gtag('event', 'page_view', {
        send_to: ID, page_location: location, page_title: document.title,
        page_referrer: '',
      });
      lastPage.current = pathname;
    }
    const onClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link) return;
      const href = link.getAttribute('href');
      const action = href === '/login' || href === '/register' ? 'get_started'
        : href === '#pricing' || href === '/#pricing' ? 'view_pricing'
        : href === '/mobile-proxy-api' ? 'view_api_guide' : null;
      if (action) w.gtag?.('event', 'cta_click', {
        send_to: ID, action, page_location: location, page_referrer: '',
      });
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      w[`ga-disable-${ID}`] = true;
    };
  }, [pathname, consent, ready, allowed]);

  function choose(value: Exclude<Consent, null>) {
    if (value === 'rejected') {
      window[`ga-disable-${ID}`] = true;
      // Remove first-party GA cookies when consent is withdrawn.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (name !== '_ga' && !name.startsWith('_ga_')) continue;
        document.cookie = `${name}=; Max-Age=0; Path=/`;
        const parts = window.location.hostname.split('.');
        for (let i = 0; i < parts.length - 1; i++) {
          document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${parts.slice(i).join('.')}`;
        }
      }
    }
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Session-only choice. */ }
    setConsent(value);
    setPreferences(false);
  }

  if (!ENABLED || !ready) return null;
  return <>
    {consent === 'accepted' && allowed && <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${ID}`}
      strategy="afterInteractive"
    />}
    {(consent === null || preferences) ? (
      <section aria-label="Analytics preferences" className="fixed bottom-20 sm:bottom-5 left-4 right-4 sm:left-auto sm:max-w-md z-[100] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <h2 className="font-semibold text-[var(--color-text)]">Analytics cookies</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Allow Google Analytics to measure visits and button clicks on our public pages? You can change your choice anytime. <Link href="/privacy" className="underline">Privacy policy</Link></p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => choose('rejected')} className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)]">Reject analytics</button>
          <button onClick={() => choose('accepted')} className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)]">Allow analytics</button>
        </div>
      </section>
    ) : <button onClick={() => setPreferences(true)} className="fixed bottom-20 sm:bottom-4 left-4 z-[60] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-muted)]">Cookie settings</button>}
  </>;
}
