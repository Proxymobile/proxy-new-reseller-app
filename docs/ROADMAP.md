# ROADMAP.md

> Planned features and scaling strategy.

## Phase 1: MVP (Current)
- [x] Landing page with pricing
- [x] Hashcode auth (register + login)
- [x] Customer dashboard (overview, keys, purchase)
- [x] Admin dashboard (stats, customers, keys, audit)
- [x] Stripe checkout → key minting
- [x] Proxy URL generator
- [x] Production deployment (Docker + Caddy)
- [x] Security audit + fixes
- [x] Documentation system

## Phase 2: Production Polish
- [ ] Custom domain + TLS
- [ ] Real Proxies.sx API key integration
- [ ] Real Stripe keys (test → live)
- [ ] SMTP email for auth
- [ ] Customer self-service: top-up, key regeneration
- [ ] Admin: manual key creation, bulk operations
- [ ] Usage sync cron (pull from Proxies.sx API)
- [ ] Hermes Agent Phase 1 (read-only monitoring)

## Phase 3: Growth Features
- [ ] Multiple pricing tiers with custom durations
- [ ] Referral system
- [ ] API key access for power users
- [ ] Usage analytics dashboard
- [ ] Bandwidth alerts (80%, 90%, 100%)
- [ ] Auto-suspend + notification on cap exceeded
- [ ] Hermes Agent Phase 2 (managed operations)

## Phase 4: Scale
- [ ] Multi-server deployment
- [ ] PgBouncer for connection pooling
- [ ] Redis caching layer
- [ ] CDN for static assets
- [ ] Rate limiting on API routes
- [ ] Horizontal auto-scaling
- [ ] Hermes Agent Phase 3 (full agentic control)
- [ ] MCP server for app-specific tooling

## Phase 5: Advanced
- [ ] Crypto payments (USDC via x402)
- [ ] White-label reseller-of-reseller
- [ ] Mobile app (React Native)
- [ ] Webhook notifications to customers
- [ ] SLA monitoring dashboard
