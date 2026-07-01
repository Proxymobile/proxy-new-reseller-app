import type { Metadata } from 'next';
import LandingPage from './_components/LandingPage';
import { HOME_FAQS } from '@/lib/home-faqs';
import { JsonLd } from '@/components/JsonLd';
import {
  SITE_URL,
  organizationJsonLd,
  webSiteJsonLd,
  productJsonLd,
  faqPageJsonLd,
} from '@/lib/seo';

export const metadata: Metadata = {
  // Absolute title (no template suffix) — this is the flagship keyword target.
  title: {
    absolute: 'Buy Mobile Proxies — 4G/5G LTE Carrier IPs from $5/GB | ProxyMobile',
  },
  description:
    'Buy mobile proxies billed per GB from $5/GB. Real 4G/5G LTE carrier IPs across 9 countries, HTTP & SOCKS5, no signup and instant activation. Start in seconds.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Buy Mobile Proxies — 4G/5G LTE Carrier IPs from $5/GB',
    description:
      'Pay-per-GB mobile proxies on real 4G/5G LTE carrier IPs across 9 countries. HTTP & SOCKS5, no signup, instant activation.',
    url: SITE_URL,
    type: 'website',
  },
  twitter: {
    title: 'Buy Mobile Proxies — 4G/5G LTE Carrier IPs from $5/GB',
    description:
      'Pay-per-GB mobile proxies on real 4G/5G LTE carrier IPs across 9 countries. HTTP & SOCKS5, no signup, instant activation.',
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          webSiteJsonLd(),
          productJsonLd(),
          faqPageJsonLd(HOME_FAQS),
        ]}
      />
      <LandingPage />
    </>
  );
}
