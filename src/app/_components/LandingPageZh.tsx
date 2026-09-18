'use client';

// Simplified-Chinese copy of LandingPage.tsx, served at /zh for SEO only (no
// language switcher links here). Keep in sync when the English page changes.
import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { config } from '@/config';
import { customGbPrice, customGbRatePerGB, GB_TIERS, FIRST_TOPUP_BONUS_USD } from '@/lib/pricing';
import { COUNTRIES } from '@/lib/countries';
import { GATEWAY_DISPLAY_HOST, GATEWAY_HTTP_PORT, gatewayDisplayEndpoint } from '@/lib/gateway';
import { HOME_FAQS_ZH as HOME_FAQS } from '@/lib/home-faqs-zh';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UseCaseLinksZh } from '@/components/UseCaseLinksZh';

// ─── Animation Variants ────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Data ───────────────────────────────────────────────────

const URL_SEGMENTS = [
  { text: 'user', label: '您的账户', color: '#9ca3af', active: '#d1d5db' },
  { text: 'mbl', label: 'IP 池类型', color: '#818cf8', active: '#a5b4fc' },
  { text: 'us', label: '国家', color: '#34d399', active: '#6ee7b7' },
  { text: 'sid-a7f3', label: '会话 ID', color: '#38bdf8', active: '#7dd3fc' },
  { text: 'rot-sticky', label: '轮换方式', color: '#fbbf24', active: '#fcd34d' },
];

const FAQS = HOME_FAQS;

const OLD_ENDPOINTS = [
  'us-http.provider.com:8080',
  'us-socks.provider.com:1080',
  'de-http.provider.com:8080',
  'de-socks.provider.com:1080',
  'gb-http.provider.com:8080',
  'gb-socks.provider.com:1080',
];

const PRICING_COUNTRIES = [
  { code: 'us', name: '美国', flag: '\u{1F1FA}\u{1F1F8}', badge: 'HOT' },
  { code: 'de', name: '德国', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'gb', name: '英国', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'fr', name: '法国', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'es', name: '西班牙', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'pl', name: '波兰', flag: '\u{1F1F5}\u{1F1F1}', badge: 'NEW' },
  { code: 'ch', name: '瑞士', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'pa', name: '巴拿马', flag: '\u{1F1F5}\u{1F1E6}' },
  { code: 'am', name: '亚美尼亚', flag: '\u{1F1E6}\u{1F1F2}' },
];

// Chinese names for the footer country links (country pages stay English).
const COUNTRY_ZH: Record<string, string> = {
  us: '美国', de: '德国', gb: '英国', fr: '法国', es: '西班牙', pl: '波兰',
  ch: '瑞士', pa: '巴拿马', am: '亚美尼亚', nl: '荷兰', ge: '格鲁吉亚',
};

// ─── Pricing config + math ──────────────────────────────────
// Pricing comes straight from src/lib/pricing.ts (the same curve the server
// charges) so the advertised price ALWAYS equals what checkout charges.
// Easy-to-edit social proof line (rendered near the CTA).
const SOCIAL_PROOF = {
  users: '1,200+ 活跃用户',
  uptime: '99.9% 在线率',
  rating: '4.8/5 用户评分',
};

const BASE_RATE = 7; // entry $/GB rate (1–5 GB) — used to compute "you save"
const POPULAR_GB = 10; // default slider position + "Most Popular" marker
const MIN_GB = 1;
const MAX_GB = 100;
const SEGS = GB_TIERS.length - 1;

function ratePerGb(gb: number): number {
  return customGbRatePerGB(Math.min(MAX_GB, Math.max(MIN_GB, gb)));
}
function totalFor(gb: number): number {
  return customGbPrice(Math.min(MAX_GB, Math.max(MIN_GB, gb)));
}
function discountPct(gb: number): number {
  return Math.round((1 - ratePerGb(gb) / BASE_RATE) * 100);
}
// Position uses equal-width segments between breakpoints so the tick labels are
// evenly spaced along the track (not bunched at the low end).
function gbToPct(gb: number): number {
  for (let i = 0; i < SEGS; i++) {
    const a = GB_TIERS[i].gb;
    const b = GB_TIERS[i + 1].gb;
    if (gb >= a && gb <= b) return ((i + (gb - a) / (b - a)) / SEGS) * 100;
  }
  return 100;
}
function pctToGb(pct: number): number {
  const p = Math.min(100, Math.max(0, pct));
  const seg = (p / 100) * SEGS;
  const i = Math.min(SEGS - 1, Math.floor(seg));
  const frac = seg - i;
  const a = GB_TIERS[i].gb;
  const b = GB_TIERS[i + 1].gb;
  return Math.round(a + frac * (b - a));
}
function money(v: number): string {
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}

// ─── Hero Tech Cards (visual only) ──────────────────────────

function LiveRouteCard() {
  const routes = [
    { flag: '\u{1F1E9}\u{1F1EA}', country: '德国', city: '法兰克福', carrier: 'Vodafone DE', latency: 38, ip: '92.196.42.xxx' },
    { flag: '\u{1F1FA}\u{1F1F8}', country: '美国', city: '达拉斯', carrier: 'T-Mobile USA', latency: 51, ip: '174.56.32.xxx' },
    { flag: '\u{1F1EC}\u{1F1E7}', country: '英国', city: '伦敦', carrier: 'EE Mobile', latency: 44, ip: '82.132.18.xxx' },
    { flag: '\u{1F1EB}\u{1F1F7}', country: '法国', city: '巴黎', carrier: 'Orange', latency: 29, ip: '93.21.74.xxx' },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % routes.length), 3200);
    return () => clearInterval(t);
  }, [routes.length]);
  const r = routes[idx];

  return (
    <div className="relative rounded-[22px] bg-[var(--color-surface)] hairline shadow-premium edge-light p-5 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">当前线路</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500 status-dot" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          在线
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="mt-4 flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-hover)] text-2xl leading-none">
            {r.flag}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">{r.country}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">{r.city} · {r.carrier}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 grid grid-cols-3 gap-2 text-left">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">类型</p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--color-text)]">移动 LTE</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">延迟</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={r.latency}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="mt-1 text-[11px] font-semibold text-[var(--color-text)]"
            >
              {r.latency}ms
            </motion.p>
          </AnimatePresence>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">信任度</p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">98%</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[var(--color-surface-hover)]/70 hairline-soft p-2.5">
        <div className="flex items-center justify-between gap-2">
          <code className="font-mono text-[10.5px] text-[var(--color-text-muted)] truncate">
            <AnimatePresence mode="wait">
              <motion.span
                key={r.ip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {r.ip}
              </motion.span>
            </AnimatePresence>
          </code>
          <span className="shrink-0 rounded-md bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            5G
          </span>
        </div>
      </div>
    </div>
  );
}

function SignalCard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1200);
    return () => clearInterval(t);
  }, []);
  const bars = [0.4, 0.6, 0.8, 1, 0.85];
  // Simulate "live" jitter
  const jitter = (i: number) => 0.85 + Math.sin((tick + i) * 1.3) * 0.12;

  return (
    <div className="relative rounded-[20px] bg-[var(--color-surface)] hairline shadow-premium edge-light p-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">信号</span>
        <span className="rounded-md bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          5G · LTE
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1 h-10">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            animate={{ scaleY: h * jitter(i) }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ transformOrigin: 'bottom' }}
            className="flex-1 rounded-sm bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-soft)]"
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-[var(--color-text-muted)]">RSSI</span>
        <span className="font-mono font-semibold text-[var(--color-text)]">−68 dBm</span>
      </div>
    </div>
  );
}

function BandwidthCard() {
  const points = [12, 18, 14, 22, 28, 24, 30, 26, 34, 31, 38, 36];
  const max = Math.max(...points);
  const w = 220;
  const h = 56;
  const step = w / (points.length - 1);
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p / max) * h}`)
    .join(' ');
  const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="relative rounded-[20px] bg-[var(--color-surface)] hairline shadow-premium edge-light p-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">带宽</span>
        <span className="text-[11px] font-semibold text-[var(--color-text)]">
          12.4 <span className="text-[var(--color-text-muted)] font-normal">/ 25 GB</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full h-14" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#bwGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
        <span>↓ 14.2 MB/s</span>
        <span>↑ 3.1 MB/s</span>
      </div>
    </div>
  );
}

function EndpointBadge() {
  return (
    <div className="relative rounded-[18px] bg-[var(--color-text)] text-[var(--color-bg)] shadow-premium p-3 overflow-hidden">
      <div className="flex items-center gap-2">
        <span className="relative inline-flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-emerald-400 status-dot" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">接入端点</span>
      </div>
      <p className="mt-1.5 font-mono text-xs sm:text-sm tracking-tight">
        {GATEWAY_DISPLAY_HOST}<span className="opacity-50">:{GATEWAY_HTTP_PORT}</span>
      </p>
    </div>
  );
}

// ─── Animated Visuals ───────────────────────────────────────

function ConfigComparison() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => setPhase(2), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [inView]);

  return (
    <div ref={ref} className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">传统方案</p>
      <div className="space-y-1.5 mb-5">
        {OLD_ENDPOINTS.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? {
              opacity: phase >= 1 ? 0.25 : 1,
              x: 0,
              textDecoration: phase >= 1 ? 'line-through' : 'none',
            } : { opacity: 0, x: -8 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="font-mono text-xs text-red-400/80"
          >
            {line}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">{config.brand.name}</p>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-mono text-sm text-emerald-400">{gatewayDisplayEndpoint()}</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-2 ml-6">一个端点，覆盖所有国家，同时支持两种协议。</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UrlAnatomy() {
  const [active, setActive] = useState(-1);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const start = setTimeout(() => {
      setActive(0);
    }, 600);
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % URL_SEGMENTS.length);
    }, 2200);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [inView]);

  return (
    <div ref={ref} className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] p-5 sm:p-6">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">URL 结构解析</p>
      <div className="font-mono text-sm sm:text-base leading-relaxed">
        <span className="text-gray-600">http://</span>
        {URL_SEGMENTS.map((seg, i) => (
          <span key={i}>
            {i > 0 && <span className="text-gray-700">-</span>}
            <span className="relative inline-block">
              <motion.span
                animate={{
                  color: active === i ? seg.active : seg.color,
                  textShadow: active === i ? `0 0 20px ${seg.color}40` : '0 0 0px transparent',
                }}
                transition={{ duration: 0.4 }}
                className="font-medium"
              >
                {seg.text}
              </motion.span>
              <AnimatePresence>
                {active === i && (
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px]"
                    style={{ backgroundColor: `${seg.color}18`, color: seg.active }}
                  >
                    {seg.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </span>
        ))}
        <span className="text-gray-700">:</span>
        <span className="text-gray-600">pmk_***</span>
        <span className="text-gray-700">@</span>
        <span className="text-gray-600">{gatewayDisplayEndpoint()}</span>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="mt-5 text-xs text-gray-500"
      >
        所有参数都写在用户名里。修改任意参数，无需更换端点。
      </motion.p>
    </div>
  );
}

function TerminalDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const cmdSegments = [
    { text: '$ ', cls: 'text-emerald-400' },
    { text: 'curl ', cls: 'text-gray-200' },
    { text: '-x ', cls: 'text-sky-400' },
    { text: `http://user-mbl-us-rot-sticky:pmk_***@${gatewayDisplayEndpoint()} `, cls: 'text-amber-300/80' },
    { text: 'ipinfo.io', cls: 'text-gray-200' },
  ];

  return (
    <div ref={ref} className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[10px] text-gray-600">终端</span>
      </div>
      <div className="p-4 sm:p-5 font-mono text-xs sm:text-sm">
        <div className="flex flex-wrap">
          {cmdSegments.map((seg, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.3 }}
              className={seg.cls}
            >
              {seg.text}
            </motion.span>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-4 space-y-0.5"
        >
          <div className="text-gray-600">{'{'}</div>
          <div className="ml-4">
            <span className="text-sky-300">{'"ip"'}</span>
            <span className="text-gray-600">: </span>
            <span className="text-amber-300">{'"174.56.32.xxx"'}</span>
            <span className="text-gray-600">,</span>
          </div>
          <div className="ml-4">
            <span className="text-sky-300">{'"country"'}</span>
            <span className="text-gray-600">: </span>
            <span className="text-amber-300">{'"US"'}</span>
            <span className="text-gray-600">,</span>
          </div>
          <div className="ml-4">
            <span className="text-sky-300">{'"org"'}</span>
            <span className="text-gray-600">: </span>
            <span className="text-emerald-400">{'"T-Mobile USA"'}</span>
          </div>
          <div className="text-gray-600">{'}'}</div>
        </motion.div>
      </div>
    </div>
  );
}

function PoolToggle() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setIsMobile((prev) => !prev), 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] p-5 sm:p-6">
      <div className="flex rounded-lg bg-white/[0.04] p-0.5 mb-5">
        <button
          onClick={() => setIsMobile(true)}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
            isMobile ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          移动
        </button>
        <button
          onClick={() => setIsMobile(false)}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
            !isMobile ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          住宅
        </button>
      </div>

      <div className="font-mono text-xs text-gray-500 mb-4 overflow-hidden">
        <span>user-</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={isMobile ? 'mbl' : 'peer'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="inline-block text-indigo-400 font-medium"
          >
            {isMobile ? 'mbl' : 'peer'}
          </motion.span>
        </AnimatePresence>
        <span>-us:pmk_***@{gatewayDisplayEndpoint()}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isMobile ? 'm' : 'p'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
        >
          {isMobile ? (
            <>
              <p className="text-sm font-medium text-emerald-400 mb-1">4G/5G 移动网络</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                实体调制解调器中的真实 SIM 卡。由运营商分配的 IP，拥有互联网上最高的信任评分。
              </p>
              <div className="flex gap-2 mt-3">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">运营商 IP</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">最高信任度</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-sky-400 mb-1">住宅节点</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                来自真实安卓设备的家庭宽带连接，与目标网站真实用户使用的 IP 完全相同。
              </p>
              <div className="flex gap-2 mt-3">
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">家庭宽带</span>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">适合大规模采集</span>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-[10px] text-gray-600 mt-4 text-center">两种 IP 池，同一网关，同一 URL 格式。</p>
    </div>
  );
}

function RotationDemo() {
  const [modeIndex, setModeIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const modes = ['粘性会话', '自动轮换', '硬绑定'];
  const tokens = ['rot-sticky', 'rot-auto10', 'rot-hard'];
  const descs = ['整个会话保持同一台设备', '每 10 分钟更换一个新 IP', '严格绑定——始终使用同一台设备'];
  const palette = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  useEffect(() => {
    const interval = setInterval(() => setModeIndex((i) => (i + 1) % modes.length), 4000);
    return () => clearInterval(interval);
  }, [modes.length]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(interval);
  }, []);

  const dots = Array.from({ length: 8 }, (_, i) => {
    if (modeIndex === 0) return palette[0];
    if (modeIndex === 1) return palette[Math.floor((tick + i) / 4) % palette.length];
    return palette[(tick + i) % palette.length];
  });

  return (
    <div className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] p-5 sm:p-6">
      <div className="flex gap-1.5 mb-5">
        {modes.map((mode, i) => (
          <button
            key={mode}
            onClick={() => setModeIndex(i)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              modeIndex === i ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="font-mono text-xs text-gray-600 mb-5">
        <span>user-mbl-us-</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={modeIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="inline-block text-amber-400 font-medium"
          >
            {tokens[modeIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-gray-600 mb-2">请求：</p>
        <div className="flex gap-2">
          {dots.map((color, i) => (
            <motion.div
              key={i}
              animate={{ backgroundColor: color }}
              transition={{ duration: 0.3 }}
              className="w-4 h-4 rounded-full"
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={modeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-xs text-gray-500"
        >
          {descs[modeIndex]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-5 pt-4 border-t border-white/[0.04]">
        <p className="text-[10px] text-gray-600 mb-2">并发会话：</p>
        <div className="space-y-1">
          {['s-001', 's-002', 's-003'].map((sid, i) => (
            <div key={sid} className="flex items-center gap-2 text-[11px] font-mono">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: palette[i] }} />
              <span className="text-gray-600">-sid-{sid}</span>
              <span className="text-gray-700 mx-1">&rarr;</span>
              <span className="text-gray-500">{['174.56.x.x', '203.12.x.x', '91.45.x.x'][i]}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">不同的会话 ID = 不同的 IP，始终如此。</p>
      </div>
    </div>
  );
}

function ApiVibeCard() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const codeSegments: { text: string; cls: string }[][] = [
    [{ text: 'import ', cls: 'text-fuchsia-400' }, { text: 'requests', cls: 'text-gray-200' }],
    [],
    [{ text: 'proxy ', cls: 'text-gray-200' }, { text: '= ', cls: 'text-gray-500' }, { text: `"http://pm_live-mbl-us:pmk_***@${gatewayDisplayEndpoint()}"`, cls: 'text-amber-300/80' }],
    [
      { text: 'r ', cls: 'text-gray-200' },
      { text: '= ', cls: 'text-gray-500' },
      { text: 'requests', cls: 'text-sky-300' },
      { text: '.get(', cls: 'text-gray-400' },
    ],
    [
      { text: '    "https://api.ipify.org?format=json"', cls: 'text-amber-300/80' },
      { text: ',', cls: 'text-gray-500' },
    ],
    [
      { text: '    proxies', cls: 'text-gray-200' },
      { text: '={', cls: 'text-gray-400' },
      { text: '"https"', cls: 'text-sky-300' },
      { text: ': proxy}', cls: 'text-gray-400' },
      { text: ')', cls: 'text-gray-400' },
    ],
  ];

  return (
    <div ref={ref} className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] overflow-hidden">
      {/* AI prompt bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <svg className="h-4 w-4 text-[var(--color-primary)] shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l1.9 5.6L19.5 9l-4.6 2 .1 5.9L12 14.4 8.9 16.9l.1-5.9L4.5 9l5.6-1.4L12 2z" />
        </svg>
        <span className="text-xs text-gray-300">让我的爬虫通过美国移动代理发送请求</span>
      </div>

      {/* Generated code */}
      <div className="p-4 sm:p-5 font-mono text-xs sm:text-[13px] leading-relaxed">
        <div className="flex items-center gap-1.5 mb-3 text-[10px] uppercase tracking-widest text-gray-600">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500 status-dot" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          已生成 · 一次运行成功
        </div>
        {codeSegments.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.3 }}
            className="min-h-[1.2em] whitespace-pre"
          >
            {line.map((seg, j) => (
              <span key={j} className={seg.cls}>{seg.text}</span>
            ))}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.1, duration: 0.4 }}
          className="mt-4 text-[11px] text-gray-500"
        >
          <span className="text-gray-600"># </span>
          <span className="text-emerald-400">{'{ "ip": "174.56.32.xxx" }'}</span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── UI Components ──────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm font-medium text-[var(--color-text)] pr-8 group-hover:text-[var(--color-primary)] transition-colors">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0, scale: open ? 1.1 : 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] text-base leading-none shrink-0"
        >
          +
        </motion.span>
      </button>
      {/*
        Answer stays mounted in the DOM at all times so crawlers can index it —
        it collapses via a CSS grid-rows transition rather than unmounting.
      */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm text-[var(--color-text-muted)] leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

function Check({ className = 'h-3.5 w-3.5 text-[var(--color-accent)]' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ─── Premium Stat Cards ─────────────────────────────────────

function StatCards() {
  const stats = [
    {
      value: '9+',
      label: '国家/地区',
      sub: '实时运营商覆盖',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a13.5 13.5 0 010 18M12 3a13.5 13.5 0 000 18" />
        </svg>
      ),
    },
    {
      value: '95%+',
      label: '信任评分',
      sub: '运营商级 IP',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      value: '24/7',
      label: '客服支持',
      sub: '真人客服，非机器人',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 + i * 0.08 }}
          whileHover={{ y: -2 }}
          className="group relative rounded-2xl bg-[var(--color-surface)] hairline edge-light p-4 sm:p-5 text-left transition-shadow hover:shadow-premium"
        >
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            {s.icon}
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {s.label}
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">{s.value}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Interactive Pricing ────────────────────────────────────

function PaymentIcons() {
  return (
    <>
      <svg viewBox="0 0 48 30" className="h-6 w-auto" role="img" aria-label="Visa">
        <rect width="48" height="30" rx="5" fill="#1434CB" />
        <text x="24" y="20" fontFamily="Arial, sans-serif" fontSize="13" fontStyle="italic" fontWeight="700" fill="#fff" textAnchor="middle">VISA</text>
      </svg>
      <svg viewBox="0 0 48 30" className="h-6 w-auto" role="img" aria-label="Mastercard">
        <rect width="48" height="30" rx="5" fill="#16161a" />
        <circle cx="20" cy="15" r="8" fill="#EB001B" />
        <circle cx="28" cy="15" r="8" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
      <svg viewBox="0 0 30 30" className="h-6 w-6" role="img" aria-label="Bitcoin">
        <circle cx="15" cy="15" r="15" fill="#F7931A" />
        <text x="15" y="21" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" fill="#fff" textAnchor="middle">₿</text>
      </svg>
      <svg viewBox="0 0 30 30" className="h-6 w-6" role="img" aria-label="Tether USDT">
        <circle cx="15" cy="15" r="15" fill="#26A17B" />
        <text x="15" y="20" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800" fill="#fff" textAnchor="middle">₮</text>
      </svg>
      <svg viewBox="0 0 30 30" className="h-6 w-6" role="img" aria-label="Ethereum">
        <circle cx="15" cy="15" r="15" fill="#627EEA" />
        <path d="M15 5l-6 10 6 3.5L21 15z" fill="#fff" fillOpacity="0.9" />
        <path d="M15 19.5L9 16l6 8 6-8z" fill="#fff" fillOpacity="0.6" />
      </svg>
    </>
  );
}

// Both billing modes are priced per GB on the same curve — they differ only in
// WHEN you pay: a bundle up front, or credits drawn down as the API meters use.
const BILLING_MODES = [
  { id: 'gb', label: '预付流量包' },
  { id: 'api', label: 'API · 按量付费' },
] as const;

type BillingMode = (typeof BILLING_MODES)[number]['id'];

const API_STEPS = [
  {
    n: '1',
    title: '创建账户',
    body: '不到一分钟即可完成注册，并在控制台获取代理端点和凭证。',
  },
  {
    n: '2',
    title: '充值余额',
    body: `在控制台充值，最低 $5。首次充值额外赠送 ${money(FIRST_TOPUP_BONUS_USD)}。`,
  },
  {
    n: '3',
    title: '开始使用',
    body: '每 GB 用量按下方费率计量并从余额中扣除——余额不足时随时充值。',
  },
];

const API_FEATURES = [
  '与预付流量包相同的每 GB 价格——API 不额外收费',
  '支持 HTTP 与 SOCKS5 协议',
  '不限并发会话数',
  '包含全部 10+ 个国家',
  '按需轮换 IP',
  '控制台实时查看用量与余额',
];

function ApiPricingPanel() {
  const entry = GB_TIERS[0];
  const best = GB_TIERS[GB_TIERS.length - 1];

  return (
    <motion.div
      id="pricing-panel-api"
      role="tabpanel"
      aria-labelledby="pricing-tab-api"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-[28px] bg-gradient-to-br from-[var(--color-primary)]/6 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-primary)]/20 p-6 sm:p-8 shadow-premium edge-light"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
            按量计费
          </p>
          <p className="text-lg font-semibold text-[var(--color-text)]">
            只为实际使用的流量付费
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-sm">
            无需预先选择流量包。充值余额、发送流量，剩下的交给计量系统。
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight tabular-nums">
            {money(best.perGb)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            /GB（大用量价）· 起步 {money(entry.perGb)}/GB
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
            <Check className="h-3 w-3 text-[var(--color-accent)]" />
            首次充值赠送 {money(FIRST_TOPUP_BONUS_USD)}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {API_STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[11px] font-bold text-[var(--color-primary)]">
              {s.n}
            </span>
            <p className="mt-2.5 text-sm font-semibold text-[var(--color-text)]">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Volume rates — same curve the prepaid slider uses */}
      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
          用量越大，单价越低
        </p>
        <div className="overflow-x-auto">
          <div className="grid min-w-[420px] grid-cols-6 gap-2">
            {GB_TIERS.map((t) => (
              <div
                key={t.gb}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2.5 text-center"
              >
                <p className="text-[11px] font-medium text-[var(--color-text-muted)]">{t.gb} GB</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-[var(--color-text)]">
                  ${t.perGb.toFixed(2)}
                </p>
                {t.discount > 0 && (
                  <p className="text-[10px] font-bold text-[var(--color-accent)]">-{t.discount}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {API_FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
            <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            {f}
          </div>
        ))}
      </div>

      <Link
        href="/register"
        className="mt-7 group relative flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-text)] py-3.5 text-sm font-semibold text-[var(--color-bg)] hover:opacity-90 transition shadow-lg shadow-[var(--color-primary)]/20 overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          领取 {money(FIRST_TOPUP_BONUS_USD)} 免费额度并开始 <Arrow />
        </span>
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 border-t border-[var(--color-border)] pt-4">
        <PaymentIcons />
      </div>

      <p className="mt-4 text-center text-[11px] text-[var(--color-text-muted)]">
        无需订阅 · 无月度承诺 · 最低充值 $5
      </p>
    </motion.div>
  );
}

function InteractivePricing() {
  const [mode, setMode] = useState<BillingMode>('gb');
  const [country, setCountry] = useState('us');
  const [gb, setGb] = useState(POPULAR_GB);
  const [dragging, setDragging] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(totalFor(POPULAR_GB));
  const [showBar, setShowBar] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef(totalFor(POPULAR_GB));
  const reduceMotion = useReducedMotion();

  const ctry = PRICING_COUNTRIES.find((c) => c.code === country)!;
  const rate = ratePerGb(gb);
  const total = totalFor(gb);
  const disc = discountPct(gb);
  const pct = gbToPct(gb);
  const saved = Math.round((gb * BASE_RATE - total) * 100) / 100;

  const setDisp = (v: number) => {
    displayRef.current = v;
    setDisplayTotal(v);
  };

  // Count-up animation on the total (skipped when reduced motion is preferred).
  useEffect(() => {
    if (reduceMotion) {
      setDisp(total);
      return;
    }
    const from = displayRef.current;
    if (from === total) return;
    let raf = 0;
    const start = performance.now();
    const dur = 420;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisp(from + (total - from) * e);
      if (t < 1) raf = requestAnimationFrame(step);
      else setDisp(total);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, reduceMotion]);

  // Sticky mini-bar: appears once the order card scrolls out of view.
  useEffect(() => {
    const el = orderRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setShowBar(!entry.isIntersecting),
      { rootMargin: '-80% 0px 0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = pctToGb(((clientX - r.left) / r.width) * 100);
    setGb(Math.min(MAX_GB, Math.max(MIN_GB, next)));
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
    sliderRef.current?.focus();
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (dragging) setFromClientX(e.clientX);
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    setDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };
  const onKeyDown = (e: ReactKeyboardEvent) => {
    let g = gb;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': g += 1; break;
      case 'ArrowLeft': case 'ArrowDown': g -= 1; break;
      case 'PageUp': g += 5; break;
      case 'PageDown': g -= 5; break;
      case 'Home': g = MIN_GB; break;
      case 'End': g = MAX_GB; break;
      default: return;
    }
    e.preventDefault();
    setGb(Math.min(MAX_GB, Math.max(MIN_GB, g)));
  };

  const baseFeatures = [
    `${gb} GB 优质带宽`,
    '支持 HTTP 与 SOCKS5 协议',
    '不限并发会话数',
    `${ctry.name}移动 + 住宅 IP`,
    '按需轮换 IP',
    '流量有效期 30 天——充值可延长',
  ];
  const extraFeatures: string[] = [];
  if (gb >= 25) extraFeatures.push('优先客服支持');
  if (gb >= 50) extraFeatures.push('专属客户经理', 'API 访问权限');

  const shownTotal = Number.isInteger(total)
    ? Math.round(displayTotal)
    : Math.round(displayTotal * 100) / 100;
  const ctaText = `购买 ${gb} GB ${ctry.name}流量 — ${money(total)}`;

  return (
    <section id="pricing" className="relative z-10 px-6 py-16 lg:py-24 border-t border-[var(--color-border)] scroll-mt-20">
      <div className="relative mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="text-center mb-10"
        >
          <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
            价格
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text)]">
            移动代理 IP 价格
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm sm:text-base text-[var(--color-text-muted)] max-w-md mx-auto">
            始终按 GB 计费，无需订阅。可预先购买流量包，也可由 API 计量实际用量并从余额中扣除。
          </motion.p>
        </motion.div>

        {/* Billing mode switch — both modes are per-GB, they differ in how you pay */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mb-10 flex justify-center"
        >
          <div
            role="tablist"
            aria-label="计费方式"
            className="inline-flex rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-premium"
          >
            {BILLING_MODES.map((m) => {
              const selected = mode === m.id;
              return (
                <button
                  key={m.id}
                  role="tab"
                  id={`pricing-tab-${m.id}`}
                  aria-selected={selected}
                  aria-controls={`pricing-panel-${m.id}`}
                  onClick={() => setMode(m.id)}
                  className={`relative rounded-xl px-4 sm:px-6 py-2.5 text-sm font-semibold transition-colors ${
                    selected ? 'text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="pricing-mode-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[var(--color-primary)] shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">{m.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {mode === 'gb' && (
        <div id="pricing-panel-gb" role="tabpanel" aria-labelledby="pricing-tab-gb">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-4">
            选择地区
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {PRICING_COUNTRIES.map((c) => {
              const selected = country === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className={`relative flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all ${
                    selected
                      ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/8 ring-1 ring-[var(--color-primary)]/30 shadow-premium'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] hover:border-[var(--color-primary)]/30'
                  }`}
                >
                  {c.badge && (
                    <span className={`absolute -top-1 -right-1 rounded-full px-1 py-0 text-[7px] font-bold uppercase tracking-wider shadow-md ${
                      c.badge === 'HOT' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {c.badge}
                    </span>
                  )}
                  <span className="text-sm leading-none">{c.flag}</span>
                  <span className="text-[10px] font-medium text-[var(--color-text)] truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-end justify-between mb-1 px-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              选择带宽
            </p>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              {money(rate)} / GB
              {disc > 0 && <span className="text-[var(--color-accent)]"> · 节省 {disc}%</span>}
            </p>
          </div>
          <div className="flex items-baseline gap-1.5 px-1 mb-2">
            <span className="text-3xl font-bold tracking-tight text-[var(--color-text)]">{gb}</span>
            <span className="text-base font-semibold text-[var(--color-text-muted)]">GB</span>
          </div>

          <div className="relative pt-8 pb-1 px-1 select-none" style={{ touchAction: 'none' }}>
            {/* Most Popular marker */}
            <div
              className="absolute top-0 -translate-x-1/2 z-10"
              style={{ left: `${gbToPct(POPULAR_GB)}%` }}
            >
              <span className="relative block rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white whitespace-nowrap shadow-[0_4px_10px_rgba(79,70,229,0.3)]">
                ★ 最受欢迎
                <span className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[var(--color-primary)]" />
              </span>
            </div>

            <div
              ref={sliderRef}
              role="slider"
              tabIndex={0}
              aria-label="带宽（GB）"
              aria-valuemin={MIN_GB}
              aria-valuemax={MAX_GB}
              aria-valuenow={gb}
              aria-valuetext={`${gb} GB，总计 ${money(total)}`}
              onKeyDown={onKeyDown}
              className="outline-none rounded-full focus-visible:ring-4 focus-visible:ring-[var(--color-primary)]/30"
            >
              <div
                ref={trackRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="relative h-2 rounded-full bg-[var(--color-border)] cursor-pointer"
              >
                <div
                  className="absolute h-full rounded-full left-0 bg-gradient-to-r from-[var(--color-primary-soft)] to-[var(--color-primary)]"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className={`absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-surface)] border-[3px] border-[var(--color-primary)] shadow-[0_2px_8px_rgba(79,70,229,0.35)] ${
                    dragging ? 'ring-8 ring-[var(--color-primary)]/12 cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ left: `${pct}%`, transition: dragging || reduceMotion ? 'none' : 'left 120ms ease-out' }}
                >
                  {/* 44px+ touch target */}
                  <span className="absolute -inset-3" />
                </div>
              </div>
            </div>

            {/* Ticks + discount badges */}
            <div className="relative h-10 mt-2">
              {GB_TIERS.map((t) => {
                const active = gb === t.gb;
                return (
                  <button
                    key={t.gb}
                    onClick={() => setGb(t.gb)}
                    className="absolute -translate-x-1/2 text-center group"
                    style={{ left: `${gbToPct(t.gb)}%` }}
                    aria-label={`选择 ${t.gb} GB`}
                  >
                    <span className={`mx-auto mb-1 block h-1.5 w-0.5 rounded ${active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                    <span className={`block text-[11px] font-bold leading-none ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'}`}>
                      {t.gb}GB
                    </span>
                    {t.discount && (
                      <span className="mt-0.5 block text-[10px] font-bold text-[var(--color-accent)]">
                        -{t.discount}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          ref={orderRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative rounded-[28px] bg-gradient-to-br from-[var(--color-primary)]/6 via-[var(--color-surface)] to-[var(--color-surface)] border border-[var(--color-primary)]/20 p-6 sm:p-8 shadow-premium edge-light"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">您的订单</p>
              <p className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
                {gb} GB <span className="text-[var(--color-text-muted)] mx-1">·</span>
                <motion.span
                  key={ctry.code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-2xl leading-none"
                >
                  {ctry.flag}
                </motion.span>
                {ctry.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] tracking-tight tabular-nums">
                {money(shownTotal)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">每 GB {money(rate)}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
                有效期 30 天 · 充值可延长
              </span>
              <div className="h-5 mt-2">
                <AnimatePresence>
                  {gb > 1 && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-bold text-[var(--color-accent)]"
                    >
                      比基础价节省 {money(saved)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {baseFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                {f}
              </div>
            ))}
            <AnimatePresence>
              {extraFeatures.map((f) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2 text-sm text-[var(--color-text)]"
                >
                  <Check className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  {f}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Link
            href="/login"
            className="mt-7 group relative flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-text)] py-3.5 text-sm font-semibold text-[var(--color-bg)] hover:opacity-90 transition shadow-lg shadow-[var(--color-primary)]/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {ctaText} <Arrow />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Link>

          {/* Social proof */}
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--color-text-muted)]">
            <span>{SOCIAL_PROOF.users}</span>
            <span className="text-[var(--color-border)]" aria-hidden>·</span>
            <span>{SOCIAL_PROOF.uptime}</span>
            <span className="text-[var(--color-border)]" aria-hidden>·</span>
            <span className="inline-flex items-center gap-1"><span className="text-amber-400" aria-hidden>★</span>{SOCIAL_PROOF.rating}</span>
          </p>

          {/* Payment methods */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 border-t border-[var(--color-border)] pt-4">
            <PaymentIcons />
          </div>

          <p className="mt-4 text-center text-[11px] text-[var(--color-text-muted)]">
            7 天退款保证 · 无隐藏费用 · 随时取消
          </p>
        </motion.div>
        </div>
        )}

        {mode === 'api' && <ApiPricingPanel />}

        {/* Shared account actions — same two steps whichever mode you pick */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/8 px-6 py-3.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/14"
          >
            创建账户 <Arrow />
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-bg)]"
          >
            充值余额
          </Link>
        </div>
        {/* The API panel already advertises the bonus twice — don't say it a third time */}
        {mode === 'gb' && (
          <p className="mt-3 text-center text-xs font-semibold text-[var(--color-accent)]">
            首次充值赠送 {money(FIRST_TOPUP_BONUS_USD)} 免费额度
          </p>
        )}
      </div>

      {/* Sticky mini-bar */}
      <AnimatePresence>
        {showBar && mode === 'gb' && (
          <motion.div
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            exit={{ y: '110%' }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-x-0 bottom-0 z-[55] border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)]"
          >
            <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
              <span className="text-xl leading-none">{ctry.flag}</span>
              <span className="min-w-0 truncate text-[13px] font-medium text-[var(--color-text-muted)]">
                <span className="font-semibold text-[var(--color-text)]">{gb} GB</span> · {ctry.name}
              </span>
              <span className="ml-auto whitespace-nowrap text-xl font-bold tracking-tight text-[var(--color-text)] tabular-nums">
                {money(total)}
              </span>
              <Link
                href="/login"
                className="shrink-0 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                立即购买
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Mobile Nav ─────────────────────────────────────────────

function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="打开菜单"
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-4 z-[70] rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-premium"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">菜单</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="关闭菜单"
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {[
                  { href: '#pricing', label: '价格' },
                  { href: '#why-us', label: '优势' },
                  { href: '#api', label: 'API' },
                  { href: '#locations', label: '覆盖地区' },
                  { href: '#faq', label: '常见问题' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    {item.label}
                    <Arrow />
                  </a>
                ))}
              </nav>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-bg)] hover:opacity-90 transition"
                >
                  注册
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function LandingPageZh() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* Background layers */}
      <div className="fixed inset-0 bg-glow pointer-events-none" />
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[var(--color-bg)]/85 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 py-3.5">
          <Link href="/zh" className="flex items-center" aria-label={`${config.brand.name} 首页`}>
            <Image
              src="/logo.png"
              alt={`${config.brand.name} — 移动代理服务`}
              width={1516}
              height={429}
              priority
              sizes="170px"
              className="h-10 sm:h-12 w-auto dark:invert"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: '#pricing', label: '价格' },
              { href: '#why-us', label: '优势' },
              { href: '#api', label: 'API' },
              { href: '#locations', label: '覆盖地区' },
              { href: '#faq', label: '常见问题' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="mx-2 h-5 w-px bg-[var(--color-border)]" />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              登录
            </Link>
            <ThemeToggle />
            <Link
              href="/register"
              className="ml-1 group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-[var(--color-text)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              <span className="relative z-10">获取 API 密钥</span>
              <span className="relative z-10 transition-transform group-hover:translate-x-0.5"><Arrow /></span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </nav>

          {/* Mobile nav */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </motion.header>

      {/* ─── Hero ─── */}
      <section className="relative z-10 px-6 pt-10 sm:pt-14 lg:pt-16 pb-14 lg:pb-20 overflow-hidden">
        <div className="relative mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] hairline edge-light px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)] shadow-premium">
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-500 status-dot" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[var(--color-text-muted)]">真实移动运营商 IP</span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span className="font-semibold uppercase tracking-wider text-[var(--color-primary)] text-[10px]">实时</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-[40px] sm:text-5xl lg:text-[64px] font-bold tracking-tight text-[var(--color-text)] leading-[1.02]"
              >
                高性能移动代理
                <br />
                <span className="text-gradient [word-break:keep-all]">真实 4G/5G LTE 运营商 IP</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] max-w-xl lg:max-w-md mx-auto lg:mx-0 leading-relaxed"
              >
                真实设备连接，覆盖 10+ 个国家的可信运营商 IP。按实际使用的带宽付费——低至 $5/GB。
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-3"
              >
                <Link
                  href="/login"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[var(--color-text)] px-7 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/15"
                >
                  <span className="relative z-10">获取 API 密钥</span>
                  <span className="relative z-10 transition-transform group-hover:translate-x-0.5"><Arrow /></span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
                <a
                  href="#pricing"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)]/30 transition"
                >
                  购买代理
                </a>
              </motion.div>

              {/* Trust chips */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-7 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)]"
              >
                {['无需邮箱', '无需预先绑定信用卡', '即时开通'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right: tech visual composition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="relative"
            >
              {/* Decorative blobs */}
              <div className="pointer-events-none absolute -inset-8 -z-10 opacity-70">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[var(--color-primary)]/20 blur-3xl" />
                <div className="absolute bottom-4 left-0 h-32 w-32 rounded-full bg-sky-400/15 blur-3xl" />
              </div>

              {/* Card composition */}
              <div className="relative">
                {/* Floating top-right signal card */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="hidden sm:block absolute -top-6 right-0 w-[200px] z-20"
                >
                  <SignalCard />
                </motion.div>

                {/* Main route card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="relative z-10 mx-auto max-w-[420px]"
                >
                  <LiveRouteCard />
                </motion.div>

                {/* Floating bottom-left bandwidth card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.65 }}
                  className="hidden sm:block absolute -bottom-8 -left-4 w-[260px] z-20"
                >
                  <BandwidthCard />
                </motion.div>

                {/* Mobile: stack signal + bandwidth horizontally below route */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
                  <SignalCard />
                  <BandwidthCard />
                </div>

                {/* Endpoint badge floats bottom-right (desktop) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.85 }}
                  className="hidden lg:block absolute -bottom-2 right-2 z-30 w-[200px]"
                >
                  <EndpointBadge />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats row below hero (full width) */}
          <div className="mt-16 lg:mt-24 max-w-3xl mx-auto">
            <StatCards />
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <InteractivePricing />

      {/* ─── Section 0: The Problem (Why Us anchor) ─── */}
      <section id="why-us" className="relative z-10 px-6 py-20 lg:py-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
                是不是很熟悉？
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                代理本不该这么复杂。
              </motion.h2>
              <div className="mt-6 space-y-4">
                {[
                  '每个国家一个主机名，每种协议一个端口。发出第一个请求前就要写六份配置。',
                  '注册表单、邮箱验证、身份审核……而您只是想运行一条 curl 命令。',
                  '来自同一个反复回收的机房 IP 池，第三个请求就被封禁。',
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    custom={i + 2}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ConfigComparison />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 1: One URL ─── */}
      <section id="how" className="relative z-10 px-6 py-20 lg:py-28 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:order-1"
            >
              <UrlAnatomy />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="lg:order-2"
            >
              <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
                单一端点
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                一切配置都在 URL 里，无需其他设置。
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                IP 池类型、国家、会话、轮换方式——全部编码在代理用户名中。修改两个字符即可切换国家，修改三个字符即可从移动切换到住宅。端点、凭证、端口始终不变。
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm font-medium text-[var(--color-text)]">
                无需重新连接，无需新凭证，无需调用 API。
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Speed ─── */}
      <section className="relative z-10 px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
                即时接入
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                一分钟内发出第一个请求。
              </motion.h2>
              <div className="mt-6 space-y-5">
                {[
                  { step: '1', title: '输入访问码', desc: '无需邮箱，无需填写注册表单。一个访问码，立即进入控制台。' },
                  { step: '2', title: '选择套餐', desc: '选择流量并为账户充值，付款后密钥即刻激活。' },
                  { step: '3', title: '生成并连接', desc: '选择国家和轮换方式，粘贴 URL，流量即刻就绪。' },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i + 2} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <TerminalDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Two Pools ─── */}
      <section className="relative z-10 px-6 py-20 lg:py-28 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:order-1"
            >
              <PoolToggle />
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="lg:order-2"
            >
              <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
                两种 IP 池
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                为每个目标匹配合适的 IP。
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                <strong className="text-[var(--color-text)]">移动：</strong>实体 4G/5G 调制解调器中的真实 SIM 卡，与真实手机从运营商获得的 IP 相同。即使面对封锁最严格的目标，也拥有最高的信任评分。
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                <strong className="text-[var(--color-text)]">住宅：</strong>来自真实安卓设备的家庭宽带连接，与目标网站真实用户使用的 IP 相同，适合大规模数据采集。
              </motion.p>
              <motion.p variants={fadeUp} custom={4} className="mt-4 text-sm font-medium text-[var(--color-text)]">
                两种 IP 池，同一网关，同一 URL 格式。
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Control ─── */}
      <section className="relative z-10 px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
                由您掌控
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                全天固定一台设备，或按间隔自动轮换。
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                多种轮换模式，只需一个 URL 参数即可设置。粘性会话（Sticky）在整个会话中保持同一台设备（IP 在运营商允许的范围内保持稳定）；自动轮换（Auto-rotate）按设定间隔分配新 IP；硬绑定（Hard）则严格固定一台设备。
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                只需使用不同的会话 ID，即可运行 50 个并发会话，每个会话使用不同的 IP。无需调用 API，无需会话管理后台，只要在 URL 中换一个不同的 <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-primary)]">-sid-</code> 即可。
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <RotationDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: API + AI / vibecoding ─── */}
      <section id="api" className="relative z-10 px-6 py-20 lg:py-28 bg-[var(--color-surface)] border-t border-[var(--color-border)] scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
                API &amp; AI
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                一个 AI 真正能用好的 API。
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                在控制台获取 API 密钥即可开始。整个代理配置就是一个 URL——无需安装 SDK，无需繁琐的 OAuth 流程，也无需阅读 40 页的文档。粘贴到任意 HTTP 客户端、爬虫或自动化工具中，流量即刻就绪。
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                这正是它适合 Vibe Coding 的原因。把端点交给 Claude、Cursor 或任何 AI 智能体，第一次就能生成可用的请求代码——因为根本没有出错的空间。如需脚本化操作，我们还提供 REST API，用于创建密钥和查询用量。
              </motion.p>

              <motion.div variants={fadeUp} custom={4} className="mt-6 space-y-3">
                {[
                  ['一个 API 密钥', '用同一个密钥验证所有代理请求和 REST 调用。'],
                  ['使用余额付费', '账户余额就是您的额度——同一余额同时用于带宽和 API 用量。无需单独套餐，也无需对账。'],
                  ['AI 零样板代码', '一个普通的代理 URL，AI 工具即可立刻生成正确代码——不会凭空捏造 SDK 方法。'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 text-[var(--color-accent)]" />
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      <strong className="text-[var(--color-text)]">{title}：</strong>{desc}
                    </p>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} custom={5} className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-text)] px-6 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
                >
                  <span>获取 API 密钥</span>
                  <span className="transition-transform group-hover:translate-x-0.5"><Arrow /></span>
                </Link>
                <Link
                  href="/zh/mobile-proxy-api"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)]/40"
                >
                  查看代码示例
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ApiVibeCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative z-10 px-6 py-20 lg:py-28 scroll-mt-20 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-10"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] mb-3">
              常见问题
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
              常见问题解答
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] px-6 shadow-premium edge-light"
          >
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 px-6 py-20 lg:py-28 bg-[#070710] overflow-hidden">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--color-primary)]/15 blur-[120px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent 70%)',
          }}
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="relative mx-auto max-w-2xl text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-6">
            {/* This band is dark in both themes, so the mark is always inverted
                to read white — not `dark:invert` like the header logo. */}
            <Image
              src="/logo.png"
              alt={`${config.brand.name} — 移动代理服务`}
              width={1516}
              height={429}
              sizes="200px"
              className="h-12 w-auto invert"
            />
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.05]">
            准备好开始了吗？
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-gray-400 leading-relaxed">
            获取访问码，60 秒内发出第一个请求。
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#0c0c14] hover:bg-gray-100 transition shadow-2xl shadow-[var(--color-primary)]/20"
            >
              <span className="relative z-10">获取 API 密钥</span>
              <span className="relative z-10 transition-transform group-hover:translate-x-0.5"><Arrow /></span>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
            {['无需邮箱', '无需预先绑定信用卡'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-[var(--color-border)] px-6 py-12 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Image
                src="/logo.png"
                alt={`${config.brand.name} — 移动代理服务`}
                width={1516}
                height={429}
                sizes="150px"
                className="h-8 w-auto dark:invert"
              />
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
                按 GB 计费的移动代理，基于覆盖 10+ 个国家的真实 4G/5G/LTE 运营商 IP。支持 HTTP 与 SOCKS5，即时开通，无需注册。
              </p>
            </div>

            {/* Locations — links to every country page */}
            <nav id="locations" className="lg:col-span-2 scroll-mt-20" aria-label="移动代理覆盖地区">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
                移动代理覆盖地区
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {COUNTRIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/zh/mobile-proxies/${c.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                      <span aria-hidden>{c.flag}</span>
                      {COUNTRY_ZH[c.code] ?? c.shortName}移动代理
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Company */}
            <nav className="lg:col-span-1" aria-label="公司">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">
                公司
              </h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <a href="/zh#pricing" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">价格</a>
                </li>
                <li>
                  <Link href="/zh/mobile-proxy-api" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">移动代理 API</Link>
                </li>
                <li>
                  <a href="/zh#faq" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">常见问题</a>
                </li>
                <li>
                  <Link href="/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">服务条款</Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">隐私政策</Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 border-t border-[var(--color-border)] pt-6">
            <UseCaseLinksZh />
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
            <span className="text-xs text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} {config.brand.name} · 保留所有权利
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 status-dot" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              所有系统运行正常
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
