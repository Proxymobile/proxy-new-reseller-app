import { proxies } from '@/lib/proxies';

/**
 * Live, per-country inventory — what we can actually sell right now.
 *
 * "Mobile" = carrier modems (`mbl` tier) + peer devices classified as mobile.
 * "Residential" = peer devices classified as residential.
 * Unclassified / datacenter peers are never counted: we only advertise what a
 * customer's `iptype-*` filter can really route to.
 *
 * Exit IPs are never exposed — counts and carrier names only, by design.
 */
export interface CountryInventory {
  /** ISO 3166-1 alpha-2, lowercase (matches the proxy username token). */
  code: string;
  /** Routable carrier modems (dedicated `mbl` tier). */
  modem: number;
  /** Routable peer devices on a mobile carrier. */
  peerMobile: number;
  /** Routable peer devices on a home ISP. */
  residential: number;
  /** modem + peerMobile. */
  mobile: number;
  /** Mobile carriers seen right now, most devices first. */
  carriers: string[];
}

export interface Inventory {
  countries: CountryInventory[];
  generatedAt: string;
}

const AVAILABILITY_URL = 'https://api.proxies.sx/v1/gateway/pool/availability';
const TTL_MS = 5 * 60_000;
const TIMEOUT_MS = 8_000;

interface AvailabilityEntry {
  routableModem?: number;
  routablePeer?: number;
  peerIpTypes?: { mobile?: number; residential?: number };
}

let cache: { at: number; value: Inventory } | null = null;
let inflight: Promise<Inventory> | null = null;

async function fetchAvailability(): Promise<Record<string, AvailabilityEntry>> {
  const res = await fetch(AVAILABILITY_URL, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`availability ${res.status}`);
  const body = (await res.json()) as { countries?: Record<string, AvailabilityEntry> };
  if (!body.countries || typeof body.countries !== 'object') {
    throw new Error('availability: unexpected response shape');
  }
  return body.countries;
}

/** Mobile carrier names per country. Best-effort: inventory still works without it. */
async function fetchMobileCarriers(): Promise<Record<string, string[]>> {
  try {
    const stock = await proxies().pool.getCarrierStock({ pool: 'all' });
    const out: Record<string, string[]> = {};
    for (const [cc, entry] of Object.entries(stock.countries)) {
      out[cc.toLowerCase()] = entry.carriers
        .filter((c) => c.ipType === 'mobile' && c.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((c) => c.name);
    }
    return out;
  } catch (err) {
    console.warn('[inventory] carrier stock unavailable:', err instanceof Error ? err.message : err);
    return {};
  }
}

async function load(): Promise<Inventory> {
  const [availability, carriers] = await Promise.all([fetchAvailability(), fetchMobileCarriers()]);
  const countries: CountryInventory[] = Object.entries(availability).map(([cc, v]) => {
    const code = cc.toLowerCase();
    const modem = v.routableModem ?? 0;
    // peerIpTypes counts online peers; never report more than are routable.
    const routablePeer = v.routablePeer ?? 0;
    const peerMobile = Math.min(v.peerIpTypes?.mobile ?? 0, routablePeer);
    const residential = Math.min(v.peerIpTypes?.residential ?? 0, routablePeer);
    return {
      code,
      modem,
      peerMobile,
      residential,
      mobile: modem + peerMobile,
      carriers: carriers[code] ?? [],
    };
  });
  countries.sort((a, b) => b.mobile - a.mobile || b.residential - a.residential);
  return { countries, generatedAt: new Date().toISOString() };
}

/**
 * Cached inventory. Serves the last good snapshot if the upstream is down, so
 * a brief Proxies.sx blip never blanks the storefront or the dashboard.
 * Returns null only if we have never loaded successfully.
 */
export async function getInventory(): Promise<Inventory | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  if (!inflight) {
    inflight = load()
      .then((value) => {
        cache = { at: Date.now(), value };
        return value;
      })
      .finally(() => {
        inflight = null;
      });
  }
  try {
    return await inflight;
  } catch (err) {
    console.error('[inventory] refresh failed:', err instanceof Error ? err.message : err);
    return cache?.value ?? null;
  }
}

export async function getCountryInventory(code: string): Promise<CountryInventory | null> {
  const inv = await getInventory();
  return inv?.countries.find((c) => c.code === code.toLowerCase()) ?? null;
}
