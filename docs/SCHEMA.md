# SCHEMA.md

> Database tables, relationships, and constraints.

## Entity Relationship

```
users 1──1 customers 1──N purchases
  │                        │
  │ (actor_id)             │ (stripe_session_id)
  ▼                        │
audit_log              webhook_events
```

## Tables

### users
Primary auth table. Every person in the system.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| email | TEXT | UNIQUE, NOT NULL |
| name | TEXT | nullable |
| role | TEXT | 'customer' or 'admin', default 'customer' |
| hashcode | TEXT | UNIQUE, NOT NULL, auto-generated 12-char hex |
| created_at | TIMESTAMPTZ | NOT NULL, default now() |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() |

### customers
Business data for proxy customers. 1:1 with users.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK→users, UNIQUE |
| pak_key_id | TEXT | nullable (set after first purchase) |
| pak_key | TEXT | nullable (CHECK: both null or both set) |
| traffic_cap_gb | NUMERIC(10,2) | default 0 |
| traffic_used_gb | NUMERIC(10,2) | default 0 |
| plan_id | TEXT | nullable |
| enabled | BOOLEAN | default true |
| expires_at | TIMESTAMPTZ | nullable |

### purchases
Payment records.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| customer_id | UUID | FK→customers |
| stripe_session_id | TEXT | UNIQUE |
| plan_id | TEXT | NOT NULL |
| gb_amount | NUMERIC(10,2) | NOT NULL |
| price_usd | NUMERIC(10,2) | NOT NULL |
| status | TEXT | 'pending'/'completed'/'failed'/'refunded' |

### webhook_events
Stripe idempotency table.

| Column | Type | Constraints |
|--------|------|-------------|
| stripe_event_id | TEXT | UNIQUE, NOT NULL |
| event_type | TEXT | NOT NULL |
| processed_at | TIMESTAMPTZ | default now() |

### audit_log
All mutations tracked here.

| Column | Type | Constraints |
|--------|------|-------------|
| actor_id | UUID | FK→users, SET NULL on delete |
| action | TEXT | NOT NULL |
| target_type | TEXT | nullable |
| target_id | TEXT | nullable |
| metadata | JSONB | default '{}' |
| ip_address | INET | nullable |

## Indexes

- `idx_users_email` — login lookups
- `idx_users_hashcode` — auth verification
- `idx_customers_user_id` — session→customer join
- `idx_customers_pak_key_id` — webhook key lookup
- `idx_purchases_customer_id` — purchase history
- `idx_purchases_stripe_session` — webhook dedup
- `idx_webhook_events_stripe` — idempotency check
- `idx_audit_log_created` — DESC for recent-first queries
- `idx_audit_log_actor` — user activity lookup
