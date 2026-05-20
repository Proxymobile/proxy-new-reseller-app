# STRIPE.md

> Payment flow, webhook handling, idempotency.

## Checkout Flow

```
1. Customer clicks plan on /dashboard/purchase
2. Client POST /api/stripe/checkout { planId }
3. Server creates Stripe checkout session with:
   - client_reference_id = user.id
   - metadata.plan_id = planId
   - line_items from config pricing
4. Returns { url } → client redirects to Stripe
5. After payment: Stripe redirects to /dashboard?purchase=success
```

## Webhook Flow

```
POST /api/stripe/webhook
1. Verify signature (stripe.webhooks.constructEvent)
2. Check idempotency (webhook_events table)
3. INSERT into webhook_events
4. Handle checkout.session.completed:
   a. Look up customer by client_reference_id
   b. If no pak_key_id → mint new key
   c. If has pak_key_id → topUp existing key
   d. INSERT into purchases
   e. INSERT into audit_log
5. On failure: DELETE webhook_events entry → Stripe retries
```

## Idempotency

- `webhook_events.stripe_event_id` has UNIQUE constraint
- If event already processed → return 200 immediately
- If handler fails → delete event entry so Stripe can retry
- SDK calls use `idempotencyKey: event.id` for Proxies.sx dedup

## Testing

```bash
# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test with Stripe test card
# Card: 4242 4242 4242 4242
# Exp: any future date
# CVC: any 3 digits
```
