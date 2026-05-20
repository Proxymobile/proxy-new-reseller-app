# INDEX.md -- Master Documentation Index

> Single source of truth for all project context, architecture, and operational state.
> Every doc file links back here. Update this when adding/changing docs.

## Quick Status

| Item | Value |
|------|-------|
| **App URL** | http://72.62.117.94 |
| **VPS** | Hetzner / Ubuntu 24.04 / 8GB RAM / 96GB disk |
| **Stack** | Next.js 15.3 + PostgreSQL 17 + Auth.js v5 + Stripe + Caddy |
| **Deploy** | Docker Compose (3 containers: app, db, caddy) |
| **Build** | 34 routes, all passing, standalone output |
| **Auth** | Access code + Admin password + ETH wallet |
| **SSH** | `ssh -i ~/.ssh/proxy_reseller_deploy root@72.62.117.94` |

---

## Documentation Map

### Full Platform Context (START HERE)
- [PLATFORM-STATUS.md](./PLATFORM-STATUS.md) -- **Complete platform overview**: stack, all DB schemas, all API endpoints, all pages, proxy system, auth flows, deployment, feature status. Best single-file context for agents.
- [ARCHITECTURE.puml](./ARCHITECTURE.puml) -- **PlantUML diagrams**: system architecture, ERD, purchase flow, auth flow, proxy URL flow. Paste into https://plantuml.com/ to render.

### Architecture & Design
- [ARCHITECTURE.md](./ARCHITECTURE.md) -- System design, data flow, trust boundaries
- [SCHEMA.md](./SCHEMA.md) -- Database tables, indexes, constraints
- [AUTH.md](./AUTH.md) -- Authentication flow, access code system, roles

### Operations
- [DEPLOY.md](./DEPLOY.md) -- VPS setup, Docker Compose, Caddy, deployment workflow
- [ENV.md](./ENV.md) -- Environment variables reference
- [RUNBOOK.md](./RUNBOOK.md) -- Common ops tasks, troubleshooting, logs

### Security
- [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) -- Audit findings, fixes applied, remaining items

### Integration
- [PROXIES-SX.md](./PROXIES-SX.md) -- Pool SDK integration, key lifecycle, proxy URL grammar
- [STRIPE.md](./STRIPE.md) -- Payment flow, webhook handling, idempotency
- [HERMES-AGENT.md](./HERMES-AGENT.md) -- Hermes Agent integration plan, guardrails, agentic control

### Development
- [CONVENTIONS.md](./CONVENTIONS.md) -- Code style, patterns, file organization
- [ROADMAP.md](./ROADMAP.md) -- Planned features, scaling strategy

---

## File Tree (source of truth)

```
proxy-new-reseller-app/
  src/
    config.ts                              # Brand, pricing (3 plans), countries (6)
    middleware.ts                           # Route protection via Auth.js
    lib/
      auth.ts                              # 3 credential providers + user management
      auth.config.ts                       # Middleware auth callbacks
      db.ts                                # PG pool (max 10), query(), queryOne()
      proxies.ts                           # Lazy ProxiesClient singleton
      stripe.ts                            # Lazy Stripe singleton
      wallet.ts                            # HMAC challenges + ETH signature verify (viem)
      hashcode.ts                          # Hash generation utilities
    app/
      page.tsx                             # Landing page
      (auth)/
        login/page.tsx                     # Access code + wallet + admin password
        register/page.tsx                  # Registration redirect
      dashboard/
        layout.tsx                         # Sidebar: balance, nav, sign out
        page.tsx                           # Overview + how-it-works + active plan
        keys/page.tsx                      # Proxy management + batch generator + docs
        purchase/page.tsx                  # Plan selection + balance purchase
        settings/page.tsx                  # Account info + wallet linking + 2FA
      admin/
        layout.tsx                         # Admin sidebar
        page.tsx                           # Admin overview
        accounts/page.tsx                  # User list + search + inline actions
        accounts/[id]/page.tsx             # Per-user: edit, balance, wallets, history
        accounts/create/page.tsx           # Create account form
        audit/page.tsx                     # Audit log viewer
        keys/page.tsx                      # Pool keys overview
      api/
        auth/
          [...nextauth]/route.ts           # Auth.js handler
          signup/route.ts                  # Self-registration
          wallet-challenge/route.ts        # Wallet login challenge (HMAC)
        balance/
          route.ts                         # GET balance
          purchase/route.ts                # Balance purchase -> PAK provision
        pool/
          keys/route.ts                    # GET/PATCH PAK (CRUD + traffic sync)
          proxy-url/route.ts               # Server-side URL builder
          stock/route.ts                   # Live pool modem counts
        user/
          profile/route.ts                 # User profile data
        wallet/
          challenge/route.ts               # Wallet link challenge (DB-backed)
          verify/route.ts                  # Wallet signature verify
          list/route.ts                    # List linked wallets
        admin/
          accounts/route.ts                # GET/POST/PATCH accounts
          accounts/[id]/route.ts           # GET/PATCH per-user detail
          balance/route.ts                 # POST credit/debit
        stripe/
          checkout/route.ts                # Create checkout session
          webhook/route.ts                 # Handle checkout.session.completed
  db/
    schema.sql                             # 8 tables + 17 indexes, idempotent
  deploy/
    docker-compose.prod.yml                # Production: db + app + caddy
    Caddyfile                              # Reverse proxy config
  docs/                                    # <- YOU ARE HERE
  Dockerfile                               # Multi-stage Node 22 Alpine
  package.json                             # Dependencies
  tsconfig.json                            # Strict TypeScript
```

---

## Key Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Raw PostgreSQL over ORM | Readable schema.sql, no magic, ~30 LOC in db.ts |
| 2 | JWT sessions over DB sessions | Simpler for MVP, no session table maintenance |
| 3 | Access code auth over passwords | Unique to proxy business; simple, admin-generated codes |
| 4 | Lazy client initialization | Prevents build-time crashes when env vars unavailable |
| 5 | Separate admin/customer layouts | Different trust levels, prevents cross-contamination |
| 6 | Caddy over nginx | Auto-TLS, simpler config, production-ready defaults |
| 7 | Timing-safe credential comparison | Prevents timing attacks on all auth paths |
| 8 | Stateless HMAC wallet login | No DB state needed for wallet login challenges |
| 9 | Client-side proxy URL generation | No API roundtrip for batch generation, instant UX |
| 10 | Auto-refund on provider failure | Balance purchase debits first, refunds if PAK creation fails |

---

## Scaling Checklist (when ready)

- [ ] Add domain + TLS (update Caddyfile + AUTH_URL)
- [ ] Replace Stripe placeholder keys with live keys
- [ ] Connection pooling via PgBouncer for high traffic
- [ ] Redis for rate limiting / caching
- [ ] Horizontal scaling: multiple app containers behind Caddy
- [ ] CDN for static assets
- [ ] Hermes Agent integration for autonomous management
- [ ] Monitoring: Prometheus + Grafana
- [ ] Backups: pg_dump cron to S3
- [ ] 2FA: Google Authenticator (TOTP)
- [ ] Solana wallet auth (schema ready, no frontend)
