import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/config';
import { GB_TIERS, FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { COUNTRIES } from '@/lib/countries';
import { JsonLd } from '@/components/JsonLd';
import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  productJsonLd,
} from '@/lib/seo';
import {
  API_TITLE,
  API_DESCRIPTION,
  API_H1,
  API_INTRO,
  API_FAQS,
  ASSISTANT_PROMPT,
  CODE_SAMPLES,
  ROTATION_MODES,
  URL_PARTS,
  USE_CASES,
  VIBE_POINTS,
} from '@/lib/api-page';

const PAGE_PATH = '/mobile-proxy-api';
const pageUrl = absoluteUrl(PAGE_PATH);

export const metadata: Metadata = {
  title: { absolute: API_TITLE },
  description: API_DESCRIPTION,
  keywords: [
    'mobile proxy api',
    'proxy api',
    'rotating proxy api',
    '4g proxy api',
    'proxy for web scraping',
    'proxy for playwright',
    'proxy for ai agents',
    'socks5 mobile proxy',
    'pay per gb proxy',
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    title: API_TITLE,
    description: API_DESCRIPTION,
    url: pageUrl,
    type: 'article',
  },
  twitter: {
    title: API_TITLE,
    description: API_DESCRIPTION,
  },
};

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

export default function MobileProxyApiPage() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_URL },
    { name: 'Mobile Proxy API', url: pageUrl },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          productJsonLd({
            name: 'Mobile Proxy API',
            description: API_DESCRIPTION,
            url: pageUrl,
          }),
          faqPageJsonLd(API_FAQS),
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
          <nav aria-label="Breadcrumb" className="mb-8 text-xs text-[var(--color-text-muted)]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/" className="hover:text-[var(--color-text)]">Home</Link></li>
              <li aria-hidden>/</li>
              <li className="text-[var(--color-text)]">Mobile Proxy API</li>
            </ol>
          </nav>

          <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            No SDK · HTTP &amp; SOCKS5
          </span>
          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--color-text)] leading-[1.08]">
            {API_H1}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
            {API_INTRO}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              Get your API key
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
            >
              See per-GB pricing
            </Link>
          </div>
          <p className="mt-3 text-xs font-semibold text-[var(--color-accent)]">
            {money(FIRST_TOPUP_BONUS_USD)} free credit on your first top-up
          </p>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Quickstart: one URL, four languages
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              Your dashboard shows the connection line with your username and key
              already filled in. Copy it into <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs">PROXY_URL</code> and
              every example below works as written.
            </p>
            <div className="mt-5 space-y-5">
              {CODE_SAMPLES.map((s) => (
                <div key={s.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {s.label}
                  </p>
                  <Code>{s.code}</Code>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Built for vibe coding
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              If you are building with Cursor, Claude Code, Copilot or any other
              assistant, the hard part of adding a proxy is usually the vendor SDK:
              the model has never seen it, invents method names, and you spend an
              afternoon debugging code you did not write. There is no SDK here, so
              that failure mode does not exist.
            </p>
            <div className="mt-6 space-y-6">
              {VIBE_POINTS.map((p) => (
                <div key={p.heading}>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{p.heading}</h3>
                  <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Hand this to your assistant
              </p>
              <Code>{ASSISTANT_PROMPT}</Code>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              What each part of the URL does
            </h2>
            <p className="mt-3 mb-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
              The routing lives in the username, so changing behaviour never means
              changing code.
            </p>
            <Code>{'{protocol}://{username}-{pool}-{country}[-sid-{id}][-rot-{mode}]:{key}@{gateway}:{port}'}</Code>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">Token</th>
                    <th className="px-4 py-3 font-semibold">Values</th>
                    <th className="px-4 py-3 font-semibold">What it controls</th>
                  </tr>
                </thead>
                <tbody>
                  {URL_PARTS.map((p) => (
                    <tr key={p.part} className="border-t border-[var(--color-border)] text-[var(--color-text)]">
                      <td className="px-4 py-3 font-mono text-[var(--color-primary)]">{p.part}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.values}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{p.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Rotation modes
            </h2>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <tbody>
                  {ROTATION_MODES.map((r) => (
                    <tr key={r.mode} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="px-4 py-3 align-top font-mono text-[var(--color-primary)] whitespace-nowrap">{r.mode}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{r.body}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              What people build with it
            </h2>
            <div className="mt-6 space-y-6">
              {USE_CASES.map((u) => (
                <div key={u.heading}>
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{u.heading}</h3>
                  <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">{u.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              API pricing — per GB, no per-request fee
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
              You are billed for bandwidth, not for calls. Requests, sessions,
              rotations and countries cost nothing extra, and there is no monthly
              subscription to keep the key alive.
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
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create an account and get your key
              </Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Mobile proxy API FAQ
            </h2>
            <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5">
              {API_FAQS.map((f) => (
                <details key={f.q} className="group border-b border-[var(--color-border)] py-4 last:border-b-0">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--color-text)]">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Pick a country to route through
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {COUNTRIES.slice(0, 6).map((c) => (
                <Link
                  key={c.slug}
                  href={`/mobile-proxies/${c.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
                >
                  <span aria-hidden>{c.flag}</span>
                  {c.shortName} Mobile Proxies
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>

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
