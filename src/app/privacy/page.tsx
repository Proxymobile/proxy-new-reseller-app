import Link from 'next/link';
import { config } from '@/config';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xl font-bold text-[var(--color-text)]">{config.brand.name}</Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl prose">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-6">Privacy Policy</h1>
          <p className="text-[var(--color-text-muted)]">
            {config.brand.name} collects minimal data required to operate the service:
            account labels, optional email addresses, and usage metrics. We do not sell
            or share your data with third parties.
          </p>
          <p className="text-[var(--color-text-muted)] mt-4">
            For questions, contact {config.brand.supportEmail}.
          </p>
        </div>
      </main>
    </div>
  );
}
