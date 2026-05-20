'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { config } from '@/config';

const FAQS = [
  {
    q: 'How do I create my first proxy?',
    a: 'Go to Purchase, pick a country and plan, and click Buy. Your access key activates instantly. Then visit Proxy Keys to generate connection URLs with country, pool type, and rotation settings.',
  },
  {
    q: 'What\'s the difference between Mobile and Residential pools?',
    a: 'Mobile pools use real 4G/5G SIM-connected modems with carrier-assigned IPs (highest trust). Residential pools use Android devices on home ISP connections (volume-friendly). Both pools are available on every plan and accessed through the same gateway.',
  },
  {
    q: 'How do I switch between countries?',
    a: 'Change two characters in your proxy URL. Replace `mbl-us` with `mbl-de` and your next request exits through Germany. No reconnection or new credentials needed.',
  },
  {
    q: 'What happens if my traffic runs out?',
    a: 'Your key stops accepting connections — no surprise charges, no overage fees. Top up from the Billing or Purchase page to continue.',
  },
  {
    q: 'Do you log my proxy traffic?',
    a: 'We track bandwidth usage for billing only. We do not log the URLs you visit or the content of your traffic.',
  },
  {
    q: 'Can I get a refund?',
    a: 'We offer a 7-day money-back guarantee on first-time purchases. Contact support and we\'ll process it within 24 hours.',
  },
  {
    q: 'How do I rotate my key secret?',
    a: 'On the Proxy Keys page, click "Rotate Secret" in the key status bar. This issues a new pak_ key — old URLs will stop working immediately.',
  },
  {
    q: 'Are these IPs really mobile?',
    a: 'Yes. Mobile IPs come from physical 4G/5G modems with real SIM cards from carriers. They are the same kind of IPs your phone gets. Not datacenter, not virtual.',
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contact, setContact] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact.subject.trim() || !contact.message.trim()) return;
    setSending(true);
    // Mock send — in production would POST to /api/support/contact
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setContact({ subject: '', message: '' });
      setTimeout(() => setSent(false), 4000);
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Support</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Get help with your account, billing, or proxy setup.
        </p>
      </div>

      {/* Contact channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ContactChannel
          title="Email Support"
          desc="Response within 24 hours"
          action={config.brand.supportEmail}
          href={`mailto:${config.brand.supportEmail}`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-5 9 5" />
            </svg>
          }
        />
        <ContactChannel
          title="Telegram"
          desc="Live chat with our team"
          action="@proxymobile_support"
          href="https://t.me/proxymobile_support"
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
          }
        />
        <ContactChannel
          title="Documentation"
          desc="Setup guides and integrations"
          action="View docs"
          href="/dashboard/keys"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" />
            </svg>
          }
        />
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Frequently Asked Questions</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Quick answers to common questions about ProxyMobile.
          </p>
        </div>
        <div className="px-6">
          {FAQS.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="border-b border-[var(--color-border)] last:border-0">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left group"
                >
                  <span className="text-sm font-medium text-[var(--color-text)] pr-8 group-hover:text-[var(--color-primary)] transition">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    className="text-[var(--color-text-muted)] text-lg shrink-0 leading-none"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-sm text-[var(--color-text-muted)] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact form */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Contact Support</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-5">
          Send us a message and we&apos;ll get back within 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={contact.subject}
              onChange={(e) => setContact({ ...contact, subject: e.target.value })}
              required
              placeholder="What can we help with?"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Message
            </label>
            <textarea
              value={contact.message}
              onChange={(e) => setContact({ ...contact, message: e.target.value })}
              required
              rows={5}
              placeholder="Describe your issue or question…"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] resize-y"
            />
          </div>

          <AnimatePresence>
            {sent && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                Message sent! We&apos;ll get back to you within 24 hours.
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={sending || !contact.subject.trim() || !contact.message.trim()}
            className="rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-40 shadow-sm shadow-[var(--color-primary)]/20"
          >
            {sending ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ContactChannel({ title, desc, action, href, icon }: { title: string; desc: string; action: string; href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-primary)]/30 hover:shadow-sm transition-all group"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
      <p className="text-xs text-[var(--color-primary)] font-medium mt-2 group-hover:underline">{action} →</p>
    </a>
  );
}
