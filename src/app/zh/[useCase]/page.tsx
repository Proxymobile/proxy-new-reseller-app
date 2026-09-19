import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/config';
import { GB_TIERS, FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { COUNTRIES_ZH as COUNTRIES, getCountryZh as getCountry } from '@/lib/countries-zh';
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
import {
  LEGITIMATE_USE_NOTICE_ZH as LEGITIMATE_USE_NOTICE,
  USE_CASE_PAGES_ZH as USE_CASE_PAGES,
  getUseCasePageZh as getUseCasePage,
  relatedPagesZh as relatedPages,
} from '@/lib/use-cases-zh';

type Params = { useCase: string };

/**
 * Simplified-Chinese copy of src/app/[useCase]/page.tsx, served at /zh/{slug}
 * for SEO. Literal segments under /zh (mobile-proxies, mobile-proxy-api) are
 * resolved before this one, and dynamicParams = false 404s anything else.
 */
export function generateStaticParams(): Params[] {
  return USE_CASE_PAGES.map((p) => ({ useCase: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { useCase } = await params;
  const page = getUseCasePage(useCase);
  if (!page) return {};
  const url = absoluteUrl(`/zh/${page.slug}`);
  return {
    title: { absolute: page.title },
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: url,
      languages: {
        en: absoluteUrl(`/${page.slug}`),
        'zh-Hans': url,
        'x-default': absoluteUrl(`/${page.slug}`),
      },
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: 'article',
      locale: 'zh_CN',
    },
    twitter: {
      title: page.title,
      description: page.description,
    },
  };
}

const langScript = `document.documentElement.lang='zh-CN';`;

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
        href="/zh#pricing"
        className="inline-flex items-center rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
      >
        查看价格
      </Link>
      {sub && <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>}
    </div>
  );
}

export default async function UseCasePageRouteZh({ params }: { params: Promise<Params> }) {
  const { useCase } = await params;
  const page = getUseCasePage(useCase);
  if (!page) notFound();

  const url = absoluteUrl(`/zh/${page.slug}`);
  const related = relatedPages(page.slug);
  const trialLabel = `领取 $${FIRST_TOPUP_BONUS_USD} 免费额度并开始`;

  const breadcrumbs = [
    { name: '首页', url: absoluteUrl('/zh') },
    { name: page.label, url },
  ];

  return (
    <div lang="zh-CN" className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <script dangerouslySetInnerHTML={{ __html: langScript }} />
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
            <TrialCta label={trialLabel} sub="无需订阅 · 按 GB 计费" />
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
                如果您遇到过以下情况
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
              可运行的代码
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              只要 <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[12px]">PROXY_URL</code> 中填入真实的连接字符串，下面的每段代码都能直接运行。首次充值后，可在控制台复制您的连接字符串。
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
              应该使用哪种轮换模式
            </h2>
            <div className="mt-5 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  推荐
                </span>
                <code className="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 font-mono text-sm font-semibold text-[var(--color-primary)]">
                  {page.rotation.token}
                </code>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text)] leading-relaxed">
                {page.rotation.why}
              </p>
            </div>
            <h3 className="mt-6 text-sm font-semibold text-[var(--color-text)]">何时选择其他模式</h3>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">模式</th>
                    <th className="px-4 py-3 font-semibold">适用场景</th>
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
              预计带宽用量
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              {page.bandwidth.lead}
            </p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">任务类型</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">单次用量</th>
                    <th className="px-4 py-3 font-semibold whitespace-nowrap">每 GB 可完成</th>
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
            <div className="mt-6">
              <TrialCta label={trialLabel} sub="余额永不过期" />
            </div>
          </section>

          {/* Countries */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              适用国家
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              修改代理用户名中的一个参数即可切换国家——无需重新部署，也无需第二个账户。
              IP 池规模因国家而异，也取决于您使用的是移动（<code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-[11px]">mbl</code>）
              还是住宅（<code className="rounded bg-[var(--color-surface)] px-1 py-0.5 text-[11px]">peer</code>）IP 池；实时可用情况请查看各国家页面和您的控制台。
            </p>
            <div className="mt-5 space-y-3">
              {page.countries.map((c) => {
                const country = getCountry(c.slug);
                if (!country) return null;
                return (
                  <Link
                    key={c.slug}
                    href={`/zh/mobile-proxies/${country.slug}`}
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
                本场景的使用要求
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
                任何套餐均严禁
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
                {LEGITIMATE_USE_NOTICE.footer}完整条款请参阅我们的
                <Link href="/terms" className="text-[var(--color-primary)] hover:underline">可接受使用政策</Link>。
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              {page.label}常见问题
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
              相关指南
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/zh/${r.slug}`}
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
              用您自己的目标网站试一试
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
              本页的带宽估算是如实给出的参考范围，而非承诺——唯一重要的数字，是您的目标网站实际消耗的流量。首次充值额外赠送 $
              {FIRST_TOPUP_BONUS_USD}，足够您在确定预算之前，先实际计量一次运行。
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
          <UseCaseLinksZh current={page.slug} />

          <nav aria-label="移动代理覆盖地区" className="mt-8 border-t border-[var(--color-border)] pt-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
              全部移动代理地区
            </h3>
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
