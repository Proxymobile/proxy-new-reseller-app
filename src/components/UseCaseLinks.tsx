import Link from 'next/link';
import { USE_CASE_PAGES } from '@/lib/use-cases';

/**
 * Footer nav for the intent pages.
 *
 * This is the only thing pointing crawlers at /{use-case} from the pages that
 * are already indexed, so it belongs in the footer of every marketing page —
 * a sitemap entry alone gets these discovered, not weighted.
 *
 * `current` omits the page you are already on.
 */
export function UseCaseLinks({ current }: { current?: string }) {
  const byGroup = (g: 'use-case' | 'stack') =>
    USE_CASE_PAGES.filter((p) => p.group === g && p.slug !== current);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
          By use case
        </h3>
        <ul className="mt-3 space-y-2">
          {byGroup('use-case').map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Mobile proxies for {p.label.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
          By stack
        </h3>
        <ul className="mt-3 space-y-2">
          {byGroup('stack').map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${p.slug}`}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {p.label} mobile proxy setup
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/mobile-proxy-api"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Mobile proxy API reference
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
