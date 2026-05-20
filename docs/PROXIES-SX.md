# PROXIES-SX.md

> Pool SDK integration, key lifecycle, proxy URL grammar.

## SDK Client

Located at `src/lib/proxies.ts` — lazy singleton, never instantiated at import time.

```ts
import { proxies } from '@/lib/proxies';
const client = proxies(); // returns ProxiesClient instance
```

## Key Lifecycle

```
1. Customer pays → Stripe webhook fires
2. proxies().poolKeys.create({ label, trafficCapGB, expiresAt, idempotencyKey })
   → returns { id, key: "pak_...", ... }
3. Store pak_key_id + pak_key in customers table
4. Customer uses key at gw.proxies.sx:7000

On top-up:
5. proxies().poolKeys.topUp(keyId, { addTrafficGB, extendDays, idempotencyKey })

On cap exceeded:
6. Platform auto-suspends (enabled=false)
7. Must topUp() + update({ enabled: true }) to restore
```

## Proxy URL Grammar

```
http://{username}-{tokens}:{pak_key}@gw.proxies.sx:7000
```

Tokens (any order, dash-separated):
- `mbl` / `peer` — pool type (mobile/residential)
- `us`, `de`, `pl`, etc. — ISO country code
- `sid-{id}` — sticky session ID
- `rot-sticky` / `rot-auto10` / `rot-auto30` / `rot-hard` — rotation policy

Example:
```
http://psx_acme-mbl-us-sid-user123-rot-sticky:pak_abc123@gw.proxies.sx:7000
```

## API Methods Used

| Method | Where Used | Purpose |
|--------|-----------|---------|
| `poolKeys.create()` | webhook/route.ts | Mint key on first purchase |
| `poolKeys.topUp()` | webhook/route.ts, admin/customers | Extend cap + expiry |
| `poolKeys.get()` | pool/keys/route.ts | Fetch key data for dashboard |
| `poolKeys.update()` | admin/customers | Toggle enabled state |
| `buildProxyUrl()` | pool/proxy-url/route.ts | Generate connection strings |
