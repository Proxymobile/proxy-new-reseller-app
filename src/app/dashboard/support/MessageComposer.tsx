'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/panel/CopyButton';

const TOPICS = ['Connection problem', 'Billing or payment', 'Refund request', 'Account access', 'Something else'];

/**
 * Honest contact form: builds a pre-filled email in the customer's own mail
 * app rather than pretending to send from the browser.
 */
export function MessageComposer({ to, diagnostics }: { to: string; diagnostics: string }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [includeDiag, setIncludeDiag] = useState(true);

  const body = `${message.trim()}${includeDiag ? `\n\n---\n${diagnostics}` : ''}`;
  const mailto = `mailto:${to}?subject=${encodeURIComponent(`[Support] ${topic}`)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Topic</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]">
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">What happened?</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 1500))}
          rows={6}
          placeholder="What were you trying to do, and what did you see? Error messages help a lot."
          className="mt-1 w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
        />
      </label>
      <label className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
        <input type="checkbox" checked={includeDiag} onChange={(e) => setIncludeDiag(e.target.checked)} className="mt-0.5 accent-[var(--color-primary)]" />
        <span>Include my account ID and key status (never your key or access code)</span>
      </label>
      {includeDiag && (
        <pre className="whitespace-pre-wrap rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5 font-mono text-[10px] text-[var(--color-text-muted)]">{diagnostics}</pre>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={mailto}
          aria-disabled={!message.trim()}
          className={`rounded-lg bg-[var(--color-text)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] ${message.trim() ? 'hover:opacity-90' : 'pointer-events-none opacity-40'}`}
        >
          Open in email app
        </a>
        <CopyButton text={`To: ${to}\nSubject: [Support] ${topic}\n\n${body}`} label="Copy message instead" />
      </div>
    </div>
  );
}
