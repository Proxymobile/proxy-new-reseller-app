import type { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/countries';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] px-6 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">404</p>
      <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)]">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-4 max-w-md text-sm text-[var(--color-text-muted)] leading-relaxed">
        The page you&apos;re looking for may have moved. Head back to the homepage or explore mobile proxies by country.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-text)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
      >
        Back to homepage
      </Link>

      <div className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-lg">
        {COUNTRIES.map((c) => (
          <Link
            key={c.slug}
            href={`/mobile-proxies/${c.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <span aria-hidden>{c.flag}</span>
            {c.shortName}
          </Link>
        ))}
      </div>
    </div>
  );
}
