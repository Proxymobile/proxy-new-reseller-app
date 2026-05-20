# ProxyHub Platform Status

> Last updated: 2026-05-07
> Live at: http://72.62.117.94 (Hetzner VPS, Ubuntu 24.04, 8GB RAM)

---

## 1. What Is This

ProxyHub is a white-label proxy reseller platform. It sits between Proxies.sx (the upstream pool provider) and end customers. Customers purchase traffic plans, receive a Pool Access Key (PAK), and build proxy URLs that route through Proxies.sx's gateway (`gw.proxies.sx`). The entire session/country/rotation config is encoded in the proxy URL username — no runtime dashboard interaction needed once URLs are generated.

**Business model**: Admin credits customer balance -> customer purchases a plan -> plan provisions a PAK with traffic cap + expiry via Proxies.sx API -> customer generates proxy URLs client-side and uses them in any HTTP client.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, standalone output) | 15.3 |
| Language | TypeScript (strict) | 5.7 |
| Database | PostgreSQL (raw parameterized queries via `pg`) | 17 |
| Auth | Auth.js / next-auth (JWT strategy) | 5.0.0-beta.25 |
| Payments | Stripe (Checkout + Webhooks) | SDK 17.5 |
| Proxy Provider | @proxies-sx/pool-sdk | 0.3.x |
| Wallet Auth | viem (ETH signature verification) | 2.48 |
| Styling | Tailwind CSS v4 | 4.0 |
| Animations | Framer Motion | 12.38 |
| Runtime | Node.js 22 (Alpine Docker) | 22 |
| Reverse Proxy | Caddy 2 | 2-alpine |

---

## 3. Architecture Overview

```
Browser
  |
  v
Caddy (:80/:443) --> Next.js App (:3000)
                         |
              +----------+----------+
              |                     |
         PostgreSQL 17         Proxies.sx API
         (local Docker)        (external SaaS)
              |
         8 tables
```

### Two Dashboards
- `/dashboard/*` — Customer-facing (proxy key management, purchase, settings)
- `/admin/*` — Admin-facing (account management, balance, audit)

### Three Docker Containers
- `deploy-db-1` — PostgreSQL 17 (persistent volume `pgdata`)
- `deploy-app-1` — Next.js standalone (port 3000, internal only)
- `deploy-caddy-1` — Caddy reverse proxy (ports 80/443, public)

---

## 4. Authentication System

Three credential providers, all via Auth.js Credentials:

| Provider ID | Method | Who |
|-------------|--------|-----|
| `access-code` | 16-hex access code (`xxxx-xxxx-xxxx-xxxx`) | All users |
| `admin-password` | Single shared password (`ADMIN_PASSWORD` env) | Admin only |
| `wallet` | ETH wallet signature (MetaMask) | Users with linked wallets |

**Security measures:**
- Timing-safe comparison on all credential checks (`crypto.timingSafeEqual`)
- Rate limiting: 5 failed attempts per 15 minutes per access code (hashed)
- Stateless HMAC-based wallet login challenges (no DB state for login flow)
- JWT session strategy (stateless, no server-side session store)
- Login attempts logged and auto-cleaned after 24h

**Session shape:**
```typescript
{ user: { id, name, email, role, label, walletRequired, walletChain } }
```

---

## 5. Database Schema

### 5.1 Tables

#### `users` — Core identity
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| label | TEXT NOT NULL | Display name |
| email | TEXT | Optional |
| access_code | TEXT UNIQUE | Login credential, `xxxx-xxxx-xxxx-xxxx` |
| role | TEXT | `'customer'` or `'admin'` |
| balance_usd | NUMERIC(10,2) | Account balance, default 0 |
| enabled | BOOLEAN | Account active flag |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `customers` — Proxy subscription state
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK UNIQUE | -> users.id |
| pak_key_id | TEXT | Proxies.sx key ID (MongoDB ObjectId) |
| pak_key | TEXT | The `pak_` secret key |
| traffic_cap_gb | NUMERIC(10,2) | Plan traffic limit |
| traffic_used_gb | NUMERIC(10,2) | Synced from provider on each GET |
| plan_id | TEXT | Current plan (`starter`/`pro`/`scale`) |
| expires_at | TIMESTAMPTZ | Plan expiry |
| CHECK | | pak_key_id and pak_key must both be null or both non-null |

#### `wallet_links` — Linked wallets for auth
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | -> users.id, CASCADE |
| chain | TEXT | `'solana'` or `'ethereum'` |
| address | TEXT | Lowercase, UNIQUE(chain, address) |
| verified | BOOLEAN | Signature verified |
| linked_at | TIMESTAMPTZ | |

#### `wallet_challenges` — Ephemeral signature challenges (wallet linking only)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | -> users.id, CASCADE |
| nonce | TEXT UNIQUE | Random hex |
| chain | TEXT | |
| address | TEXT | |
| expires_at | TIMESTAMPTZ | now() + 5 min |
| used | BOOLEAN | |

#### `login_attempts` — Rate limiting
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| access_code_hash | TEXT | SHA-256 truncated to 16 chars |
| ip_address | INET | Optional |
| success | BOOLEAN | |
| attempted_at | TIMESTAMPTZ | |

#### `balance_transactions` — Ledger
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | -> users.id, CASCADE |
| amount_usd | NUMERIC(10,2) | Always positive |
| type | TEXT | `'credit'` or `'debit'` |
| reason | TEXT | Human-readable |
| reference | TEXT | e.g. plan ID, Stripe session |
| created_by | UUID FK | Admin who initiated (nullable) |
| created_at | TIMESTAMPTZ | |

#### `purchases` — Purchase history
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID FK | -> customers.id, CASCADE |
| stripe_session_id | TEXT UNIQUE | Nullable (balance purchases have none) |
| plan_id | TEXT | |
| gb_amount | NUMERIC(10,2) | |
| price_usd | NUMERIC(10,2) | |
| status | TEXT | `pending`/`completed`/`failed`/`refunded` |
| created_at | TIMESTAMPTZ | |

#### `webhook_events` — Stripe idempotency
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| stripe_event_id | TEXT UNIQUE | |
| event_type | TEXT | |
| processed_at | TIMESTAMPTZ | |

#### `audit_log` — All mutations tracked
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| actor_id | UUID FK | -> users.id, SET NULL |
| action | TEXT | e.g. `balance_purchase`, `key_toggle` |
| target_type | TEXT | e.g. `user`, `pool_key`, `customer` |
| target_id | TEXT | |
| metadata | JSONB | Additional context |
| ip_address | INET | |
| created_at | TIMESTAMPTZ | |

### 5.2 Indexes
All tables have appropriate indexes on foreign keys, lookup columns, and time-series columns. See `db/schema.sql` for the full list (17 indexes).

---

## 6. API Endpoints

### 6.1 Auth
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `*` | `/api/auth/[...nextauth]` | Public | Auth.js handler (login/logout/session) |
| POST | `/api/auth/signup` | Public | Self-registration, returns one-time access code |
| POST | `/api/auth/wallet-challenge` | Public | Get HMAC-signed challenge for wallet login |

### 6.2 Customer APIs
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/balance` | User | Get current balance |
| POST | `/api/balance/purchase` | User | Purchase plan with balance (debit + provision PAK) |
| GET | `/api/pool/keys` | User | Get user's PAK data + sync traffic from provider |
| PATCH | `/api/pool/keys` | User | Key actions: `toggle_enabled`, `regenerate`, `delete` |
| POST | `/api/pool/proxy-url` | User | Server-side proxy URL generation |
| GET | `/api/pool/stock` | User | Live pool modem counts per country (mbl/peer) |
| GET | `/api/user/profile` | User | User profile: label, email, access code, role, created_at |
| POST | `/api/wallet/challenge` | User | Create wallet linking challenge (DB-backed) |
| POST | `/api/wallet/verify` | User | Verify wallet signature and link |
| GET | `/api/wallet/list` | User | List linked wallets |

### 6.3 Admin APIs
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/admin/accounts` | Admin | List all users with customer/wallet data |
| POST | `/api/admin/accounts` | Admin | Create new account |
| PATCH | `/api/admin/accounts` | Admin | Actions: `toggle_enabled`, `regenerate_code`, `unlink_wallet` |
| GET | `/api/admin/accounts/[id]` | Admin | Full user detail + wallets + transactions + purchases |
| PATCH | `/api/admin/accounts/[id]` | Admin | Update user fields (label, email, role) |
| POST | `/api/admin/balance` | Admin | Credit or debit user balance |

### 6.4 Stripe
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/stripe/checkout` | User | Create Stripe Checkout session |
| POST | `/api/stripe/webhook` | Stripe | Handle `checkout.session.completed` (idempotent) |

---

## 7. Pages

### 7.1 Public
| Path | Type | Description |
|------|------|-------------|
| `/` | Static | Landing page |
| `/login` | Static | Access code + wallet + admin password login |
| `/register` | Static | Redirect/alias |
| `/terms` | Static | Terms of service |
| `/privacy` | Static | Privacy policy |

### 7.2 Customer Dashboard (`/dashboard/*`)
| Path | Type | Description |
|------|------|-------------|
| `/dashboard` | Server | Overview: welcome, how-it-works guide, active plan card, stats |
| `/dashboard/keys` | Client | Full proxy management: key status, live pool grid, batch URL generator, connection reference |
| `/dashboard/purchase` | Client | Plan selection + balance purchase |
| `/dashboard/settings` | Client | Account info (access code reveal/copy), wallet linking, 2FA placeholder |

### 7.3 Admin Panel (`/admin/*`)
| Path | Type | Description |
|------|------|-------------|
| `/admin` | Server | Admin overview |
| `/admin/accounts` | Client | User list with search, inline actions, click-to-detail |
| `/admin/accounts/[id]` | Client | Per-user management: edit, balance credit/debit, wallets, transactions, purchases |
| `/admin/accounts/create` | Client | Create new user account |
| `/admin/audit` | Server | Audit log viewer |
| `/admin/keys` | Server | Pool keys overview |

---

## 8. Proxy System

### 8.1 How It Works
1. Customer purchases a plan (balance debit or Stripe)
2. Platform creates a Pool Access Key (PAK) via `@proxies-sx/pool-sdk`
3. PAK has traffic cap (GB) and expiry (days)
4. Customer generates proxy URLs client-side using their PAK + reseller username
5. URLs route through `gw.proxies.sx` on port 7000 (HTTP) or 7001 (SOCKS5)

### 8.2 Proxy URL Format
```
{protocol}://{username}-{pool}-{country}[-sid-{id}][-rot-{mode}]:{pak_key}@gw.proxies.sx:{port}
```

**Tokens (in order):**
| Token | Values | Required |
|-------|--------|----------|
| pool | `mbl` (mobile 4G/5G), `peer` (residential) | Yes |
| country | ISO 2-letter (`us`, `de`, `pl`, `fr`, `es`, `gb`, `ch`, `pa`, `am`) | Yes |
| carrier | `-carrier-{name}` (e.g. `att`, `tmobile`) | No |
| city | `-city-{name}` (e.g. `nyc`) | No |
| sid | `-sid-{id}` (session pinning) | No |
| rot | `-rot-{mode}` (rotation) | No |

**Rotation modes:**
| Mode | Behavior |
|------|----------|
| `sticky` | Same IP for session lifetime. Use with `-sid-` for persistence across reconnects |
| `auto10` | New IP every 10 minutes |
| `auto30` | New IP every 30 minutes |
| `hard` | New IP on every connection |
| `none` | Default gateway behavior (~1h TTL) |

**Ports:** HTTP = 7000, SOCKS5 = 7001

### 8.3 SDK Methods Used
```typescript
proxies().poolKeys.create(input)    // Mint new PAK
proxies().poolKeys.get(id)          // Fetch PAK data + live traffic
proxies().poolKeys.update(id, input) // Toggle enabled, update cap/expiry
proxies().poolKeys.topUp(id, input) // Add traffic + extend expiry (atomic)
proxies().poolKeys.regenerate(id)   // Rotate the pak_ secret
proxies().poolKeys.delete(id)       // Delete PAK
proxies().pool.getStock()           // Live modem counts per country
proxies().buildProxyUrl(pakKey, opts) // Server-side URL builder
```

---

## 9. Key Lib Files

| File | Purpose |
|------|---------|
| `src/config.ts` | Brand, pricing plans, countries (single source of truth) |
| `src/lib/db.ts` | PG pool (max 10), `query()`, `queryOne()` helpers |
| `src/lib/auth.ts` | 3 credential providers, `createAccount()`, `regenerateAccessCode()`, `isAdmin()` |
| `src/lib/auth.config.ts` | Middleware auth config (route protection) |
| `src/lib/proxies.ts` | Lazy singleton `ProxiesClient` |
| `src/lib/stripe.ts` | Lazy singleton `Stripe` |
| `src/lib/wallet.ts` | HMAC challenges, ETH signature verification via viem |
| `src/middleware.ts` | Next.js middleware (protects `/dashboard/*` and `/admin/*`) |

---

## 10. Pricing Plans

| Plan | GB | Price | Duration |
|------|----|-------|----------|
| Starter | 5 | $35 | 30 days |
| Pro | 25 | $150 | 30 days |
| Scale | 100 | $500 | 30 days |

Purchase flow: Balance debit -> PAK creation/top-up -> Record purchase + audit log.
On provider failure: Automatic balance refund.

---

## 11. Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (set by Docker Compose) |
| `DB_PASSWORD` | Postgres password (used in docker-compose) |
| `AUTH_SECRET` | NextAuth JWT signing key |
| `AUTH_URL` | Public URL (e.g. `http://72.62.117.94`) |
| `PROXIES_SX_API_KEY` | Proxies.sx reseller API key |
| `PROXIES_SX_USERNAME` | Proxies.sx reseller username (`psx_*`) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `ADMIN_PASSWORD` | Shared admin login password |

---

## 12. Deployment

**Server:** Hetzner VPS, Ubuntu 24.04, 8GB RAM
**SSH:** `ssh -i ~/.ssh/proxy_reseller_deploy root@72.62.117.94`
**App path:** `/opt/proxy-reseller`

**Deploy process:**
```bash
# From local machine
rsync -azP --exclude='.env' --exclude='node_modules' --exclude='.next' --exclude='.git' \
  -e "ssh -i ~/.ssh/proxy_reseller_deploy" \
  ./ root@72.62.117.94:/opt/proxy-reseller/

# On server
cd /opt/proxy-reseller/deploy
docker compose -f docker-compose.prod.yml build app
docker compose -f docker-compose.prod.yml up -d app
```

**Docker architecture:**
- Multi-stage Dockerfile: builder (npm ci + next build) -> runner (standalone output, ~150MB)
- Non-root user `nextjs:nodejs` (UID 1001)
- Caddy reverse-proxies port 80 -> app:3000
- PostgreSQL data persisted in Docker volume `pgdata`

---

## 13. Security Posture

- Timing-safe credential comparison everywhere
- Rate limiting on login (5 attempts / 15 min)
- All `request.json()` calls wrapped in try-catch
- Input validation on all API endpoints
- Parameterized SQL queries (no string interpolation)
- Audit log on all state mutations
- Non-root Docker container
- PAK secrets stored in DB (needed for client-side URL generation)
- HMAC-based stateless wallet login challenges (TTL 5 min)
- Webhook idempotency via `webhook_events` table

---

## 14. Current Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Access code auth | DONE | Timing-safe, rate-limited |
| Admin password auth | DONE | Single shared password |
| Wallet auth (ETH) | DONE | MetaMask, stateless HMAC challenges |
| Self-signup | DONE | Generates one-time access code |
| Customer dashboard | DONE | Overview, keys, purchase, settings |
| Proxy key lifecycle | DONE | Create, toggle, rotate, delete, traffic sync |
| Live pool status | DONE | Country-level mbl/peer modem counts |
| Batch URL generator | DONE | Client-side, up to 100 URLs, session prefix |
| Connection reference docs | DONE | Inline collapsible reference |
| Balance system | DONE | Credit/debit, admin management |
| Balance purchase | DONE | Debit balance + provision PAK, auto-refund on failure |
| Stripe checkout | DONE | Checkout session + webhook (idempotent) |
| Admin account management | DONE | List, search, create, edit, toggle, regen code |
| Per-user admin detail | DONE | Balance, transactions, purchases, wallets |
| Audit log | DONE | All mutations tracked |
| Wallet linking | DONE | MetaMask connect + signature verification |
| 2FA (Google Auth) | PLANNED | Placeholder in settings |
| Stripe live keys | PENDING | Currently using test/placeholder keys |
| HTTPS / SSL | PENDING | Caddy configured but domain not pointed |
| Solana wallet auth | PLANNED | Schema supports it, no frontend yet |

---

## 15. File Tree (Key Files)

```
src/
  config.ts                              # Brand, pricing, countries
  middleware.ts                          # Route protection
  lib/
    auth.ts                              # 3 credential providers, user management
    auth.config.ts                       # Middleware auth callbacks
    db.ts                                # PG pool + query helpers
    proxies.ts                           # Proxies.sx SDK singleton
    stripe.ts                            # Stripe SDK singleton
    wallet.ts                            # HMAC challenges + ETH verify
  app/
    page.tsx                             # Landing page
    (auth)/login/page.tsx                # Login (access code + wallet + admin)
    dashboard/
      layout.tsx                         # Sidebar: balance, nav, sign out
      page.tsx                           # Overview + how-it-works + active plan
      keys/page.tsx                      # Proxy management + generator + docs
      purchase/page.tsx                  # Plan selection + purchase
      settings/page.tsx                  # Account info + wallet linking + 2FA
    admin/
      layout.tsx                         # Admin sidebar
      page.tsx                           # Admin overview
      accounts/page.tsx                  # User list + search
      accounts/[id]/page.tsx             # Per-user detail management
      accounts/create/page.tsx           # Create account form
      audit/page.tsx                     # Audit log viewer
      keys/page.tsx                      # Pool keys overview
    api/
      auth/[...nextauth]/route.ts        # Auth.js handler
      auth/signup/route.ts               # Self-registration
      auth/wallet-challenge/route.ts     # Wallet login challenge
      balance/route.ts                   # GET balance
      balance/purchase/route.ts          # Balance purchase flow
      pool/keys/route.ts                 # PAK CRUD + traffic sync
      pool/proxy-url/route.ts            # Server-side URL builder
      pool/stock/route.ts                # Live pool status
      user/profile/route.ts              # User profile data
      wallet/challenge/route.ts          # Wallet link challenge
      wallet/verify/route.ts             # Wallet signature verify
      wallet/list/route.ts               # List linked wallets
      admin/accounts/route.ts            # Admin account CRUD
      admin/accounts/[id]/route.ts       # Per-user admin API
      admin/balance/route.ts             # Admin balance credit/debit
      stripe/checkout/route.ts           # Stripe checkout session
      stripe/webhook/route.ts            # Stripe webhook handler
db/
  schema.sql                             # 8 tables, idempotent
deploy/
  docker-compose.prod.yml               # 3-container stack
  Caddyfile                              # Reverse proxy config
Dockerfile                               # Multi-stage Node 22 Alpine
```
