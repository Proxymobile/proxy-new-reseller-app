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

## Switching to a different Stripe account

Run this **on the server**, as root — never paste live keys into a chat, an
editor, or your shell history:

```sh
ssh -i ~/.ssh/proxy_reseller_deploy root@72.62.117.94
cd /opt/proxy-reseller
bash deploy/rotate-stripe.sh
```

It prompts (hidden) for the three values, then before changing anything it
calls Stripe and prints which account the key actually belongs to — id,
business name, email, country, live/test mode, and whether charges are
enabled — and waits for you to confirm. Prefix checks alone can't catch
"right-shaped key, wrong account"; this does.

It then lists that account's webhook endpoints and warns if none points at
`https://proxymobile.shop/api/stripe/webhook` or if the endpoint isn't
listening to `checkout.session.completed`. That combination — valid keys, no
endpoint — is the dangerous one: payments succeed at Stripe and never credit
a balance, so it looks like it worked.

Finally it backs up `.env`, writes the new keys, keeps the old signing secret
as `STRIPE_WEBHOOK_SECRET_PREVIOUS` so events already in flight still verify,
and recreates the app container.

### Where the three values are

| Value | Stripe Dashboard location |
|-------|---------------------------|
| `STRIPE_SECRET_KEY` (`sk_live_…`) | Developers → API keys → Secret key → *Reveal* |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_…`) | Developers → API keys → Publishable key |
| `STRIPE_WEBHOOK_SECRET` (`whsec_…`) | Developers → Webhooks → your endpoint → *Signing secret* |

Make sure the account switcher at the top-left of the Dashboard is on the
account you intend, and that **Test mode** is off, before copying live keys.

### Afterwards

1. Re-read any WARNING the script printed.
2. Send a test event from the endpoint and confirm a 200.
3. Make a real small deposit and check the balance credits.
4. Remove `STRIPE_WEBHOOK_SECRET_PREVIOUS` from `.env` once the old account is quiet.

Roll back at any time — the script prints the backup path:

```sh
cp /opt/proxy-reseller/.env.bak.<timestamp> /opt/proxy-reseller/.env
cd /opt/proxy-reseller/deploy
docker compose -f docker-compose.prod.yml up -d --force-recreate app
```
