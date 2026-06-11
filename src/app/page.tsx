'use client';

import { useState, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import { config } from '@/config';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  { text: 'user', label: 'Your account', color: '#9ca3af', active: '#d1d5db' },
  { text: 'mbl', label: 'Pool type', color: '#818cf8', active: '#a5b4fc' },
  { text: 'us', label: 'Country', color: '#34d399', active: '#6ee7b7' },
  { text: 'sid-a7f3', label: 'Session ID', color: '#38bdf8', active: '#7dd3fc' },
  { text: 'rot-sticky', label: 'Rotation', color: '#fbbf24', active: '#fcd34d' },
];

const FAQS = [
  {
    q: 'What kind of IPs are these?',
    a: 'Mobile IPs come from real 4G/5G SIM cards in physical modems — the same kind of IP your phone gets from a carrier. Residential IPs come from real Android devices on home ISP connections. None of our IPs are datacenter.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. We use standard HTTP and SOCKS5 proxy protocol. If your tool supports a proxy URL — curl, Python requests, Puppeteer, Scrapy — it works out of the box.',
  },
  {
    q: 'How do I switch countries?',
    a: "Change two characters in your proxy URL. Replace 'us' with 'de' and your next request exits through Germany. No reconnection, no new credentials.",
  },
  {
    q: 'What happens when my traffic runs out?',
    a: 'Your key stops accepting connections. No surprise charges, no overage fees. Top up from your dashboard when you\'re ready.',
  },
  {
    q: 'Is my browsing data logged?',
    a: 'We track bandwidth usage for billing purposes. We do not log the content of your proxy traffic or the URLs you visit.',
  },
  {
    q: "What's an access code?",
    a: 'Your login credential — a short alphanumeric code. No email or password required. Get one from your provider or register to generate one.',
  },
];

const OLD_ENDPOINTS = [
  'us-http.provider.com:8080',
  'us-socks.provider.com:1080',
  'de-http.provider.com:8080',
  'de-socks.provider.com:1080',
  'gb-http.provider.com:8080',
  'gb-socks.provider.com:1080',
];

const PRICING_COUNTRIES = [
  { code: 'us', name: 'USA', flag: '\u{1F1FA}\u{1F1F8}', badge: 'HOT' },
  { code: 'de', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'gb', name: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'fr', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'es', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'pl', name: 'Poland', flag: '\u{1F1F5}\u{1F1F1}', badge: 'NEW' },
  { code: 'ch', name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'pa', name: 'Panama', flag: '\u{1F1F5}\u{1F1E6}' },
  { code: 'am', name: 'Armenia', flag: '\u{1F1E6}\u{1F1F2}' },
];

const GB_TIERS = [
  { gb: 1, price: 8, perGb: 8.0 },
  { gb: 5, price: 35, perGb: 7.0, discount: 13 },
  { gb: 10, price: 65, perGb: 6.5, discount: 19 },
  { gb: 25, price: 150, perGb: 6.0, discount: 25 },
  { gb: 50, price: 275, perGb: 5.5, discount: 31 },
  { gb: 100, price: 500, perGb: 5.0, discount: 38 },
];

// ─── Pricing config + math ──────────────────────────────────
// Easy-to-edit social proof line (rendered near the CTA).
const SOCIAL_PROOF = {
  users: '1,200+ active users',
  uptime: '99.9% uptime',
  rating: '4.8/5 rating',
};

const BASE_RATE = 8; // $/GB used to compute "you save"
const POPULAR_GB = 10; // default slider position + "Most Popular" marker
const MIN_GB = 1;
const MAX_GB = 100;
const SEGS = GB_TIERS.length - 1;

// Per-GB rate is interpolated linearly between tier breakpoints. Because each
// breakpoint's rate is lower than the previous, the result is monotonic
// non-increasing — a higher GB amount can never be priced at a worse $/GB.
function ratePerGb(gb: number): number {
  const g = Math.min(MAX_GB, Math.max(MIN_GB, gb));
  for (let i = 0; i < SEGS; i++) {
    const a = GB_TIERS[i];
    const b = GB_TIERS[i + 1];
    if (g >= a.gb && g <= b.gb) {
      const t = (g - a.gb) / (b.gb - a.gb);
      return a.perGb + (b.perGb - a.perGb) * t;
    }
  }
  return GB_TIERS[SEGS].perGb;
}
function totalFor(gb: number): number {
  return Math.round(gb * ratePerGb(gb) * 100) / 100;
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

// ─── Logo ───────────────────────────────────────────────────

function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">
      <circle cx="16" cy="16" r="14" />
      <path d="M16 6 L23.5 10.4 L23.5 21.6 L16 26 L8.5 21.6 L8.5 10.4 Z" />
      <line x1="16" y1="16" x2="16" y2="6" />
      <line x1="16" y1="16" x2="23.5" y2="10.4" />
      <line x1="16" y1="16" x2="23.5" y2="21.6" />
      <line x1="16" y1="16" x2="16" y2="26" />
      <line x1="16" y1="16" x2="8.5" y2="21.6" />
      <line x1="16" y1="16" x2="8.5" y2="10.4" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── Hero Tech Cards (visual only) ──────────────────────────

function LiveRouteCard() {
  const routes = [
    { flag: '\u{1F1E9}\u{1F1EA}', country: 'Germany', city: 'Frankfurt', carrier: 'Vodafone DE', latency: 38, ip: '92.196.42.xxx' },
    { flag: '\u{1F1FA}\u{1F1F8}', country: 'United States', city: 'Dallas, TX', carrier: 'T-Mobile USA', latency: 51, ip: '174.56.32.xxx' },
    { flag: '\u{1F1EC}\u{1F1E7}', country: 'United Kingdom', city: 'London', carrier: 'EE Mobile', latency: 44, ip: '82.132.18.xxx' },
    { flag: '\u{1F1EB}\u{1F1F7}', country: 'France', city: 'Paris', carrier: 'Orange', latency: 29, ip: '93.21.74.xxx' },
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
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Active Route</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500 status-dot" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Online
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
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">Type</p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--color-text)]">Mobile LTE</p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">Latency</p>
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
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">Trust</p>
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
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Signal</span>
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
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Bandwidth</span>
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
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">Endpoint</span>
      </div>
      <p className="mt-1.5 font-mono text-xs sm:text-sm tracking-tight">
        gw.proxies.sx<span className="opacity-50">:7000</span>
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
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-3">Traditional setup</p>
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
                <span className="font-mono text-sm text-emerald-400">gw.proxies.sx:7000</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-2 ml-6">One endpoint. Every country. Both protocols.</p>
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
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">URL anatomy</p>
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
        <span className="text-gray-600">pak_***</span>
        <span className="text-gray-700">@</span>
        <span className="text-gray-600">gw.proxies.sx:7000</span>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="mt-5 text-xs text-gray-500"
      >
        Every parameter lives in the username. Change any token without changing your endpoint.
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
    { text: 'http://user-mbl-us-rot-sticky:pak_***@gw.proxies.sx:7000 ', cls: 'text-amber-300/80' },
    { text: 'ipinfo.io', cls: 'text-gray-200' },
  ];

  return (
    <div ref={ref} className="rounded-2xl bg-[#0c0c14] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[10px] text-gray-600">terminal</span>
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
          Mobile
        </button>
        <button
          onClick={() => setIsMobile(false)}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
            !isMobile ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          Residential
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
        <span>-us:pak_***@gw.proxies.sx:7000</span>
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
              <p className="text-sm font-medium text-emerald-400 mb-1">4G/5G Mobile</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Real SIM cards in physical modems. Carrier-assigned IPs with the highest trust scores on the internet.
              </p>
              <div className="flex gap-2 mt-3">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Carrier IPs</span>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Highest trust</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-sky-400 mb-1">Residential Peers</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Home ISP connections from real Android devices. The same IPs your target&apos;s real users browse from.
              </p>
              <div className="flex gap-2 mt-3">
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">Home ISPs</span>
                <span className="rounded bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-400">Volume-friendly</span>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="text-[10px] text-gray-600 mt-4 text-center">Both pools. Same gateway. Same URL format.</p>
    </div>
  );
}

function RotationDemo() {
  const [modeIndex, setModeIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const modes = ['Sticky', 'Auto-rotate', 'Hard rotate'];
  const tokens = ['rot-sticky', 'rot-auto10', 'rot-hard'];
  const descs = ['Same IP for your entire session', 'Fresh IP every 10 minutes', 'New IP on every request'];
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
        <p className="text-[10px] text-gray-600 mb-2">Requests:</p>
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
        <p className="text-[10px] text-gray-600 mb-2">Parallel sessions:</p>
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
        <p className="text-[10px] text-gray-600 mt-2">Different session ID = different IP. Always.</p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-8">
          <div className="mx-auto max-w-[200px] h-5 rounded bg-[var(--color-surface-hover)] flex items-center justify-center">
            <span className="text-[9px] text-[var(--color-text-muted)]">proxymobile.io/dashboard</span>
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="w-40 border-r border-[var(--color-border)] bg-[var(--color-bg)] p-3 hidden sm:block">
          <div className="flex items-center gap-1.5 mb-4 text-[var(--color-text)]">
            <Logo className="h-5 w-5" />
            <span className="text-[10px] font-semibold">{config.brand.name}</span>
          </div>
          <div className="space-y-0.5">
            <div className="rounded px-2 py-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-medium">Overview</div>
            <div className="rounded px-2 py-1.5 text-[10px] text-[var(--color-text-muted)]">Proxy Keys</div>
            <div className="rounded px-2 py-1.5 text-[10px] text-[var(--color-text-muted)]">Purchase</div>
          </div>
          <div className="mt-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
            <p className="text-[8px] text-[var(--color-text-muted)] uppercase tracking-wider">Balance</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">$150.00</p>
          </div>
        </div>
        <div className="flex-1 p-4">
          <p className="text-xs font-semibold text-[var(--color-text)] mb-3">Dashboard</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Account', value: 'client-47', color: 'text-[var(--color-text)]' },
              { label: 'Status', value: 'Active', color: 'text-[var(--color-accent)]' },
              { label: 'Expires', value: 'Jun 15', color: 'text-[var(--color-text)]' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
                <p className="text-[8px] text-[var(--color-text-muted)] mb-0.5">{s.label}</p>
                <p className={`text-[11px] font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-[var(--color-text-muted)]">Traffic Usage</span>
              <span className="text-[9px] font-medium text-[var(--color-text)]">12.4 / 25 GB</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--color-primary)] w-[50%]" />
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <p className="text-[9px] font-medium text-[var(--color-text)] mb-2">Proxy URL</p>
            <div className="rounded bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-1.5">
              <code className="text-[8px] text-[var(--color-primary)] break-all">
                http://psx_69fb...-mbl-us-rot-sticky:pak_a8f2...@gw.proxies.sx:7000
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UI Components ──────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-sm font-medium text-[var(--color-text)] pr-8 group-hover:text-[var(--color-primary)] transition-colors">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0, scale: open ? 1.1 : 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] text-base leading-none shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] as const }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-[var(--color-text-muted)] leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
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
      label: 'Countries',
      sub: 'Live carrier coverage',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a13.5 13.5 0 010 18M12 3a13.5 13.5 0 000 18" />
        </svg>
      ),
    },
    {
      value: '95%+',
      label: 'Trust score',
      sub: 'Carrier-grade IPs',
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      value: '24/7',
      label: 'Support',
      sub: 'Humans, not bots',
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

function InteractivePricing() {
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
    `${gb} GB premium bandwidth`,
    'HTTP & SOCKS5 protocols',
    'Unlimited parallel sessions',
    `${ctry.name} mobile + residential IPs`,
    'On-demand IP rotation',
    'Unused data never expires',
  ];
  const extraFeatures: string[] = [];
  if (gb >= 25) extraFeatures.push('Priority support');
  if (gb >= 50) extraFeatures.push('Dedicated account manager', 'API access');

  const shownTotal = Number.isInteger(total)
    ? Math.round(displayTotal)
    : Math.round(displayTotal * 100) / 100;
  const ctaText = `Get ${gb} GB in ${ctry.name} — ${money(total)}`;

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
            Pricing
          </motion.p>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text)]">
            Mobile Proxy Pricing
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm sm:text-base text-[var(--color-text-muted)] max-w-md mx-auto">
            Pay per GB — no subscriptions, no expiry. Use at your own pace.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-4">
            Select Your Location
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
              Select Bandwidth
            </p>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              {money(rate)} / GB
              {disc > 0 && <span className="text-[var(--color-accent)]"> · save {disc}%</span>}
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
                ★ Most Popular
                <span className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 bg-[var(--color-primary)]" />
              </span>
            </div>

            <div
              ref={sliderRef}
              role="slider"
              tabIndex={0}
              aria-label="Bandwidth in gigabytes"
              aria-valuemin={MIN_GB}
              aria-valuemax={MAX_GB}
              aria-valuenow={gb}
              aria-valuetext={`${gb} gigabytes, ${money(total)} total`}
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
                    aria-label={`Set ${t.gb} gigabytes`}
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
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">Your order</p>
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
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{money(rate)} per GB</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--color-accent)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
                Unused data never expires
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
                      You save {money(saved)} vs base rate
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
            7-day money-back guarantee · No hidden fees · Cancel anytime
          </p>
        </motion.div>
      </div>

      {/* Sticky mini-bar */}
      <AnimatePresence>
        {showBar && (
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
                Buy now
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
        aria-label="Open menu"
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
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {[
                  { href: '#pricing', label: 'Pricing' },
                  { href: '#why-us', label: 'Why Us' },
                  { href: '#faq', label: 'FAQ' },
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
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--color-bg)] hover:opacity-90 transition"
                >
                  Register
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

export default function LandingPage() {
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
          <Link href="/" className="flex items-center" aria-label={config.brand.name}>
            <Image
              src="/logo.png"
              alt={config.brand.name}
              width={1516}
              height={429}
              priority
              className="h-10 sm:h-12 w-auto dark:invert"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {[
              { href: '#pricing', label: 'Pricing' },
              { href: '#why-us', label: 'Why Us' },
              { href: '#faq', label: 'FAQ' },
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
              Login
            </Link>
            <ThemeToggle />
            <Link
              href="/register"
              className="ml-1 group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-[var(--color-text)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-90"
            >
              <span className="relative z-10">Register</span>
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
                  <span className="text-[var(--color-text-muted)]">Real Mobile Carrier IPs</span>
                  <span className="text-[var(--color-border)]">·</span>
                  <span className="font-semibold uppercase tracking-wider text-[var(--color-primary)] text-[10px]">Live</span>
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-[40px] sm:text-5xl lg:text-[64px] font-bold tracking-tight text-[var(--color-text)] leading-[1.02]"
              >
                High-Performance
                <br />
                <span className="text-gradient">LTE/5G Proxies</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 text-base sm:text-lg text-[var(--color-text-muted)] max-w-xl lg:max-w-md mx-auto lg:mx-0 leading-relaxed"
              >
                Real device connections and trusted carrier IPs from 9 countries. Pay only for the bandwidth you use — starting at just $5/GB.
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
                  <span className="relative z-10">Get Started</span>
                  <span className="relative z-10 transition-transform group-hover:translate-x-0.5"><Arrow /></span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </Link>
                <a
                  href="#how"
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)]/30 transition"
                >
                  Learn More
                </a>
              </motion.div>

              {/* Trust chips */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="mt-7 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)]"
              >
                {['No email required', 'No credit card upfront', 'Instant activation'].map((t) => (
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
                Sound familiar?
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                Proxies shouldn&apos;t be this hard.
              </motion.h2>
              <div className="mt-6 space-y-4">
                {[
                  'A different hostname for every country. A different port for every protocol. Six configs before your first request.',
                  'Signup forms, email verification, identity checks. You just wanted to run a curl command.',
                  'IPs from the same recycled datacenter pool. Blocked by the third request.',
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
                One endpoint
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                Everything lives in the URL. Nothing else needed.
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                Pool type. Country. Session. Rotation. All encoded in your proxy username.
                Change country by editing two characters. Switch from mobile to residential by changing three.
                Same endpoint, same credentials, same port.
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm font-medium text-[var(--color-text)]">
                No reconnection. No new credentials. No API calls.
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
                Instant access
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                First request in under a minute.
              </motion.h2>
              <div className="mt-6 space-y-5">
                {[
                  { step: '1', title: 'Enter your access code', desc: 'No email. No signup form. One code, instant dashboard.' },
                  { step: '2', title: 'Choose your plan', desc: 'Pick your GB. Fund your account. Key activates the moment you pay.' },
                  { step: '3', title: 'Generate and connect', desc: 'Select country and rotation. Paste the URL. Traffic flows.' },
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
                Two pools
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                The right IP for every target.
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                <strong className="text-[var(--color-text)]">Mobile:</strong> Real SIM cards in physical 4G/5G modems.
                The kind of IP a real phone gets from a carrier. Highest trust scores for the targets that block everything else.
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                <strong className="text-[var(--color-text)]">Residential:</strong> Home ISP connections from real Android devices.
                The same IPs your target&apos;s actual users browse from. Volume-friendly for large-scale collection.
              </motion.p>
              <motion.p variants={fadeUp} custom={4} className="mt-4 text-sm font-medium text-[var(--color-text)]">
                Both pools. Same gateway. Same URL format.
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
                Your rules
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
                Keep one IP all day. Or rotate every request.
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                Five rotation modes, all set with a single URL token.
                Sticky pins one IP to your session. Auto-rotate gives you a fresh IP every 10 or 30 minutes.
                Hard rotate cycles on every connection.
              </motion.p>
              <motion.p variants={fadeUp} custom={3} className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
                Run 50 parallel sessions — each on a different IP — just by using unique session IDs.
                No API calls. No session management dashboard. Just a different <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-primary)]">-sid-</code> in the URL.
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
              FAQ
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
              Common questions.
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
          <motion.div variants={fadeUp} custom={0} className="flex justify-center mb-6 text-white/90">
            <Logo className="h-12 w-12" />
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.05]">
            Ready to connect?
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-gray-400 leading-relaxed">
            Get your access code and send your first request in under 60 seconds.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#0c0c14] hover:bg-gray-100 transition shadow-2xl shadow-[var(--color-primary)]/20"
            >
              <span className="relative z-10">Get Started</span>
              <span className="relative z-10 transition-transform group-hover:translate-x-0.5"><Arrow /></span>
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} custom={4} className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
            {['No email required', 'No credit card upfront'].map((t) => (
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
      <footer className="relative z-10 border-t border-[var(--color-border)] px-6 py-8 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt={config.brand.name}
              width={1516}
              height={429}
              className="h-8 w-auto dark:invert"
            />
            <span className="text-xs text-[var(--color-text-muted)]">
              &copy; {new Date().getFullYear()} · All rights reserved
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 status-dot" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              All systems operational
            </span>
            <Link href="/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
