import { query, queryOne } from '@/lib/db';
import { proxies, isNotFound } from '@/lib/proxies';

/**
 * Ensure the user has a customer row + live pool key, and add `gb` of traffic
 * (extending expiry by `durationDays`). Shared by paid purchases and free
 * trials so both go through identical, tested provisioning.
 *
 * `idempotencyKey` must identify the business event (an invoice number, a
 * promo redemption) — never a random value generated at call time. The SDK
 * retries transient failures on its own; the key lets the platform dedupe
 * those retries (24h window) so one purchase can never add traffic twice.
 *
 * Throws on upstream failure — callers are responsible for compensating
 * (refunding balance / releasing a promo slot).
 */
export async function provisionTraffic(
  userId: string,
  gb: number,
  durationDays: number,
  idempotencyKey: string,
): Promise<{ customerId: string; keyId: string }> {
  // The platform only accepts whole-GB caps (DTO: @IsInt @Min(1)); a fraction
  // is a 400 for every reseller. Reject it here with a clear message instead.
  if (!Number.isInteger(gb) || gb < 1) {
    throw new Error(`Traffic must be a whole number of GB (got ${gb})`);
  }

  let customer = await queryOne<{ id: string; pak_key_id: string | null }>(
    'SELECT id, pak_key_id FROM customers WHERE user_id = $1',
    [userId],
  );
  if (!customer) {
    customer = await queryOne<{ id: string; pak_key_id: string | null }>(
      'INSERT INTO customers (user_id) VALUES ($1) RETURNING id, pak_key_id',
      [userId],
    );
  }
  if (!customer) {
    throw new Error('Failed to initialize customer');
  }

  if (customer.pak_key_id) {
    try {
      const key = await proxies().poolKeys.topUp(customer.pak_key_id, {
        addTrafficGB: gb,
        extendDays: durationDays,
        idempotencyKey: `${idempotencyKey}:topup`,
      });
      // A key that hit its cap is auto-suspended by the platform, and topUp
      // does NOT re-enable it — without this the customer pays and the key
      // stays dead.
      if (!key.enabled) {
        await proxies().poolKeys.update(customer.pak_key_id, { enabled: true });
      }
      await query(
        'UPDATE customers SET traffic_cap_gb = COALESCE($1, traffic_cap_gb), expires_at = $2, updated_at = now() WHERE id = $3',
        [key.trafficCapGB, key.expiresAt, customer.id],
      );
      return { customerId: customer.id, keyId: customer.pak_key_id };
    } catch (err) {
      // The key was deleted upstream (e.g. by an operator). Without this the
      // customer could never buy again — every top-up would 404 and refund.
      // Fall through and mint a fresh key.
      if (!isNotFound(err)) throw err;
      console.warn(`[provision] pool key ${customer.pak_key_id} missing upstream — minting a new one`);
      await query(
        'UPDATE customers SET pak_key_id = NULL, pak_key = NULL, updated_at = now() WHERE id = $1',
        [customer.id],
      );
    }
  }

  const key = await proxies().poolKeys.create({
    label: `customer:${userId}`,
    trafficCapGB: gb,
    expiresAt: new Date(Date.now() + durationDays * 86_400_000).toISOString(),
    idempotencyKey: `${idempotencyKey}:create`,
  });

  await query(
    'UPDATE customers SET pak_key_id = $1, pak_key = $2, traffic_cap_gb = $3, traffic_used_gb = 0, expires_at = $4, updated_at = now() WHERE id = $5',
    [key.id, key.key, gb, key.expiresAt, customer.id],
  );

  return { customerId: customer.id, keyId: key.id };
}
