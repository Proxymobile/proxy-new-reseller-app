import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/config';
import { GB_TIERS } from '@/lib/pricing';
import { COUNTRIES, getCountry, siblingCountries } from '@/lib/countries';
import { JsonLd } from '@/components/JsonLd';
import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  productJsonLd,
} from '@/lib/seo';

type Params = { country: string };

// Pre-render one static page per country at build time.
export function generateStaticParams(): Params[] {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) return {};
  const url = absoluteUrl(`/mobile-proxies/${country.slug}`);
  return {
    title: { absolute: country.title },
    description: country.description,
    alternates: { canonical: url },
    openGraph: {
      title: country.title,
      description: country.description,
      url,
      type: 'article',
    },
    twitter: {
      title: country.title,
      description: country.description,
    },
  };
}

export const dynamicParams = false;

function money(v: number) {
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();

  const url = absoluteUrl(`/mobile-proxies/${country.slug}`);
  const siblings = siblingCountries(country.slug, 3);
  const carrierList = country.carriers.join(', ');

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Mobile Proxies', url: absoluteUrl('/#locations') },
    { name: `${country.shortName} Mobile Proxies`, url },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          productJsonLd({
            name: `${country.name} Mobile Proxies`,
            description: country.description,
            url,
          }),
          faqPageJsonLd(country.faqs),
        ]}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[var(--color-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 sm:px-6 py-3.5">
          <Link href="/" className="flex items-center" aria-label={`${config.brand.name} home`}>
            <Image
              src="/logo.png"
              alt={`${config.brand.name} — mobile proxy service`}
              width={1516}
              height={429}
              sizes="170px"
              className="h-9 sm:h-10 w-auto dark:invert"
            />
          </Link>
          <nav className="flex items-center gap-2 text-sm" aria-label="Primary">
            <Link href="/#pricing" className="rounded-lg px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              Pricing
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[var(--color-text)] px-5 py-2 font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8 text-xs text-[var(--color-text-muted)]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-[var(--color-text)]">Home</Link></li>
              <li aria-hidden>/</li>
              <li><a href="/#locations" className="hover:text-[var(--color-text)]">Mobile Proxies</a></li>
              <li aria-hidden>/</li>
              <li className="text-[var(--color-text)]">{country.shortName}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none" aria-hidden>{country.flag}</span>
            <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              Real 4G/5G Carrier IPs
            </span>
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--color-text)] leading-[1.08]">
            {country.h1}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
            {country.intro}
          </p>

          {/* Primary CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              See {country.shortName} pricing
            </Link>
            <span className="text-xs text-[var(--color-text-muted)]">
              Carriers: {carrierList}
            </span>
          </div>

          {/* Unique body sections */}
          {country.sections.map((s) => (
            <section key={s.heading} className="mt-12">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
                {s.heading}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
                {s.body}
              </p>
            </section>
          ))}

          {/* Use cases */}
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              What people use {country.shortName} mobile proxies for
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {country.useCases.map((u) => (
                <li key={u} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {u}
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing tiers */}
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {country.shortName} mobile proxy pricing
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Pay per GB — no subscription, no expiry. The more you buy, the lower your per-GB rate, down to $5/GB.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">Bandwidth</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Per GB</th>
                    <th className="px-4 py-3 font-semibold">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {GB_TIERS.map((t) => (
                    <tr key={t.gb} className="border-t border-[var(--color-border)] text-[var(--color-text)]">
                      <td className="px-4 py-3 font-medium">{t.gb} GB</td>
                      <td className="px-4 py-3">{money(t.price)}</td>
                      <td className="px-4 py-3">{money(t.perGb)}</td>
                      <td className="px-4 py-3 text-[var(--color-accent)]">{t.discount ? `${t.discount}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5">
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Configure your {country.shortName} plan
              </Link>
            </div>
          </section>

          {/* FAQ — server-rendered, always in the DOM via <details> */}
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {country.shortName} mobile proxy FAQ
            </h2>
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
              {country.faqs.map((f) => (
                <details key={f.q} className="group border-b border-[var(--color-border)] py-4 last:border-b-0">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--color-text)]">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Internal links to sibling countries */}
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Explore other locations
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/mobile-proxies/${s.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
                >
                  <span aria-hidden>{s.flag}</span>
                  {s.shortName} Mobile Proxies
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              Or head back to the <Link href="/#pricing" className="text-[var(--color-primary)] hover:underline">homepage pricing</Link> to compare all 9 countries.
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Mobile proxy locations">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
              All Mobile Proxy Locations
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {COUNTRIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/mobile-proxies/${c.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <span aria-hidden>{c.flag}</span>
                    {c.shortName} Mobile Proxies
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6">
            <span className="text-xs text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} {SITE_NAME} · All rights reserved
            </span>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Terms</Link>
              <Link href="/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
