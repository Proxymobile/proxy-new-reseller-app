import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { config } from '@/config';
import { GB_TIERS, FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { COUNTRIES_ZH as COUNTRIES } from '@/lib/countries-zh';
import { JsonLd } from '@/components/JsonLd';
import { UseCaseLinksZh } from '@/components/UseCaseLinksZh';
import {
  SITE_NAME,
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  productJsonLd,
} from '@/lib/seo';
import {
  API_TITLE_ZH as API_TITLE,
  API_DESCRIPTION_ZH as API_DESCRIPTION,
  API_H1_ZH as API_H1,
  API_INTRO_ZH as API_INTRO,
  API_FAQS_ZH as API_FAQS,
  ASSISTANT_PROMPT_ZH as ASSISTANT_PROMPT,
  CODE_SAMPLES_ZH as CODE_SAMPLES,
  ROTATION_MODES_ZH as ROTATION_MODES,
  URL_PARTS_ZH as URL_PARTS,
  USE_CASES_ZH as USE_CASES,
  VIBE_POINTS_ZH as VIBE_POINTS,
} from '@/lib/api-page-zh';

// Simplified-Chinese copy of src/app/mobile-proxy-api/page.tsx (SEO only).
const PAGE_PATH = '/zh/mobile-proxy-api';
const pageUrl = absoluteUrl(PAGE_PATH);

export const metadata: Metadata = {
  title: { absolute: API_TITLE },
  description: API_DESCRIPTION,
  keywords: [
    '移动代理API',
    '代理IP API',
    '轮换代理API',
    '4G代理API',
    '网页爬虫代理',
    'Playwright代理',
    'AI智能体代理',
    'SOCKS5移动代理',
    '按流量计费代理',
  ],
  alternates: {
    canonical: pageUrl,
    languages: {
      en: absoluteUrl('/mobile-proxy-api'),
      'zh-Hans': pageUrl,
      'x-default': absoluteUrl('/mobile-proxy-api'),
    },
  },
  openGraph: {
    title: API_TITLE,
    description: API_DESCRIPTION,
    url: pageUrl,
    type: 'article',
    locale: 'zh_CN',
  },
  twitter: {
    title: API_TITLE,
    description: API_DESCRIPTION,
  },
};

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

export default function MobileProxyApiPageZh() {
  const breadcrumbs = [
    { name: '首页', url: absoluteUrl('/zh') },
    { name: '移动代理 API', url: pageUrl },
  ];

  return (
    <div lang="zh-CN" className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <script dangerouslySetInnerHTML={{ __html: langScript }} />
      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbs),
          productJsonLd({
            name: '移动代理 API',
            description: API_DESCRIPTION,
            url: pageUrl,
          }),
          faqPageJsonLd(API_FAQS),
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
          <nav aria-label="面包屑导航" className="mb-8 text-xs text-[var(--color-text-muted)]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li><Link href="/zh" className="hover:text-[var(--color-text)]">首页</Link></li>
              <li aria-hidden>/</li>
              <li className="text-[var(--color-text)]">移动代理 API</li>
            </ol>
          </nav>

          <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            无需 SDK · HTTP 与 SOCKS5
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
              获取您的 API 密钥
            </Link>
            <Link
              href="/zh#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
            >
              查看按 GB 计费价格
            </Link>
          </div>
          <p className="mt-3 text-xs font-semibold text-[var(--color-accent)]">
            首次充值赠送 {money(FIRST_TOPUP_BONUS_USD)} 免费额度
          </p>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              快速上手：一个 URL，四种语言
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              控制台中显示的连接字符串已填好您的用户名和密钥。把它复制到 <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs">PROXY_URL</code> 中，
              下面的每个示例即可直接运行。
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
              为 Vibe Coding 而生
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
              如果您使用 Cursor、Claude Code、Copilot 或其他 AI 助手开发，接入代理最难的部分通常是厂商 SDK：
              模型从未见过它，会凭空编造方法名，您得花一下午去调试不是自己写的代码。
              这里没有 SDK，所以这类问题根本不存在。
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
                把这段话交给您的 AI 助手
              </p>
              <Code>{ASSISTANT_PROMPT}</Code>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              URL 各部分的作用
            </h2>
            <p className="mt-3 mb-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
              路由信息都在用户名中，因此改变行为永远不需要修改代码。
            </p>
            <Code>{'{protocol}://{username}-{pool}-{country}[-sid-{id}][-rot-{mode}]:{key}@{gateway}:{port}'}</Code>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)] text-left text-[var(--color-text-muted)]">
                    <th className="px-4 py-3 font-semibold">参数</th>
                    <th className="px-4 py-3 font-semibold">取值</th>
                    <th className="px-4 py-3 font-semibold">作用</th>
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
              轮换模式
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
              常见应用场景
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
              API 价格——按 GB 计费，不按请求收费
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
              我们按带宽计费，而不是按调用次数。请求、会话、轮换和国家切换均不额外收费，
              也无需为保持密钥有效而支付月度订阅费。
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
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                创建账户并获取密钥
              </Link>
            </div>
          </section>

          <section className="mt-14">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              移动代理 API 常见问题
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
              选择出口国家
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {COUNTRIES.slice(0, 6).map((c) => (
                <Link
                  key={c.slug}
                  href={`/zh/mobile-proxies/${c.slug}`}
                  className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
                >
                  <span aria-hidden>{c.flag}</span>
                  {c.shortName}移动代理
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>

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
              <Link href="/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">服务条款</Link>
              <Link href="/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">隐私政策</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
