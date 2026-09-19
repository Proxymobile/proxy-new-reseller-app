import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/config';
import { GB_TIERS } from '@/lib/pricing';
import { proxies } from '@/lib/proxies';
import { COUNTRIES_ZH as COUNTRIES, getCountryZh as getCountry, siblingCountriesZh as siblingCountries } from '@/lib/countries-zh';
import { JsonLd } from '@/components/JsonLd';
import { UseCaseLinksZh } from '@/components/UseCaseLinksZh';
import { TelegramFooterLink } from '@/components/TelegramLink';
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  productJsonLd,
} from '@/lib/seo';

type Params = { country: string };

// Simplified-Chinese copy of src/app/mobile-proxies/[country]/page.tsx (SEO only).
// Pre-render one static page per country at build time.
export function generateStaticParams(): Params[] {
  return COUNTRIES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) return {};
  const url = absoluteUrl(`/zh/mobile-proxies/${country.slug}`);
  return {
    title: { absolute: country.title },
    description: country.description,
    alternates: {
      canonical: url,
      languages: {
        en: absoluteUrl(`/mobile-proxies/${country.slug}`),
        'zh-Hans': url,
        'x-default': absoluteUrl(`/mobile-proxies/${country.slug}`),
      },
    },
    openGraph: {
      title: country.title,
      description: country.description,
      url,
      type: 'article',
      locale: 'zh_CN',
    },
    twitter: {
      title: country.title,
      description: country.description,
    },
  };
}

export const dynamicParams = false;
// Re-check live inventory periodically so availability badges stay honest
// without rebuilding. Pages remain statically served between revalidations.
export const revalidate = 600;

const langScript = `document.documentElement.lang='zh-CN';`;

function money(v: number) {
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}

/** Live mobile endpoint count for a country code, or null if unknown. */
async function liveMobileStock(code: string): Promise<number | null> {
  try {
    const stock = await proxies().pool.getStock();
    return stock?.pools?.mbl?.[code] ?? 0;
  } catch {
    return null;
  }
}

export default async function CountryPageZh({ params }: { params: Promise<Params> }) {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();

  const mblOnline = await liveMobileStock(country.code);

  const url = absoluteUrl(`/zh/mobile-proxies/${country.slug}`);
  const siblings = siblingCountries(country.slug, 3);
  const carrierList = country.carriers.join('、');

  const breadcrumbs = [
    { name: '首页', url: absoluteUrl('/zh') },
    { name: '移动代理', url: absoluteUrl('/zh#locations') },
    { name: `${country.shortName}移动代理`, url },
  ];

  return (
    <div lang="zh-CN" className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <script dangerouslySetInnerHTML={{ __html: langScript }} />
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          productJsonLd({
            name: `${country.name}移动代理`,
            description: country.description,
            url,
          }),
          faqPageJsonLd(country.faqs),
        ]}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[var(--color-bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 sm:px-6 py-3.5">
          <Link href="/zh" className="flex items-center" aria-label={`${config.brand.name} 首页`}>
            <Image
              src="/logo.png"
              alt={`${config.brand.name} — 移动代理服务`}
              width={1516}
              height={429}
              sizes="170px"
              className="h-9 sm:h-10 w-auto dark:invert"
            />
          </Link>
          <nav className="flex items-center gap-2 text-sm" aria-label="主导航">
            <Link href="/zh#pricing" className="rounded-lg px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              价格
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[var(--color-text)] px-5 py-2 font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              获取 API 密钥
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-12 lg:py-16">
          {/* Breadcrumb */}
          <nav aria-label="面包屑导航" className="mb-8 text-xs text-[var(--color-text-muted)]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/zh" className="hover:text-[var(--color-text)]">首页</Link></li>
              <li aria-hidden>/</li>
              <li><a href="/zh#locations" className="hover:text-[var(--color-text)]">移动代理</a></li>
              <li aria-hidden>/</li>
              <li className="text-[var(--color-text)]">{country.shortName}</li>
            </ol>
          </nav>

          {/* Hero */}
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none" aria-hidden>{country.flag}</span>
            <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
              真实 4G/5G 运营商 IP
            </span>
          </div>
          <h1 className="mt-5 text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[var(--color-text)] leading-[1.08]">
            {country.h1}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] leading-relaxed">
            {country.intro}
          </p>

          {/* Live availability — reflects real upstream inventory */}
          {mblOnline !== null && (
            mblOnline > 0 ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                {country.shortName}当前有 {mblOnline} 个移动节点在线
              </div>
            ) : (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-medium text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
                {country.shortName}移动 IP 池正在补充中——{country.shortName}住宅 IP 现已可用
              </div>
            )
          )}

          {/* Primary CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/zh#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              查看{country.shortName}价格
            </Link>
            <span className="text-xs text-[var(--color-text-muted)]">
              运营商：{carrierList}
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
              {country.shortName}移动代理的常见用途
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
              {country.shortName}移动代理价格
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              按 GB 计费——无需订阅，流量永不过期。购买越多，每 GB 单价越低，最低 $5/GB。
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">带宽</th>
                    <th className="px-4 py-3 font-semibold">价格</th>
                    <th className="px-4 py-3 font-semibold">每 GB</th>
                    <th className="px-4 py-3 font-semibold">节省</th>
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
                href="/zh#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                配置您的{country.shortName}套餐
              </Link>
            </div>
          </section>

          {/* FAQ — server-rendered, always in the DOM via <details> */}
          <section className="mt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {country.shortName}移动代理常见问题
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
              探索其他地区
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  href={`/zh/mobile-proxies/${s.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
                >
                  <span aria-hidden>{s.flag}</span>
                  {s.shortName}移动代理
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-[var(--color-text-muted)]">
              也可以返回<Link href="/zh#pricing" className="text-[var(--color-primary)] hover:underline">首页价格</Link>，对比我们覆盖的所有国家。
              想把{country.shortName} IP 接入自己的代码？
              <Link href="/zh/mobile-proxy-api" className="text-[var(--color-primary)] hover:underline">移动代理 API 指南</Link>
              提供了 curl、Python、Node 和 Playwright 的可直接复制的示例。
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 py-10 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-5xl">
          <UseCaseLinksZh />

          <nav aria-label="移动代理覆盖地区" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
              全部移动代理地区
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {COUNTRIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/zh/mobile-proxies/${c.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <span aria-hidden>{c.flag}</span>
                    {c.shortName}移动代理
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6">
            <span className="text-xs text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} {SITE_NAME} · 保留所有权利
            </span>
            <div className="flex items-center gap-4">
              <TelegramFooterLink label="客服 @proxymobilesupport" />
              <Link href="/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">服务条款</Link>
              <Link href="/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">隐私政策</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
