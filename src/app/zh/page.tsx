import type { Metadata } from 'next';
import LandingPageZh from '../_components/LandingPageZh';
import { HOME_FAQS_ZH } from '@/lib/home-faqs-zh';
import { JsonLd } from '@/components/JsonLd';
import {
  SITE_URL,
  SITE_NAME,
  organizationJsonLd,
  productJsonLd,
  faqPageJsonLd,
} from '@/lib/seo';

/**
 * Simplified-Chinese homepage — an SEO landing page only. It is not linked
 * from the English UI (no language switcher); search engines find it through
 * the hreflang alternates on both pages and the sitemap.
 */
const ZH_URL = `${SITE_URL}/zh`;

const TITLE = '购买移动代理 IP — 真实 4G/5G LTE 运营商 IP，低至 $5/GB';
const DESCRIPTION =
  '按 GB 购买移动代理，低至 $5/GB。覆盖 10+ 个国家的真实 4G/5G LTE 运营商 IP 与住宅 IP，支持 HTTP 与 SOCKS5，无需注册，即时开通。';

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE_NAME}` },
  description: DESCRIPTION,
  keywords: [
    '移动代理',
    '手机代理IP',
    '4G代理',
    '5G代理',
    '住宅代理',
    '动态IP代理',
    'SOCKS5代理',
    '代理IP购买',
  ],
  alternates: {
    canonical: ZH_URL,
    languages: {
      en: SITE_URL,
      'zh-Hans': ZH_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: ZH_URL,
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: ['en_US'],
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
};

// The root layout is shared and renders <html lang="en">; correct it for this
// page before paint so crawlers and screen readers see Chinese.
const langScript = `document.documentElement.lang='zh-CN';`;

export default function Page() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: langScript }} />
      <JsonLd
        data={[
          organizationJsonLd(),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: TITLE,
            description: DESCRIPTION,
            url: ZH_URL,
            inLanguage: 'zh-CN',
          },
          productJsonLd({
            name: '移动代理带宽',
            description:
              '按 GB 计费的移动代理带宽，基于真实 4G/5G/LTE 运营商 IP。支持 HTTP 与 SOCKS5，按需轮换 IP，无需订阅。',
            url: ZH_URL,
          }),
          faqPageJsonLd(HOME_FAQS_ZH),
        ]}
      />
      <div lang="zh-CN">
        <LandingPageZh />
      </div>
    </>
  );
}
