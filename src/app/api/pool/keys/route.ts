import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { proxies, getProxyUsername, describeProxiesError, isNotFound } from '@/lib/proxies';
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

  let proxyUsername: string;
  try {
    proxyUsername = getProxyUsername();
  } catch (err) {
    // Misconfigured server: refuse rather than hand out credentials that can
    // never authenticate at the gateway.
    console.error('[pool/keys]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { key: null, error: 'Proxy service is not configured yet — please contact support.' },
      { status: 503 },
    );
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

    return NextResponse.json({ key: keyData, proxyUsername });
  } catch (err: unknown) {
    console.error(`[pool/keys] Failed to fetch key ${customer.pak_key_id}:`, {
      error: describeProxiesError(err),
      userId: session.user.id,
      customerId: customer.id,
    });
    if (isNotFound(err)) {
      return NextResponse.json({
        key: null,
        error: 'Your proxy key is no longer active. Buy traffic to get a fresh key, or contact support.',
      });
    }
    return NextResponse.json(
      { key: null, error: 'Could not reach the proxy network — please retry in a moment.' },
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

  // Customers can pause/resume and rotate their secret. Deleting a key is
  // deliberately NOT exposed: it destroys paid, unused traffic irreversibly.
  try {
    switch (action) {
      case 'toggle_enabled': {
        const current = await proxies().poolKeys.get(customer.pak_key_id);
        const updated = await proxies().poolKeys.update(customer.pak_key_id, {
          enabled: !current.enabled,
        });
        if (!updated.enabled) {
          // Disabling only stops NEW connections (30 s auth cache); close live
          // tunnels too so "Pause" actually pauses.
          await proxies().sessions.closeAll({ pakId: customer.pak_key_id }).catch(() => {});
        }
        await query(
          `INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
           VALUES ($1, 'key_toggle', 'pool_key', $2, $3)`,
          [session.user.id, customer.pak_key_id, JSON.stringify({ enabled: updated.enabled })],
        );
        return NextResponse.json({ key: updated });
      }

      case 'regenerate': {
        const updated = await proxies().poolKeys.regenerate(customer.pak_key_id);
        await query(
          'UPDATE customers SET pak_key = $1, updated_at = now() WHERE id = $2',
          [updated.key, customer.id],
        );
        // The old secret keeps authenticating new connections for up to ~30 s
        // and established tunnels are not torn down — close them so a leaked
        // key actually stops working.
        await proxies().sessions.closeAll({ pakId: customer.pak_key_id }).catch(() => {});
        await query(
          `INSERT INTO audit_log (actor_id, action, target_type, target_id)
           VALUES ($1, 'key_regenerated', 'pool_key', $2)`,
          [session.user.id, customer.pak_key_id],
        );
        return NextResponse.json({ key: updated });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: unknown) {
    console.error(`[pool/keys] Action ${action} failed:`, describeProxiesError(err));
    return NextResponse.json({ error: 'Action failed — please retry in a moment.' }, { status: 502 });
  }
}
