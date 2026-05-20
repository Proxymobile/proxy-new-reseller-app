# CONVENTIONS.md

> Code style, patterns, and file organization rules.

## TypeScript

- **Strict mode** — no `any` unless commented why
- **Explicit return types** on exported functions
- **Interface over type** for object shapes
- **const assertions** for config objects (`as const`)

## SQL

- **Always parameterized** — `$1`, `$2`, never string interpolation
- **Schema changes** — add to `db/schema.sql` with `IF NOT EXISTS`
- **Queries** — use `query<T>()` for multiple rows, `queryOne<T>()` for single
- **Naming** — snake_case for columns, tables

## API Routes

- **Always validate JSON** — wrap `request.json()` in try-catch
- **Always check auth** — `await auth()` + verify `session.user.id`
- **Admin routes** — double-check with `isAdmin()`
- **Return types** — consistent `{ data }` or `{ error }` shape
- **Audit everything** — INSERT into audit_log for mutations

## Components

- **Server components** by default — add `'use client'` only when needed
- **No `use client`** in layouts — keep server for auth checks
- **Fetch error handling** — always check `res.ok`, always `.catch()`

## File Organization

- `src/lib/` — shared server utilities (db, auth, SDK clients)
- `src/config.ts` — all configurable values in one place
- `src/app/api/` — API routes, grouped by domain
- `src/app/(auth)/` — auth pages (route group, no layout nesting)
- `src/app/dashboard/` — customer-facing pages
- `src/app/admin/` — admin-facing pages

## Security

- Server clients are lazy singletons (never crash at import time)
- Never expose `psx_` keys to browser (no `NEXT_PUBLIC_` prefix)
- Timing-safe comparison for auth credentials
- Webhook signature verification is mandatory
