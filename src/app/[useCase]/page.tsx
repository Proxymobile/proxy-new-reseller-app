import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/config';
import { GB_TIERS, FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { COUNTRIES, getCountry } from '@/lib/countries';
import { JsonLd } from '@/components/JsonLd';
import { UseCaseLinks } from '@/components/UseCaseLinks';
import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  productJsonLd,
} from '@/lib/seo';
import {
  LEGITIMATE_USE_NOTICE,
  USE_CASE_PAGES,
  getUseCasePage,
  relatedPages,
} from '@/lib/use-cases';

type Params = { useCase: string };

/**
 * Root-level dynamic segment. Next resolves literal segments (/pricing,
 * /login, /mobile-proxy-api …) before this one, and dynamicParams = false
 * means anything outside USE_CASE_PAGES 404s rather than rendering an empty
 * shell — so this cannot swallow a mistyped URL.
 */
export function generateStaticParams(): Params[] {
  return USE_CASE_PAGES.map((p) => ({ useCase: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { useCase } = await params;
  const page = getUseCasePage(useCase);
  if (!page) return {};
  const url = absoluteUrl(`/${page.slug}`);
  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: url,
      languages: { en: url, 'zh-Hans': absoluteUrl(`/zh/${page.slug}`), 'x-default': url },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: 'article',
    },
    twitter: {
      title: page.title,
      description: page.description,
    },
  };
}

function money(v: number) {
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-[12px] leading-relaxed">
      <code className="text-[var(--color-text)] whitespace-pre">{children}</code>
    </pre>
  );
}

/** The trial CTA. Repeated deliberately — top, mid-page and close. */
function TrialCta({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {label}
        <span aria-hidden>→</span>
      </Link>
      <Link
        href="/#pricing"
        className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
      >
        See pricing
      </Link>
      {sub && <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>}
    </div>
  );
}

export default async function UseCasePageRoute({ params }: { params: Promise<Params> }) {
  const { useCase } = await params;
  const page = getUseCasePage(useCase);
  if (!page) notFound();

  const url = absoluteUrl(`/${page.slug}`);
  const related = relatedPages(page.slug);
  const trialLabel = `Start with $${FIRST_TOPUP_BONUS_USD} free credit`;

  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: page.label, url },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          productJsonLd({ name: page.h1, description: page.description, url }),
          faqPageJsonLd(page.faqs),
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
              Get API Key
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
              <li className="text-[var(--color-text)]">{page.label}</li>
            </ol>
          </nav>

          {/* Hero */}
          <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            {page.badge}
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--color-text)] leading-[1.08]">
            {page.h1}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
            {page.intro}
          </p>

          <div className="mt-7">
            <TrialCta label={trialLabel} sub="No subscription · pay per GB" />
          </div>

          {/* The buyer's problem */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {page.problem.heading}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              {page.problem.body}
            </p>
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                You will recognise this if
              </p>
              <ul className="mt-3 space-y-2">
                {page.problem.symptoms.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-[var(--color-text)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Working code */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Working code
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Every block below runs as written once <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[12px]">PROXY_URL</code> holds
              a real connection string. Copy yours from the dashboard after your first top-up.
            </p>
            <div className="mt-6 space-y-8">
              {page.code.map((c) => (
                <div key={c.label}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">{c.label}</h3>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                      {c.lang}
                    </span>
                  </div>
                  <Code>{c.code}</Code>
                  {c.note && (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)] leading-relaxed">{c.note}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Rotation */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Which rotation mode to use
            </h2>
            <div className="mt-5 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Recommended
                </span>
                <code className="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 font-mono text-sm font-semibold text-[var(--color-primary)]">
                  {page.rotation.token}
                </code>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text)] leading-relaxed">
                {page.rotation.why}
              </p>
            </div>
            <h3 className="mt-6 text-sm font-semibold text-[var(--color-text)]">When to choose something else</h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">Mode</th>
                    <th className="px-4 py-3 font-semibold">Use it when</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rotation.alternatives.map((a) => (
                    <tr key={a.mode} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3 align-top font-mono text-[var(--color-primary)]">{a.mode}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{a.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bandwidth */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Expected bandwidth use
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              {page.bandwidth.lead}
            </p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">Workload</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Per unit</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">Per GB</th>
                  </tr>
                </thead>
                <tbody>
                  {page.bandwidth.rows.map((r) => (
                    <tr key={r.workload} className="border-t border-[var(--color-border)]">
                      <td className="px-4 py-3 text-[var(--color-text)]">{r.workload}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-muted)]">{r.perUnit}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-[var(--color-accent)]">{r.perGb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
              {page.bandwidth.tip}
            </p>

            {/* Pricing */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)]">
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
            <div className="mt-6">
              <TrialCta label={trialLabel} sub="Credits do not expire" />
            </div>
          </section>

          {/* Countries */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Relevant countries
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Change country by editing one token in the proxy username — no redeploy, no second account.
              Pool depth varies by country and by whether you use the mobile (<code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-[11px]">mbl</code>)
              or residential (<code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-[11px]">peer</code>) pool; live availability is shown on each
              country page and in your dashboard.
            </p>
            <div className="mt-5 space-y-3">
              {page.countries.map((c) => {
                const country = getCountry(c.slug);
                if (!country) return null;
                return (
                  <Link
                    key={c.slug}
                    href={`/mobile-proxies/${country.slug}`}
                    className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition hover:border-[var(--color-primary)]/40"
                  >
                    <span className="text-xl leading-none" aria-hidden>{country.flag}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--color-text)]">
                        {country.name}
                        <span className="ml-2 font-mono text-xs font-normal text-[var(--color-primary)]">-{country.code}-</span>
                      </span>
                      <span className="mt-1 block text-sm text-[var(--color-text-muted)] leading-relaxed">{c.why}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Legitimate use */}
          <section className="mt-14">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <h2 className="text-lg font-bold tracking-tight text-[var(--color-text)]">
                  {LEGITIMATE_USE_NOTICE.heading}
                </h2>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                {LEGITIMATE_USE_NOTICE.body}
              </p>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                For this use case
              </p>
              <ul className="mt-2.5 space-y-2">
                {page.legitimate.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-sm text-[var(--color-text)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    {l}
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Never, on any plan
              </p>
              <ul className="mt-2.5 space-y-2">
                {LEGITIMATE_USE_NOTICE.universal.map((l) => (
                  <li key={l} className="flex items-start gap-2.5 text-sm text-[var(--color-text)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    {l}
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-xs text-[var(--color-text-muted)] leading-relaxed">
                {LEGITIMATE_USE_NOTICE.footer} Full terms are in our{' '}
                <Link href="/terms" className="text-[var(--color-primary)] hover:underline">acceptable use policy</Link>.
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {page.label} FAQ
            </h2>
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
              {page.faqs.map((f) => (
                <details key={f.q} className="group border-b border-[var(--color-border)] py-4 last:border-b-0">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--color-text)]">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Related guides
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition hover:border-[var(--color-primary)]/40"
                >
                  <span className="block text-sm font-semibold text-[var(--color-text)]">{r.label}</span>
                  <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{r.badge}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Closing CTA */}
          <section className="mt-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Try it against your own targets
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
              Bandwidth estimates on this page are honest ranges, not promises — the only number that
              matters is what your targets cost you. Your first top-up is credited with an extra $
              {FIRST_TOPUP_BONUS_USD}, which is enough to meter a real run before you size a budget.
            </p>
            <div className="mt-6">
              <TrialCta label={trialLabel} />
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl">
          <UseCaseLinks current={page.slug} />

          <nav aria-label="Mobile proxy locations" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
              All Mobile Proxy Locations
            </h3>
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
