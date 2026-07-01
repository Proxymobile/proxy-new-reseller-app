/**
 * Homepage FAQ content — single source of truth shared by the rendered
 * accordion (client) and the FAQPage JSON-LD (server). Kept in a plain module
 * (not the 'use client' landing file) so the server can import the real array.
 */
export const HOME_FAQS = [
  {
    q: 'What kind of IPs are these?',
    a: 'Mobile IPs come from real 4G/5G SIM cards in physical modems — the same kind of IP your phone gets from a carrier. Residential IPs come from real Android devices on home ISP connections. None of our IPs are datacenter.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. We use standard HTTP and SOCKS5 proxy protocol. If your tool supports a proxy URL — curl, Python requests, Puppeteer, Scrapy — it works out of the box.',
  },
  {
    q: 'How do I switch countries?',
    a: "Change two characters in your proxy URL. Replace 'us' with 'de' and your next request exits through Germany. No reconnection, no new credentials.",
  },
  {
    q: 'What happens when my traffic runs out?',
    a: "Your key stops accepting connections. No surprise charges, no overage fees. Top up from your dashboard when you're ready.",
  },
  {
    q: 'Is my browsing data logged?',
    a: 'We track bandwidth usage for billing purposes. We do not log the content of your proxy traffic or the URLs you visit.',
  },
  {
    q: "What's an access code?",
    a: 'Your login credential — a short alphanumeric code. No email or password required. Get one from your provider or register to generate one.',
  },
];
