import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { config } from '@/config';
import { getAccountUser, getCustomerKey } from '@/lib/customer-data';
import { Card, PageHeader } from '@/components/panel/ui';
import { MessageComposer } from './MessageComposer';
import { TelegramButton } from '@/components/TelegramLink';

const FAQS: [string, string][] = [
  ['How do I start using my proxies?', 'Buy bandwidth, then open Proxy setup. Pick a country and rotation, press Generate and paste the URL into your tool — it works in anything that supports an HTTP or SOCKS5 proxy.'],
  ['My requests fail or time out. What should I check?', 'Make sure your key is Active on the Overview page and has data left. Check that the country you picked shows devices online. A 407 error means the username or key is wrong — copy a fresh URL. If you just rotated your secret, old URLs no longer work.'],
  ['What is the difference between Mobile and Residential?', 'Mobile uses real SIM cards in 4G/5G modems — the highest-trust IPs. Residential uses home internet connections from Android devices and suits high-volume work. Both use the same key and gateway.'],
  ['How do I keep the same IP?', 'Use Sticky rotation with a session ID (Proxy setup does this for you). Reusing the same session ID returns you to the same device for as long as the carrier allows.'],
  ['How do I get a new IP?', 'Use a different session ID, or pick “Every 10 min” rotation to change automatically.'],
  ['What happens when my data runs out or expires?', 'Connections stop — nothing is charged automatically. Buy more bandwidth and the same key and URLs start working again. Every purchase extends the expiry by 30 days.'],
  ['Do you log my traffic?', 'We record how much bandwidth you use for billing. We do not log the content of your traffic or the URLs you visit.'],
  ['Can I get a refund?', 'First purchases have a 7-day money-back guarantee. Send us a message with your account ID and we reply within 24 hours.'],
];

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const [user, { key }] = await Promise.all([getAccountUser(session.user.id), getCustomerKey(session.user.id)]);
  if (!user) redirect('/login');

  const diagnostics = [
    `Account ID: ${user.id}`,
    `Key ID: ${key?.id ?? 'none'}`,
    `Key status: ${!key ? 'no key' : key.expired ? 'expired' : !key.enabled ? 'paused' : 'active'}`,
    key?.capGb ? `Data: ${key.usedGb.toFixed(2)} of ${key.capGb} GB used` : null,
  ].filter(Boolean).join('\n');

  return (
    <div>
      <PageHeader title="Help & support" subtitle="Answers to common questions, and a direct line to our team." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Channel title="Telegram" body="Fastest route to a human" action={config.brand.supportTelegram} href={config.brand.supportTelegramUrl} />
        <Channel title="Email" body="Replies within 24 hours" action={config.brand.supportEmail} href={`mailto:${config.brand.supportEmail}`} />
        <Channel title="Setup guide" body="Code examples for curl, Python, Node and Playwright" action="Open the API guide" href="/mobile-proxy-api" />
        <Channel title="Generate a proxy" body="Build connection strings for any country" action="Open Proxy setup" href="/dashboard/keys" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card title="Frequently asked questions" className="lg:col-span-3">
          <div className="divide-y divide-[var(--color-border)]">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[var(--color-text)]">
                  {q}
                  <span aria-hidden className="text-[var(--color-text-muted)] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card title="Message us" subtitle="Opens your email app with the details filled in" className="lg:col-span-2">
          <MessageComposer to={config.brand.supportEmail} diagnostics={diagnostics} />
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <p className="mb-3 text-xs text-[var(--color-text-muted)]">Prefer chat? We answer fastest on Telegram.</p>
            <TelegramButton />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Channel({ title, body, action, href }: { title: string; body: string; action: string; href: string }) {
  // mailto: and absolute URLs (Telegram) both leave the app, so neither should
  // go through next/link — and the http(s) ones need target/rel.
  const external = href.startsWith('mailto:') || href.startsWith('http');
  const newTab = href.startsWith('http');
  const inner = (
    <div className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)]/40">
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{body}</p>
      <p className="mt-3 truncate text-xs font-medium text-[var(--color-primary)]">{action} →</p>
    </div>
  );
  return external ? (
    <a
      href={href}
      className="block"
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {inner}
    </a>
  ) : (
    <Link href={href} className="block">{inner}</Link>
  );
}
