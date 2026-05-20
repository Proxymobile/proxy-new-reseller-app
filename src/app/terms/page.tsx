import Link from 'next/link';
import { config } from '@/config';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xl font-bold text-[var(--color-text)]">{config.brand.name}</Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl prose">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">Terms of Service</h1>
          <p className="text-[var(--color-text-muted)]">
            By using {config.brand.name}, you agree to use our proxy services responsibly and in
            compliance with all applicable laws. We reserve the right to suspend accounts that
            violate our acceptable use policy.
          </p>
          <p className="text-[var(--color-text-muted)] mt-4">
            For questions, contact {config.brand.supportEmail}.
          </p>
        </div>
      </main>
    </div>
  );
}
