# SECURITY-AUDIT.md

> Audit findings, fixes applied, and remaining items.

## Audit Date: 2026-05-06

## Fixed (Critical/High)

| # | Finding | Fix |
|---|---------|-----|
| 1 | Timing attack on hashcode comparison | `crypto.timingSafeEqual()` in auth.ts |
| 2 | Missing try-catch on `request.json()` | All POST endpoints now wrap JSON parsing |
| 3 | No status code validation in client fetch | keys/page.tsx checks `res.ok` before `.json()` |
| 4 | Missing input validation on admin topup | Validates gb/days as positive finite numbers |
| 5 | Name field type not checked | Register endpoint validates `typeof name === 'string'` |
| 6 | Rotation parameter not validated | VALID_ROTATIONS allowlist in proxy-url route |
| 7 | Hashcode exposed in admin API | Removed from admin GET query |
| 8 | Missing database indexes | Added idx on pak_key_id, stripe_session_id, stripe_event_id |
| 9 | No DB pool error handler | `pool.on('error', ...)` in db.ts |
| 10 | No security headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy in next.config.ts |
| 11 | Missing audit log for user creation | createUser() now logs 'user_created' |
| 12 | pak_key/pak_key_id constraint | CHECK constraint ensures both null or both set |
| 13 | Client fetch has no error state | Error state + catch handlers in keys page |
| 14 | API responses cacheable | Cache-Control: private, no-store on /api/* |

## Remaining (Medium/Low — Non-blocking for MVP)

| # | Finding | Priority | Notes |
|---|---------|----------|-------|
| 1 | Webhook handler not fully transactional | Medium | INSERT + multiple writes not atomic; Stripe retry handles this |
| 2 | No request body size limits | Medium | Caddy has default limits; add explicit in next.config if needed |
| 3 | No structured logging | Low | console.error is fine for MVP; add pino later |
| 4 | No pagination on audit log | Low | LIMIT 100 hardcoded; add cursor pagination when needed |
| 5 | accounts/sessions tables unused | Low | Kept for future OAuth; zero runtime cost |
| 6 | HSTS header missing | Low | Add after domain + TLS configured |
| 7 | CSP header missing | Low | Complex to configure correctly; add post-MVP |

## Security Posture Summary

- All SQL parameterized ($1, $2) — zero injection surface
- API keys server-side only — never in NEXT_PUBLIC_*
- Stripe webhooks signature-verified
- Webhook idempotency via unique constraint
- Timing-safe auth comparison
- Security headers on all responses
- API responses marked uncacheable
- Admin routes double-gated (middleware + DB role check)
- Audit log on all mutations
