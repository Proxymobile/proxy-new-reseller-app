import type { ProxyPool, ProxyProtocol, Rotation } from '@/lib/proxy-url';

/** Per-browser proxy defaults (a convenience only — nothing depends on them server-side). */
export interface DashPrefs {
  pool: ProxyPool;
  country: string;
  protocol: ProxyProtocol;
  rotation: Rotation;
}

const KEY = 'proxymobile_proxy_defaults';
export const DEFAULT_PREFS: DashPrefs = { pool: 'mbl', country: 'us', protocol: 'http', rotation: 'sticky' };

export function loadPrefs(): DashPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    // Migrate the old settings page's values.
    const old = JSON.parse(localStorage.getItem('proxymobile_prefs') ?? 'null');
    if (old) return { ...DEFAULT_PREFS, pool: old.defaultPool ?? 'mbl', country: old.defaultCountry ?? 'us' };
  } catch { /* storage unavailable */ }
  return DEFAULT_PREFS;
}

export function savePrefs(p: DashPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
