import type { Metadata } from 'next';
import Link from 'next/link';
import { config } from '@/config';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${config.brand.name}. We track bandwidth for billing only and never log the content of your proxy traffic.`,
  alternates: { canonical: absoluteUrl('/privacy') },
};

const UPDATED = 'July 3, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xl font-bold text-[var(--color-text)]">{config.brand.name}</Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Last updated: {UPDATED}</p>

          <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">1. What we collect</h2>
              <p>We deliberately collect as little as possible:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Account data:</strong> your chosen label, an optional email, and your access code (stored to authenticate you).</li>
                <li><strong>Billing data:</strong> deposits, balance, and bandwidth purchases. Card payments are processed by Stripe — we never see or store full card numbers.</li>
                <li><strong>Usage metrics:</strong> aggregate gigabytes used, for billing and capacity. We do <strong>not</strong> log the content, destinations, or payloads of your proxy traffic.</li>
                <li><strong>Security data:</strong> IP addresses and timestamps of login and redemption attempts, kept short-term to prevent abuse.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">2. How we use it</h2>
              <p>
                To operate your account, process payments, provision proxy access, prevent fraud and
                abuse, and provide support. We do not use your data for advertising.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">3. Sharing</h2>
              <p>
                We do not sell or rent your data. We share only with the processors needed to run the
                service — our payment provider (Stripe), our upstream proxy network, and our hosting/
                infrastructure providers — and only what each needs. We may disclose information where
                required by valid legal process.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">4. Retention</h2>
              <p>
                Account and billing records are kept while your account is active and as required for
                accounting and legal obligations. Login/redemption security logs are pruned on a rolling
                short-term basis. You may request deletion of your account and associated personal data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">5. Your rights</h2>
              <p>
                Depending on your jurisdiction (including the EU/UK GDPR), you may have the right to
                access, correct, export, or delete your personal data, and to object to certain
                processing. To exercise these, contact us at the address below.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">6. Contact</h2>
              <p>
                Privacy questions or requests: <a className="text-[var(--color-primary)] hover:underline" href={`mailto:${config.brand.supportEmail}`}>{config.brand.supportEmail}</a>.
              </p>
            </section>
          </div>

          <p className="mt-10 text-sm">
            <Link href="/terms" className="text-[var(--color-primary)] hover:underline">Terms of Service</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
