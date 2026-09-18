'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { fmt, shortDate, usd, type ValueFormat } from './format';

export interface ChartSeries {
  key: string;
  label: string;
  /** Categorical slot 1–3 (validated order). */
  slot: 1 | 2 | 3;
}

type Row = { day: string } & Record<string, number | string>;

/**
 * Daily time-series chart: columns (optionally stacked) or lines.
 * Hover/keyboard crosshair with one tooltip listing every series; a table
 * view is always available below, so nothing is gated on hover.
 */
export function TimeChart({
  data, series, kind = 'column', stacked = false, format = 'int', height = 220, emptyNote, period = 'day',
}: {
  data: Row[];
  series: ChartSeries[];
  kind?: 'column' | 'line';
  stacked?: boolean;
  format?: ValueFormat;
  height?: number;
  emptyNote?: string;
  /** 'month' rows use the first day of each month and are labelled "Sep 26". */
  period?: 'day' | 'month';
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const val = (r: Row, k: string) => Number(r[k] ?? 0) || 0;
  const totals = data.map((r) => (stacked ? series.reduce((a, s) => a + val(r, s.key), 0) : Math.max(0, ...series.map((s) => val(r, s.key)))));
  const rawMax = Math.max(0, ...totals);
  const isEmpty = rawMax === 0;

  const { max, ticks } = useMemo(() => niceTicks(rawMax || 1, format === 'int'), [rawMax, format]);

  const padL = 48, padR = 12, padT = 10, padB = 24;
  const w = width, h = height;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const n = Math.max(1, data.length);
  const slot = plotW / n;
  const x = (i: number) => padL + slot * i + slot / 2;
  const y = (v: number) => padT + plotH - (v / max) * plotH;

  const barW = Math.max(2, Math.min(24, slot * (stacked || series.length === 1 ? 0.7 : 0.8) / (stacked ? 1 : series.length)));
  const labelEvery = Math.ceil(n / Math.max(2, Math.floor(plotW / 70)));

  function onMove(e: PointerEvent<SVGRectElement>) {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;
    setActive(Math.max(0, Math.min(n - 1, Math.floor((px - padL) / slot))));
  }
  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === 'ArrowRight') { setActive((a) => Math.min(n - 1, (a ?? -1) + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { setActive((a) => Math.max(0, (a ?? n) - 1)); e.preventDefault(); }
    if (e.key === 'Escape') setActive(null);
  }

  const color = (s: ChartSeries) => `var(--viz-${s.slot})`;
  const label = (d: string) => (period === 'month' ? monthLabel(d) : shortDate(d));
  const tip = active !== null ? data[active] : null;
  const tipLeft = active !== null ? (x(active) / w) * 100 : 0;

  return (
    <div className="viz">
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              {kind === 'line'
                ? <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ backgroundColor: color(s) }} />
                : <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color(s) }} />}
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={wrap} className="relative">
        <svg
          width="100%"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          tabIndex={0}
          aria-label={`${series.map((s) => s.label).join(' and ')} per day, ${data.length} days. Use arrow keys to read values.`}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 rounded"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
              <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--color-text-muted)]" style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>
                {t === 0 ? '0' : format === 'usd' ? usd(t, { cents: !Number.isInteger(t) }) : fmt(t, format)}
              </text>
            </g>
          ))}

          {data.map((r, i) => (i % labelEvery === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= Math.max(1, labelEvery * 0.9)) ? (
            <text key={r.day} x={x(i)} y={h - 6} textAnchor={x(i) + 28 > w ? 'end' : 'middle'} className="fill-[var(--color-text-muted)]" style={{ fontSize: 10 }}>
              {label(r.day)}
            </text>
          ) : null)}

          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={padT} y2={padT + plotH} stroke="var(--viz-axis)" strokeWidth={1} />
          )}

          {kind === 'column' && data.map((r, i) => {
            if (stacked) {
              let base = 0;
              return (
                <g key={r.day} opacity={active === null || active === i ? 1 : 0.55}>
                  {series.map((s, si) => {
                    const v = val(r, s.key);
                    if (v <= 0) return null;
                    const top = y(base + v);
                    const bottom = y(base);
                    base += v;
                    const isTop = series.slice(si + 1).every((t) => val(r, t.key) <= 0);
                    const gap = si > 0 ? 2 : 0;
                    const hgt = Math.max(1, bottom - top - gap);
                    return <path key={s.key} d={barPath(x(i) - barW / 2, top, barW, hgt, isTop ? Math.min(4, hgt) : 0)} fill={color(s)} />;
                  })}
                </g>
              );
            }
            return (
              <g key={r.day} opacity={active === null || active === i ? 1 : 0.55}>
                {series.map((s, si) => {
                  const v = val(r, s.key);
                  if (v <= 0) return null;
                  const bx = x(i) - (barW * series.length + 2 * (series.length - 1)) / 2 + si * (barW + 2);
                  const hgt = Math.max(1, y(0) - y(v));
                  return <path key={s.key} d={barPath(bx, y(v), barW, hgt, Math.min(4, hgt))} fill={color(s)} />;
                })}
              </g>
            );
          })}

          {kind === 'line' && series.map((s) => {
            const pts = data.map((r, i) => `${x(i)},${y(val(r, s.key))}`);
            return (
              <g key={s.key}>
                {series.length === 1 && (
                  <path d={`M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)} Z`} fill={color(s)} opacity={0.1} />
                )}
                <path d={`M${pts.join(' L')}`} fill="none" stroke={color(s)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {active !== null && (
                  <circle cx={x(active)} cy={y(val(data[active], s.key))} r={4} fill={color(s)} stroke="var(--color-surface)" strokeWidth={2} />
                )}
              </g>
            );
          })}

          <rect
            x={padL} y={padT} width={plotW} height={plotH} fill="transparent"
            onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setActive(null)}
          />
        </svg>

        {isEmpty && (
          <p className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-xs text-[var(--color-text-muted)]">
            {emptyNote ?? 'No data in this period'}
          </p>
        )}

        {tip && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 z-10 min-w-[140px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-lg"
            style={{ left: `${tipLeft}%`, transform: `translateX(${tipLeft > 60 ? 'calc(-100% - 10px)' : '10px'})` }}
          >
            <p className="mb-1 text-[var(--color-text-muted)]">{label(tip.day as string)}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-0.5 w-3 rounded" style={{ backgroundColor: color(s) }} />
                <span className="font-semibold tabular-nums text-[var(--color-text)]">{fmt(val(tip, s.key), format)}</span>
                <span className="text-[var(--color-text-muted)]">{s.label}</span>
              </p>
            ))}
            {stacked && series.length > 1 && (
              <p className="mt-1 border-t border-[var(--color-border)] pt-1 text-[var(--color-text-muted)]">
                Total <span className="font-semibold text-[var(--color-text)]">{fmt(series.reduce((a, s) => a + val(tip, s.key), 0), format)}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Show table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full tabular-nums">
            <thead className="sticky top-0 bg-[var(--color-surface)]">
              <tr className="text-left text-[var(--color-text-muted)]">
                <th className="px-3 py-1.5 font-medium">{period === 'month' ? 'Month' : 'Day'}</th>
                {series.map((s) => <th key={s.key} className="px-3 py-1.5 text-right font-medium">{s.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((r) => (
                <tr key={r.day} className="border-t border-[var(--color-border)] text-[var(--color-text)]">
                  <td className="px-3 py-1">{label(r.day)}</td>
                  {series.map((s) => <td key={s.key} className="px-3 py-1 text-right">{fmt(val(r, s.key), format)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function monthLabel(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

/** Column with rounded data-end, square at the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

function niceTicks(max: number, integer = false) {
  const raw = integer ? Math.max(1, max / 4) : max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const steps = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  const step = steps.map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top + 1e-9; t += step) ticks.push(+t.toFixed(6));
  return { max: top, ticks };
}
