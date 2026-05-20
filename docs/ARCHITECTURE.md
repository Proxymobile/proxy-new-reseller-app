# ARCHITECTURE.md

> System design, data flow, trust boundaries.

2233## Overview

Two-sided proxy reseller platform: customers buy bandwidth, admins manage the business.

```
Browser (Customer)              Browser (Admin)
      │                               │
      │ HTTPS                         │ HTTPS
      ▼                               ▼
┌─────────────────────────────────────────┐
│           Caddy (TLS termination)       │
│           :80 / :443 → app:3000        │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Next.js 15 App (standalone)      │
│                                          │
│  /login, /register        Auth pages     │
│  /dashboard/*             Customer UI    │
│  /admin/*                 Admin UI       │
│  /api/auth/*              Auth endpoints │
│  /api/pool/*              Proxy SDK      │
│  /api/stripe/*            Payments       │
│  /api/admin/*             Admin API      │
│                                          │
│  ProxiesClient (server-side only)        │
│  ────────────────────────────────────→   │
│              api.proxies.sx              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         PostgreSQL 17                    │
│                                          │
│  users          → auth + roles           │
│  customers      → proxy key bindings     │
│  purchases      → payment records        │
│  webhook_events → idempotency            │
│  audit_log      → all mutations          │
└──────────────────────────────────────────┘
```

## Trust Boundaries

1. **psx_ API key** — server-side only, never in browser, never in NEXT_PUBLIC_
2. **pak_ customer key** — stored in DB, shown to customer, used at gw.proxies.sx
3. **Stripe webhook** — signature verified, idempotent via webhook_events table
4. **Admin routes** — double-gated: middleware auth + isAdmin() DB check
5. **Customer routes** — scoped by user_id from JWT session

## Request Flow: Purchase → Key Mint

```
1. Customer clicks "Buy" on /dashboard/purchase
2. POST /api/stripe/checkout → creates Stripe session
3. Customer redirected to Stripe
4. Payment succeeds → Stripe sends webhook
5. POST /api/stripe/webhook:
   a. Verify signature
   b. Check idempotency (webhook_events)
   c. If new customer: proxies.poolKeys.create() → mint pak_ key
   d. If existing: proxies.poolKeys.topUp() → extend
   e. Write to purchases + audit_log
6. Customer sees key on /dashboard/keys
7. Customer generates proxy URL → uses at gw.proxies.sx:7000
```
