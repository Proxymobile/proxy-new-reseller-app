import type { Metadata } from 'next';
import Link from 'next/link';
import { config } from '@/config';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${config.brand.name}. We track bandwidth for billing only and never log the content of your proxy traffic.`,
  alternates: { canonical: absoluteUrl('/privacy') },
};

const UPDATED = 'September 15, 2026';

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
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Website analytics</h2>
              <p>When analytics is enabled and you choose to allow it, we use Google Analytics to measure visits and selected button clicks on our public website. Google processes device and browser information and uses analytics cookies to distinguish visits. This is separate from proxy traffic, whose contents we do not record.</p>
              <p className="mt-2">Our tracking sends public page paths without URL query strings. We do not intentionally send account identifiers, access codes, wallet addresses, or payment details to Google Analytics. Advertising features are disabled. You can reject analytics or withdraw your choice using Cookie settings. Analytics cookies are configured to expire after 180 days, with renewal on subsequent visits.</p>
              <p className="mt-2">Separately, we keep our own aggregate page-view counts for public pages: the page path, the referring website (host name only), a campaign tag if the link carried one, and whether the device is mobile or desktop, summed per day. These counts use no cookies or local storage and store no IP addresses, browser details or identifiers, so they cannot be linked to you. They are not collected if your browser sends Do Not Track or Global Privacy Control.</p>
              <p className="mt-2">See <a href="https://policies.google.com/privacy" className="underline" rel="noreferrer">Google’s privacy policy</a> for details about its processing. Rejecting analytics does not affect your access to the service.</p>
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
