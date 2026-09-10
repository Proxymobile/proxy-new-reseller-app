import { query, queryOne } from '@/lib/db';
import { proxies } from '@/lib/proxies';

/**
 * Ensure the user has a customer row + live pool key, and add `gb` of traffic
 * (extending expiry by `durationDays`). Shared by paid purchases and free
 * trials so both go through identical, tested provisioning.
 *
 * Throws on upstream failure — callers are responsible for compensating
 * (refunding balance / releasing a promo slot).
 */
export async function provisionTraffic(
  userId: string,
  gb: number,
  durationDays: number,
): Promise<{ customerId: string; keyId: string }> {
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
    await proxies().poolKeys.topUp(customer.pak_key_id, {
      addTrafficGB: gb,
      extendDays: durationDays,
    });
    // A key that hit its cap is auto-suspended by the gateway, and topUp does
    // NOT re-enable it — without this the customer pays and the key stays dead.
    await proxies().poolKeys.update(customer.pak_key_id, { enabled: true });
    return { customerId: customer.id, keyId: customer.pak_key_id };
  }

  const key = await proxies().poolKeys.create({
    label: `customer:${userId}`,
    trafficCapGB: gb,
    expiresAt: new Date(Date.now() + durationDays * 86_400_000).toISOString(),
  });

  await query(
    'UPDATE customers SET pak_key_id = $1, pak_key = $2, traffic_cap_gb = $3 WHERE id = $4',
    [key.id, key.key, gb, customer.id],
  );

  return { customerId: customer.id, keyId: key.id };
}
