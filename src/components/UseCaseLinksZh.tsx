import Link from 'next/link';
import { USE_CASE_PAGES_ZH } from '@/lib/use-cases-zh';

/**
 * Footer nav for the /zh pages — Chinese twin of UseCaseLinks. Links stay
 * inside /zh so crawlers can discover every Chinese guide from any Chinese page.
 * `current` omits the page you are already on.
 */
export function UseCaseLinksZh({ current }: { current?: string }) {
  const byGroup = (g: 'use-case' | 'stack') =>
    USE_CASE_PAGES_ZH.filter((p) => p.group === g && p.slug !== current);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
          按使用场景
        </h3>
        <ul className="mt-3 space-y-2">
          {byGroup('use-case').map((p) => (
            <li key={p.slug}>
              <Link
                href={`/zh/${p.slug}`}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                用于{p.label}的移动代理
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
          按技术栈
        </h3>
        <ul className="mt-3 space-y-2">
          {byGroup('stack').map((p) => (
            <li key={p.slug}>
              <Link
                href={`/zh/${p.slug}`}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {p.label} 移动代理配置指南
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/zh/mobile-proxy-api"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              移动代理 API 参考
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
