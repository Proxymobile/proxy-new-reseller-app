import type { Metadata } from 'next';
import Link from 'next/link';
import { config } from '@/config';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${config.brand.name} mobile proxy services — acceptable use, billing, and account terms.`,
  alternates: { canonical: absoluteUrl('/terms') },
};

const UPDATED = 'July 3, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xl font-bold text-[var(--color-text)]">{config.brand.name}</Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">Terms of Service</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Last updated: {UPDATED}</p>

          <div className="space-y-6 text-[var(--color-text-muted)] leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">1. Agreement</h2>
              <p>
                These Terms govern your use of {config.brand.name} (&quot;we&quot;, &quot;us&quot;), a mobile and
                residential proxy service. By creating an account, redeeming a code, or using the
                service, you agree to these Terms. If you do not agree, do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">2. The service</h2>
              <p>
                We resell proxy bandwidth on real carrier and residential IP addresses. Bandwidth is
                sold per gigabyte from a prepaid balance; there is no recurring subscription unless
                stated. IP availability, country coverage, and endpoint counts vary in real time with
                upstream network inventory and are not guaranteed for any specific country or moment.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">3. Acceptable use</h2>
              <p>You agree <strong>not</strong> to use the service to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Break any applicable law, regulation, or third-party rights in your jurisdiction or the target&apos;s.</li>
                <li>Access, distribute, or create child sexual abuse material, or any content that sexualizes minors.</li>
                <li>Send spam, conduct phishing, distribute malware, or carry out credential-stuffing or fraud.</li>
                <li>Launch DDoS, port-scanning, intrusion, or other attacks against systems you do not own or have permission to test.</li>
                <li>Commit payment fraud, card testing, or money laundering.</li>
                <li>Abuse trial credits by creating multiple accounts to evade limits.</li>
              </ul>
              <p className="mt-2">
                You are solely responsible for your traffic and for complying with the terms of any
                site or service you connect to. We may suspend or terminate accounts that violate this
                policy without notice or refund, and may cooperate with lawful requests from authorities.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">4. Billing &amp; refunds</h2>
              <p>
                Deposits fund a prepaid balance used to purchase bandwidth. Prices are shown before
                purchase and charged in USD. Bandwidth already delivered is non-refundable. If a purchase
                fails on our side, your balance is automatically restored. If bandwidth you purchased does
                not perform for your use case, contact support and we will work with you in good faith —
                a discretionary courtesy, not an automatic entitlement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">5. Accounts</h2>
              <p>
                Your access code is your sole credential. Keep it secret; anyone holding it can access
                your account and balance. You are responsible for all activity under your account. We are
                not liable for loss resulting from a shared, lost, or compromised access code.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">6. Disclaimer &amp; liability</h2>
              <p>
                The service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
                uptime, specific IPs, speeds, or that any target will be reachable. To the maximum extent
                permitted by law, our total liability for any claim is limited to the amount you paid us in
                the 30 days before the claim.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">7. Changes</h2>
              <p>
                We may update these Terms; material changes take effect when posted here. Continued use
                after changes means you accept them.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">8. Contact</h2>
              <p>
                Questions about these Terms: <a className="text-[var(--color-primary)] hover:underline" href={`mailto:${config.brand.supportEmail}`}>{config.brand.supportEmail}</a>, or <a className="text-[var(--color-primary)] hover:underline" href={config.brand.supportTelegramUrl} target="_blank" rel="noopener noreferrer">{config.brand.supportTelegram}</a> on Telegram.
              </p>
            </section>
          </div>

          <p className="mt-10 text-sm">
            <Link href="/privacy" className="text-[var(--color-primary)] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
