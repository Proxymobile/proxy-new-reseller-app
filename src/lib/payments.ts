/**
 * Which self-serve payment rails are actually live.
 *
 * Card checkout needs BOTH a real Stripe secret key and a webhook signing
 * secret — without the webhook, customers would pay and never be credited.
 * Placeholder values from .env.example / deploy.sh count as "not configured",
 * so the dashboard falls back to manual top-ups instead of a broken button.
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  const webhook = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  const looksReal = (v: string) => !/placeholder|your_|_here/i.test(v);
  return (
    /^sk_(live|test)_[A-Za-z0-9]{16,}$/.test(key) &&
    /^whsec_[A-Za-z0-9]{16,}$/.test(webhook) &&
    looksReal(key) &&
    looksReal(webhook)
  );
}
