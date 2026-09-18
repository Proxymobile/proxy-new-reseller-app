import { int, pct } from './format';

/** Ordinal funnel: each step shows its count and conversion from the step above. */
export function Funnel({ steps }: { steps: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol className="viz space-y-3">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv = prev ? (s.value / prev) * 100 : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-[var(--color-text)]">{s.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-[var(--color-text)]">{int(s.value)}</span>
                {conv !== null && <span className="ml-2 text-[var(--color-text-muted)]">{pct(conv, conv < 10 ? 1 : 0)} of previous</span>}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[var(--color-surface-hover)]">
              <div className="h-full rounded-full bg-[var(--viz-1)]" style={{ width: `${Math.max(s.value > 0 ? 1.5 : 0, (s.value / max) * 100)}%` }} />
            </div>
            {s.note && <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
