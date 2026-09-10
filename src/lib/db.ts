import { Pool, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const { rows } = await pool.query<T>(sql, params);
  return rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function nextInvoiceNumber(): Promise<string> {
  const row = await queryOne<{ n: string }>("SELECT nextval('invoice_seq') AS n", []);
  return `INV-${row!.n}`;
}

export type TxQuery = <T extends QueryResultRow = QueryResultRow>(sql: string, params?: unknown[]) => Promise<T[]>;

/**
 * Run `fn` inside one transaction on a dedicated connection: everything
 * commits together or nothing does. Use for money movements, where a partial
 * write followed by a retry would double-credit.
 */
export async function withTransaction<R>(fn: (q: TxQuery) => Promise<R>): Promise<R> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q: TxQuery = async (sql, params = []) => (await client.query(sql, params)).rows;
    const result = await fn(q);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
