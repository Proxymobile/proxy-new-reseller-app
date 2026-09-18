import Link from 'next/link';
import type { ReactNode } from 'react';
import { pct } from './format';

export function Card({ title, subtitle, action, children, className = '' }: {
  title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`viz min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-2 px-5 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 text-xs">{action}</div>}
        </header>
      )}
      <div className="p-5 pt-3">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function SectionTitle({ children, href, linkLabel }: { children: ReactNode; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 mt-10 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{children}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-[var(--color-primary)] hover:underline">
          {linkLabel ?? 'Details'} →
        </Link>
      )}
    </div>
  );
}

/** Date-range presets. Scopes every figure on the page. */
export function RangeTabs({ current, basePath }: { current: string; basePath: string }) {
  const opts = [['7d', '7 days'], ['30d', '30 days'], ['90d', '90 days'], ['365d', '12 months']] as const;
  return (
    <nav aria-label="Date range" className="inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {opts.map(([k, label]) => (
        <Link
          key={k}
          href={`${basePath}?range=${k}`}
          aria-current={current === k ? 'page' : undefined}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            current === k
              ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

/** Signed change vs the previous period. `goodWhenUp=false` flips the colors. */
export function Delta({ current, previous, goodWhenUp = true, label }: {
  current: number; previous: number; goodWhenUp?: boolean; label: string;
}) {
  if (previous === 0 && current === 0) {
    return <span className="text-[11px] text-[var(--color-text-muted)]">no change {label}</span>;
  }
  if (previous === 0) {
    return <span className="text-[11px] text-[var(--color-text-muted)]">new {label}</span>;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const up = change >= 0;
  const good = up === goodWhenUp;
  return (
    <span className="text-[11px] text-[var(--color-text-muted)]">
      <span className={`font-semibold ${good ? 'text-[var(--viz-good-text)]' : 'text-[var(--viz-bad-text)]'}`}>
        <span aria-hidden>{up ? '▲' : '▼'}</span> {up ? '+' : '−'}{pct(Math.abs(change))}
      </span>{' '}
      {label}
    </span>
  );
}

export function StatTile({ label, value, delta, hint, href }: {
  label: string; value: ReactNode; delta?: ReactNode; hint?: ReactNode; href?: string;
}) {
  const body = (
    <div className="viz h-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)]/30">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
      {delta && <div className="mt-1">{delta}</div>}
      {hint && <p className="mt-1 text-[11px] leading-snug text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export type Level = 'good' | 'warning' | 'serious' | 'critical' | 'neutral';
const LEVEL_ICON: Record<Level, string> = { good: '✓', warning: '!', serious: '!', critical: '✕', neutral: '•' };

/** Status pill: always icon + label, never color alone. */
export function Status({ level, children }: { level: Level; children: ReactNode }) {
  const color = level === 'neutral' ? 'var(--color-text-muted)' : `var(--viz-${level})`;
  return (
    <span className="viz inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text)]">
      <span
        aria-hidden
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {LEVEL_ICON[level]}
      </span>
      {children}
    </span>
  );
}

/** Alert row for the top-of-page strip. */
export function Alert({ level, title, children, href }: { level: Level; title: string; children?: ReactNode; href?: string }) {
  const inner = (
    <div className="viz flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
        style={{ backgroundColor: level === 'neutral' ? 'var(--color-text-muted)' : `var(--viz-${level})` }}
      >
        {LEVEL_ICON[level]}
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium text-[var(--color-text)]">{title}</p>
        {children && <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{children}</p>}
      </div>
      {href && <span className="ml-auto shrink-0 self-center whitespace-nowrap text-xs text-[var(--color-primary)]">View →</span>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

/** Meter: fill carries severity; the track is a lighter step of the same hue. */
export function Meter({ value, max, label }: { value: number; max: number | null; label?: string }) {
  if (!max) return <span className="text-[11px] text-[var(--color-text-muted)]">no cap</span>;
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  const color = p >= 100 ? 'var(--viz-critical)' : p >= 80 ? 'var(--viz-serious)' : 'var(--viz-1)';
  return (
    <div className="viz min-w-[90px]" title={label}>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(p, p > 0 ? 3 : 0)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/** Horizontal bar list — values are always printed, so the bars never gate the number. */
export function BarList({ rows, format, empty = 'No data yet' }: {
  rows: { label: ReactNode; value: number; sub?: ReactNode; key: string }[];
  format: (v: number) => string;
  empty?: string;
}) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (!rows.length || max === 0) return <p className="py-4 text-sm text-[var(--color-text-muted)]">{empty}</p>;
  return (
    <ul className="viz space-y-2.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-[var(--color-text)]">{r.label}</span>
            <span className="shrink-0 tabular-nums text-[var(--color-text)]">
              {format(r.value)}{r.sub && <span className="ml-1.5 text-[var(--color-text-muted)]">{r.sub}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[var(--color-surface-hover)]">
            <div className="h-full rounded-full bg-[var(--viz-1)]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">{children}</p>;
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] ${className}`}>{children}</th>;
}
export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}
