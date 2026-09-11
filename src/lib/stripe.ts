import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    // Fail with something readable instead of letting the SDK throw on an
    // undefined key — this is the first thing to check after moving the app
    // to a different Stripe account.
    if (!key || key.endsWith('placeholder')) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. Set it in .env and restart the app container.',
      );
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}

/**
 * Webhook signing secrets to try, newest first.
 *
 * When the app is moved to a different Stripe account the endpoint secret
 * changes too. Setting STRIPE_WEBHOOK_SECRET_PREVIOUS to the old value for a
 * few days means events still in flight from the old account keep verifying,
 * so a deposit paid seconds before the switch is not silently dropped. Remove
 * it once the old account is quiet.
 */
export function webhookSecrets(): string[] {
  return [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_PREVIOUS]
    .filter((s): s is string => Boolean(s) && !s!.endsWith('placeholder'));
}
