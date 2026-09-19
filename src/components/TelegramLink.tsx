import { config } from '@/config';

/**
 * The Telegram support handle, rendered consistently wherever we offer help.
 *
 * The handle and URL come from src/config.ts so there is exactly one place to
 * change if the account ever moves. Always opens in a new tab with
 * rel="noopener" — it is an external destination.
 */

function TelegramGlyph({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={`${className} shrink-0`}>
      <path d="M21.94 4.5 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.19c-.25.25-.46.46-.95.46l.34-4.8 8.74-7.9c.38-.34-.08-.53-.59-.19l-10.8 6.8-4.65-1.46c-1.01-.32-1.03-1.01.21-1.5l18.2-7.01c.84-.31 1.58.2 1.21 1.39Z" />
    </svg>
  );
}

/** Small muted link, for footers and legal pages. */
export function TelegramFooterLink({ label }: { label?: string }) {
  return (
    <a
      href={config.brand.supportTelegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
    >
      <TelegramGlyph className="h-3.5 w-3.5" />
      {label ?? `Support ${config.brand.supportTelegram}`}
    </a>
  );
}

/** Inline link inside a sentence — inherits the surrounding text size. */
export function TelegramInlineLink({ label }: { label?: string }) {
  return (
    <a
      href={config.brand.supportTelegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[var(--color-primary)] hover:underline"
    >
      <TelegramGlyph className="h-3.5 w-3.5" />
      {label ?? config.brand.supportTelegram}
    </a>
  );
}

/**
 * Button sized to sit in a dashboard header action row next to the page's own
 * buttons. Telegram-tinted rather than filled, so it reads as a third option
 * without competing with the primary call to action beside it.
 */
export function TelegramActionButton({ label = 'Support' }: { label?: string }) {
  return (
    <a
      href={config.brand.supportTelegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Message support on Telegram (${config.brand.supportTelegram})`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#229ED9]/35 bg-[#229ED9]/10 px-3.5 py-2 text-sm font-medium text-[#1B87BA] transition hover:bg-[#229ED9]/20 dark:text-[#4FB6E6]"
    >
      <TelegramGlyph className="h-4 w-4" />
      {label}
    </a>
  );
}

/** Prominent button, for the support page and anywhere we want the fast path. */
export function TelegramButton({ label }: { label?: string }) {
  return (
    <a
      href={config.brand.supportTelegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
    >
      <TelegramGlyph />
      {label ?? `Message us on Telegram`}
    </a>
  );
}
