import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proxies } from '@/lib/proxies';
import { queryOne, query } from '@/lib/db';

interface Customer {
  id: string;
  user_id: string;
  pak_key_id: string | null;
  pak_key: string | null;
  traffic_cap_gb: number;
  traffic_used_gb: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const customer = await queryOne<Customer>(
    'SELECT id, user_id, pak_key_id, pak_key, traffic_cap_gb, traffic_used_gb FROM customers WHERE user_id = $1',
    [session.user.id],
  );

  if (!customer || !customer.pak_key_id) {
    return NextResponse.json({ key: null });
  }

  try {
    const keyData = await proxies().poolKeys.get(customer.pak_key_id);

    // Sync traffic usage back to DB
    if (keyData.trafficUsedMB != null) {
      const usedGB = keyData.trafficUsedMB / 1024;
      await query(
        'UPDATE customers SET traffic_used_gb = $1, traffic_cap_gb = COALESCE($2, traffic_cap_gb), updated_at = now() WHERE id = $3',
        [usedGB, keyData.trafficCapGB, customer.id],
      ).catch(() => {});
    }

    return NextResponse.json({
      key: keyData,
      proxyUsername: process.env.PROXIES_SX_USERNAME ?? '',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number }).status;
    console.error(`[pool/keys] Failed to fetch key ${customer.pak_key_id}:`, {
      error: message,
      status,
      userId: session.user.id,
      customerId: customer.id,
    });
    return NextResponse.json(
      { key: null, error: 'Failed to fetch key from provider' },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body as Record<string, unknown>;
  if (!action || typeof action !== 'string') {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  const customer = await queryOne<Customer>(
    'SELECT id, user_id, pak_key_id, pak_key, traffic_cap_gb, traffic_used_gb FROM customers WHERE user_id = $1',
    [session.user.id],
  );

  if (!customer || !customer.pak_key_id) {
    return NextResponse.json({ error: 'No active proxy key' }, { status: 404 });
  }

  try {
    switch (action) {
      case 'toggle_enabled': {
        const current = await proxies().poolKeys.get(customer.pak_key_id);
        const updated = await proxies().poolKeys.update(customer.pak_key_id, {
          enabled: !current.enabled,
        });
        await query(
          `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
           VALUES ($1, 'key_toggle', 'pool_key', $2, $3)`,
          [session.user.id, customer.pak_key_id, JSON.stringify({ enabled: updated.enabled })],
        );
        return NextResponse.json({ key: updated });
      }

      case 'regenerate': {
        const updated = await proxies().poolKeys.regenerate(customer.pak_key_id);
        // Update stored pak_key in DB
        await query(
          'UPDATE customers SET pak_key = $1, updated_at = now() WHERE id = $2',
          [updated.key, customer.id],
        );
        await query(
          `INSERT INTO audit_log (actor_id, action, target_type, target_id)
           VALUES ($1, 'key_regenerated', 'pool_key', $2)`,
          [session.user.id, customer.pak_key_id],
        );
        return NextResponse.json({ key: updated });
      }

      case 'delete': {
        await proxies().poolKeys.delete(customer.pak_key_id);
        await query(
          'UPDATE customers SET pak_key_id = NULL, pak_key = NULL, traffic_cap_gb = 0, traffic_used_gb = 0, plan_id = NULL, expires_at = NULL, updated_at = now() WHERE id = $1',
          [customer.id],
        );
        await query(
          `INSERT INTO audit_log (actor_id, action, target_type, target_id)
           VALUES ($1, 'key_deleted', 'pool_key', $2)`,
          [session.user.id, customer.pak_key_id],
        );
        return NextResponse.json({ key: null, deleted: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pool/keys] Action ${action} failed:`, message);
    return NextResponse.json({ error: `Action failed: ${message}` }, { status: 502 });
  }
}
